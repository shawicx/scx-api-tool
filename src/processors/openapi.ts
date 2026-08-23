/**
 * @description OpenAPI 数据处理模块
 * 处理 OpenAPI 格式的数据，提取接口、类型和类别信息
 */

import type { ApiConfig } from '@/types';
import type {
  ApiCategory,
  ApiInterface,
  ApiTypeDefinition,
  OpenApiDocument,
  OpenApiSchema,
} from '@/types';
import { sanitizeTypeName } from '@/naming';
import { isFreeFormSchema, isJacksonDynamicType, createJsonValueDefinition } from '@/schema';
import { logger } from '@/utils/logger';
import { ErrorFactory } from '@/errors';

export interface ProcessedApiData {
  interfaces: ApiInterface[];
  types: ApiTypeDefinition[];
  categories: ApiCategory[];
}

export { groupInterfacesByTag, extractUsedTypeNames } from './common';

/**
 * @description 应用 transformPath 转换函数，处理异常和返回值校验。
 * 当函数抛错或返回非字符串时，归一为 E3005 GenerateError。
 * @param transform transformPath 函数（已规范化为函数）
 * @param path 原始路径
 * @returns 转换后的路径
 * @throws {GenerateError} 当函数抛错或返回非字符串时（E3005）
 *
 * @example
 * ```typescript
 * const newPath = applyTransformPath(config.transformPath, '/users');
 * ```
 */
function applyTransformPath(transform: (path: string) => string, path: string): string {
  let result: unknown;
  try {
    result = transform(path);
  } catch (err: any) {
    throw ErrorFactory.pathTransformError(
      path,
      `transformPath 函数处理路径时抛出异常: ${err?.message ?? String(err)}`,
      err instanceof Error ? err : new Error(String(err)),
    );
  }
  if (typeof result !== 'string') {
    throw ErrorFactory.pathTransformError(
      path,
      `transformPath 函数必须返回 string，实际返回类型: ${typeof result}`,
      new Error(`Invalid return type: ${typeof result}`),
    );
  }
  return result;
}

/**
 * @description 递归检测 schema 树中是否含 free-form 属性（additionalProperties: true / {}）
 * 用于判断是否需要注入内置 JsonValue 类型。仅做存在性检测，不收集具体位置。
 * @param schema 待检测的 schema
 * @param depth 递归深度（防 DoS）
 * @returns 是否含 free-form 属性
 */
function containsFreeFormProperty(schema: unknown, depth = 0): boolean {
  if (!schema || typeof schema !== 'object' || depth > 20) return false;
  const s = schema as OpenApiSchema;

  // 当前节点本身是 free-form（additionalProperties: true / {}）
  if (isFreeFormSchema(s)) return true;

  // 检查 properties 里的每个属性
  if (s.properties) {
    for (const prop of Object.values(s.properties)) {
      if (containsFreeFormProperty(prop, depth + 1)) return true;
    }
  }

  // additionalProperties 是具名 schema（map）时递归其内部
  const ap = s.additionalProperties;
  if (ap && typeof ap === 'object' && containsFreeFormProperty(ap, depth + 1)) {
    return true;
  }

  // 检查数组 items
  if (s.items && containsFreeFormProperty(s.items, depth + 1)) return true;

  // 检查组合 schema
  for (const key of ['allOf', 'oneOf', 'anyOf'] as const) {
    const arr = s[key];
    if (Array.isArray(arr)) {
      for (const sub of arr) {
        if (containsFreeFormProperty(sub, depth + 1)) return true;
      }
    }
  }

  return false;
}

/**
/**
 * @description 从 OpenAPI paths 中收集所有 requestBody / response 的 schema
 * 用于预扫描是否含 free-form 属性。扁平化返回所有 schema 节点。
 * @param paths OpenAPI 文档的 paths 对象
 * @returns schema 数组
 */
function collectSchemasFromPaths(paths: NonNullable<OpenApiDocument['paths']>): unknown[] {
  const schemas: unknown[] = [];
  for (const methods of Object.values(paths)) {
    if (!methods || typeof methods !== 'object') continue;
    for (const operation of Object.values(methods)) {
      if (!operation || typeof operation !== 'object') continue;
      const op = operation as Record<string, unknown>;
      // requestBody.content.*.schema
      const reqBody = op.requestBody as { content?: Record<string, unknown> } | undefined;
      if (reqBody?.content) {
        for (const media of Object.values(reqBody.content)) {
          const m = media as { schema?: unknown };
          if (m.schema) schemas.push(m.schema);
        }
      }
      // responses.*.content.*.schema
      const responses = op.responses as
        Record<string, { content?: Record<string, unknown> }> | undefined;
      if (responses) {
        for (const resp of Object.values(responses)) {
          if (!resp?.content) continue;
          for (const media of Object.values(resp.content)) {
            const m = media as { schema?: unknown };
            if (m.schema) schemas.push(m.schema);
          }
        }
      }
    }
  }
  return schemas;
}

/**
 * @description 按需注入内置 JsonValue 类型定义。
 *
 * 触发条件（满足任一）：
 * 1. 已存在 kind === 'jsonValueAlias' 的类型（Jackson 命名 + free-form）
 * 2. 某个 schema 的属性树中含 free-form 属性（additionalProperties: true / {}）
 *
 * 注入前检查命名碰撞：若用户文档已有自定义 JsonValue 类型，则跳过注入
 * （此时 free-form 属性会降级，但不会引用到错误的用户定义）。
 *
 * @param data OpenAPI 原始文档（用于扫描 paths 下的 schema）
 * @param types 已收集的类型数组（会原地追加 JsonValue 定义）
 */
function injectJsonValueIfNeeded(data: OpenApiDocument, types: ApiTypeDefinition[]): void {
  // 条件 1：已存在 Jackson 别名
  let needsJsonValue = types.some((t) => t.kind === 'jsonValueAlias');

  // 条件 2：扫描所有 schema 的属性树是否含 free-form
  if (!needsJsonValue) {
    // 扫描 components.schemas
    if (data.components?.schemas) {
      for (const schema of Object.values(data.components.schemas)) {
        if (containsFreeFormProperty(schema)) {
          needsJsonValue = true;
          break;
        }
      }
    }
    // 扫描 paths 下的 requestBody / response schema
    if (!needsJsonValue && data.paths) {
      const pathSchemas = collectSchemasFromPaths(data.paths);
      needsJsonValue = pathSchemas.some((s) => containsFreeFormProperty(s));
    }
  }

  if (!needsJsonValue) return;

  // 命名碰撞检查：用户文档已有 JsonValue 定义则跳过（用户优先）
  if (types.some((t) => t.name === 'JsonValue' && t.kind !== 'jsonValueAlias')) {
    logger.debug('用户文档已含 JsonValue 类型定义，跳过内置注入');
    return;
  }

  // 避免重复注入
  if (types.some((t) => t.kind === 'jsonValue')) return;

  types.push(createJsonValueDefinition());
  logger.debug('检测到自由格式对象，已注入内置 JsonValue 类型定义');
}

/**
 * @description 处理 OpenAPI 数据
 * 从 OpenAPI 格式的数据中提取接口、类型和类别信息
 * @param data OpenAPI 原始数据
 * @param config API 配置
 * @returns 处理后的 API 数据
 *
 * @example
 * ```typescript
 * const processedData = processOpenApiData(rawData, config);
 * // processedData = {
 * //   interfaces: [{ path: '/user', method: 'get', operation: {...} }],
 * //   types: [{ name: 'User', schema: {...} }],
 * //   categories: [{ name: '用户管理', description: '...' }]
 * // }
 * ```
 */
export function processOpenApiData(data: OpenApiDocument, config: ApiConfig): ProcessedApiData {
  // 记录调试信息
  if (typeof data === 'object' && data !== null) {
    logger.debug('数据键:', Object.keys(data));
    // 记录第一个路径条目用于调试
    if (data.paths) {
      const firstPath = Object.keys(data.paths)[0];
      const pathItem = firstPath ? data.paths[firstPath] : undefined;
      if (pathItem && typeof pathItem === 'object') {
        const firstMethod = Object.keys(pathItem)[0];
        logger.debug('第一个路径条目:', firstPath, firstMethod);
        if (firstMethod) {
          logger.debug('第一个操作键:', Object.keys(pathItem[firstMethod]));
        }
      }
    }

    // 记录标签信息
    if (data.tags) {
      logger.debug('标签:', data.tags);
    }
  }

  const interfaces: ApiInterface[] = [];
  const types: ApiTypeDefinition[] = [];
  const categories: ApiCategory[] = [];

  // 处理包括 Apifox 在内的所有服务器类型的标准 OpenAPI 格式
  // 防御畸形输入：仅处理 paths 为对象的情况
  if (data.paths && typeof data.paths === 'object') {
    for (const [path, methods] of Object.entries(data.paths)) {
      // 应用 transformPath 转换函数（0.6.0 起为函数形式，由 defineConfig 规范化）
      const normalizedPath = applyTransformPath(config.transformPath, path);

      // 防御畸形输入：仅处理 methods 为对象的情况
      if (!methods || typeof methods !== 'object') continue;

      for (const [method, operation] of Object.entries(methods)) {
        // 防御畸形输入：跳过非对象的 operation
        if (!operation || typeof operation !== 'object') continue;

        // 数据已由各客户端的 normalize() 标准化为统一 OpenAPI 格式
        // 记录前几个操作用于调试
        if (interfaces.length < 3) {
          logger.debug(`操作 ${path} ${method}:`, Object.keys(operation));
        }

        interfaces.push({
          path: normalizedPath,
          method,
          operation,
        });
      }
    }
  }

  // 提取 components/schemas 用于类型定义
  // 识别 Jackson 动态类型（JsonNode 等）+ free-form 特征，标记为 JsonValue 别名
  if (data.components?.schemas && typeof data.components.schemas === 'object') {
    for (const [name, schema] of Object.entries(data.components.schemas)) {
      const cleanName = sanitizeTypeName(name);
      // Jackson 已知动态类型 + free-form schema → 标记为 jsonValueAlias
      // 生成器会渲染为 `type JsonNode = JsonValue`（而非空 interface）
      if (isJacksonDynamicType(cleanName) && isFreeFormSchema(schema)) {
        types.push({
          name: cleanName,
          originalName: name,
          schema,
          kind: 'jsonValueAlias',
        });
      } else {
        types.push({
          name: cleanName,
          originalName: name, // 保留原始名称用于调试
          schema,
        });
      }
    }
  }

  // 按需注入内置 JsonValue 类型定义（仅当存在 Jackson 别名或属性级 free-form 时）
  injectJsonValueIfNeeded(data, types);

  // 处理类别提取 — Apifox 和 Swagger 均使用标签作为类别
  if (Array.isArray(data.tags)) {
    categories.push(...data.tags);
  }

  logger.debug(
    `Processed ${interfaces.length} interfaces, ${types.length} types, ${categories.length} categories`,
  );

  return {
    interfaces,
    types,
    categories,
  };
}

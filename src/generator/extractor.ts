/**
 * @description 数据提取模块
 * 从 OpenAPI 操作中提取响应和路径参数；请求参数提取已下沉至
 * requestParameters.ts（含 body/query/path 分组与 @ParameterObject 展开），
 * 此处 re-export 以保持既有 `from '../extractor'` 的导入兼容性。
 */

import type { ProcessedApiData } from '../processors/openapi';
import type { ApiProperty, OpenApiOperation, OpenApiSchema } from '@/types';
import { sanitizePropertyName, sanitizeTypeName } from '@/naming';
import { escapeJsDocComment, escapeStringLiteral } from '@/utils/escape';
import { resolveComposedSchema } from '@/utils/refResolver';
import { getPropertyType, wrapNullable } from './propertyType';
import { getResponseSchema } from '@/schema/operation';

/**
 * @description 属性类型映射（getPropertyType 等）
 * 实现位于 propertyType.ts，支持 nullable / oneOf / anyOf / allOf。
 * 此处重新导出以保持既有 `from '../extractor'` 的导入兼容性。
 */
export { getPropertyType };

// 请求参数提取（打平 + 分组 + @ParameterObject 展开）位于 requestParameters.ts
export { extractRequestProperties, extractRequestParameterGroups } from './requestParameters';
export type { RequestParameterGroups } from './requestParameters';

/**
 * @description 提取路径参数名列表
 * 从 OpenAPI 操作的 parameters 中筛出 `in === 'path'` 的参数名。
 * 返回的名称为原始参数名（未经 sanitize），用于与路径中的 `{paramName}` 占位符匹配。
 * @param operation OpenAPI 操作对象
 * @returns 路径参数名数组（如 `['userId', 'postId']`）；无 path 参数时返回空数组
 *
 * @example
 * ```typescript
 * const operation = {
 *   parameters: [
 *     { name: 'userId', in: 'path', type: 'number' },
 *     { name: 'page', in: 'query', type: 'number' },
 *     { name: 'postId', in: 'path', type: 'string' },
 *   ],
 * };
 * extractPathParameterNames(operation); // → ['userId', 'postId']
 * ```
 */
export function extractPathParameterNames(operation: OpenApiOperation): string[] {
  if (!operation.parameters || !Array.isArray(operation.parameters)) return [];
  return operation.parameters.filter((p) => p.in === 'path').map((p) => p.name);
}

/**
 * @description 提取响应属性
 * 从响应中提取响应属性
 * @param responses OpenAPI 响应对象
 * @param processedData 处理后的 API 数据
 * @returns 响应属性数组
 *
 * @example
 * ```typescript
 * const properties = extractResponseProperties(responses, processedData);
 * // properties = [
 * //   { name: 'data', type: 'User', description: '用户数据', required: true }
 * // ]
 * ```
 */
export function extractResponseProperties(
  responses: OpenApiOperation['responses'],
  processedData: ProcessedApiData,
): ApiProperty[] {
  if (!responses) return [];

  const properties: ApiProperty[] = [];

  // 从成功响应（200/201）中提取 schema，按 content-type 优先级查找
  // （application/json → 通配符 → 第一个可用），兼容 springdoc 默认输出通配符 content-type
  const operation: OpenApiOperation = { responses };
  const responseSchema = getResponseSchema(operation);
  if (responseSchema) {
    const { schema } = responseSchema;
    // allOf 展平（顶层合并）
    const resolved = resolveComposedSchema(schema, processedData);

    // 处理引用模式
    if (resolved.$ref) {
      const refName = sanitizeTypeName(resolved.$ref.split('/').pop()!);
      const refSchema = processedData.types.find((t) => t.name === refName)?.schema;
      if (refSchema && refSchema.properties) {
        for (const [name, property] of Object.entries(refSchema.properties)) {
          properties.push({
            name: sanitizePropertyName(name),
            type: getPropertyType(property),
            description: escapeJsDocComment(property.description || ''),
            required: refSchema.required?.includes(name) || false,
          });
        }
      } else {
        // 引用模式没有属性或找不到引用，添加通用响应
        properties.push({
          name: 'data',
          type: refName,
          description: '响应数据',
          required: true,
        });
      }
    } else if (resolved.properties && Object.keys(resolved.properties).length > 0) {
      // 处理内联模式（含 allOf 展平后的 properties；空 properties 不抢占分支，
      // 让 additionalProperties（map/free-form）在 getPropertyType 的对象分支中被正确处理）
      for (const [name, property] of Object.entries(resolved.properties)) {
        properties.push({
          name: sanitizePropertyName(name),
          type: getPropertyType(property),
          description: escapeJsDocComment(property.description || ''),
          required: resolved.required?.includes(name) || false,
        });
      }
    } else if (resolved.type === 'array' && resolved.items) {
      // 处理数组响应
      properties.push({
        name: 'data',
        type: `${getPropertyType(resolved.items)}[]`,
        description: '响应数据数组',
        required: true,
      });
    } else if (resolved.type) {
      // 处理基本类型（含空 properties 的对象：Record<string, X> / JsonValue）
      properties.push({
        name: 'data',
        type: getPropertyType(resolved),
        description: '响应数据',
        required: true,
      });
    } else if (resolved.oneOf || resolved.anyOf) {
      // 处理顶层组合 schema（union），交给 getPropertyType 处理
      properties.push({
        name: 'data',
        type: getPropertyType(resolved),
        description: '响应数据',
        required: true,
      });
    } else {
      // 空 schema（无任何结构定义）：文档缺少响应体，生成 unknown 强制调用方收窄
      properties.push({
        name: 'data',
        type: 'unknown',
        description: '响应数据（文档未定义响应结构）',
        required: true,
      });
    }
  }

  return properties;
}

/**
 * @description 提取类型属性
 * 从 Schema 中提取类型属性。当传入 processedData 时，会先展平 allOf 组合 schema。
 * @param schema OpenAPI Schema 对象
 * @param processedData 处理后的 API 数据（可选，用于解析 allOf 子 schema 的 $ref）
 * @returns 类型属性数组
 *
 * @example
 * ```typescript
 * const properties = extractTypeProperties(schema);
 * // properties = [
 * //   { name: 'id', type: 'number', description: 'ID', required: true },
 * //   { name: 'name', type: 'string', description: '名称', required: false }
 * // ]
 *
 * // 含 allOf 展平：
 * const merged = extractTypeProperties(
 *   { allOf: [{ $ref: '#/components/schemas/Base' }, { properties: { ext: { type: 'string' } } }] },
 *   processedData,
 * );
 * ```
 */
export function extractTypeProperties(
  schema: OpenApiSchema,
  processedData?: ProcessedApiData,
): ApiProperty[] {
  if (!schema) {
    return [];
  }

  // allOf 展平（顶层合并，仅在传入 processedData 时）
  const resolved = processedData ? resolveComposedSchema(schema, processedData) : schema;

  // 处理引用模式
  if (resolved.$ref) {
    // 顶层引用等非对象形态由 extractTypeAlias 走类型别名路径（type X = Y），
    // 此处保留空数组作为 interface 路径的兜底行为
    return [];
  }

  if (!resolved.properties) {
    return [];
  }

  const properties: ApiProperty[] = [];

  for (const [name, property] of Object.entries(resolved.properties)) {
    properties.push({
      name: sanitizePropertyName(name),
      type: getPropertyType(property),
      description: escapeJsDocComment(property.description || ''),
      required: resolved.required?.includes(name) || false,
    });
  }

  return properties;
}

/**
 * @description 判断顶层 Schema 是否为「对象形态」（应生成 interface）
 * 含 properties（属性表）、allOf（合并语义）、或显式空对象声明
 * （type: object 且无 additionalProperties）均视为对象形态；
 * 其余形态适合生成类型别名。
 * @param schema OpenAPI Schema 对象
 * @returns 是否为对象形态
 */
function isObjectShapedSchema(schema: OpenApiSchema): boolean {
  if (schema.properties) return true;
  if (schema.allOf) return true;
  // 显式空对象 DTO（无属性、无 map/free-form 语义）：维持空 interface 的既有行为
  if (schema.type === 'object' && schema.additionalProperties === undefined) return true;
  return false;
}

/**
 * @description 渲染枚举值为 TypeScript 字面量联合
 * 字符串值经 escapeStringLiteral 转义，数字/布尔直接输出
 * @param values 枚举值数组
 * @returns 字面量联合串，如 `'active' | 'inactive'`、`1 | 2 | 3`
 */
function renderEnumLiterals(values: unknown[]): string {
  return values
    .map((v) => {
      if (typeof v === 'string') return `'${escapeStringLiteral(v)}'`;
      if (v === null) return 'null';
      if (typeof v === 'number' || typeof v === 'boolean') return String(v);
      return `'${escapeStringLiteral(String(v))}'`;
    })
    .join(' | ');
}

/**
 * @description 提取顶层类型别名
 * 顶层 Schema 为非对象形态（$ref、枚举、数组、原始类型、oneOf/anyOf 联合、
 * map/free-form 对象）时，返回对应的 TypeScript 类型串；对象形态
 * （properties / allOf / 显式空对象 / 无结构信息）返回 null，由调用方走 interface 路径。
 * 典型场景：组件 Schema 仅为另一个 Schema 的引用时，应生成 `type X = Y`
 * 而非空接口 `interface X {}`。
 * @param schema OpenAPI Schema 对象
 * @returns 类型别名串（如 `'User'`、`"'active' | 'inactive'"`、`'User[]'`、`'Record<string, User>'`），不可别名时返回 null
 *
 * @example
 * ```typescript
 * extractTypeAlias({ $ref: '#/components/schemas/User' }); // 'User'
 * extractTypeAlias({ type: 'string', enum: ['a', 'b'] }); // "'a' | 'b'"
 * extractTypeAlias({ type: 'array', items: { type: 'number' } }); // 'number[]'
 * extractTypeAlias({ type: 'object', properties: {} }); // null（对象形态走 interface）
 * ```
 */
export function extractTypeAlias(schema: OpenApiSchema): string | null {
  if (!schema || typeof schema !== 'object') return null;
  if (isObjectShapedSchema(schema)) return null;

  // 枚举 → 字面量联合（字符串/数字枚举均支持）
  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    return wrapNullable(renderEnumLiterals(schema.enum as unknown[]), schema);
  }

  // 其余非对象形态交由 getPropertyType 统一映射
  // （$ref / 数组 / 原始类型 / oneOf / anyOf / 3.1 type 数组 / map / free-form 均已覆盖）
  const mapped = getPropertyType(schema);
  // 完全无结构信息的 schema（映射为 any）不生成别名，维持 interface 兜底
  if (!mapped || mapped === 'any') return null;
  return mapped;
}

// 操作内容（content-type / schema）提取已下沉至中立层 @/schema/operation
// （processors 与 generator 共用，避免 processors → generator 反向依赖）。
// 此处重新导出以保持既有 `from '../extractor'` 的导入兼容性（内部使用已在顶部导入）。
export {
  getRequestBodySchema,
  getResponseSchema,
  getRequestContentType,
  isFormDataRequest,
  hasRequestBody,
} from '@/schema/operation';

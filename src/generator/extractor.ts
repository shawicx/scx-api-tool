/**
 * @description 数据提取模块
 * 从 OpenAPI 操作中提取响应和路径参数；请求参数提取已下沉至
 * requestParameters.ts（含 body/query/path 分组与 @ParameterObject 展开），
 * 此处 re-export 以保持既有 `from '../extractor'` 的导入兼容性。
 */

import type { ProcessedApiData } from '../processors/openapi';
import type { ApiProperty, OpenApiOperation, OpenApiSchema } from '../types';
import { sanitizePropertyName, sanitizeTypeName } from '@/naming';
import { escapeJsDocComment } from '@/utils/escape';
import { resolveComposedSchema } from '@/utils/refResolver';
import { getPropertyType } from './propertyType';
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
    // 目前，我们对引用类型返回空数组
    // 在更完整的实现中，我们将解析引用
    // 并从引用的模式中提取属性
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

/**
 * @description OpenAPI 操作内容（content）提取工具
 *
 * 从单个 OpenApiOperation 中按 content-type 优先级提取请求体/响应的 schema
 * 及内容类型信息。纯函数、无副作用。
 *
 * 本模块属于中立层（src/schema/）：processors 与 generator 共用，
 * 避免 processors → generator 的反向依赖。
 */

import type { OpenApiOperation, OpenApiSchema } from '@/types';

/**
 * @description 获取请求体的 schema
 * 按优先级查找 content-type：multipart/form-data → application/json → 其他
 * @param operation OpenAPI 操作对象
 * @returns 包含 schema 的对象，或 null
 */
export function getRequestBodySchema(
  operation: OpenApiOperation,
): { schema: OpenApiSchema } | null {
  if (!operation.requestBody?.content) return null;

  const { content } = operation.requestBody;

  // 优先查找 multipart/form-data
  if (content['multipart/form-data']?.schema) {
    return { schema: content['multipart/form-data'].schema };
  }

  // 其次查找 application/json
  if (content['application/json']?.schema) {
    return { schema: content['application/json'].schema };
  }

  // fallback：取第一个可用的 content-type
  for (const mediaType of Object.values(content)) {
    if (mediaType.schema) {
      return { schema: mediaType.schema };
    }
  }

  return null;
}

/**
 * @description 获取成功响应（200/201）的 schema
 * 按优先级查找 content-type：application/json → 通配符 → 第一个可用。
 * 兼容 springdoc 在 controller 未显式声明 produces 时默认输出通配符 content-type 的场景，
 * 此前硬编码 application/json 会导致响应 schema 取不到，
 * 进而使生成的响应类型退化为 any 或 z.object({})。
 * @param operation OpenAPI 操作对象
 * @returns 包含 schema 的对象，或 null
 *
 * @example
 * ```typescript
 * const resp = getResponseSchema(operation);
 * if (resp) {
 *   const { schema } = resp; // 可能为 $ref、inline object、array 等
 * }
 * ```
 */
export function getResponseSchema(operation: OpenApiOperation): { schema: OpenApiSchema } | null {
  if (!operation.responses) return null;

  // 优先取 200，其次 201
  const successResponse = operation.responses['200'] || operation.responses['201'];
  if (!successResponse?.content) return null;

  const { content } = successResponse;

  // 优先 application/json
  if (content['application/json']?.schema) {
    return { schema: content['application/json'].schema };
  }

  // 其次通配符 content-type（springdoc 默认输出）
  if (content['*/*']?.schema) {
    return { schema: content['*/*'].schema };
  }

  // fallback：取第一个可用的 content-type
  for (const mediaType of Object.values(content)) {
    if (mediaType.schema) {
      return { schema: mediaType.schema };
    }
  }

  return null;
}

/**
 * @description 获取请求体的 content-type
 * @param operation OpenAPI 操作对象
 * @returns content-type 字符串，如 'multipart/form-data'、'application/json'，或 null
 */
export function getRequestContentType(operation: OpenApiOperation): string | null {
  if (!operation.requestBody?.content) return null;
  const contentTypes = Object.keys(operation.requestBody.content);
  return contentTypes[0] || null;
}

/**
 * @description 判断请求是否为 multipart/form-data
 * @param operation OpenAPI 操作对象
 * @returns 是否为 multipart/form-data 请求
 */
export function isFormDataRequest(operation: OpenApiOperation): boolean {
  return getRequestContentType(operation) === 'multipart/form-data';
}

/**
 * @description 检查是否有请求体
 * @param operation OpenAPI 操作对象
 * @returns 是否有请求体
 *
 * @example
 * ```typescript
 * const hasBody = hasRequestBody(operation);
 * // 如果操作有 requestBody，返回 true
 * ```
 */
export function hasRequestBody(operation: OpenApiOperation): boolean {
  return !!operation.requestBody;
}

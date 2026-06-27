/**
 * @description $ref 解析模块
 * 将 OpenAPI 的 $ref（形如 #/components/schemas/Name）解析为对应的 schema，
 * 并提供 allOf 组合 schema 的展平合并。仅支持 #/components/schemas/ 形式
 * （项目当前唯一用法）。
 */

import type { OpenApiSchema } from '@/types';
import type { ProcessedApiData } from '@/processors/openapi';
import { sanitizeTypeName } from '@/naming';

/**
 * @description 解析 $ref 为对应的 schema
 * 仅支持 #/components/schemas/Name 形式（项目当前唯一用法）。
 * @param $ref 引用路径，如 '#/components/schemas/User'
 * @param processedData 处理后的 API 数据（含完整类型定义）
 * @returns 解析到的 schema，或 undefined（未找到）
 *
 * @example
 * ```typescript
 * const schema = resolveRef('#/components/schemas/User', processedData);
 * // schema = { type: 'object', properties: { id: { type: 'number' } } }
 * ```
 */
export function resolveRef(
  $ref: string,
  processedData: ProcessedApiData,
): OpenApiSchema | undefined {
  if (!$ref) return undefined;
  const refName = sanitizeTypeName($ref.split('/').pop()!);
  return processedData.types.find((t) => t.name === refName)?.schema;
}

/**
 * @description 解析并合并 allOf 组合 schema
 * 子 schema 若是 $ref，先经 resolveRef 展开；properties 后者覆盖前者同名属性；
 * required 取并集。非 allOf 的 schema 原样返回（无副作用）。
 * @param schema 可能含 allOf 的 schema
 * @param processedData 处理后的 API 数据（用于解析子 schema 的 $ref）
 * @returns 展平后的 schema（若含 allOf），或原 schema（若不含 allOf）
 *
 * @example
 * ```typescript
 * const merged = resolveComposedSchema(
 *   { allOf: [{ $ref: '#/components/schemas/Base' }, { properties: { ext: { type: 'string' } } }] },
 *   processedData,
 * );
 * // merged = { type: 'object', properties: { base: {...}, ext: {...} }, required: [...] }
 * ```
 */
export function resolveComposedSchema(
  schema: OpenApiSchema,
  processedData: ProcessedApiData,
): OpenApiSchema {
  if (!schema.allOf?.length) return schema;

  const merged: OpenApiSchema = { type: 'object', properties: {}, required: [] };
  for (const sub of schema.allOf) {
    const resolved = sub.$ref ? (resolveRef(sub.$ref, processedData) ?? sub) : sub;
    if (resolved.properties) {
      Object.assign(merged.properties!, resolved.properties);
    }
    if (resolved.required) {
      merged.required = [...new Set([...(merged.required ?? []), ...resolved.required])];
    }
  }
  return merged;
}

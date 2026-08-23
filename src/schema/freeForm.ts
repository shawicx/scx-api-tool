/**
 * @description 自由格式对象（free-form）检测与 JsonValue 类型定义
 *
 * Java Jackson 的动态类型（JsonNode / ObjectNode / ArrayNode 等）在 springdoc-openapi
 * 导出时，因结构运行时才能确定，会产出 free-form schema（如 `{ type: 'object' }` 或
 * `{ additionalProperties: true }`）。本模块负责识别这类 schema，并为其生成精确的
 * 递归联合类型 `JsonValue`（任意 JSON 值：对象/数组/标量/null 皆可）。
 *
 * 本模块属于中立层（src/schema/）：processors 与 generator 共用，
 * 避免 processors → generator 的反向依赖。
 */

import type { ApiTypeDefinition, OpenApiSchema } from '@/types';

/**
 * Jackson 动态类型的已知命名（sanitize 后保持原样，无碰撞风险）
 * 这些类型在运行时才能确定结构，应映射为 JsonValue
 */
export const JACKSON_DYNAMIC_TYPE_NAMES = new Set([
  'JsonNode',
  'ObjectNode',
  'ArrayNode',
  'MissingNode',
  'POJONode',
]);

/**
 * @description 判断 schema 是否为 free-form（任意 JSON 值）。
 *
 * 判定依据（必须满足全部）：
 * 1. type 缺失或为 'object'
 * 2. 无具名 properties（或有但为空）
 * 3. additionalProperties 为 `true` 或空对象 `{}`（springdoc free-form 信号）
 *
 * **不**把「纯 `{ type: 'object' }` 且 additionalProperties 缺失」判为 free-form，
 * 以避免误伤真正的空 DTO（其结构将来可能扩展）。后者保持兜底 `Record<string, any>`。
 *
 * @param schema OpenAPI Schema 对象
 * @returns 是否为 free-form
 *
 * @example
 * ```typescript
 * isFreeFormSchema({ additionalProperties: true }); // true
 * isFreeFormSchema({ additionalProperties: {} });   // true
 * isFreeFormSchema({ type: 'object' });             // false（无 free-form 信号）
 * isFreeFormSchema({ type: 'object', properties: { id: {...} } }); // false（有具名字段）
 * isFreeFormSchema({ additionalProperties: { $ref: '...' } });      // false（是真正的 map）
 * ```
 */
export function isFreeFormSchema(schema: OpenApiSchema): boolean {
  if (!schema) return false;
  // type 非 object（如 array/string）不是 free-form
  if (schema.type && schema.type !== 'object') return false;
  // 有具名 properties 的是普通 DTO
  if (schema.properties && Object.keys(schema.properties).length > 0) return false;

  const ap = schema.additionalProperties;
  // true：OpenAPI 规范明确的 free-form 信号
  if (ap === true) return true;
  // 空对象 {}：springdoc 常见产物
  if (ap !== undefined && ap !== false && typeof ap === 'object' && Object.keys(ap).length === 0) {
    return true;
  }
  // 缺失 additionalProperties（纯 { type: 'object' }）→ 不判为 free-form
  return false;
}

/**
 * @description 判断命名 schema 是否为 Jackson 动态类型（JsonNode 等）
 * @param name 已 sanitize 的类型名
 * @returns 是否为 Jackson 动态类型
 */
export function isJacksonDynamicType(name: string): boolean {
  return JACKSON_DYNAMIC_TYPE_NAMES.has(name);
}

/**
 * @description 构造内置的 JsonValue 类型定义（供注入 processedData.types）
 *
 * 该定义带 `kind: 'jsonValue'` 标记，生成器据此渲染递归联合类型：
 * `type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }`
 *
 * @returns JsonValue 的虚拟类型定义
 */
export function createJsonValueDefinition(): ApiTypeDefinition {
  return {
    name: 'JsonValue',
    originalName: 'JsonValue',
    schema: { type: 'object', description: '任意 JSON 值（对象/数组/标量/null 皆可，递归）' },
    kind: 'jsonValue',
  };
}

/**
 * @description 判断类型定义是否为 Jackson 动态类型别名（kind === 'jsonValueAlias'）
 * @param type 类型定义
 * @returns 是否为 JsonValue 别名
 */
export function isJsonValueAlias(type: ApiTypeDefinition): boolean {
  return type.kind === 'jsonValueAlias';
}

/**
 * @description 判断类型定义是否为内置的 JsonValue 类型本身（kind === 'jsonValue'）
 * @param type 类型定义
 * @returns 是否为 JsonValue 类型
 */
export function isJsonValueDefinition(type: ApiTypeDefinition): boolean {
  return type.kind === 'jsonValue';
}

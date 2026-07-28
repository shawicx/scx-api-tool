/**
 * @description 属性类型映射模块
 * 将 OpenAPI Schema 属性转换为 TypeScript 类型字符串，支持
 * nullable（3.0 / 3.1 双版本）、oneOf/anyOf（union）、allOf（属性级简单 intersection）。
 * 从 extractor.ts 抽出以控制文件行数（AGENTS.md 约束 < 360 行）。
 */

import type { OpenApiSchema } from '../types';
import { sanitizeTypeName } from '@/naming';
import { isDepthExceeded } from '@/utils/schemaSafety';
import { isFreeFormSchema } from './freeForm';

/**
 * @description 将基础类型字符串映射（处理 string 的 binary format 等）
 * @param type OpenAPI 类型名
 * @param property 含 format 等信息的 schema
 * @returns TypeScript 类型字符串
 */
export function mapBasicType(type: string | undefined, property: OpenApiSchema): string {
  switch (type) {
    case 'string':
      if (property.format === 'binary') return 'File';
      return 'string';
    case 'number':
    case 'integer':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'null':
      return 'null';
    default:
      return 'any';
  }
}

/**
 * @description 检测属性是否可空（兼容 OpenAPI 3.0 的 nullable 与 3.1 的 type 数组）
 * @param property OpenAPI schema 属性
 * @returns 是否可空
 */
export function isNullable(property: OpenApiSchema): boolean {
  return (
    property.nullable === true ||
    (Array.isArray(property.type) && (property.type as unknown[]).includes('null'))
  );
}

/**
 * @description 包装 nullable：若属性可空，追加 ` | null`；否则原样返回。
 * 对 fallback `any` 不追加（保持既有 `any` 行为不变）
 * @param baseType 基础类型字符串
 * @param property OpenAPI schema 属性
 * @returns 包装后的类型字符串
 */
export function wrapNullable(baseType: string, property: OpenApiSchema): string {
  return isNullable(property) && baseType !== 'any' ? `${baseType} | null` : baseType;
}

/**
 * @description 获取属性类型
 * 将 OpenAPI Schema 属性转换为 TypeScript 类型字符串。
 * 支持 nullable（3.0 / 3.1 双版本）、oneOf/anyOf（union）、allOf（属性级简单 intersection）。
 * @param property OpenAPI Schema 属性对象
 * @param depth 当前递归深度（防 DoS）
 * @returns TypeScript 类型字符串
 *
 * @example
 * ```typescript
 * const type = getPropertyType({ type: 'string' }); // 'string'
 * const type = getPropertyType({ type: 'array', items: { type: 'number' } }); // 'number[]'
 * const type = getPropertyType({ $ref: '#/components/schemas/User' }); // 'User'
 * const type = getPropertyType({ type: 'string', nullable: true }); // 'string | null'
 * const type = getPropertyType({ oneOf: [{ type: 'string' }, { type: 'number' }] }); // 'string | number'
 * ```
 */
export function getPropertyType(property: OpenApiSchema, depth = 0): string {
  if (!property || isDepthExceeded(depth)) return 'any';

  // 处理引用类型
  if (property.$ref) {
    const refName = property.$ref.split('/').pop()!;
    return wrapNullable(sanitizeTypeName(refName), property);
  }

  // 处理组合类型 oneOf / anyOf（union 语义）
  if (property.oneOf || property.anyOf) {
    const subs = (property.oneOf || property.anyOf)!;
    const types = subs.map((s) => getPropertyType(s, depth + 1)).filter((t) => t !== 'any');
    const baseType = types.length ? types.join(' | ') : 'any';
    return wrapNullable(baseType, property);
  }

  // 处理组合类型 allOf（属性级简单 intersection，不查表；顶层合并由 extract 入口展平）
  if (property.allOf) {
    const types = property.allOf.map((s) => getPropertyType(s, depth + 1));
    const baseType = types.join(' & ');
    return wrapNullable(baseType || 'any', property);
  }

  // 处理数组类型
  if (property.type === 'array' && property.items) {
    return wrapNullable(`${getPropertyType(property.items, depth + 1)}[]`, property);
  }

  // 处理对象类型
  if (property.type === 'object') {
    // free-form（任意 JSON 值，如 Jackson JsonNode 属性、additionalProperties: true）
    // 映射为内置的 JsonValue 递归联合类型，而非 Record<string, any>
    if (isFreeFormSchema(property)) {
      return wrapNullable('JsonValue', property);
    }
    // 检查是否为 map（additionalProperties 含 $ref）
    const ap = property.additionalProperties;
    if (ap && typeof ap === 'object' && ap.$ref) {
      const refName = ap.$ref.split('/').pop()!;
      return wrapNullable(`Record<string, ${sanitizeTypeName(refName)}>`, property);
    }
    return wrapNullable('Record<string, any>', property);
  }

  // 处理 3.1 风格 type 数组（含 null 之外的类型取第一个非 null 项）
  if (Array.isArray(property.type)) {
    const nonNull = property.type.filter((t) => t !== 'null');
    if (nonNull.length) {
      const mapped = mapBasicType(nonNull[0] as string, property);
      return wrapNullable(mapped, property);
    }
    return 'null';
  }

  // 映射基本类型
  return wrapNullable(mapBasicType(property.type, property), property);
}

/**
 * @description Zod 组合 schema 处理模块
 * nullable 检测、基本类型映射、object/union/allOf 组合的 Zod 表达式生成
 * （从 types.ts 拆出以控制文件行数，AGENTS.md 约束 < 360 行）
 */

import { sanitizeTypeName } from '@/naming';
import { CircularRefGuard } from '@/utils/schemaSafety';
import { isFreeFormSchema } from '@/schema';
import type { OpenApiSchema } from '@/types';
import { generateZodSchemaFromOpenApiSchema, openApiPropertyToZodType } from './types';

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
 * @description 映射基本类型到 Zod（含 3.1 风格 type 数组取第一个非 null 项）
 * @param property OpenAPI schema 属性
 * @returns Zod 类型字符串与 imports
 */
export function composeBasic(property: OpenApiSchema): { type: string; imports: string[] } {
  const typeMap: Record<string, string> = {
    string: 'z.string()',
    number: 'z.number()',
    integer: 'z.number()',
    boolean: 'z.boolean()',
    null: 'z.null()',
  };

  // 3.1 风格 type 数组（非 null 项取第一个）
  if (Array.isArray(property.type)) {
    const nonNull = property.type.filter((t) => t !== 'null');
    if (nonNull.length && typeMap[nonNull[0] as string]) {
      return { type: typeMap[nonNull[0] as string], imports: [] };
    }
    return { type: 'z.any()', imports: [] };
  }

  if (property.type && typeMap[property.type]) {
    return { type: typeMap[property.type], imports: [] };
  }
  return { type: 'z.any()', imports: [] };
}

/**
 * @description 处理 object 类型（additionalProperties / properties / 空对象）
 * @param property 含 type:'object' 的 schema
 * @param depth 当前递归深度
 * @param guard 循环引用检测器（必须透传）
 * @returns Zod 类型字符串与 imports
 */
export function composeObject(
  property: OpenApiSchema,
  depth: number,
  guard: CircularRefGuard,
): { type: string; imports: string[] } {
  // free-form（任意 JSON 值，如 JsonNode 属性）→ z.unknown()
  if (isFreeFormSchema(property)) {
    return { type: 'z.unknown()', imports: [] };
  }
  const ap = property.additionalProperties;
  // additionalProperties 为具名 schema（非 boolean）时按 map 处理
  if (ap && typeof ap === 'object') {
    if (ap.$ref) {
      const refName = ap.$ref.split('/').pop()!;
      const sanitizedRefName = sanitizeTypeName(refName);
      return {
        type: `z.record(${sanitizedRefName}Schema)`,
        imports: [`${sanitizedRefName}Schema`],
      };
    }
    const inner = openApiPropertyToZodType(ap, depth + 1, guard);
    return { type: `z.record(${inner.type})`, imports: inner.imports };
  }
  if (property.properties) {
    const inner = generateZodSchemaFromOpenApiSchema(property, depth + 1, guard);
    return { type: inner.code, imports: inner.imports };
  }
  return { type: 'z.record(z.any())', imports: [] };
}

/**
 * @description 处理 oneOf / anyOf 组合
 * 递归每个子 schema（透传 guard），结果拼为 z.union([...])。
 * @param property 含 oneOf 或 anyOf 的 schema
 * @param depth 当前递归深度
 * @param guard 循环引用检测器（必须透传）
 * @returns z.union 类型字符串与收集的 imports
 */
export function composeUnion(
  property: OpenApiSchema,
  depth: number,
  guard: CircularRefGuard,
): { type: string; imports: string[] } {
  const subs = (property.oneOf || property.anyOf)!;
  const results = subs.map((s) => openApiPropertyToZodType(s, depth + 1, guard));
  const imports = results.flatMap((r) => r.imports);
  return {
    type: `z.union([${results.map((r) => r.type).join(', ')}])`,
    imports,
  };
}

/**
 * @description 处理 allOf 组合
 * 全为 $ref 时输出 z.intersection(A, B)；单个 $ref 退化为 {Name}Schema。
 * 含内联子 schema 时递归取各 object 后用 z.intersection 包裹（深度合并留作后续）。
 * @param property 含 allOf 的 schema
 * @param depth 当前递归深度
 * @param guard 循环引用检测器（必须透传）
 * @returns z.intersection 类型字符串与收集的 imports
 */
export function composeAllOf(
  property: OpenApiSchema,
  depth: number,
  guard: CircularRefGuard,
): { type: string; imports: string[] } {
  const subs = property.allOf!;
  const allRef = subs.every((s) => s.$ref);

  // 全为 $ref：z.intersection（单个时退化为该 ref）
  if (allRef) {
    const refs = subs.map((s) => {
      const refName = s.$ref!.split('/').pop()!;
      const sanitizedRefName = sanitizeTypeName(refName);
      return { type: `${sanitizedRefName}Schema`, import: `${sanitizedRefName}Schema` };
    });
    const imports = refs.map((r) => r.import);
    const type =
      refs.length === 1 ? refs[0].type : `z.intersection(${refs.map((r) => r.type).join(', ')})`;
    return { type, imports };
  }

  // 含内联子 schema：递归各子 schema 后用 z.intersection 包裹
  const results = subs.map((s) => openApiPropertyToZodType(s, depth + 1, guard));
  const imports = results.flatMap((r) => r.imports);
  return {
    type: `z.intersection(${results.map((r) => r.type).join(', ')})`,
    imports,
  };
}

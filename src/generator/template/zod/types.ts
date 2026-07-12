/**
 * @description Zod 类型模板模块
 * 处理 Zod 类型的模板生成
 */

import { compileTemplate } from '../index';
import { sanitizeTypeName, sanitizePropertyName } from '@/naming';
import { isDepthExceeded, CircularRefGuard } from '@/utils/schemaSafety';
import { escapeStringLiteral, escapeJsDocComment } from '@/utils/escape';
import type { ApiConfig, OpenApiSchema } from '@/types';
import { logger } from '@/utils/logger';

/**
 * @description Zod 类型生成所需的类型信息
 */
export interface ZodTypeInfo {
  name: string;
  schema: OpenApiSchema;
}

/**
 * @description Zod 类型模板 - 带注释
 * @returns 模板字符串
 */
function getZodTypeTemplateWithComment(): string {
  return `import { z } from 'zod';

/**
 {{#if description}}
 * @description {{description}}
 {{/if}}
 */
export const {{schemaName}} = {{{schemaContent}}};

// 推导类型
export type {{typeName}} = z.infer<typeof {{schemaName}}>;
`;
}

/**
 * @description Zod 类型模板 - 不带注释
 * @returns 模板字符串
 */
function getZodTypeTemplateWithoutComment(): string {
  return `import { z } from 'zod';

export const {{schemaName}} = {{{schemaContent}}};

// 推导类型
export type {{typeName}} = z.infer<typeof {{schemaName}}>;
`;
}

/**
 * @description 获取 Zod 类型模板
 * @param comment 是否包含注释
 * @returns 模板字符串
 */
export function getZodTypeTemplateByConfig(comment: boolean): string {
  return comment ? getZodTypeTemplateWithComment() : getZodTypeTemplateWithoutComment();
}

/**
 * @description 获取 Zod import 语句
 * @returns import 语句字符串
 */
export function getZodImportStatement(): string {
  return `import { z } from 'zod';\n`;
}

/**
 * @description 编译 Zod 类型模板并生成代码
 * @param typeInfo 类型信息
 * @param config 配置对象
 * @param processedData 处理后的 API 数据
 * @returns 生成的 Zod Schema 代码
 */
export function generateZodTypeSchema(typeInfo: ZodTypeInfo, config: ApiConfig): string {
  const template = compileTemplate(getZodTypeTemplateByConfig(config.comment !== false));

  const result = generateZodSchemaFromOpenApiSchema(typeInfo.schema);

  logger.debug(
    `Generating Zod type schema: ${typeInfo.name}, properties count: ${result.imports.length}`,
  );

  const templateData = {
    schemaName: `${typeInfo.name}Schema`,
    typeName: typeInfo.name,
    description: escapeJsDocComment(typeInfo.schema.description || typeInfo.name),
    schemaContent: result.code,
  };

  return template(templateData);
}

/**
 * @description 将 OpenAPI Schema 转换为 Zod Schema 字符串
 * @param schema OpenAPI Schema 对象
 * @param depth 当前递归深度（防 DoS）
 * @param guard 循环引用检测器
 * @returns 包含代码和需要导入的 schema 列表的对象
 */
export function generateZodSchemaFromOpenApiSchema(
  schema: OpenApiSchema,
  depth = 0,
  guard: CircularRefGuard = new CircularRefGuard(),
): {
  code: string;
  imports: string[];
} {
  // 空或深度超限短路
  if (!schema || isDepthExceeded(depth)) {
    return { code: 'z.object({})', imports: [] };
  }

  // 组合 schema 分支（必须在 !schema.properties 短路之前，否则组合 schema 被吞掉）
  if (schema.oneOf || schema.anyOf) {
    const result = composeUnion(schema, depth, guard);
    return { code: result.type, imports: result.imports };
  }
  if (schema.allOf) {
    const result = composeAllOf(schema, depth, guard);
    return { code: result.type, imports: result.imports };
  }

  // 无 properties 且无组合关键字 → 短路（保持既有 z.object({}) 行为）
  if (!schema.properties) {
    return { code: 'z.object({})', imports: [] };
  }

  if (typeof schema === 'object' && guard.begin(schema)) {
    return { code: 'z.object({})', imports: [] };
  }

  const fields: string[] = [];
  const imports: Set<string> = new Set();

  try {
    for (const [name, prop] of Object.entries(schema.properties)) {
      const sanitizedName = sanitizePropertyName(name);
      const result = openApiPropertyToZodType(prop, depth + 1, guard);
      const required = schema.required?.includes(name);
      const optional = required ? '' : '.optional()';
      fields.push(`  ${sanitizedName}: ${result.type}${optional},`);

      result.imports.forEach((imp) => imports.add(imp));
    }
  } finally {
    if (typeof schema === 'object') guard.end(schema);
  }

  return {
    code: `z.object({\n${fields.join('\n')}\n})`,
    imports: Array.from(imports),
  };
}

/**
 * @description 检测属性是否可空（兼容 OpenAPI 3.0 的 nullable 与 3.1 的 type 数组）
 * @param property OpenAPI schema 属性
 * @returns 是否可空
 */
function isNullable(property: OpenApiSchema): boolean {
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
function composeBasic(property: OpenApiSchema): { type: string; imports: string[] } {
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
function composeObject(
  property: OpenApiSchema,
  depth: number,
  guard: CircularRefGuard,
): { type: string; imports: string[] } {
  if (property.additionalProperties) {
    if (property.additionalProperties.$ref) {
      const refName = property.additionalProperties.$ref.split('/').pop()!;
      const sanitizedRefName = sanitizeTypeName(refName);
      return {
        type: `z.record(${sanitizedRefName}Schema)`,
        imports: [`${sanitizedRefName}Schema`],
      };
    }
    const inner = openApiPropertyToZodType(property.additionalProperties, depth + 1, guard);
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
function composeUnion(
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
function composeAllOf(
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

/**
 * @description 将 OpenAPI property 转换为 Zod 类型。
 * 支持 nullable（3.0 / 3.1 双版本）、oneOf/anyOf（z.union）、allOf（z.intersection）。
 * @param property OpenAPI property 对象
 * @param depth 当前递归深度（防 DoS）
 * @param guard 循环引用检测器
 * @returns 包含类型字符串和引用的 schema 列表的对象
 */
export function openApiPropertyToZodType(
  property: OpenApiSchema,
  depth = 0,
  guard: CircularRefGuard = new CircularRefGuard(),
): {
  type: string;
  imports: string[];
} {
  if (!property || isDepthExceeded(depth)) return { type: 'z.any()', imports: [] };

  let result: { type: string; imports: string[] };

  if (property.$ref) {
    const refName = property.$ref.split('/').pop()!;
    const sanitizedRefName = sanitizeTypeName(refName);
    result = {
      type: `${sanitizedRefName}Schema`,
      imports: [`${sanitizedRefName}Schema`],
    };
  } else if (property.oneOf || property.anyOf) {
    result = composeUnion(property, depth, guard);
  } else if (property.allOf) {
    result = composeAllOf(property, depth, guard);
  } else if (property.type === 'array' && property.items) {
    const inner = openApiPropertyToZodType(property.items, depth + 1, guard);
    result = { type: `z.array(${inner.type})`, imports: inner.imports };
  } else if (property.type === 'object') {
    result = composeObject(property, depth, guard);
  } else if (property.enum) {
    const enumValues = property.enum.map((v) => `'${escapeStringLiteral(v)}'`);
    result = { type: `z.union([${enumValues.join(', ')}])`, imports: [] };
  } else {
    result = composeBasic(property);
  }

  // nullable 包装（兼容 3.0 的 nullable 与 3.1 的 type 数组）
  if (isNullable(property)) {
    return { type: `${result.type}.nullable()`, imports: result.imports };
  }
  return result;
}

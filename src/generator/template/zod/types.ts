/**
 * @description Zod 类型模板模块
 * 处理 Zod 类型的模板生成
 */

import { compileTemplate } from '../index';
import { sanitizeTypeName, sanitizePropertyName } from '@/naming';
import { isDepthExceeded, CircularRefGuard } from '@/utils/schemaSafety';
import { escapeStringLiteral, escapeJsDocComment } from '@/utils/escape';
import type { ApiConfig, OpenApiSchema } from '@/types';
import { isFreeFormSchema } from '@/schema';
import { renderRecursiveTypeSchema } from './recursive';
import { isNullable, composeBasic, composeObject, composeUnion, composeAllOf } from './compose';
import { logger } from '@/utils/logger';

/**
 * @description Zod 类型生成所需的类型信息
 */
export interface ZodTypeInfo {
  name: string;
  schema: OpenApiSchema;
  /** 类型种类：jsonValue（递归）/ jsonValueAlias（别名）/ 缺省（普通） */
  kind?: 'jsonValue' | 'jsonValueAlias';
}

/**
 * @description Zod 类型模板 - 带注释
 * @returns 模板字符串
 */
function getZodTypeTemplateWithComment(): string {
  return `import { z } from 'zod';
{{#each extraImports}}
import { {{name}} } from '{{path}}';
{{/each}}
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
{{#each extraImports}}
import { {{name}} } from '{{path}}';
{{/each}}
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

  // 内置递归 JsonValue：自包含的 z.lazy 定义（不依赖外部 import）
  // schemaContent 会拼到 `export const XSchema: z.ZodType<X> = {{{schemaContent}}};`
  // 类型 X 在 const 声明时被前向引用，TS 编译期解析允许（与运行时 const 初始化无关）
  if (typeInfo.kind === 'jsonValue') {
    logger.debug(`Generating recursive JsonValue schema: ${typeInfo.name}`);
    const schemaName = `${typeInfo.name}Schema`;
    const typeName = typeInfo.name;
    // 注意：模板里 const 声明需带类型标注 z.ZodType<X>，否则 z.lazy 无法推断递归类型
    // 现有模板（getZodTypeTemplateByConfig）不含类型标注，这里用 schemaContent 自带 `as` 无法满足，
    // 故对 jsonValue 走专用渲染（绕过通用模板，直接拼字符串）
    const comment = config.comment !== false;
    const desc = escapeJsDocComment(typeInfo.schema.description || '任意 JSON 值');
    const header = comment
      ? `import { z } from 'zod';\n\n/**\n * @description ${desc}\n */\n`
      : `import { z } from 'zod';\n\n`;
    return (
      `${header}export const ${schemaName}: z.ZodType<${typeName}> = z.lazy(() =>\n` +
      `  z.union([\n` +
      `    z.string(),\n` +
      `    z.number(),\n` +
      `    z.boolean(),\n` +
      `    z.null(),\n` +
      `    z.array(${schemaName}),\n` +
      `    z.record(${schemaName}),\n` +
      `  ]),\n` +
      `);\n\n` +
      `// 推导类型\n` +
      `export type ${typeName} = z.infer<typeof ${schemaName}>;\n`
    );
  }

  // Jackson 别名：JsonNodeSchema = JsonValueSchema（引用已定义的递归 schema）
  if (typeInfo.kind === 'jsonValueAlias') {
    logger.debug(`Generating JsonValue alias schema: ${typeInfo.name}`);
    return template({
      schemaName: `${typeInfo.name}Schema`,
      typeName: typeInfo.name,
      description: escapeJsDocComment(typeInfo.schema.description || typeInfo.name),
      schemaContent: 'JsonValueSchema',
      // 别名文件引用 JsonValueSchema，必须补齐同目录 import（否则生成产物编译报 TS2304）
      extraImports: [{ name: 'JsonValueSchema', path: './JsonValueSchema' }],
    });
  }

  const result = generateZodSchemaFromOpenApiSchema(typeInfo.schema);

  const schemaName = `${typeInfo.name}Schema`;

  // 自引用检测：schema 内容引用了自身（如树形结构的 children），
  // zod 递归必须用 z.lazy 延迟求值，且 const 声明需要显式类型标注（否则 TS7022 循环推断）
  const selfRefPattern = new RegExp(`\\b${schemaName}\\b`);
  const isRecursive = selfRefPattern.test(result.code);
  let schemaContent = result.code;
  if (isRecursive) {
    schemaContent = schemaContent.replace(
      new RegExp(`\\b${schemaName}\\b`, 'g'),
      `z.lazy(() => ${schemaName})`,
    );
  }

  logger.debug(
    `Generating Zod type schema: ${typeInfo.name}, properties count: ${result.imports.length}`,
  );

  // 跨类型 $ref：为引用的其他 Schema 生成同目录 import（过滤自身引用，去重）
  const refImports = Array.from(new Set(result.imports))
    .filter((name) => name !== schemaName)
    .map((name) => ({ name, path: `./${name}` }));

  // 递归 schema 走专用渲染（见 recursive.ts）：const 声明带 `: z.ZodType<X>` 标注，
  // 类型 X 以手写 interface 声明（zod 官方递归模式），避免 z.infer 循环推导（TS2456/TS2502）
  if (isRecursive) {
    return renderRecursiveTypeSchema(typeInfo, config, schemaContent, refImports);
  }

  const templateData = {
    schemaName,
    typeName: typeInfo.name,
    description: escapeJsDocComment(typeInfo.schema.description || typeInfo.name),
    schemaContent,
    extraImports: refImports,
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

  // 无 properties 且无组合关键字 → 短路
  // free-form（additionalProperties: true / {}，如 Jackson JsonNode）→ z.unknown()
  // 运行时接受任意 JSON 值（对象/数组/标量/null），匹配 JsonNode 语义
  if (!schema.properties) {
    if (isFreeFormSchema(schema)) {
      return { code: 'z.unknown()', imports: [] };
    }
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
    result =
      property.type === 'string' && property.format === 'binary'
        ? { type: 'z.instanceof(File)', imports: [] }
        : composeBasic(property);
  }

  // nullable 包装（兼容 3.0 的 nullable 与 3.1 的 type 数组）
  if (isNullable(property)) {
    return { type: `${result.type}.nullable()`, imports: result.imports };
  }
  return result;
}

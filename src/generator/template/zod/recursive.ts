/**
 * @description 递归 Zod Schema 渲染模块
 * 自引用类型（如树形结构 children）需要 z.lazy 延迟求值 + 手写 interface 类型声明
 * （zod 官方递归模式：z.infer 与 z.ZodType<X> 标注互相循环引用，无法推导，TS2456/TS2502）
 */

import { sanitizeTypeName, sanitizePropertyName } from '@/naming';
import { escapeJsDocComment } from '@/utils/escape';
import { getPropertyType } from '../../propertyType';
import type { ApiConfig, OpenApiSchema } from '@/types';
import type { ZodTypeInfo } from './types';

/** 跨类型 Schema 引用（name + import 路径） */
export interface SchemaRefImport {
  name: string;
  path: string;
}

/**
 * @description 渲染递归类型的完整 Schema 文件
 * @param typeInfo 类型信息（name / schema）
 * @param config 配置对象
 * @param schemaContent 已包裹 z.lazy 的 schema 内容字符串
 * @param refImports 跨类型 Schema 值导入列表
 * @returns 完整文件代码字符串
 */
export function renderRecursiveTypeSchema(
  typeInfo: ZodTypeInfo,
  config: ApiConfig,
  schemaContent: string,
  refImports: SchemaRefImport[],
): string {
  const comment = config.comment !== false;
  const desc = escapeJsDocComment(typeInfo.schema.description || typeInfo.name);
  const schemaName = `${typeInfo.name}Schema`;
  const refTypeNames = collectRefTypeNames(typeInfo.schema, typeInfo.name);

  const importLines = [
    "import { z } from 'zod';",
    ...refImports.map((r) => `import { ${r.name} } from '${r.path}';`),
    ...refTypeNames.map((n) => `import type { ${n} } from './${n}Schema';`),
  ].join('\n');
  const header = comment
    ? `${importLines}\n\n/**\n * @description ${desc}\n */\n`
    : `${importLines}\n\n`;

  const interfaceCode = buildRecursiveTypeInterface(typeInfo.name, typeInfo.schema);
  return (
    `${header}export const ${schemaName}: z.ZodType<${typeInfo.name}> = ${schemaContent};\n\n` +
    `// 递归类型：手写 interface（z.infer 与 z.ZodType 标注循环引用，无法推导）\n` +
    `${interfaceCode}\n`
  );
}

/**
 * @description 收集 schema 树中引用的其他类型名（$ref 末段，过滤自身）
 * 用于递归类型 interface 的 `import type` 生成
 * @param schema OpenAPI Schema 对象
 * @param selfName 自身类型名（过滤自引用）
 * @returns 引用的类型名数组（去重）
 */
function collectRefTypeNames(schema: OpenApiSchema, selfName: string): string[] {
  const names = new Set<string>();

  function walk(node: unknown): void {
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (node && typeof node === 'object') {
      for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
        if (key === '$ref' && typeof value === 'string') {
          const refName = sanitizeTypeName(value.split('/').pop()!);
          if (refName !== selfName) {
            names.add(refName);
          }
        } else {
          walk(value);
        }
      }
    }
  }

  walk(schema);
  return Array.from(names);
}

/**
 * @description 为递归类型生成手写 interface（zod 官方递归模式）
 * interface 的属性自引用（如 children: X[]）在 TS 中合法，绕开 z.infer 的循环推导
 * @param name 类型名
 * @param schema OpenAPI Schema 对象
 * @returns interface 声明代码字符串
 *
 * @example
 * ```typescript
 * buildRecursiveTypeInterface('MenuNode', {
 *   type: 'object',
 *   properties: { id: { type: 'string' }, children: { type: 'array', items: { $ref: '#/components/schemas/MenuNode' } } },
 *   required: ['id'],
 * });
 * // export interface MenuNode {
 * //   id: string;
 * //   children?: MenuNode[];
 * // }
 * ```
 */
function buildRecursiveTypeInterface(name: string, schema: OpenApiSchema): string {
  const lines: string[] = [];
  for (const [propName, propSchema] of Object.entries(schema.properties ?? {})) {
    const required = schema.required?.includes(propName);
    const optional = required ? '' : '?';
    lines.push(
      `  ${sanitizePropertyName(propName)}${optional}: ${getPropertyType(propSchema as OpenApiSchema)};`,
    );
  }
  return `export interface ${name} {\n${lines.join('\n')}\n}`;
}

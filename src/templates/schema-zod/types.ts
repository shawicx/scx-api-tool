/**
 * @description Zod 类型模板模块
 * 处理 Zod 类型的模板生成
 */

import Handlebars from 'handlebars';
import consola from 'consola';
import { compileTemplate } from '../../generator/template/index';
import { sanitizeTypeName, sanitizePropertyName } from '../../generator/naming';
import { ProcessedApiData } from '../../processors/openapi';

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
export function generateZodTypeSchema(
  typeInfo: any,
  config: any,
  processedData?: ProcessedApiData,
): string {
  const template = compileTemplate(getZodTypeTemplateByConfig(config.comment !== false));

  const result = generateZodSchemaFromOpenApiSchema(typeInfo.schema);

  if (process.env.DEBUG) {
    consola.debug(
      `Generating Zod type schema: ${typeInfo.name}, properties count: ${result.imports.length}`,
    );
  }

  const templateData = {
    schemaName: `${typeInfo.name}Schema`,
    typeName: typeInfo.name,
    description: typeInfo.schema.description || typeInfo.name,
    schemaContent: result.code,
  };

  return template(templateData);
}

/**
 * @description 将 OpenAPI Schema 转换为 Zod Schema 字符串
 * @param schema OpenAPI Schema 对象
 * @returns 包含代码和需要导入的 schema 列表的对象
 */
export function generateZodSchemaFromOpenApiSchema(schema: any): {
  code: string;
  imports: string[];
} {
  if (!schema || !schema.properties) {
    return { code: 'z.object({})', imports: [] };
  }

  const fields: string[] = [];
  const imports: Set<string> = new Set();

  for (const [name, prop] of Object.entries(schema.properties)) {
    const sanitizedName = sanitizePropertyName(name);
    const result = openApiPropertyToZodType(prop);
    const required = schema.required?.includes(name);
    const optional = required ? '' : '.optional()';
    fields.push(`  ${sanitizedName}: ${result.type}${optional},`);

    result.imports.forEach((imp) => imports.add(imp));
  }

  return {
    code: `z.object({\n${fields.join('\n')}\n})`,
    imports: Array.from(imports),
  };
}

/**
 * @description 将 OpenAPI property 转换为 Zod 类型
 * @param property OpenAPI property 对象
 * @returns 包含类型字符串和引用的 schema 列表的对象
 */
export function openApiPropertyToZodType(property: any): {
  type: string;
  imports: string[];
} {
  if (!property) return { type: 'z.any()', imports: [] };

  if (property.$ref) {
    const refName = property.$ref.split('/').pop();
    const sanitizedRefName = sanitizeTypeName(refName);
    return {
      type: `${sanitizedRefName}Schema`,
      imports: [`${sanitizedRefName}Schema`],
    };
  }

  if (property.type === 'array' && property.items) {
    const result = openApiPropertyToZodType(property.items);
    return {
      type: `z.array(${result.type})`,
      imports: result.imports,
    };
  }

  if (property.type === 'object') {
    if (property.additionalProperties) {
      if (property.additionalProperties.$ref) {
        const refName = property.additionalProperties.$ref.split('/').pop();
        const sanitizedRefName = sanitizeTypeName(refName);
        return {
          type: `z.record(${sanitizedRefName}Schema)`,
          imports: [`${sanitizedRefName}Schema`],
        };
      }
      const result = openApiPropertyToZodType(property.additionalProperties);
      return {
        type: `z.record(${result.type})`,
        imports: result.imports,
      };
    }
    if (property.properties) {
      const result = generateZodSchemaFromOpenApiSchema(property);
      return { type: result.code, imports: result.imports };
    }
    return { type: 'z.record(z.any())', imports: [] };
  }

  if (property.enum) {
    const enumValues = property.enum.map((v: any) => {
      if (typeof v === 'string') return `'${v}'`;
      return String(v);
    });
    return { type: `z.union([${enumValues.join(', ')}])`, imports: [] };
  }

  const typeMap: Record<string, string> = {
    string: 'z.string()',
    number: 'z.number()',
    integer: 'z.number()',
    boolean: 'z.boolean()',
    null: 'z.null()',
  };

  if (typeMap[property.type]) {
    return { type: typeMap[property.type], imports: [] };
  }

  return { type: 'z.any()', imports: [] };
}

/**
 * @description Zod Schema 模板
 * 用于生成运行时验证 Schema
 */

import Handlebars from 'handlebars';
import consola from 'consola';
import { compileTemplate } from '../generator/template';
import { sanitizeTypeName, sanitizePropertyName } from '../generator/naming';

/**
 * Zod 类型模板 - 带注释
 */
function getZodTypeTemplateWithComment(): string {
  return `import { z } from 'zod';

/**
{{#if description}}
 * @description {{description}}
{{/if}}
 */
export const {{schemaName}} = {{{schemaContent}}};
`;
}

/**
 * Zod 类型模板 - 不带注释
 */
function getZodTypeTemplateWithoutComment(): string {
  return `import { z } from 'zod';

export const {{schemaName}} = {{{schemaContent}}};
`;
}

/**
 * 获取 Zod 类型模板
 */
export function getZodTypeTemplateByConfig(comment: boolean): string {
  return comment ? getZodTypeTemplateWithComment() : getZodTypeTemplateWithoutComment();
}

/**
 * Zod Request Schema 模板内容 - 带注释（不包含 import）
 */
function getZodRequestSchemaContentWithComment(): string {
  return `/**
{{#if description}}
 * @description {{description}} - 请求参数 Schema
{{/if}}
 */
export const {{requestSchemaName}} = {{{requestSchemaContent}}};
`;
}

/**
 * Zod Request Schema 模板内容 - 不带注释（不包含 import）
 */
function getZodRequestSchemaContentWithoutComment(): string {
  return `export const {{requestSchemaName}} = {{{requestSchemaContent}}};
`;
}

/**
 * 获取 Zod Request Schema 模板内容（不包含 import）
 */
export function getZodRequestSchemaContentByConfig(comment: boolean): string {
  return comment
    ? getZodRequestSchemaContentWithComment()
    : getZodRequestSchemaContentWithoutComment();
}

/**
 * 获取 Zod import 语句
 */
export function getZodImportStatement(): string {
  return `import { z } from 'zod';\n`;
}

/**
 * Zod Response Schema 模板内容 - 带注释（不包含 import）
 */
function getZodResponseSchemaContentWithComment(): string {
  return `/**
{{#if description}}
 * @description {{description}} - 响应数据 Schema
{{/if}}
 */
export const {{responseSchemaName}} = {{{responseSchemaContent}}};
`;
}

/**
 * Zod Response Schema 模板内容 - 不带注释（不包含 import）
 */
function getZodResponseSchemaContentWithoutComment(): string {
  return `export const {{responseSchemaName}} = {{{responseSchemaContent}}};
`;
}

/**
 * 获取 Zod Response Schema 模板内容（不包含 import）
 */
export function getZodResponseSchemaContentByConfig(comment: boolean): string {
  return comment
    ? getZodResponseSchemaContentWithComment()
    : getZodResponseSchemaContentWithoutComment();
}

/**
 * 生成 Zod Schema 索引文件内容
 */
export function generateZodSchemaIndex(schemas: string[]): string {
  let content = '// Zod Schema 导出\n\n';

  for (const schema of schemas) {
    content += `export { ${schema} } from './${schema}';\n`;
  }

  return content;
}

/**
 * 编译 Zod 类型模板并生成代码
 */
export function generateZodTypeSchema(typeInfo: any, config: any): string {
  const template = compileTemplate(getZodTypeTemplateByConfig(config.comment !== false));

  // 生成 Zod schema 内容 - 直接从 schema 生成
  const result = generateZodSchemaFromOpenApiSchema(typeInfo.schema);

  const templateData = {
    schemaName: `${typeInfo.name}Schema`,
    description: typeInfo.description || typeInfo.name,
    schemaContent: result.code,
  };

  return template(templateData);
}

/**
 * 编译 Zod Request Schema 模板并生成代码（不包含 import）
 * 返回对象包含代码内容和引用的 schema 名称列表
 */
export function generateZodRequestSchema(
  interfaceInfo: any,
  processedData: any,
  config: any,
): { code: string; imports: string[] } {
  const template = compileTemplate(getZodRequestSchemaContentByConfig(config.comment !== false));

  // 生成 Zod schema 内容 - 直接从 operation 生成
  const result = generateZodSchemaFromOperation(interfaceInfo.operation, processedData, 'request');

  const templateData = {
    requestSchemaName: `${interfaceInfo.requestTypeName}Schema`,
    description: interfaceInfo.description,
    requestSchemaContent: result.code,
  };

  return {
    code: template(templateData),
    imports: result.imports,
  };
}

/**
 * 编译 Zod Response Schema 模板并生成代码（不包含 import）
 * 返回对象包含代码内容和引用的 schema 名称列表
 */
export function generateZodResponseSchema(
  interfaceInfo: any,
  processedData: any,
  config: any,
): { code: string; imports: string[] } {
  const template = compileTemplate(getZodResponseSchemaContentByConfig(config.comment !== false));

  // 生成 Zod schema 内容 - 直接从 operation 生成
  const result = generateZodSchemaFromOperation(interfaceInfo.operation, processedData, 'response');

  const templateData = {
    responseSchemaName: `${interfaceInfo.responseTypeName}Schema`,
    description: interfaceInfo.description,
    responseSchemaContent: result.code,
  };

  return {
    code: template(templateData),
    imports: result.imports,
  };
}

/**
 * 从 OpenAPI Schema 生成 Zod schema 内容
 * 返回对象包含代码和引用的 schema 列表
 */
function generateZodSchemaFromOpenApiSchema(schema: any): {
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

    // 收集引用的 schema
    result.imports.forEach((imp) => imports.add(imp));
  }

  return {
    code: `z.object({\n${fields.join('\n')}\n})`,
    imports: Array.from(imports),
  };
}

/**
 * 从 Operation 生成 Zod schema（request 或 response）
 * 返回对象包含代码和引用的 schema 列表
 */
function generateZodSchemaFromOperation(
  operation: any,
  processedData: any,
  type: 'request' | 'response',
): { code: string; imports: string[] } {
  let schema: any = null;
  const imports: Set<string> = new Set();

  if (type === 'request') {
    // 处理请求体或参数
    if (operation.requestBody?.content?.['application/json']?.schema) {
      schema = operation.requestBody.content['application/json'].schema;
    } else if (operation.parameters && operation.parameters.length > 0) {
      // 过滤掉 header 参数，只保留 query、path 等参数
      const nonHeaderParams = operation.parameters.filter((param: any) => param.in !== 'header');

      if (nonHeaderParams.length > 0) {
        const fields: string[] = [];
        for (const param of nonHeaderParams) {
          const sanitizedName = sanitizePropertyName(param.name);
          const result = openApiPropertyToZodType({ type: param.type || 'string' });
          const required = param.required !== false;
          const optional = required ? '' : '.optional()';
          fields.push(`  ${sanitizedName}: ${result.type}${optional},`);
          result.imports.forEach((imp) => imports.add(imp));
        }
        return {
          code: `z.object({\n${fields.join('\n')}\n})`,
          imports: Array.from(imports),
        };
      }
    }
  } else {
    // 处理响应
    const successResponse = operation.responses?.['200'] || operation.responses?.['201'];
    if (successResponse?.content?.['application/json']?.schema) {
      schema = successResponse.content['application/json'].schema;
    }
  }

  if (!schema) {
    return { code: 'z.object({})', imports: [] };
  }

  // 处理 $ref
  if (schema.$ref) {
    const refName = schema.$ref.split('/').pop();
    const sanitizedRefName = sanitizeTypeName(refName);
    return {
      code: `${sanitizedRefName}Schema`,
      imports: [`${sanitizedRefName}Schema`],
    };
  }

  return generateZodSchemaFromOpenApiSchema(schema);
}

/**
 * 将 OpenAPI property 转换为 Zod 类型
 * 返回对象包含类型字符串和引用的 schema 列表
 */
function openApiPropertyToZodType(property: any): {
  type: string;
  imports: string[];
} {
  if (!property) return { type: 'z.any()', imports: [] };

  // 处理 $ref 引用
  if (property.$ref) {
    const refName = property.$ref.split('/').pop();
    const sanitizedRefName = sanitizeTypeName(refName);
    return {
      type: `${sanitizedRefName}Schema`,
      imports: [`${sanitizedRefName}Schema`],
    };
  }

  // 处理数组类型
  if (property.type === 'array' && property.items) {
    const result = openApiPropertyToZodType(property.items);
    return {
      type: `z.array(${result.type})`,
      imports: result.imports,
    };
  }

  // 处理对象类型
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

  // 处理枚举类型
  if (property.enum) {
    const enumValues = property.enum.map((v: any) => {
      if (typeof v === 'string') return `'${v}'`;
      return String(v);
    });
    return { type: `z.union([${enumValues.join(', ')}])`, imports: [] };
  }

  // 基础类型映射
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

  // 默认返回 any
  return { type: 'z.any()', imports: [] };
}

/**
 * @description Zod Schema 模板
 * 用于生成运行时验证 Schema
 */

import Handlebars from 'handlebars';
import consola from 'consola';
import { compileTemplate } from '../generator/template';
import { sanitizeTypeName, sanitizePropertyName } from '../generator/naming';
import { ProcessedApiData } from '../processors/openapi';

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

// 推导类型
export type {{typeName}} = z.infer<typeof {{schemaName}}>;
 `;
}

/**
 * Zod 类型模板 - 不带注释
 */
function getZodTypeTemplateWithoutComment(): string {
  return `import { z } from 'zod';

export const {{schemaName}} = {{{schemaContent}}};

// 推导类型
export type {{typeName}} = z.infer<typeof {{schemaName}}>;
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
 * 接口级 Schema 模板（包含 Request/Response Schema 和推导类型）
 */
function getZodInterfaceSchemaTemplateWithComment(): string {
  return `import { z } from 'zod';
{{#each typeImports}}
import { {{.}} } from '../schemas/{{.}}';
{{/each}}

/**
{{#if requestDescription}}
 * @description {{requestDescription}}
{{/if}}
 */
export const {{requestSchemaName}} = {{{requestSchemaContent}}};

/**
{{#if responseDescription}}
 * @description {{responseDescription}}
{{/if}}
 */
export const {{responseSchemaName}} = {{{responseSchemaContent}}};

// 推导类型
export type {{requestTypeName}} = z.infer<typeof {{requestSchemaName}}>;
export type {{responseTypeName}} = z.infer<typeof {{responseSchemaName}}>;
`;
}

/**
 * 接口级 Schema 模板（不包含注释，包含 Request/Response Schema 和推导类型）
 */
function getZodInterfaceSchemaTemplateWithoutComment(): string {
  return `import { z } from 'zod';
{{#each typeImports}}
import { {{.}} } from '../schemas/{{.}}';
{{/each}}

export const {{requestSchemaName}} = {{{requestSchemaContent}}};

export const {{responseSchemaName}} = {{{responseSchemaContent}}};

// 推导类型
export type {{requestTypeName}} = z.infer<typeof {{requestSchemaName}}>;
export type {{responseTypeName}} = z.infer<typeof {{responseSchemaName}}>;
`;
}

/**
 * 获取接口级 Schema 模板（包含推导类型）
 */
export function getZodInterfaceSchemaTemplateByConfig(comment: boolean): string {
  return comment
    ? getZodInterfaceSchemaTemplateWithComment()
    : getZodInterfaceSchemaTemplateWithoutComment();
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
export function generateZodTypeSchema(
  typeInfo: any,
  config: any,
  processedData?: ProcessedApiData,
): string {
  const template = compileTemplate(getZodTypeTemplateByConfig(config.comment !== false));

  // 生成 Zod schema 内容 - 直接从 schema 生成
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

/**
 * 生成接口级 Schema 文件（包含 Request/Response Schema 和推导类型）
 * @param interfaceInfo 接口信息
 * @param processedData 处理后的 API 数据
 * @param config 配置
 * @returns 包含完整文件内容和引用的 schema 名称列表
 */
export function generateZodInterfaceSchemaFile(
  interfaceInfo: any,
  processedData: ProcessedApiData,
  config: any,
): { code: string; imports: string[] } {
  const template = compileTemplate(getZodInterfaceSchemaTemplateByConfig(config.comment !== false));

  // 生成 Request Schema 内容
  const requestResult = generateZodSchemaFromOperation(
    interfaceInfo.operation,
    processedData,
    'request',
  );

  // 生成 Response Schema 内容
  const responseResult = generateZodSchemaFromOperation(
    interfaceInfo.operation,
    processedData,
    'response',
  );

  // 合并引用的 schema
  const imports = new Set<string>();
  requestResult.imports.forEach((imp) => imports.add(imp));
  responseResult.imports.forEach((imp) => imports.add(imp));

  // 准备模板数据
  const templateData = {
    requestSchemaName: `${interfaceInfo.requestTypeName}Schema`,
    responseSchemaName: `${interfaceInfo.responseTypeName}Schema`,
    requestTypeName: interfaceInfo.requestTypeName,
    responseTypeName: interfaceInfo.responseTypeName,
    requestDescription: interfaceInfo.description,
    responseDescription: interfaceInfo.description,
    requestSchemaContent: requestResult.code,
    responseSchemaContent: responseResult.code,
    typeImports: Array.from(imports),
  };

  return {
    code: template(templateData),
    imports: Array.from(imports),
  };
}

/**
 * 合并的 Schema 文件模板（包含多个接口的 Request/Response Schema）
 */
function getMergedSchemaTemplateWithComment(): string {
  return `import { z } from 'zod';
{{#each typeImports}}
import { {{.}} } from '../schemas/{{.}}';
{{/each}}

{{#each schemas}}
/**
{{#if this.requestDescription}}
 * @description {{this.requestDescription}}
{{/if}}
 */
export const {{this.requestSchemaName}} = {{{this.requestSchemaContent}}};

/**
{{#if this.responseDescription}}
 * @description {{this.responseDescription}}
{{/if}}
 */
export const {{this.responseSchemaName}} = {{{this.responseSchemaContent}}};

// 推导类型
export type {{this.requestTypeName}} = z.infer<typeof {{this.requestSchemaName}}>;
export type {{this.responseTypeName}} = z.infer<typeof {{this.responseSchemaName}}>;

{{/each}}
`;
}

/**
 * 合并的 Schema 文件模板（不包含注释，包含多个接口的 Request/Response Schema）
 */
function getMergedSchemaTemplateWithoutComment(): string {
  return `import { z } from 'zod';
{{#each typeImports}}
import { {{.}} } from '../schemas/{{.}}';
{{/each}}

{{#each schemas}}
export const {{this.requestSchemaName}} = {{{this.requestSchemaContent}}};

export const {{this.responseSchemaName}} = {{{this.responseSchemaContent}}};

// 推导类型
export type {{this.requestTypeName}} = z.infer<typeof {{this.requestSchemaName}}>;
export type {{this.responseTypeName}} = z.infer<typeof {{this.responseSchemaName}}>;

{{/each}}
`;
}

/**
 * 获取合并的 Schema 模板
 */
export function getMergedSchemaTemplateByConfig(comment: boolean): string {
  return comment ? getMergedSchemaTemplateWithComment() : getMergedSchemaTemplateWithoutComment();
}

/**
 * 生成合并的 Schema 文件内容（包含多个接口的 Request/Response Schema）
 */
export function generateMergedSchemaFile(
  interfaces: any[],
  processedData: ProcessedApiData,
  config: any,
  getRequestTypeName: (path: string, method: string, operation: any, config: any) => string,
  getResponseTypeName: (path: string, method: string, operation: any, config: any) => string,
): { code: string; schemaNames: string[] } {
  const template = compileTemplate(getMergedSchemaTemplateByConfig(config.comment !== false));

  const schemas: any[] = [];
  const typeImports = new Set<string>();
  const schemaNames: string[] = [];

  for (const apiInterface of interfaces) {
    const requestTypeName = getRequestTypeName(
      apiInterface.path,
      apiInterface.method,
      apiInterface.operation,
      config,
    );
    const responseTypeName = getResponseTypeName(
      apiInterface.path,
      apiInterface.method,
      apiInterface.operation,
      config,
    );

    // 生成 Request Schema 内容
    const requestResult = generateZodSchemaFromOperation(
      apiInterface.operation,
      processedData,
      'request',
    );

    // 生成 Response Schema 内容
    const responseResult = generateZodSchemaFromOperation(
      apiInterface.operation,
      processedData,
      'response',
    );

    // 收集引用的类型 schema
    requestResult.imports.forEach((imp) => typeImports.add(imp));
    responseResult.imports.forEach((imp) => typeImports.add(imp));

    schemas.push({
      requestSchemaName: `${requestTypeName}Schema`,
      responseSchemaName: `${responseTypeName}Schema`,
      requestTypeName,
      responseTypeName,
      requestDescription:
        apiInterface.operation.summary || apiInterface.operation.description || '',
      responseDescription:
        apiInterface.operation.summary || apiInterface.operation.description || '',
      requestSchemaContent: requestResult.code,
      responseSchemaContent: responseResult.code,
    });

    schemaNames.push(`${requestTypeName}Schema`, `${responseTypeName}Schema`);
  }

  const templateData = {
    typeImports: Array.from(typeImports),
    schemas,
  };

  return {
    code: template(templateData),
    schemaNames,
  };
}

/**
 * @description Zod 接口模板模块
 * 处理 Zod 接口（包含 Request/Response Schema）的模板生成
 */

import Handlebars from 'handlebars';
import consola from 'consola';
import { compileTemplate } from '../../generator/template';
import { ProcessedApiData } from '../../processors/openapi';
import { sanitizeTypeName } from '../../generator/naming';
import { generateZodSchemaFromOpenApiSchema, openApiPropertyToZodType } from './types';

/**
 * @description Zod 接口 Schema 模板 - 带注释
 * @returns 模板字符串
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
 * @description Zod 接口 Schema 模板 - 不带注释
 * @returns 模板字符串
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
 * @description 获取接口级 Schema 模板
 * @param comment 是否包含注释
 * @returns 模板字符串
 */
export function getZodInterfaceSchemaTemplateByConfig(comment: boolean): string {
  return comment
    ? getZodInterfaceSchemaTemplateWithComment()
    : getZodInterfaceSchemaTemplateWithoutComment();
}

/**
 * @description 生成接口级 Schema 文件
 * @param interfaceInfo 接口信息
 * @param processedData 处理后的 API 数据
 * @param config 配置对象
 * @returns 包含代码和引用的 schema 名称列表的对象
 */
export function generateZodInterfaceSchemaFile(
  interfaceInfo: any,
  processedData: ProcessedApiData,
  config: any,
): { code: string; imports: string[] } {
  const template = compileTemplate(getZodInterfaceSchemaTemplateByConfig(config.comment !== false));

  const requestResult = generateZodSchemaFromOperation(
    interfaceInfo.operation,
    processedData,
    'request',
  );

  const responseResult = generateZodSchemaFromOperation(
    interfaceInfo.operation,
    processedData,
    'response',
  );

  const imports = new Set<string>();
  requestResult.imports.forEach((imp) => imports.add(imp));
  responseResult.imports.forEach((imp) => imports.add(imp));

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
 * @description 从 Operation 生成 Zod schema（request 或 response）
 * @param operation OpenAPI 操作对象
 * @param processedData 处理后的 API 数据
 * @param type Schema 类型 ('request' 或 'response')
 * @returns 包含代码和引用的 schema 列表的对象
 */
export function generateZodSchemaFromOperation(
  operation: any,
  processedData: any,
  type: 'request' | 'response',
): { code: string; imports: string[] } {
  let schema: any = null;
  const imports: Set<string> = new Set();

  if (type === 'request') {
    if (operation.requestBody?.content?.['application/json']?.schema) {
      schema = operation.requestBody.content['application/json'].schema;
    } else if (operation.parameters && operation.parameters.length > 0) {
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
    const successResponse = operation.responses?.['200'] || operation.responses?.['201'];
    if (successResponse?.content?.['application/json']?.schema) {
      schema = successResponse.content['application/json'].schema;
    }
  }

  if (!schema) {
    return { code: 'z.object({})', imports: [] };
  }

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

function sanitizePropertyName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, '_');
}

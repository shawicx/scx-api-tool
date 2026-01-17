/**
 * @description Zod 合并 Schema 模块
 * 处理多个接口的 Request/Response Schema 合并生成
 */

import Handlebars from 'handlebars';
import consola from 'consola';
import { compileTemplate } from '../../generator/template';
import { ProcessedApiData } from '../../processors/openapi';

/**
 * @description 合并的 Schema 文件模板 - 带注释
 * @returns 模板字符串
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
 * @description 合并的 Schema 文件模板 - 不带注释
 * @returns 模板字符串
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
 * @description 获取合并的 Schema 模板
 * @param comment 是否包含注释
 * @returns 模板字符串
 */
export function getMergedSchemaTemplateByConfig(comment: boolean): string {
  return comment ? getMergedSchemaTemplateWithComment() : getMergedSchemaTemplateWithoutComment();
}

/**
 * @description 生成合并的 Schema 文件内容
 * @param interfaces 接口信息数组
 * @param processedData 处理后的 API 数据
 * @param config 配置对象
 * @param getRequestTypeName 获取请求类型名称的函数
 * @param getResponseTypeName 获取响应类型名称的函数
 * @returns 包含代码和 schema 名称列表的对象
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

  const { generateZodSchemaFromOperation } = require('./interfaces');

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

    const requestResult = generateZodSchemaFromOperation(
      apiInterface.operation,
      processedData,
      'request',
    );

    const responseResult = generateZodSchemaFromOperation(
      apiInterface.operation,
      processedData,
      'response',
    );

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

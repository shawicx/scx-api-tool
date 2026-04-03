/**
 * @description Zod 请求/响应模板模块
 * 处理单独的 Request Schema 和 Response Schema 生成
 */

import Handlebars from 'handlebars';
import { compileTemplate } from '../../generator/template/index';

/**
 * @description Zod Request Schema 模板内容 - 带注释（不包含 import）
 * @returns 模板字符串
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
 * @description Zod Request Schema 模板内容 - 不带注释（不包含 import）
 * @returns 模板字符串
 */
function getZodRequestSchemaContentWithoutComment(): string {
  return `export const {{requestSchemaName}} = {{{requestSchemaContent}}};
`;
}

/**
 * @description 获取 Zod Request Schema 模板内容（不包含 import）
 * @param comment 是否包含注释
 * @returns 模板字符串
 */
export function getZodRequestSchemaContentByConfig(comment: boolean): string {
  return comment
    ? getZodRequestSchemaContentWithComment()
    : getZodRequestSchemaContentWithoutComment();
}

/**
 * @description Zod Response Schema 模板内容 - 带注释（不包含 import）
 * @returns 模板字符串
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
 * @description Zod Response Schema 模板内容 - 不带注释（不包含 import）
 * @returns 模板字符串
 */
function getZodResponseSchemaContentWithoutComment(): string {
  return `export const {{responseSchemaName}} = {{{responseSchemaContent}}};
`;
}

/**
 * @description 获取 Zod Response Schema 模板内容（不包含 import）
 * @param comment 是否包含注释
 * @returns 模板字符串
 */
export function getZodResponseSchemaContentByConfig(comment: boolean): string {
  return comment
    ? getZodResponseSchemaContentWithComment()
    : getZodResponseSchemaContentWithoutComment();
}

/**
 * @description 编译 Zod Request Schema 模板并生成代码（不包含 import）
 * @param interfaceInfo 接口信息
 * @param processedData 处理后的 API 数据
 * @param config 配置对象
 * @returns 包含代码内容和引用的 schema 名称列表的对象
 */
export function generateZodRequestSchema(
  interfaceInfo: any,
  processedData: any,
  config: any,
): { code: string; imports: string[] } {
  const template = compileTemplate(getZodRequestSchemaContentByConfig(config.comment !== false));

  const { generateZodSchemaFromOperation } = require('./interfaces');
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
 * @description 编译 Zod Response Schema 模板并生成代码（不包含 import）
 * @param interfaceInfo 接口信息
 * @param processedData 处理后的 API 数据
 * @param config 配置对象
 * @returns 包含代码内容和引用的 schema 名称列表的对象
 */
export function generateZodResponseSchema(
  interfaceInfo: any,
  processedData: any,
  config: any,
): { code: string; imports: string[] } {
  const template = compileTemplate(getZodResponseSchemaContentByConfig(config.comment !== false));

  const { generateZodSchemaFromOperation } = require('./interfaces');
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

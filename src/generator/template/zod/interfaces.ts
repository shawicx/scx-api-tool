/**
 * @description Zod 接口模板模块
 * 处理 Zod 接口（包含 Request/Response Schema）的模板生成
 */

import { compileTemplate } from '../index';
import { sanitizeTypeName, sanitizePropertyName } from '@/naming';
import { getRequestBodySchema, getResponseSchema } from '@/schema';
import { getRequestBodyKind } from '@/schema/operation';
import { extractRequestParameterGroups } from '../../requestParameters';
import { generateZodSchemaFromOpenApiSchema, openApiPropertyToZodType } from './types';
import { escapeJsDocComment } from '@/utils/escape';
import type { ApiConfig, OpenApiOperation, OpenApiSchema } from '@/types';
import type { ProcessedApiData } from '../../../processors/openapi';

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
/**
 * @description Zod 接口 Schema 生成所需的接口信息（扩展自 ApiInterface）
 */
export interface ZodInterfaceInfo {
  operation: OpenApiOperation;
  requestTypeName: string;
  responseTypeName: string;
  description?: string;
}

export function generateZodInterfaceSchemaFile(
  interfaceInfo: ZodInterfaceInfo,
  config: ApiConfig,
  processedData?: ProcessedApiData,
): { code: string; imports: string[] } {
  const template = compileTemplate(getZodInterfaceSchemaTemplateByConfig(config.comment !== false));

  const requestResult = generateZodSchemaFromOperation(
    interfaceInfo.operation,
    'request',
    processedData,
  );

  const responseResult = generateZodSchemaFromOperation(interfaceInfo.operation, 'response');

  const imports = new Set<string>();
  requestResult.imports.forEach((imp) => imports.add(imp));
  responseResult.imports.forEach((imp) => imports.add(imp));

  const templateData = {
    requestSchemaName: `${interfaceInfo.requestTypeName}Schema`,
    responseSchemaName: `${interfaceInfo.responseTypeName}Schema`,
    requestTypeName: interfaceInfo.requestTypeName,
    responseTypeName: interfaceInfo.responseTypeName,
    requestDescription: escapeJsDocComment(interfaceInfo.description || ''),
    responseDescription: escapeJsDocComment(interfaceInfo.description || ''),
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
  operation: OpenApiOperation,
  type: 'request' | 'response',
  processedData?: ProcessedApiData,
): { code: string; imports: string[] } {
  let schema: OpenApiSchema | null = null;
  const imports: Set<string> = new Set();

  if (type === 'request') {
    const bodySchema = getRequestBodySchema(operation);
    const nonHeaderParameters = (operation.parameters ?? []).filter(
      (param) => param.in !== 'header',
    );
    if (
      processedData &&
      bodySchema &&
      (getRequestBodyKind(operation) === 'binary' || nonHeaderParameters.length > 0)
    ) {
      return generateMergedRequestSchema(operation, processedData);
    }

    if (bodySchema) {
      schema = bodySchema.schema;
    } else if (operation.parameters && operation.parameters.length > 0) {
      const nonHeaderParams = nonHeaderParameters;

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
    const responseSchema = getResponseSchema(operation);
    if (responseSchema) {
      schema = responseSchema.schema;
    }
  }

  if (!schema) {
    return { code: 'z.object({})', imports: [] };
  }

  if (schema.$ref) {
    const refName = schema.$ref.split('/').pop()!;
    const sanitizedRefName = sanitizeTypeName(refName);
    return {
      code: `${sanitizedRefName}Schema`,
      imports: [`${sanitizedRefName}Schema`],
    };
  }

  return generateZodSchemaFromOpenApiSchema(schema);
}

/**
 * @description 合并 body/path/query 字段生成请求 Schema
 * @param operation OpenAPI 操作对象
 * @param processedData 处理后的 API 数据
 * @returns Zod Schema 生成结果
 */
function generateMergedRequestSchema(
  operation: OpenApiOperation,
  processedData: ProcessedApiData,
): { code: string; imports: string[] } {
  const groups = extractRequestParameterGroups(operation, processedData, true);
  const properties = [
    ...groups.pathProperties,
    ...groups.queryProperties,
    ...groups.bodyProperties,
  ];
  const imports = new Set<string>();
  const fields = properties.map((property) => {
    const isRawBody =
      groups.requestBodyKind === 'binary' && groups.rawBodyPropertyName === property.name;
    const result = isRawBody
      ? { type: 'z.instanceof(Blob)', imports: [] as string[] }
      : openApiPropertyToZodType(property.schema ?? { type: 'string' });
    result.imports.forEach((importName) => imports.add(importName));
    const optional = property.required ? '' : '.optional()';
    return `  ${sanitizePropertyName(property.name)}: ${result.type}${optional},`;
  });

  return {
    code: `z.object({\n${fields.join('\n')}\n})`,
    imports: Array.from(imports),
  };
}

/**
 * @description Zod TypesOnly Schema 生成器
 * 从 interfaceGenerator.ts 拆分而来，负责在 typesFormat=zod 且仅生成类型时
 * 为每个 tag 目录生成 schema.ts（合并的 Request/Response Schema）
 */

import { join } from 'path';
import type {
  ApiConfig,
  ApiInterface,
  CliHooks,
  OpenApiOperation,
  ProcessedApiData,
} from '@/types';
import { compileTemplate } from '../template';
import { generateZodSchemaFromOperation } from '../template/zod/interfaces';
import { writeGeneratedFile } from '../fileWriter';
import { applyNamingStrategy, type NamingContext } from '@/naming';

/**
 * @description 获取命名结果（避免与 interfaceGenerator 循环依赖的本地副本）
 */
function getNamingResult(
  path: string,
  method: string,
  operation: OpenApiOperation,
  config: ApiConfig,
) {
  const ctx: NamingContext = {
    path,
    method,
    summary: operation.summary,
    description: operation.description,
    operationId: operation.operationId,
    tags: operation.tags,
    config,
  };
  return applyNamingStrategy(ctx, config.namingStrategy);
}

/**
 * @description 生成 Zod TypesOnly Schema 文件
 * @param interfaces 该 tag 下的接口列表
 * @param processedData 处理后的 API 数据
 * @param config API 配置
 * @param dirPath 目标目录路径
 * @param hooks 钩子函数
 */
export async function generateZodTypesOnlySchemaFile(
  interfaces: ApiInterface[],
  processedData: ProcessedApiData,
  config: ApiConfig,
  dirPath: string,
  hooks?: CliHooks,
): Promise<void> {
  const schemas: Array<{
    requestSchemaName: string;
    responseSchemaName: string;
    requestTypeName: string;
    responseTypeName: string;
    requestDescription: string;
    responseDescription: string;
    requestSchemaContent: string;
    responseSchemaContent: string;
  }> = [];
  const typeImports = new Set<string>();

  for (const apiInterface of interfaces) {
    const namingResult = getNamingResult(
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

    requestResult.imports.forEach((imp: string) => typeImports.add(imp));
    responseResult.imports.forEach((imp: string) => typeImports.add(imp));

    schemas.push({
      requestSchemaName: `${namingResult.requestTypeName}Schema`,
      responseSchemaName: `${namingResult.responseTypeName}Schema`,
      requestTypeName: namingResult.requestTypeName,
      responseTypeName: namingResult.responseTypeName,
      requestDescription:
        apiInterface.operation.summary || apiInterface.operation.description || '',
      responseDescription:
        apiInterface.operation.summary || apiInterface.operation.description || '',
      requestSchemaContent: requestResult.code,
      responseSchemaContent: responseResult.code,
    });
  }

  const template = compileTemplate(getZodTypesOnlySchemaTemplateByConfig(config.comment !== false));

  const templateData = {
    typeImports: Array.from(typeImports),
    schemas,
  };

  const code = template(templateData);
  await writeGeneratedFile(join(dirPath, 'schema.ts'), code, config, hooks, '创建 Zod Schema 文件');
}

/** Zod TypesOnly Schema 模板 - 带注释 */
function getZodTypesOnlySchemaTemplateWithComment(): string {
  return `import { z } from 'zod';
{{#if typeImports}}
import {
  {{#each typeImports}}
  {{.}},
  {{/each}}
} from '../schemas';
{{/if}}

{{#each schemas}}
/**
 * @description {{this.requestDescription}}
 */
export const {{this.requestSchemaName}} = {{{this.requestSchemaContent}}};

/**
 * @description {{this.responseDescription}}
 */
export const {{this.responseSchemaName}} = {{{this.responseSchemaContent}}};

export type {{this.requestTypeName}} = z.infer<typeof {{this.requestSchemaName}}>;
export type {{this.responseTypeName}} = z.infer<typeof {{this.responseSchemaName}}>;

{{/each}}
`;
}

/** Zod TypesOnly Schema 模板 - 不带注释 */
function getZodTypesOnlySchemaTemplateWithoutComment(): string {
  return `import { z } from 'zod';
{{#if typeImports}}
import {
  {{#each typeImports}}
  {{.}},
  {{/each}}
} from '../schemas';
{{/if}}

{{#each schemas}}
export const {{this.requestSchemaName}} = {{{this.requestSchemaContent}}};

export const {{this.responseSchemaName}} = {{{this.responseSchemaContent}}};

export type {{this.requestTypeName}} = z.infer<typeof {{this.requestSchemaName}}>;
export type {{this.responseTypeName}} = z.infer<typeof {{this.responseSchemaName}}>;

{{/each}}
`;
}

/** 根据配置获取 Zod TypesOnly Schema 模板 */
function getZodTypesOnlySchemaTemplateByConfig(comment: boolean): string {
  return comment
    ? getZodTypesOnlySchemaTemplateWithComment()
    : getZodTypesOnlySchemaTemplateWithoutComment();
}

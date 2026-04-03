/**
 * @description 接口文件生成器
 * 负责生成 API 接口相关的文件
 */

import consola from 'consola';
import { join } from 'path';
import { ProcessedApiData, groupInterfacesByTag } from '../../processors/openapi';
import { ApiConfig, CliHooks } from '../../types';
import type { ApiInterface, InterfaceTemplateData, OpenApiOperation } from '../../types';
import { ensureDir, writeFormattedFile } from '../../utils/file';
import { formatCode } from '../../utils/formatter';
import { chineseToPinyinCamelCase } from '../../utils/path';
import { extractRequestProperties, extractResponseProperties, hasRequestBody } from '../extractor';
import { getNormalizedPathWithAlias } from '../pathUtils';
import { applyNamingStrategy, type NamingContext } from '../naming/strategy';
import { generateInterfaceFunction, compileTemplate } from '../template';
import { executeWithConcurrency } from '../../utils/concurrency';
import { generateZodSchemaFromOperation } from '../../templates/schema-zod/interfaces';
import { getFileExtension } from '../../utils/config';

/**
 * @description 生成所有接口文件
 * 按标签分组生成接口文件，每个标签生成一个 index.ts 文件
 * @param processedData 处理后的 API 数据
 * @param config API 配置
 * @param hooks 钩子函数
 *
 * @example
 * ```typescript
 * await generateInterfaceFiles(processedData, config);
 * // 生成结构：
 * // output/
 * //   index.ts
 * //   tag1/index.ts
 * //   tag2/index.ts
 * ```
 */
export async function generateInterfaceFiles(
  processedData: ProcessedApiData,
  config: ApiConfig,
  hooks?: CliHooks,
): Promise<void> {
  if (process.env.DEBUG) {
    consola.debug(`正在生成 ${processedData.interfaces.length} 个接口文件...`);
  }

  const { outputDir } = config;

  // 按标签分组接口
  const interfacesByTag = groupInterfacesByTag(processedData.interfaces);

  // 为每个标签目录生成一个索引.ts文件
  const tagEntries = Object.entries(interfacesByTag);
  const concurrency = config.concurrency || 50;

  // 并发生成接口文件
  await executeWithConcurrency(
    tagEntries,
    async ([tag, interfaces]) => {
      const tagDir = chineseToPinyinCamelCase(tag);
      const dirPath = join(outputDir, tagDir);

      await ensureDir(dirPath);

      await generateInterfaceFileForTag(tagDir, interfaces, processedData, config, dirPath, hooks);
    },
    concurrency,
    `生成接口文件`,
  );

  // 生成根目录 index.ts 文件
  await generateRootIndexFile(processedData, config, hooks);
}

/**
 * @description 为指定标签生成接口文件
 * 在单个 index.ts 文件中生成该标签的所有接口
 * @param tag 标签名称
 * @param interfaces 接口数组
 * @param processedData 处理后的 API 数据
 * @param config API 配置
 * @param dirPath 目录路径
 * @param hooks 钩子函数
 *
 * @example
 * ```typescript
 * await generateInterfaceFileForTag('user', interfaces, processedData, config, '/output/user');
 * ```
 */
export async function generateInterfaceFileForTag(
  tag: string,
  interfaces: ApiInterface[],
  processedData: ProcessedApiData,
  config: ApiConfig,
  dirPath: string,
  hooks?: CliHooks,
): Promise<void> {
  const isJS = config.target === 'javascript';
  const ext = getFileExtension(config.target);
  const effectiveGenerateTypes = isJS ? false : config.generateTypes;

  const typesOnly = effectiveGenerateTypes && !config.generateApi;
  const isZodTypesOnly = typesOnly && config.typesFormat === 'zod';

  if (isZodTypesOnly) {
    await generateZodTypesOnlySchemaFile(interfaces, processedData, config, dirPath, hooks);
    return;
  }

  let combinedCode = '';

  const usedTypes = new Set<string>();

  // JavaScript 模式下不需要收集类型引用
  if (!isJS) {
    for (const apiInterface of interfaces) {
      const requestProps = extractRequestProperties(apiInterface.operation, processedData);
      for (const prop of requestProps) {
        if (processedData.types.some((t) => t.name === prop.type)) {
          usedTypes.add(prop.type);
        }
        if (prop.type.endsWith('[]')) {
          const baseType = prop.type.slice(0, -2);
          if (processedData.types.some((t) => t.name === baseType)) {
            usedTypes.add(baseType);
          }
        }
      }

      const responseProps = extractResponseProperties(
        apiInterface.operation.responses,
        processedData,
      );
      for (const prop of responseProps) {
        if (processedData.types.some((t) => t.name === prop.type)) {
          usedTypes.add(prop.type);
        }
        if (prop.type.endsWith('[]')) {
          const baseType = prop.type.slice(0, -2);
          if (processedData.types.some((t) => t.name === baseType)) {
            usedTypes.add(baseType);
          }
        }
      }
    }
  }

  const relativePath = getNormalizedPathWithAlias(dirPath, config.requestFunctionFilePath);
  const cleanRelativePath = relativePath.replace(/\.(ts|js)$/, '');

  const requestFunctionName = config.requestFunctionName || 'request';
  const requestMethodsObjectName = config.requestMethodsObjectName || 'requestMethods';

  const apiOnly = config.generateApi && !effectiveGenerateTypes;

  if (typesOnly) {
    if (config.typesFormat === 'typescript' && usedTypes.size > 0) {
      const typesDirPath = join(config.outputDir, 'types');
      const typesRelativePath = getNormalizedPathWithAlias(dirPath, typesDirPath);
      const cleanTypesRelativePath = typesRelativePath.replace(/\/$/, '');
      combinedCode += `import type { ${Array.from(usedTypes).join(', ')} } from '${cleanTypesRelativePath}';\n`;
    }
  } else if (apiOnly || isJS) {
    combinedCode += `import { ${requestFunctionName} } from '${cleanRelativePath}';\n`;
  } else {
    if (config.requestMethodStyle === 'method-specific' || config.requestMethodStyle === 'both') {
      combinedCode += `import { RequestConfig, ${requestFunctionName}, ${requestMethodsObjectName} } from '${cleanRelativePath}';\n`;
    } else {
      combinedCode += `import { RequestConfig, ${requestFunctionName} } from '${cleanRelativePath}';\n`;
    }

    if (config.typesFormat === 'typescript' && usedTypes.size > 0) {
      const typesDirPath = join(config.outputDir, 'types');
      const typesRelativePath = getNormalizedPathWithAlias(dirPath, typesDirPath);
      const cleanTypesRelativePath = typesRelativePath.replace(/\/$/, '');
      combinedCode += `import type { ${Array.from(usedTypes).join(', ')} } from '${cleanTypesRelativePath}';\n`;
    }
  }

  combinedCode += '\n';

  for (const apiInterface of interfaces) {
    const namingResult = getNamingResult(
      apiInterface.path,
      apiInterface.method,
      apiInterface.operation,
      config,
    );

    const templateData: InterfaceTemplateData = {
      interfaceName: namingResult.interfaceName,
      requestTypeName: namingResult.requestTypeName,
      responseTypeName: namingResult.responseTypeName,
      requestSchemaName: `${namingResult.requestTypeName}Schema`,
      responseSchemaName: `${namingResult.responseTypeName}Schema`,
      functionName: namingResult.functionName,
      path: apiInterface.path,
      method: apiInterface.method.toUpperCase(),
      description: apiInterface.operation.summary || apiInterface.operation.description || '',
      hasParameters: !!(apiInterface.operation.parameters || apiInterface.operation.requestBody),
      parameters: extractRequestProperties(apiInterface.operation, processedData),
      hasResponse: !!apiInterface.operation.responses,
      responseProperties: extractResponseProperties(
        apiInterface.operation.responses,
        processedData,
      ),
      hasBody: hasRequestBody(apiInterface.operation),
      requestMethodStyle: config.requestMethodStyle,
      requestFunctionName: config.requestFunctionName || 'request',
      requestMethodsObjectName: config.requestMethodsObjectName || 'requestMethods',
      requestParamName: config.requestParamName || 'params',
    };

    const code = generateInterfaceFunction(templateData, config);

    const codeWithoutImport = code.replace(
      /import type \{ AxiosRequestConfig \} from 'axios';\nimport axios from 'axios';\nimport consola from 'consola';\n\n?/g,
      '',
    );
    combinedCode += `${codeWithoutImport}\n\n`;
  }

  const indexFileName = `index${ext}`;
  const formattedCode = await formatCode(
    combinedCode,
    join(dirPath, indexFileName),
    config.indentSize,
  );

  const filePath = join(dirPath, indexFileName);
  await writeFormattedFile(filePath, formattedCode, hooks);

  if (process.env.DEBUG) {
    consola.debug(`创建合并接口文件: ${filePath}`);
  }
}

/**
 * @description 为 Zod TypesOnly 模式生成 Schema 文件
 * 直接在服务目录下生成 schema.ts 文件
 * @param interfaces 接口数组
 * @param processedData 处理后的 API 数据
 * @param config API 配置
 * @param dirPath 目录路径
 * @param hooks 钩子函数
 */
async function generateZodTypesOnlySchemaFile(
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
  const formattedCode = await formatCode(code, join(dirPath, 'schema.ts'), config.indentSize);
  const filePath = join(dirPath, 'schema.ts');
  await writeFormattedFile(filePath, formattedCode, hooks);

  if (process.env.DEBUG) {
    consola.debug(`创建 Zod Schema 文件: ${filePath}`);
  }
}

/**
 * @description Zod TypesOnly Schema 模板 - 带注释
 * @returns 模板字符串
 */
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

/**
 * @description Zod TypesOnly Schema 模板 - 不带注释
 * @returns 模板字符串
 */
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

/**
 * @description 根据配置获取 Zod TypesOnly Schema 模板
 * @param comment 是否包含注释
 * @returns 模板字符串
 */
function getZodTypesOnlySchemaTemplateByConfig(comment: boolean): string {
  return comment
    ? getZodTypesOnlySchemaTemplateWithComment()
    : getZodTypesOnlySchemaTemplateWithoutComment();
}

/**
 * @description 生成根目录 index.ts 文件
 * 导出所有标签目录和请求函数
 * @param processedData 处理后的 API 数据
 * @param config API 配置
 * @param hooks 钩子函数
 */
export async function generateRootIndexFile(
  processedData: ProcessedApiData,
  config: ApiConfig,
  hooks?: CliHooks,
): Promise<void> {
  const { outputDir } = config;

  let rootIndexContent = '';

  const isJS = config.target === 'javascript';
  const effectiveGenerateTypes = isJS ? false : config.generateTypes;
  const isZodMode = !isJS && config.typesFormat === 'zod';
  const isZodTypesOnly = isZodMode && effectiveGenerateTypes && !config.generateApi;

  if (!isZodTypesOnly) {
    const relativePath = getNormalizedPathWithAlias(outputDir, config.requestFunctionFilePath);
    const ext = getFileExtension(config.target);
    const cleanRelativePath = relativePath.replace(new RegExp(`\\${ext}$`), '');
    rootIndexContent += `export * from '${cleanRelativePath}';\n\n`;
  }

  const tagDirs: string[] = [];

  for (const category of processedData.categories) {
    const tagDir = chineseToPinyinCamelCase(category.name);
    tagDirs.push(tagDir);
  }

  if (isZodMode && effectiveGenerateTypes) {
    for (const tagDir of tagDirs) {
      rootIndexContent += `export * from './${tagDir}/schema';\n`;
    }
    rootIndexContent += `export * from './schemas';\n`;

    if (config.generateApi) {
      rootIndexContent += '\n';
      for (const tagDir of tagDirs) {
        rootIndexContent += `export * from './${tagDir}';\n`;
      }
    }
  } else if (isZodMode) {
    for (const tagDir of tagDirs) {
      rootIndexContent += `export * from './${tagDir}';\n`;
    }
  } else if (effectiveGenerateTypes) {
    for (const tagDir of tagDirs) {
      rootIndexContent += `export * from './${tagDir}';\n`;
    }
    rootIndexContent += `export * from './types';\n`;
  } else {
    for (const tagDir of tagDirs) {
      rootIndexContent += `export * from './${tagDir}';\n`;
    }
  }

  const ext = getFileExtension(config.target);
  const rootIndexPath = join(outputDir, `index${ext}`);
  await writeFormattedFile(rootIndexPath, rootIndexContent, hooks);

  if (process.env.DEBUG) {
    consola.debug(`创建根索引文件: ${rootIndexPath}`);
  }
}

/**
 * @description 获取命名结果
 * 使用命名策略生成接口名称、函数名称、请求类型名称、响应类型名称
 * @param path API 路径
 * @param method HTTP 方法
 * @param operation 操作对象
 * @param config API 配置
 * @returns 命名结果对象
 */
function getNamingResult(
  path: string,
  method: string,
  operation: OpenApiOperation,
  config: ApiConfig,
): {
  interfaceName: string;
  functionName: string;
  requestTypeName: string;
  responseTypeName: string;
} {
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

/**
 * @description 接口文件生成器
 * 负责生成 API 接口相关的文件
 */

import consola from 'consola';
import { join } from 'path';
import { ProcessedApiData, groupInterfacesByTag } from '../../processors/openapi';
import { collectUsedTypesFromProperties } from '../../processors/common';
import { ApiConfig, CliHooks } from '../../types';
import type { ApiInterface, InterfaceTemplateData, OpenApiOperation } from '../../types';
import { ensureDir } from '../../utils/file';
import { chineseToPinyinCamelCase } from '../../utils/path';
import { escapeJsDocComment, escapeStringLiteral } from '@/utils/escape';
import { writeGeneratedFile } from '../fileWriter';
import { generateZodTypesOnlySchemaFile } from './zodTypesOnlyGenerator';
import {
  extractRequestProperties,
  extractResponseProperties,
  hasRequestBody,
  isFormDataRequest,
} from '../extractor';
import { getNormalizedPathWithAlias } from '../pathUtils';
import { applyNamingStrategy, type NamingContext } from '@/naming';
import { generateInterfaceFunction } from '../template';
import { executeWithConcurrency } from '../../utils/concurrency';
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
    await generateZodTypesOnlySchemaFile(interfaces, config, dirPath, hooks);
    return;
  }

  let combinedCode = '';

  const usedTypes = new Set<string>();

  // JavaScript 模式下不需要收集类型引用
  if (!isJS) {
    for (const apiInterface of interfaces) {
      const requestProps = extractRequestProperties(apiInterface.operation, processedData);
      collectUsedTypesFromProperties(requestProps, processedData).forEach((t) => usedTypes.add(t));

      const responseProps = extractResponseProperties(
        apiInterface.operation.responses,
        processedData,
      );
      collectUsedTypesFromProperties(responseProps, processedData).forEach((t) => usedTypes.add(t));
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
    } else if (config.typesFormat === 'zod') {
      const usedZodTypes = new Set<string>();
      for (const apiInterface of interfaces) {
        const namingResult = getNamingResult(
          apiInterface.path,
          apiInterface.method,
          apiInterface.operation,
          config,
        );
        usedZodTypes.add(namingResult.requestTypeName);
        usedZodTypes.add(namingResult.responseTypeName);
      }
      if (usedZodTypes.size > 0) {
        combinedCode += `import type { ${Array.from(usedZodTypes).join(', ')} } from './schema';\n`;
      }
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
      path: escapeStringLiteral(apiInterface.path),
      method: apiInterface.method.toUpperCase(),
      description: escapeJsDocComment(
        apiInterface.operation.summary || apiInterface.operation.description || '',
      ),
      hasParameters: !!(apiInterface.operation.parameters || apiInterface.operation.requestBody),
      parameters: extractRequestProperties(apiInterface.operation, processedData),
      hasResponse: !!apiInterface.operation.responses,
      responseProperties: extractResponseProperties(
        apiInterface.operation.responses,
        processedData,
      ),
      hasBody: hasRequestBody(apiInterface.operation),
      isFormData: isFormDataRequest(apiInterface.operation),
      requestMethodStyle: config.requestMethodStyle,
      requestFunctionName: config.requestFunctionName || 'request',
      requestMethodsObjectName: config.requestMethodsObjectName || 'requestMethods',
      requestParamName: config.requestParamName || 'params',
    };

    const code = generateInterfaceFunction(templateData, config);

    combinedCode += `${code}\n\n`;
  }

  const indexFileName = `index${ext}`;
  await writeGeneratedFile(
    join(dirPath, indexFileName),
    combinedCode,
    config,
    hooks,
    '创建合并接口文件',
  );
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

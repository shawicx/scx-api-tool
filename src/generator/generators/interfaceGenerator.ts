/**
 * @description 接口文件生成器
 * 负责生成 API 接口相关的文件
 */

import consola from 'consola';
import { join } from 'path';
import { ProcessedApiData, groupInterfacesByTag } from '../../processors/openapi';
import { ApiConfig } from '../../types';
import { ensureDir, writeFormattedFile } from '../../utils/file';
import { formatCode } from '../../utils/formatter';
import { chineseToPinyinCamelCase } from '../../utils/path';
import { extractRequestProperties, extractResponseProperties, hasRequestBody } from '../extractor';
import { getNormalizedPathWithAlias } from '../pathUtils';
import { applyNamingStrategy, type NamingContext } from '../naming/strategy';
import { generateInterfaceFunction } from '../template';
import { executeWithConcurrency } from '../../utils/concurrency';

/**
 * @description 生成所有接口文件
 * 按标签分组生成接口文件，每个标签生成一个 index.ts 文件
 * @param processedData 处理后的 API 数据
 * @param config API 配置
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

      await generateInterfaceFileForTag(tagDir, interfaces, processedData, config, dirPath);
    },
    concurrency,
    `生成接口文件`,
  );

  // 生成根目录 index.ts 文件
  await generateRootIndexFile(processedData, config);
}

/**
 * @description 为指定标签生成接口文件
 * 在单个 index.ts 文件中生成该标签的所有接口
 * @param tag 标签名称
 * @param interfaces 接口数组
 * @param processedData 处理后的 API 数据
 * @param config API 配置
 * @param dirPath 目录路径
 *
 * @example
 * ```typescript
 * await generateInterfaceFileForTag('user', interfaces, processedData, config, '/output/user');
 * ```
 */
export async function generateInterfaceFileForTag(
  tag: string,
  interfaces: any[],
  processedData: ProcessedApiData,
  config: ApiConfig,
  dirPath: string,
): Promise<void> {
  let combinedCode = '';

  // 收集所有使用的类型
  const usedTypes = new Set<string>();

  // 收集接口使用的类型
  for (const apiInterface of interfaces) {
    const requestProps = extractRequestProperties(apiInterface.operation, processedData);
    for (const prop of requestProps) {
      if (processedData.types.some((t: any) => t.name === prop.type)) {
        usedTypes.add(prop.type);
      }
      if (prop.type.endsWith('[]')) {
        const baseType = prop.type.slice(0, -2);
        if (processedData.types.some((t: any) => t.name === baseType)) {
          usedTypes.add(baseType);
        }
      }
    }

    const responseProps = extractResponseProperties(
      apiInterface.operation.responses,
      processedData,
    );
    for (const prop of responseProps) {
      if (processedData.types.some((t: any) => t.name === prop.type)) {
        usedTypes.add(prop.type);
      }
      if (prop.type.endsWith('[]')) {
        const baseType = prop.type.slice(0, -2);
        if (processedData.types.some((t: any) => t.name === baseType)) {
          usedTypes.add(baseType);
        }
      }
    }
  }

  // 添加导入语句
  const relativePath = getNormalizedPathWithAlias(dirPath, config.requestFunctionFilePath);
  const cleanRelativePath = relativePath.replace(/\.ts$/, '');

  const requestFunctionName = config.requestFunctionName || 'request';
  const requestMethodsObjectName = config.requestMethodsObjectName || 'requestMethods';

  const typesOnly = config.generateTypes && !config.generateApi;
  const apiOnly = config.generateApi && !config.generateTypes;

  if (typesOnly) {
    if (config.typesFormat === 'typescript' && usedTypes.size > 0) {
      const typesDirPath = join(config.outputDir, 'types');
      const typesRelativePath = getNormalizedPathWithAlias(dirPath, typesDirPath);
      const cleanTypesRelativePath = typesRelativePath.replace(/\/$/, '');
      combinedCode += `import type { ${Array.from(usedTypes).join(', ')} } from '${cleanTypesRelativePath}';\n`;
    }
  } else if (apiOnly) {
    combinedCode += `import { ${requestFunctionName} } from '${cleanRelativePath}';\n`;
  } else {
    if (config.requestMethodStyle === 'method-specific' || config.requestMethodStyle === 'both') {
      combinedCode += `import { RequestConfig, ${requestFunctionName}, ${requestMethodsObjectName} } from '${cleanRelativePath}';\n`;
    } else {
      combinedCode += `import { RequestConfig, ${requestFunctionName} } from '${cleanRelativePath}';\n`;
    }

    if (config.typesFormat === 'zod') {
      combinedCode += `import {\n`;
      for (const apiInterface of interfaces) {
        const namingResult = getNamingResult(
          apiInterface.path,
          apiInterface.method,
          apiInterface.operation,
          config,
        );
        combinedCode += `  ${namingResult.requestTypeName}Schema,\n  ${namingResult.responseTypeName}Schema,\n`;
      }
      combinedCode += `} from './schema';\n`;
      combinedCode += `import type {\n`;
      for (const apiInterface of interfaces) {
        const namingResult = getNamingResult(
          apiInterface.path,
          apiInterface.method,
          apiInterface.operation,
          config,
        );
        combinedCode += `  ${namingResult.requestTypeName},\n  ${namingResult.responseTypeName},\n`;
      }
      combinedCode += `} from './schema';\n`;
    } else if (usedTypes.size > 0) {
      const typesDirPath = join(config.outputDir, 'types');
      const typesRelativePath = getNormalizedPathWithAlias(dirPath, typesDirPath);
      const cleanTypesRelativePath = typesRelativePath.replace(/\/$/, '');
      combinedCode += `import type { ${Array.from(usedTypes).join(', ')} } from '${cleanTypesRelativePath}';\n`;
    }
  }

  combinedCode += '\n';

  // 处理接口
  for (const apiInterface of interfaces) {
    const namingResult = getNamingResult(
      apiInterface.path,
      apiInterface.method,
      apiInterface.operation,
      config,
    );

    const templateData = {
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

  const formattedCode = await formatCode(combinedCode, join(dirPath, 'index.ts'));

  const filePath = join(dirPath, 'index.ts');
  await writeFormattedFile(filePath, formattedCode);

  if (process.env.DEBUG) {
    consola.debug(`创建合并接口文件: ${filePath}`);
  }
}

/**
 * @description 生成根目录 index.ts 文件
 * 导出所有标签目录和请求函数
 * @param processedData 处理后的 API 数据
 * @param config API 配置
 */
export async function generateRootIndexFile(
  processedData: ProcessedApiData,
  config: ApiConfig,
): Promise<void> {
  const { outputDir } = config;

  let rootIndexContent = '';

  const relativePath = getNormalizedPathWithAlias(outputDir, config.requestFunctionFilePath);
  const cleanRelativePath = relativePath.replace(/\.ts$/, '');
  rootIndexContent += `export * from '${cleanRelativePath}';\n\n`;

  const tagDirs: string[] = [];

  for (const category of processedData.categories) {
    const tagDir = chineseToPinyinCamelCase(category.name);
    tagDirs.push(tagDir);
  }

  for (const tagDir of tagDirs) {
    rootIndexContent += `export * from './${tagDir}';\n`;
  }

  const rootIndexPath = join(outputDir, 'index.ts');
  await writeFormattedFile(rootIndexPath, rootIndexContent);

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
  operation: any,
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

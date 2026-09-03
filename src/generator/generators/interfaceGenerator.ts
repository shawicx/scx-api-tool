/**
 * @description 接口文件生成器
 * 负责生成 API 接口相关的文件
 */

import { join } from 'path';
import { ProcessedApiData, groupInterfacesByTag } from '../../processors/openapi';
import { collectUsedTypesFromProperties } from '../../processors/common';
import { ApiConfig, CliHooks } from '../../types';
import type { ApiInterface, InterfaceTemplateData, OpenApiOperation } from '../../types';
import { ensureDir } from '../../utils/file';
import { chineseToPinyinCamelCase } from '../../utils/path';
import { escapeJsDocComment, interpolatePathParams } from '@/utils/escape';
import { writeGeneratedFile } from '../fileWriter';
import { generateZodTypesOnlySchemaFile } from './zodTypesOnlyGenerator';
import { generateRootIndexFile } from './rootIndexGenerator';
import {
  extractPathParameterNames,
  extractRequestParameterGroups,
  extractRequestProperties,
  extractResponseProperties,
  hasRequestBody,
  isFormDataRequest,
} from '../extractor';
import { getNormalizedPathWithAlias } from '@/utils/pathUtils';
import { applyNamingStrategy, type NamingContext } from '@/naming';
import { generateInterfaceFunction } from '../template';
import { executeWithConcurrency } from '../../utils/concurrency';
import { getFileExtension } from '../../utils/config';
import { logger } from '@/utils/logger';

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
  logger.debug(`正在生成 ${processedData.interfaces.length} 个接口文件...`);

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

    // 提取路径参数名，将 {param} 占位符插值为模板字符串 ${requestParamName.param}
    // 无 path 参数时退化为单引号字面量（保持旧行为）
    const pathParamNames = extractPathParameterNames(apiInterface.operation);
    const requestParamName = config.requestParamName || 'params';
    const interpolatedPath = interpolatePathParams(
      apiInterface.path,
      requestParamName,
      pathParamNames,
    );

    const responseProperties = extractResponseProperties(
      apiInterface.operation.responses,
      processedData,
    );

    // body/query 分组：body 与 query 并存时生成静态解构拆分（query 走 config.params）
    const parameterGroups = extractRequestParameterGroups(apiInterface.operation, processedData);
    const queryParameterNames = parameterGroups.queryProperties.map((p) => p.name);
    const hasBody = hasRequestBody(apiInterface.operation);
    const hasQueryParams = hasBody && queryParameterNames.length > 0;
    // 防御：query 参数名与 rest 变量 'body' 冲突时改用 bodyParams
    const restVarName = queryParameterNames.includes('body') ? 'bodyParams' : 'body';
    const requestBodyVarName = hasQueryParams ? restVarName : requestParamName;
    // 解构/params 对象条目：合法标识符用简写（page）；sanitizePropertyName 对非法
    // 标识符加引号（'X-Custom'），解构与 params 对象需改用别名绑定（'X-Custom': X_Custom）
    const IDENTIFIER_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
    const queryParamsList = parameterGroups.queryProperties
      .map((p) => {
        if (IDENTIFIER_RE.test(p.name)) return p.name;
        const bare = p.name.replace(/^'(.*)'$/, '$1');
        const alias = bare.replace(/[^A-Za-z0-9_$]/g, '_');
        return `'${bare}': ${alias}`;
      })
      .join(', ');

    // 文档质量告警：帮助定位「生成结果退化」的源头（均在 API 文档侧修数据）
    if (apiInterface.method.toLowerCase() === 'get' && hasRequestBody(apiInterface.operation)) {
      logger.warn(
        `接口 GET ${apiInterface.path} 定义了 requestBody，不符合 HTTP 语义（多数客户端会丢弃 GET 请求体），建议改为 POST 或使用 query 参数`,
      );
    }
    if (responseProperties.some((p) => p.type === 'unknown')) {
      logger.warn(
        `接口 ${apiInterface.method.toUpperCase()} ${apiInterface.path} 缺少 200 响应体定义，已生成 data: unknown，建议在 API 文档中补充响应 schema`,
      );
    }

    const templateData: InterfaceTemplateData = {
      interfaceName: namingResult.interfaceName,
      requestTypeName: namingResult.requestTypeName,
      responseTypeName: namingResult.responseTypeName,
      requestSchemaName: `${namingResult.requestTypeName}Schema`,
      responseSchemaName: `${namingResult.responseTypeName}Schema`,
      functionName: namingResult.functionName,
      // path 已含外层引号/反引号，模板须用三花括号 {{{path}}} 渲染（禁用 HTML 转义）
      path: interpolatedPath.value,
      method: apiInterface.method.toUpperCase(),
      description: escapeJsDocComment(
        apiInterface.operation.summary || apiInterface.operation.description || '',
      ),
      hasParameters: !!(apiInterface.operation.parameters || apiInterface.operation.requestBody),
      parameters: extractRequestProperties(apiInterface.operation, processedData),
      hasResponse: !!apiInterface.operation.responses,
      responseProperties,
      hasBody,
      isFormData: isFormDataRequest(apiInterface.operation),
      queryParameterNames,
      hasQueryParams,
      requestBodyVarName,
      queryParamsList,
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

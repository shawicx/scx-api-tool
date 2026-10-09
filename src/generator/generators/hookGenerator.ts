/**
 * @description Hook 文件生成器
 * 在已生成的 API 请求函数之上生成 React Query v5 风格的 Hook 包装：
 * GET / HEAD 生成 useQuery hook，POST / PUT / PATCH / DELETE 生成 useMutation hook
 */

import { join } from 'path';
import { ProcessedApiData, groupInterfacesByTag } from '../../processors/openapi';
import type { ApiConfig, ApiInterface, CliHooks, OpenApiOperation } from '../../types';
import { ensureDir } from '../../utils/file';
import { chineseToPinyinCamelCase } from '../../utils/path';
import { escapeJsDocComment } from '@/utils/escape';
import { getNormalizedPathWithAlias } from '@/utils/pathUtils';
import { applyNamingStrategy, type NamingContext } from '@/naming';
import { compileTemplate, getReactHookTemplateByKind } from '../template';
import { writeGeneratedFile } from '../fileWriter';
import { executeWithConcurrency } from '../../utils/concurrency';
import { getFileExtension } from '../../utils/config';
import { logger } from '@/utils/logger';

/** 单个接口的 Hook 渲染所需数据（模板数据 + 签名预渲染字符串） */
interface HookTemplateData {
  comment: boolean;
  hookName: string;
  functionName: string;
  requestParamName: string;
  description: string;
  requestTypeName: string;
  responseTypeName: string;
  hasParameters: boolean;
  /** query hook 专用 */
  paramsSignature?: string;
  queryOptionsSignature?: string;
  queryKeyItems?: string;
  /** mutation hook 专用 */
  mutationOptionsSignature?: string;
  mutationFnSignature?: string;
}

/**
 * @description 生成所有 Hook 文件
 * 按标签分组生成各 tag 目录的 hooks 文件 + 根目录 hooks barrel 文件
 * @param processedData 处理后的 API 数据
 * @param config API 配置
 * @param hooks 钩子函数
 *
 * @example
 * ```typescript
 * await generateHookFiles(processedData, { ...config, generateHooks: true });
 * // 生成结构：
 * // output/
 * //   hooks.ts            （根 barrel）
 * //   tag1/hooks.ts
 * //   tag2/hooks.ts
 * ```
 */
export async function generateHookFiles(
  processedData: ProcessedApiData,
  config: ApiConfig,
  hooks?: CliHooks,
): Promise<void> {
  logger.info(
    '已启用 Hooks 生成（react-query v5）：请确保项目中已安装 peer dependency "@tanstack/react-query@^5" 并配置了 QueryClientProvider',
  );

  const { outputDir } = config;
  const interfacesByTag = groupInterfacesByTag(processedData.interfaces);
  const tagEntries = Object.entries(interfacesByTag);
  const concurrency = config.concurrency || 50;

  await executeWithConcurrency(
    tagEntries,
    async ([tag, interfaces]) => {
      const tagDir = chineseToPinyinCamelCase(tag);
      const dirPath = join(outputDir, tagDir);
      await ensureDir(dirPath);
      await generateHookFileForTag(interfaces, config, dirPath, hooks);
    },
    concurrency,
    '生成 Hooks 文件',
  );

  // 生成根目录 hooks barrel
  const ext = getFileExtension(config.target);
  let barrelContent = '';
  for (const [tag, interfaces] of tagEntries) {
    if (interfaces.length === 0) continue;
    const tagDir = chineseToPinyinCamelCase(tag);
    barrelContent += `export * from './${tagDir}/hooks';\n`;
  }

  if (barrelContent) {
    await writeGeneratedFile(
      join(outputDir, `hooks${ext}`),
      barrelContent,
      config,
      hooks,
      '创建根 Hooks barrel 文件',
    );
  }
}

/**
 * @description 为指定标签生成 hooks 文件
 * @param interfaces 接口数组
 * @param processedData 处理后的 API 数据
 * @param config API 配置
 * @param dirPath 标签目录路径
 * @param hooks 钩子函数
 */
async function generateHookFileForTag(
  interfaces: ApiInterface[],
  config: ApiConfig,
  dirPath: string,
  hooks?: CliHooks,
): Promise<void> {
  const isJS = config.target === 'javascript';
  const ext = getFileExtension(config.target);
  const requestParamName = config.requestParamName || 'params';
  const hasTypeAnnotations = !isJS && config.generateTypes;

  const usedQuery = new Set<string>();
  const usedMutation = new Set<string>();
  const importedFunctions = new Set<string>();
  const importedTypes = new Set<string>();

  let combinedCode = '';

  for (const apiInterface of interfaces) {
    const naming = getHookNamingResult(
      apiInterface.path,
      apiInterface.method,
      apiInterface.operation,
      config,
    );

    const isQuery =
      apiInterface.method.toUpperCase() === 'GET' || apiInterface.method.toUpperCase() === 'HEAD';
    const kind = isQuery ? 'query' : 'mutation';

    const requestTypeName = hasTypeAnnotations ? naming.requestTypeName : 'any';
    const responseTypeName = hasTypeAnnotations ? naming.responseTypeName : 'any';
    const hasParameters = !!(
      apiInterface.operation.parameters || apiInterface.operation.requestBody
    );

    importedFunctions.add(naming.functionName);
    if (hasTypeAnnotations) {
      importedTypes.add(naming.requestTypeName);
      importedTypes.add(naming.responseTypeName);
    }

    const templateData: HookTemplateData = {
      comment: config.comment !== false,
      hookName: naming.hookName,
      functionName: naming.functionName,
      requestParamName,
      description: escapeJsDocComment(
        apiInterface.operation.summary || apiInterface.operation.description || '',
      ),
      requestTypeName,
      responseTypeName,
      hasParameters,
    };

    if (isQuery) {
      usedQuery.add(naming.hookName);
      templateData.paramsSignature = hasTypeAnnotations
        ? `${requestParamName}: ${requestTypeName}${hasParameters ? '' : ` = {} as ${requestTypeName}`}`
        : `${requestParamName}${hasParameters ? '' : ' = {}'}`;
      templateData.queryOptionsSignature = hasTypeAnnotations
        ? `options: Omit<UseQueryOptions<${responseTypeName}, Error>, 'queryKey' | 'queryFn'> = {}`
        : 'options = {}';
      templateData.queryKeyItems = buildQueryKeyItems(
        config.queryKeyPrefix,
        naming.functionName,
        requestParamName,
      );
    } else {
      usedMutation.add(naming.hookName);
      templateData.mutationOptionsSignature = hasTypeAnnotations
        ? `options: Omit<UseMutationOptions<${responseTypeName}, Error, ${requestTypeName}, unknown>> = {}`
        : 'options = {}';
      templateData.mutationFnSignature = hasTypeAnnotations
        ? `${requestParamName}: ${requestTypeName}`
        : requestParamName;
    }

    const template = getReactHookTemplateByKind(kind);
    const compiled = compileTemplate(template);
    combinedCode += `${compiled(templateData)}\n`;
  }

  // 组装 import 段
  combinedCode =
    buildImportSection(
      isJS,
      usedQuery.size > 0,
      usedMutation.size > 0,
      importedFunctions,
      importedTypes,
      config,
      dirPath,
    ) + combinedCode;

  await writeGeneratedFile(
    join(dirPath, `hooks${ext}`),
    combinedCode,
    config,
    hooks,
    '创建 Hooks 文件',
  );
}

/**
 * @description 组装 hooks 文件的 import 段
 * @param isJS 是否为 JavaScript 目标
 * @param hasQuery 是否包含 query hook
 * @param hasMutation 是否包含 mutation hook
 * @param importedFunctions 引用的 API 函数名集合
 * @param importedTypes 引用的类型名集合
 * @param config API 配置
 * @param dirPath 标签目录路径
 * @returns import 段代码字符串
 */
function buildImportSection(
  isJS: boolean,
  hasQuery: boolean,
  hasMutation: boolean,
  importedFunctions: Set<string>,
  importedTypes: Set<string>,
  config: ApiConfig,
  dirPath: string,
): string {
  let imports = '';

  const hookFns: string[] = [];
  if (hasQuery) hookFns.push('useQuery');
  if (hasMutation) hookFns.push('useMutation');
  imports += `import { ${hookFns.join(', ')} } from '@tanstack/react-query';\n`;

  if (!isJS) {
    const optionTypes: string[] = [];
    if (hasQuery) optionTypes.push('UseQueryOptions');
    if (hasMutation) optionTypes.push('UseMutationOptions');
    imports += `import type { ${optionTypes.join(', ')} } from '@tanstack/react-query';\n`;
  }

  imports += `import { ${Array.from(importedFunctions).join(', ')} } from './index';\n`;

  if (!isJS && config.generateTypes && importedTypes.size > 0) {
    let typeModulePath: string;
    if (config.typesFormat === 'zod') {
      typeModulePath = './schema';
    } else {
      const typesDirPath = join(config.outputDir, 'types');
      typeModulePath = getNormalizedPathWithAlias(dirPath, typesDirPath).replace(/\/$/, '');
    }
    imports += `import type { ${Array.from(importedTypes).join(', ')} } from '${typeModulePath}';\n`;
  }

  return `${imports}\n`;
}

/**
 * @description 构建 queryKey 数组项字符串（前缀 + 函数名 + 参数对象）
 * @param prefix 配置的 queryKey 前缀
 * @param functionName API 函数名
 * @param requestParamName 请求参数名
 * @returns 逗号分隔的数组项字符串，如 `'user', 'getUserFunc', params`
 *
 * @example
 * ```typescript
 * buildQueryKeyItems(['user'], 'getUserFunc', 'params');
 * // "'user', 'getUserFunc', params"
 * ```
 */
function buildQueryKeyItems(
  prefix: string[] | undefined,
  functionName: string,
  requestParamName: string,
): string {
  const items = (prefix ?? []).map((p) => `'${p}'`);
  items.push(`'${functionName}'`);
  items.push(requestParamName);
  return items.join(', ');
}

/**
 * @description 获取 Hook 命名结果（复用全局命名策略，含 hookName）
 * @param path API 路径
 * @param method HTTP 方法
 * @param operation 操作对象
 * @param config API 配置
 * @returns 命名结果对象（含 hookName）
 */
function getHookNamingResult(
  path: string,
  method: string,
  operation: OpenApiOperation,
  config: ApiConfig,
): {
  interfaceName: string;
  functionName: string;
  requestTypeName: string;
  responseTypeName: string;
  hookName: string;
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

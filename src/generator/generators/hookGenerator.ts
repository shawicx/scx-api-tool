/**
 * @description Hook 文件生成器（库无关）
 * 在已生成的 API 请求函数之上生成 Hook 包装：GET/HEAD 生成 query hook，
 * POST/PUT/PATCH/DELETE 生成 mutation hook；具体库语法由 hookLibraryRegistry 的适配器提供
 */

import { join } from 'path';
import { ProcessedApiData, groupInterfacesByTag } from '../../processors/openapi';
import type { ApiConfig, ApiInterface, CliHooks, OpenApiOperation } from '../../types';
import { ensureDir } from '../../utils/file';
import { chineseToPinyinCamelCase } from '../../utils/path';
import { escapeJsDocComment } from '@/utils/escape';
import { getNormalizedPathWithAlias } from '@/utils/pathUtils';
import { applyNamingStrategy, type NamingContext } from '@/naming';
import { getHookLibraryAdapter } from '../template/hookLibraryRegistry';
import { writeGeneratedFile } from '../fileWriter';
import { executeWithConcurrency } from '../../utils/concurrency';
import { getFileExtension } from '../../utils/config';
import { logger } from '@/utils/logger';

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
  cliHooks?: CliHooks,
): Promise<void> {
  const adapter = getHookLibraryAdapter(config.hooksLibrary);
  logger.info(adapter.peerDependencyHint);

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
      await generateHookFileForTag(interfaces, config, adapter, dirPath, cliHooks);
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
      cliHooks,
      '创建根 Hooks barrel 文件',
    );
  }
}

/**
 * @description 为指定标签生成 hooks 文件
 * @param interfaces 接口数组
 * @param config API 配置
 * @param adapter Hook 库适配器
 * @param dirPath 标签目录路径
 * @param cliHooks 钩子函数
 */
async function generateHookFileForTag(
  interfaces: ApiInterface[],
  config: ApiConfig,
  adapter: ReturnType<typeof getHookLibraryAdapter>,
  dirPath: string,
  cliHooks?: CliHooks,
): Promise<void> {
  const isJS = config.target === 'javascript';
  const ext = getFileExtension(config.target);
  const requestParamName = config.requestParamName || 'params';
  const hasTypeAnnotations = !isJS && config.generateTypes;
  const validateResponse = config.hooksValidateResponse && config.typesFormat === 'zod' && !isJS;

  const usedQuery = new Set<string>();
  const usedMutation = new Set<string>();
  const importedFunctions = new Set<string>();
  const importedTypes = new Set<string>();
  const importedSchemas = new Set<string>();

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

    const data = {
      comment: config.comment !== false,
      hookName: naming.hookName,
      functionName: naming.functionName,
      requestParamName,
      description: escapeJsDocComment(
        apiInterface.operation.summary || apiInterface.operation.description || '',
      ),
      requestTypeName: hasTypeAnnotations ? naming.requestTypeName : 'any',
      responseTypeName: hasTypeAnnotations ? naming.responseTypeName : 'any',
      hasParameters: !!(apiInterface.operation.parameters || apiInterface.operation.requestBody),
      hasTypeAnnotations,
      queryKeyPrefix: config.queryKeyPrefix ?? [],
      validateResponse,
      responseSchemaName: validateResponse ? `${naming.responseTypeName}Schema` : '',
    };

    importedFunctions.add(naming.functionName);
    if (hasTypeAnnotations) {
      importedTypes.add(naming.requestTypeName);
      importedTypes.add(naming.responseTypeName);
    }
    if (validateResponse) {
      importedSchemas.add(`${naming.responseTypeName}Schema`);
    }

    if (isQuery) {
      usedQuery.add(naming.hookName);
      combinedCode += `${adapter.renderQuery(data)}\n`;
    } else {
      usedMutation.add(naming.hookName);
      combinedCode += `${adapter.renderMutation(data)}\n`;
    }
  }

  // 组装 import 段：库相关 import + API 函数 import + 类型/Schema import
  combinedCode =
    adapter.renderLibraryImports({
      isJS,
      hasQuery: usedQuery.size > 0,
      hasMutation: usedMutation.size > 0,
    }) +
    buildCommonImports(isJS, importedFunctions, importedTypes, importedSchemas, config, dirPath) +
    combinedCode;

  await writeGeneratedFile(
    join(dirPath, `hooks${ext}`),
    combinedCode,
    config,
    cliHooks,
    '创建 Hooks 文件',
  );
}

/**
 * @description 组装库无关的 import 段（API 函数 + 类型模块 + 响应校验 Schema）
 * @param isJS 是否为 JavaScript 目标
 * @param importedFunctions 引用的 API 函数名集合
 * @param importedTypes 引用的类型名集合
 * @param importedSchemas 需要值导入的响应 Schema 名集合（zod 校验开启时）
 * @param config API 配置
 * @param dirPath 标签目录路径
 * @returns import 段代码字符串
 */
function buildCommonImports(
  isJS: boolean,
  importedFunctions: Set<string>,
  importedTypes: Set<string>,
  importedSchemas: Set<string>,
  config: ApiConfig,
  dirPath: string,
): string {
  let imports = '';

  imports += `import { ${Array.from(importedFunctions).join(', ')} } from './index';\n`;

  if (!isJS && config.generateTypes && (importedTypes.size > 0 || importedSchemas.size > 0)) {
    let typeModulePath: string;
    if (config.typesFormat === 'zod') {
      typeModulePath = './schema';
    } else {
      const typesDirPath = join(config.outputDir, 'types');
      typeModulePath = getNormalizedPathWithAlias(dirPath, typesDirPath).replace(/\/$/, '');
    }
    if (importedSchemas.size > 0) {
      imports += `import { ${Array.from(importedSchemas).join(', ')} } from '${typeModulePath}';\n`;
    }
    if (importedTypes.size > 0) {
      imports += `import type { ${Array.from(importedTypes).join(', ')} } from '${typeModulePath}';\n`;
    }
  }

  return imports;
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

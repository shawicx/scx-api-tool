/**
 * @description 文件生成器
 */

import consola from 'consola';
import { join } from 'path';
import { ProcessedApiData } from '../processors/openapi';
import { ApiConfig } from '../types';
import { ensureDir, fileExists, writeFormattedFile } from '../utils/file';
import { formatCode } from '../utils/formatter';
import { chineseToPinyinCamelCase } from '../utils/path';
import {
  extractRequestProperties,
  extractResponseProperties,
  extractTypeProperties,
  hasRequestBody,
} from './extractor';
import { aliasToRealPath, getNormalizedPathWithAlias } from './pathUtils';
import { sanitizeTypeName, sanitizeInterfaceName, sanitizeParamName } from './naming';
import {
  compileTemplate,
  getTypeTemplateByConfig,
  generateRequestFile as generateRequestFileContent,
  generateInterfaceFunction,
  registerTemplateHelpers,
  registerTemplatePartials,
} from './template';
import {
  generateZodTypeSchema,
  generateZodRequestSchema,
  generateZodResponseSchema,
  generateZodSchemaIndex,
  getZodImportStatement,
} from '../templates/schema-zod';

/**
 * 接口命名信息，用于自定义命名策略
 * (本地定义以避免 d.ts 生成问题)
 */
interface InterfaceNamingInfo {
  /** API 路径 */
  path: string;
  /** HTTP 方法 */
  method: string;
  /** 操作描述 */
  summary?: string;
  /** 操作详细描述 */
  description?: string;
  /** 操作 ID */
  operationId?: string;
  /** 标签 */
  tags?: string[];
}

export async function generateRequestFile(config: ApiConfig): Promise<void> {
  // 将 alias 路径转换为实际文件路径（用于文件写入）
  const requestFilePath = aliasToRealPath(config.requestFunctionFilePath);

  if (await fileExists(requestFilePath)) {
    if (process.env.DEBUG) {
      consola.debug(`请求文件已存在，跳过: ${requestFilePath}`);
    }
    return;
  }

  try {
    // 注册模板辅助函数和 partials
    registerTemplateHelpers();
    registerTemplatePartials();

    // 生成请求文件内容
    const requestFileContent = generateRequestFileContent(config);

    // 格式化代码
    const formattedCode = await formatCode(requestFileContent, requestFilePath);

    // 写入文件
    await writeFormattedFile(requestFilePath, formattedCode);

    consola.info(`创建请求函数文件: ${requestFilePath}`);
  } catch (error: any) {
    consola.error('生成请求文件失败:', error.message);
    throw error;
  }
}

export async function generateInterfaceFiles(
  processedData: ProcessedApiData,
  config: ApiConfig,
): Promise<void> {
  if (process.env.DEBUG) {
    consola.debug(`正在生成 ${processedData.interfaces.length} 个接口文件...`);
  }

  // 创建输出目录
  const { outputDir } = config;

  // 按标签分组接口
  const interfacesByTag: Record<string, any[]> = {};

  for (const apiInterface of processedData.interfaces) {
    const tags = apiInterface.operation.tags || [];
    if (tags.length > 0) {
      const tag = tags[0]; // 使用第一个标签
      if (!interfacesByTag[tag]) {
        interfacesByTag[tag] = [];
      }
      interfacesByTag[tag].push(apiInterface);
    } else {
      // 对于没有标签的接口，将它们分组到默认类别下
      if (!interfacesByTag.default) {
        interfacesByTag.default = [];
      }
      interfacesByTag.default.push(apiInterface);
    }
  }

  // 为每个标签目录生成一个索引.ts文件，其中包含该标签的所有接口
  const tagEntries = Object.entries(interfacesByTag);
  const concurrency = config.concurrency || 50;

  // 并发生成接口文件
  await executeWithConcurrency(
    tagEntries,
    async ([tag, interfaces]) => {
      // 使用 chineseToPinyinCamelCase 转换 tag 名称作为文件夹名称
      const tagDir = chineseToPinyinCamelCase(tag);
      const dirPath = join(outputDir, tagDir);

      // 如果目录不存在则创建
      await ensureDir(dirPath);

      // 在单个 index.ts 文件中生成此目录中的所有接口
      await generateInterfaceFileForTag(tagDir, interfaces, processedData, config, dirPath);
    },
    concurrency,
    `生成接口文件`,
  );

  // 生成根目录 index.ts 文件
  await generateRootIndexFile(processedData, config);
}

/**
 * 使用自定义命名策略或默认逻辑生成接口名称
 */
function getInterfaceName(path: string, method: string, operation: any, config: ApiConfig): string {
  if (config.namingStrategy?.interfaceName) {
    const info: InterfaceNamingInfo = {
      path,
      method,
      summary: operation.summary,
      description: operation.description,
      operationId: operation.operationId,
      tags: operation.tags,
    };
    return config.namingStrategy.interfaceName(info);
  }
  return generateInterfaceName(path, method);
}

/**
 * 使用自定义命名策略或默认逻辑生成函数名称
 */
function getFunctionName(path: string, method: string, operation: any, config: ApiConfig): string {
  if (config.namingStrategy?.functionName) {
    const info: InterfaceNamingInfo = {
      path,
      method,
      summary: operation.summary,
      description: operation.description,
      operationId: operation.operationId,
      tags: operation.tags,
    };
    return config.namingStrategy.functionName(info);
  }
  return generateFunctionName(path, method);
}

/**
 * 使用自定义命名策略或默认逻辑生成请求类型名称
 */
function getRequestTypeName(
  path: string,
  method: string,
  operation: any,
  config: ApiConfig,
): string {
  if (config.namingStrategy?.requestTypeName) {
    const info: InterfaceNamingInfo = {
      path,
      method,
      summary: operation.summary,
      description: operation.description,
      operationId: operation.operationId,
      tags: operation.tags,
    };
    return config.namingStrategy.requestTypeName(info);
  }
  // 默认逻辑：接口名称 + RequestType
  const interfaceName = getInterfaceName(path, method, operation, config);
  return `${interfaceName}RequestType`;
}

/**
 * 使用自定义命名策略或默认逻辑生成响应类型名称
 */
function getResponseTypeName(
  path: string,
  method: string,
  operation: any,
  config: ApiConfig,
): string {
  if (config.namingStrategy?.responseTypeName) {
    const info: InterfaceNamingInfo = {
      path,
      method,
      summary: operation.summary,
      description: operation.description,
      operationId: operation.operationId,
      tags: operation.tags,
    };
    const result = config.namingStrategy.responseTypeName(info);
    if (process.env.DEBUG) {
      consola.debug(`Custom responseTypeName for ${method} ${path}: ${result}`);
    }
    return result;
  }
  // 默认逻辑：接口名称 + ResponseType
  const interfaceName = getInterfaceName(path, method, operation, config);
  return `${interfaceName}ResponseType`;
}

export async function generateInterfaceFileForTag(
  tag: string,
  interfaces: any[],
  processedData: ProcessedApiData,
  config: ApiConfig,
  dirPath: string,
): Promise<void> {
  // 调试：检查 namingStrategy 是否存在
  if (process.env.DEBUG) {
    consola.debug(`namingStrategy exists: ${!!config.namingStrategy}`);
    consola.debug(
      `namingStrategy.responseTypeName: ${typeof config.namingStrategy?.responseTypeName}`,
    );
  }

  // 为该标签生成接口代码
  let combinedCode = '';

  // 收集所有使用的类型
  const usedTypes = new Set<string>();

  // 收集接口使用的类型
  for (const apiInterface of interfaces) {
    // 收集请求参数类型
    const requestProps = extractRequestProperties(apiInterface.operation, processedData);
    for (const prop of requestProps) {
      // 检查是否为引用类型
      if (processedData.types.some((t: any) => t.name === prop.type)) {
        usedTypes.add(prop.type);
      }
      // 检查类型是否为引用数组
      if (prop.type.endsWith('[]')) {
        const baseType = prop.type.slice(0, -2);
        if (processedData.types.some((t: any) => t.name === baseType)) {
          usedTypes.add(baseType);
        }
      }
    }

    // 从响应属性收集类型
    const responseProps = extractResponseProperties(
      apiInterface.operation.responses,
      processedData,
    );
    for (const prop of responseProps) {
      // 检查是否为引用类型
      if (processedData.types.some((t: any) => t.name === prop.type)) {
        usedTypes.add(prop.type);
      }
      // 检查类型是否为引用数组
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
  // 移除.ts扩展名
  const cleanRelativePath = relativePath.replace(/\.ts$/, '');

  // 根据配置决定导入内容
  const requestFunctionName = config.requestFunctionName || 'request';
  const requestMethodsObjectName = config.requestMethodsObjectName || 'requestMethods';

  // 判断生成模式
  const typesOnly = config.generateTypes && !config.generateApi;
  const apiOnly = config.generateApi && !config.generateTypes;

  if (typesOnly) {
    // 只生成类型模式：只导入类型（不导入 request 函数）
    if (usedTypes.size > 0) {
      // 计算类型目录路径
      const typesDirPath = join(config.outputDir, 'types');
      const typesRelativePath = getNormalizedPathWithAlias(dirPath, typesDirPath);
      const cleanTypesRelativePath = typesRelativePath.replace(/\/$/, ''); // 移除尾部斜杠
      combinedCode += `import type { ${Array.from(usedTypes).join(', ')} } from '${cleanTypesRelativePath}';\n`;
    }
  } else if (apiOnly) {
    // 只生成 API 模式：只导入 request 函数
    combinedCode += `import { ${requestFunctionName} } from '${cleanRelativePath}';\n`;
  } else {
    // 完整模式（API + 类型）：导入 RequestConfig 和函数
    if (config.requestMethodStyle === 'method-specific' || config.requestMethodStyle === 'both') {
      combinedCode += `import { RequestConfig, ${requestFunctionName}, ${requestMethodsObjectName} } from '${cleanRelativePath}';\n`;
    } else {
      combinedCode += `import { RequestConfig, ${requestFunctionName} } from '${cleanRelativePath}';\n`;
    }

    // 添加类型导入（只在 typesFormat 为 typescript 时导入）
    if (config.typesFormat === 'typescript' && usedTypes.size > 0) {
      // 计算类型目录路径
      const typesDirPath = join(config.outputDir, 'types');
      const typesRelativePath = getNormalizedPathWithAlias(dirPath, typesDirPath);
      const cleanTypesRelativePath = typesRelativePath.replace(/\/$/, ''); // 移除尾部斜杠
      combinedCode += `import type { ${Array.from(usedTypes).join(', ')} } from '${cleanTypesRelativePath}';\n`;
    }
  }

  combinedCode += '\n';

  // 处理接口（只生成类型模式和完整模式都会生成接口定义）
  for (const apiInterface of interfaces) {
    // 生成接口名称（使用自定义策略或默认逻辑）
    const interfaceName = getInterfaceName(
      apiInterface.path,
      apiInterface.method,
      apiInterface.operation,
      config,
    );
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

    // 准备模板数据
    const templateData = {
      interfaceName,
      requestTypeName,
      responseTypeName,
      functionName: getFunctionName(
        apiInterface.path,
        apiInterface.method,
        apiInterface.operation,
        config,
      ),
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

    // 生成接口代码
    const code = generateInterfaceFunction(templateData, config);

    // 移除模板中的导入语句（已在顶部添加）
    const codeWithoutImport = code.replace(
      /import type \{ AxiosRequestConfig \} from 'axios';\nimport axios from 'axios';\nimport consola from 'consola';\n\n?/g,
      '',
    );
    combinedCode += `${codeWithoutImport}\n\n`;
  }

  // 格式化代码
  const formattedCode = await formatCode(combinedCode, join(dirPath, 'index.ts'));

  // 写入文件
  const filePath = join(dirPath, 'index.ts');
  await writeFormattedFile(filePath, formattedCode);

  if (process.env.DEBUG) {
    consola.debug(`创建合并接口文件: ${filePath}`);
  }
}

export async function generateTypeFiles(
  processedData: ProcessedApiData,
  config: ApiConfig,
): Promise<void> {
  // 只生成 API 模式下不生成类型文件
  if (config.generateApi && !config.generateTypes) {
    if (process.env.DEBUG) {
      consola.debug('API Only 模式：跳过类型文件生成');
    }
    return;
  }

  if (process.env.DEBUG) {
    consola.debug(`正在生成 ${processedData.types.length} 个类型文件...`);
  }

  // 创建类型目录
  const typesDir = join(config.outputDir, 'types');
  await ensureDir(typesDir);

  // 并发生成类型文件
  const concurrency = config.concurrency || 50;
  await executeWithConcurrency(
    processedData.types,
    (type) => generateTypeFile(type, processedData, config, typesDir),
    concurrency,
    `生成类型文件`,
  );

  // 生成类型索引文件
  await generateTypesIndexFile(processedData, config);
}

async function generateTypeFile(
  type: any,
  processedData: ProcessedApiData,
  config: ApiConfig,
  typesDir: string,
): Promise<void> {
  // 清理类型名
  const cleanTypeName = sanitizeTypeName(type.name);
  const cleanFileName = cleanTypeName.replace(/[^a-zA-Z0-9$_]/g, '_');

  // 编译模板
  const template = compileTemplate(getTypeTemplateByConfig(config.comment !== false));

  // 准备模板数据
  const templateData = {
    typeName: cleanTypeName,
    description: type.schema.description || type.name,
    properties: extractTypeProperties(type.schema),
  };

  // 生成代码
  let code = template(templateData);

  // 收集类型依赖并生成导入语句
  const dependencies = new Set<string>();
  for (const prop of templateData.properties) {
    // 检查属性类型是否为引用类型（非原始类型）
    const propType = prop.type;
    // 排除原始类型和数组类型中的原始类型
    const baseType = propType.endsWith('[]') ? propType.slice(0, -2) : propType;
    // 如果是引用类型（首字母大写且在已处理的类型中）
    if (
      /^[A-Z]/.test(baseType) &&
      !['any', 'string', 'number', 'boolean', 'object', 'unknown', 'never'].includes(
        baseType.toLowerCase(),
      ) &&
      processedData.types.some((t: any) => t.name === baseType)
    ) {
      dependencies.add(baseType);
    }
  }

  // 如果有依赖的类型，添加导入语句
  if (dependencies.size > 0) {
    const importPath = getNormalizedPathWithAlias(
      typesDir,
      join(config.outputDir, 'types/index.ts'),
    );
    const cleanImportPath = importPath.replace(/\.ts$/, '').replace(/\/$/, '');
    const importStatement = `import type { ${Array.from(dependencies).join(', ')} } from '${cleanImportPath}';\n\n`;
    code = importStatement + code;
  }

  // 格式化代码
  const formattedCode = await formatCode(code, join(typesDir, `${cleanFileName}.ts`));

  // 写入文件
  const filePath = join(typesDir, `${cleanFileName}.ts`);
  await writeFormattedFile(filePath, formattedCode);

  if (process.env.DEBUG) {
    consola.debug(`创建类型文件: ${filePath}`);
  }
}

async function generateTypesIndexFile(
  processedData: ProcessedApiData,
  config: ApiConfig,
): Promise<void> {
  const typesDir = join(config.outputDir, 'types');

  // 生成类型导出
  let indexContent = '';

  for (const type of processedData.types) {
    const cleanTypeName = sanitizeTypeName(type.name);
    const cleanFileName = cleanTypeName.replace(/[^a-zA-Z0-9$_]/g, '_');
    indexContent += `export type { ${cleanTypeName} } from './${cleanFileName}';\n`;
  }

  // 写入 index.ts 文件
  const indexPath = join(typesDir, 'index.ts');
  await writeFormattedFile(indexPath, indexContent);

  if (process.env.DEBUG) {
    consola.debug(`创建类型索引文件: ${indexPath}`);
  }
}

export async function generateRootIndexFile(
  processedData: ProcessedApiData,
  config: ApiConfig,
): Promise<void> {
  const { outputDir } = config;

  // 生成标签目录导出
  let rootIndexContent = '';

  // 添加请求函数导出
  const relativePath = getNormalizedPathWithAlias(outputDir, config.requestFunctionFilePath);
  // 移除.ts扩展名
  const cleanRelativePath = relativePath.replace(/\.ts$/, '');
  rootIndexContent += `export * from '${cleanRelativePath}';\n\n`;

  // 添加标签目录导出
  const tagDirs: string[] = [];

  // 收集标签目录
  for (const category of processedData.categories) {
    const tagDir = chineseToPinyinCamelCase(category.name);
    tagDirs.push(tagDir);
  }

  // 添加默认类别（如果需要）
  // tagDirs.push('default');

  for (const tagDir of tagDirs) {
    rootIndexContent += `export * as ${tagDir} from './${tagDir}';\n`;
  }

  // 写入根目录 index.ts 文件
  const rootIndexPath = join(outputDir, 'index.ts');
  await writeFormattedFile(rootIndexPath, rootIndexContent);

  if (process.env.DEBUG) {
    consola.debug(`创建根索引文件: ${rootIndexPath}`);
  }
}

function generateInterfaceName(path: string, method: string): string {
  // 1. 提取路径参数
  const paramMatches = path.match(/\{([^}]+)\}/g) || [];

  // 2. 移除路径参数，清理路径
  let pathName = path.replace(/\{[^}]+\}/g, '');
  pathName = pathName
    .replace(/^\//, '') // 移除开头的 /
    .replace(/^api-?/i, '') // 移除开头的 api- 或 api/
    .replace(/\//g, '-') // / → -
    .replace(/^-+|-+$/g, ''); // 移除前导/尾随 -

  // 3. 分割并处理每个单词
  const words = pathName.split('-');
  const camelCaseWords = words.map((word) => {
    // 如果单词已经是驼峰命名（包含大写字母或数字），保持不变
    if (/[A-Z0-9]/.test(word.charAt(0))) {
      return word;
    }
    // 否则首字母大写
    return word.charAt(0).toUpperCase() + word.slice(1);
  });

  pathName = camelCaseWords.join('');

  // 4. 为每个路径参数添加 By 前缀（驼峰化）
  const paramsPart = paramMatches
    .map((param) => {
      const paramName = param.replace(/\{([^}]+)\}/, '$1');
      const capitalized = paramName.charAt(0).toUpperCase() + paramName.slice(1);
      return `By${capitalized}`;
    })
    .join('');

  // 5. 组合：方法（首字母大写）+ 路径名 + 参数
  const methodCapitalized = method.charAt(0).toUpperCase() + method.slice(1).toLowerCase();
  const interfaceName = methodCapitalized + pathName + paramsPart;

  // 6. 清理非法字符（如点等）
  return sanitizeInterfaceName(interfaceName);
}

function generateFunctionName(path: string, method: string): string {
  // 1. 提取路径参数
  const paramMatches = path.match(/\{([^}]+)\}/g) || [];

  // 2. 移除路径参数，清理路径
  let pathName = path.replace(/\{[^}]+\}/g, '');
  pathName = pathName
    .replace(/^\//, '') // 移除开头的 /
    .replace(/^api-?/i, '') // 移除开头的 api- 或 api/
    .replace(/\//g, '-') // / → -
    .replace(/^-+|-+$/g, ''); // 移除前导/尾随 -

  // 3. 分割并处理每个单词（全部转为 PascalCase）
  const words = pathName.split('-');
  const pascalCaseWords = words.map((word) => {
    // 如果单词已经是驼峰命名（包含大写字母或数字），保持不变
    if (/[A-Z0-9]/.test(word.charAt(0))) {
      return word;
    }
    // 否则首字母大写
    return word.charAt(0).toUpperCase() + word.slice(1);
  });

  const pascalCasePathName = pascalCaseWords.join('');

  // 4. 为每个路径参数添加 By 前缀（驼峰化）
  const paramsPart = paramMatches
    .map((param) => {
      const paramName = param.replace(/\{[^}]+\}/, '$1');
      const capitalized = paramName.charAt(0).toUpperCase() + paramName.slice(1);
      return `By${capitalized}`;
    })
    .join('');

  // 5. 组合：方法（小写开头）+ 路径名（PascalCase） + 参数 + Api 后缀
  // 方法小写 + 路径名第一个字母保持大写，形成正确的 camelCase
  const methodLower = method.toLowerCase();
  const functionName = `${methodLower + pascalCasePathName + paramsPart}Api`;

  // 6. 清理非法字符（如点等）
  return sanitizeParamName(functionName);
}

/**
 * 并发执行器，带并发控制和错误处理
 * @param items 需要处理的项目数组
 * @param handler 处理函数
 * @param concurrency 并发数量
 * @param taskName 任务名称（用于日志）
 */
async function executeWithConcurrency<T>(
  items: T[],
  handler: (item: T) => Promise<void>,
  concurrency: number,
  taskName: string,
): Promise<void> {
  if (items.length === 0) {
    return;
  }

  if (process.env.DEBUG) {
    consola.debug(`${taskName}：开始并发处理 ${items.length} 个项目，并发数：${concurrency}`);
  }

  // 分批处理
  const errors: Array<{ item: T; error: Error }> = [];
  let completed = 0;

  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);

    const batchResults = await Promise.allSettled(batch.map(async (item) => handler(item)));

    // 统计结果
    batchResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        errors.push({ item: batch[index], error: result.reason });
      }
    });

    completed += batch.length;

    if (process.env.DEBUG) {
      consola.debug(`${taskName}：进度 ${completed}/${items.length}`);
    }
  }

  // 如果有错误，汇总报告
  if (errors.length > 0) {
    consola.warn(`${taskName}：${errors.length}/${items.length} 个项目处理失败`);
    if (process.env.DEBUG) {
      errors.forEach(({ error }) => {
        consola.error(`  - ${error.message}`);
      });
    }
  } else if (process.env.DEBUG) {
    consola.success(`${taskName}：成功完成 ${items.length} 个项目`);
  }
}

/**
 * 生成 Zod Schema 文件
 * @param processedData 处理后的 API 数据
 * @param config 配置
 */
export async function generateSchemaFiles(
  processedData: ProcessedApiData,
  config: ApiConfig,
): Promise<void> {
  // 如果未启用 validation，则跳过
  if (!config.validation?.enabled) {
    if (process.env.DEBUG) {
      consola.debug('Schema 生成未启用，跳过');
    }
    return;
  }

  // 只支持 Zod
  const { validation } = config;
  if (validation.library !== 'zod') {
    consola.warn(`目前只支持 Zod，配置的 library: ${validation.library}`);
    return;
  }

  consola.info('开始生成 Zod Schema...');

  // 确定 schema 输出目录
  const schemasDir = validation.outputDir || join(config.outputDir, 'schemas');
  await ensureDir(schemasDir);

  const generatedSchemas: string[] = [];

  // 1. 生成类型 Schemas
  if (validation.generateTypeSchemas !== false) {
    await generateTypeSchemasFiles(processedData, config, schemasDir, generatedSchemas);
  }

  // 2. 生成接口 Request/Response Schemas
  await generateInterfaceSchemasFiles(processedData, config, schemasDir);

  // 3. 生成索引文件
  await generateSchemaIndexFile(schemasDir, generatedSchemas);

  consola.success(`成功生成 ${generatedSchemas.length} 个 Zod Schema 文件`);
}

/**
 * 生成类型 Schema 文件
 */
async function generateTypeSchemasFiles(
  processedData: ProcessedApiData,
  config: ApiConfig,
  schemasDir: string,
  generatedSchemas: string[],
): Promise<void> {
  if (process.env.DEBUG) {
    consola.debug(`正在生成 ${processedData.types.length} 个类型 Schema...`);
  }

  // 并发生成类型 Schema
  const concurrency = config.concurrency || 50;
  await executeWithConcurrency(
    processedData.types,
    async (type) => {
      const schemaName = `${sanitizeTypeName(type.name)}Schema`;
      // 文件名也添加 Schema 后缀，与主要内容区分
      const fileName = `${sanitizeTypeName(type.name)}Schema`.replace(/[^a-zA-Z0-9$_]/g, '_');

      // 生成 schema 代码
      const schemaCode = generateZodTypeSchema(
        {
          name: sanitizeTypeName(type.name),
          description: type.schema.description || type.name,
          properties: extractTypeProperties(type.schema),
        },
        config,
      );

      // 格式化代码
      const formattedCode = await formatCode(schemaCode, join(schemasDir, `${fileName}.ts`));

      // 写入文件
      const filePath = join(schemasDir, `${fileName}.ts`);
      await writeFormattedFile(filePath, formattedCode);

      generatedSchemas.push(schemaName);

      if (process.env.DEBUG) {
        consola.debug(`创建类型 Schema 文件: ${filePath}`);
      }
    },
    concurrency,
    `生成类型 Schema`,
  );
}

/**
 * 生成接口 Request/Response Schema 文件
 */
async function generateInterfaceSchemasFiles(
  processedData: ProcessedApiData,
  config: ApiConfig,
  schemasDir: string,
): Promise<void> {
  if (process.env.DEBUG) {
    consola.debug(`正在生成 ${processedData.interfaces.length} 个接口 Schema...`);
  }

  // 获取 validation 配置（已在外层函数检查过 enabled）
  const validation = config.validation!;

  // 按标签分组接口
  const interfacesByTag: Record<string, any[]> = {};
  for (const apiInterface of processedData.interfaces) {
    const tags = apiInterface.operation.tags || [];
    const tag = tags.length > 0 ? tags[0] : 'default';
    if (!interfacesByTag[tag]) {
      interfacesByTag[tag] = [];
    }
    interfacesByTag[tag].push(apiInterface);
  }

  // 为每个标签生成 Schema 文件
  const concurrency = config.concurrency || 50;
  const tagEntries = Object.entries(interfacesByTag);

  await executeWithConcurrency(
    tagEntries,
    async ([tag, interfaces]) => {
      // 使用 chineseToPinyinCamelCase 转换 tag 名称作为文件夹名称
      const tagDir = chineseToPinyinCamelCase(tag);
      const dirPath = join(schemasDir, tagDir);
      await ensureDir(dirPath);

      // 为该标签下的每个接口生成 Schema
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

        // 生成接口信息
        const interfaceInfo = {
          requestTypeName,
          responseTypeName,
          description: apiInterface.operation.summary || apiInterface.operation.description || '',
        };

        let schemaCode = '';

        // 添加 import 语句（只添加一次）
        schemaCode += getZodImportStatement();
        schemaCode += '\n';

        // 收集所有引用的类型 schema
        const typeSchemaImports = new Set<string>();

        // 生成 Request Schema
        if (validation.generateRequestSchemas !== false) {
          const hasRequest = !!(
            apiInterface.operation.parameters || apiInterface.operation.requestBody
          );
          if (hasRequest) {
            const result = generateZodRequestSchema(
              { ...interfaceInfo, operation: apiInterface.operation },
              processedData,
              config,
            );
            schemaCode += result.code;
            schemaCode += '\n\n';

            // 收集引用的类型 schema
            result.imports.forEach((imp) => typeSchemaImports.add(imp));
          }
        }

        // 生成 Response Schema
        if (validation.generateResponseSchemas !== false) {
          const hasResponse = !!apiInterface.operation.responses;
          if (hasResponse) {
            const result = generateZodResponseSchema(
              { ...interfaceInfo, operation: apiInterface.operation },
              processedData,
              config,
            );
            schemaCode += result.code;

            // 收集引用的类型 schema
            result.imports.forEach((imp) => typeSchemaImports.add(imp));
          }
        }

        // 在顶部添加类型 schema 的导入语句
        if (typeSchemaImports.size > 0) {
          const importStatements = Array.from(typeSchemaImports)
            .map((schemaName) => `import { ${schemaName} } from '../${schemaName}';`)
            .join('\n');
          schemaCode = `${importStatements}\n\n${schemaCode}`;
        }

        // 如果有生成的内容，写入文件
        if (schemaCode.trim()) {
          // 使用接口名称作为文件名
          const interfaceName = getInterfaceName(
            apiInterface.path,
            apiInterface.method,
            apiInterface.operation,
            config,
          );
          const fileName = interfaceName.replace(/[^a-zA-Z0-9$_]/g, '_');

          // 格式化代码
          const formattedCode = await formatCode(schemaCode, join(dirPath, `${fileName}.ts`));

          // 写入文件
          const filePath = join(dirPath, `${fileName}.ts`);
          await writeFormattedFile(filePath, formattedCode);

          if (process.env.DEBUG) {
            consola.debug(`创建接口 Schema 文件: ${filePath}`);
          }
        }
      }
    },
    concurrency,
    `生成接口 Schema`,
  );
}

/**
 * 生成 Schema 索引文件
 */
async function generateSchemaIndexFile(
  schemasDir: string,
  generatedSchemas: string[],
): Promise<void> {
  // 生成根索引文件
  const indexContent = generateZodSchemaIndex(generatedSchemas);

  // 写入索引文件
  const indexPath = join(schemasDir, 'index.ts');
  await writeFormattedFile(indexPath, indexContent);

  if (process.env.DEBUG) {
    consola.debug(`创建 Schema 索引文件: ${indexPath}`);
  }
}

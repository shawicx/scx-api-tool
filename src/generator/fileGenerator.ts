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
import { getRelativeImportPath } from './pathUtils';
import { compileTemplate, interfaceTemplate, requestTemplate, typeTemplate } from './template';

export async function generateRequestFile(config: ApiConfig): Promise<void> {
  const requestFilePath = config.requestFunctionFilePath;

  // 检查文件是否已存在
  if (await fileExists(requestFilePath)) {
    if (process.env.DEBUG) {
      consola.debug(`请求文件已存在，跳过: ${requestFilePath}`);
    }
    return;
  }

  try {
    // 格式化模板代码
    const formattedCode = await formatCode(requestTemplate, requestFilePath);

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
  for (const [tag, interfaces] of Object.entries(interfacesByTag)) {
    const tagDir = chineseToPinyinCamelCase(tag);
    const dirPath = join(outputDir, tagDir);

    // 如果目录不存在则创建
    await ensureDir(dirPath);

    // 在单个 index.ts 文件中生成此目录中的所有接口
    await generateInterfaceFileForTag(tag, interfaces, processedData, config, dirPath);
  }

  // 生成根目录 index.ts 文件
  await generateRootIndexFile(processedData, config);
}

export async function generateInterfaceFileForTag(
  tag: string,
  interfaces: any[],
  processedData: ProcessedApiData,
  config: ApiConfig,
  dirPath: string,
): Promise<void> {
  // 为该标签中的所有接口生成代码
  let combinedCode = '';

  // 收集所有使用的类型
  const usedTypes = new Set<string>();

  // 处理每个接口以收集使用的类型
  for (const apiInterface of interfaces) {
    // 从请求参数收集类型
    const requestProps = extractRequestProperties(apiInterface.operation, processedData);
    for (const prop of requestProps) {
      // 检查类型是否引用另一个类型
      if (processedData.types.some((t: any) => t.name === prop.type)) {
        usedTypes.add(prop.type);
      }
    }

    // 从响应属性收集类型
    const responseProps = extractResponseProperties(
      apiInterface.operation.responses,
      processedData,
    );
    for (const prop of responseProps) {
      // 检查类型是否引用另一个类型
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

  // 在顶部添加导入语句
  const relativePath = getRelativeImportPath(dirPath, config.requestFunctionFilePath);
  // 如果存在则移除.ts扩展名
  const cleanRelativePath = relativePath.replace(/\.ts$/, '');
  // combinedCode += `import type { AxiosRequestConfig } from 'axios';\n`;
  combinedCode += `import { RequestConfig, request } from '${cleanRelativePath}';\n`;

  // 为使用的类型添加导入
  if (usedTypes.size > 0) {
    // 计算到类型目录的路径（不包括index.ts）
    const typesDirPath = join(config.outputDir, 'types');
    const typesRelativePath = getRelativeImportPath(dirPath, typesDirPath);
    const cleanTypesRelativePath = typesRelativePath.replace(/\/$/, ''); // 如果存在则移除尾部斜杠
    combinedCode += `import type { ${Array.from(usedTypes).join(', ')} } from '${cleanTypesRelativePath}';\n`;
  }

  combinedCode += '\n';

  // 处理每个接口
  for (const apiInterface of interfaces) {
    // 根据路径和方法生成接口名称
    const interfaceName = generateInterfaceName(apiInterface.path, apiInterface.method);

    // 准备模板数据
    const templateData = {
      interfaceName,
      functionName: generateFunctionName(apiInterface.path, apiInterface.method),
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
      comment: config.comment,
    };

    // 移除调试信息
    if (process.env.DEBUG && interfaceName === 'ApiRolesGET') {
      consola.debug(`${interfaceName} 的模板数据:`, JSON.stringify(templateData, null, 2));
    }

    // 从模板生成代码
    const template = compileTemplate(interfaceTemplate);
    const code = template(templateData);

    // 移除单个模板中的导入语句，因为我们在顶部已添加
    const codeWithoutImport = code.replace(
      /import type \{ AxiosRequestConfig \} from 'axios';\nimport \{ RequestConfig, request \} from '[^']*';\n\n?/,
      '',
    );
    combinedCode += `${codeWithoutImport}\n\n`;
  }

  // 格式化合并的代码
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
  if (process.env.DEBUG) {
    consola.debug(`正在生成 ${processedData.types.length} 个类型文件...`);
  }

  // 创建类型目录（用于向后兼容）
  const typesDir = join(config.outputDir, 'types');
  await ensureDir(typesDir);

  // 生成每个类型文件
  for (const type of processedData.types) {
    await generateTypeFile(type, processedData, config, typesDir);
  }

  // 为类型目录生成 index.ts 文件
  await generateTypesIndexFile(processedData, config);
}

async function generateTypeFile(
  type: any,
  processedData: ProcessedApiData,
  config: ApiConfig,
  typesDir: string,
): Promise<void> {
  // 编译模板
  const template = compileTemplate(typeTemplate);

  // 准备模板数据
  const templateData = {
    typeName: type.name,
    description: type.schema.description || type.name,
    properties: extractTypeProperties(type.schema),
    comment: config.comment,
  };

  // 从模板生成代码
  const code = template(templateData);

  // 格式化代码
  const formattedCode = await formatCode(code, join(typesDir, `${type.name}.ts`));

  // 写入文件
  const filePath = join(typesDir, `${type.name}.ts`);
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

  // 为所有类型生成导出
  let indexContent = '';

  for (const type of processedData.types) {
    indexContent += `export type { ${type.name} } from './${type.name}';\n`;
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

  // 为所有标签目录生成导出
  let rootIndexContent = '';

  // 添加请求函数导出
  const relativePath = getRelativeImportPath(outputDir, config.requestFunctionFilePath);
  // 如果存在则移除.ts扩展名
  const cleanRelativePath = relativePath.replace(/\.ts$/, '');
  rootIndexContent += `export * from '${cleanRelativePath}';\n\n`;

  // 为每个标签目录添加导出
  const tagDirs: string[] = [];

  // 收集所有标签目录
  for (const category of processedData.categories) {
    const tagDir = chineseToPinyinCamelCase(category.name);
    tagDirs.push(tagDir);
  }

  // 如果存在则添加默认类别
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
  // 将路径转换为驼峰命名
  const pathName = path
    .replace(/\{([^}]+)\}/g, 'By$1') // 替换路径参数
    .replace(/[^a-zA-Z0-9]/g, '-') // 替换非字母数字字符
    .replace(/^-+|-+$/g, '') // 修剪前导/尾随破折号
    .replace(/-([a-z])/g, (g) => g[1].toUpperCase()); // 转换为驼峰命名

  // 首字母大写并添加方法
  return pathName.charAt(0).toUpperCase() + pathName.slice(1) + method.toUpperCase();
}

function generateFunctionName(path: string, method: string): string {
  // 将路径转换为驼峰命名
  const pathName = path
    .replace(/\{([^}]+)\}/g, 'By$1') // 替换路径参数
    .replace(/[^a-zA-Z0-9]/g, '-') // 替换非字母数字字符
    .replace(/^-+|-+$/g, '') // 修剪前导/尾随破折号
    .replace(/-([a-z])/g, (g) => g[1].toUpperCase()); // 转换为驼峰命名

  // 转换为驼峰命名并添加方法
  return pathName + method.toUpperCase();
}

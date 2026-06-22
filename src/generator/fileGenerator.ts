/**
 * @description 文件生成器协调器
 * 统一协调各类文件的生成工作，包括请求函数、接口文件、类型文件和 Schema 文件
 */

import consola from 'consola';
import { ApiConfig, CliHooks } from '../types';
import { fileExists, writeFormattedFile } from '../utils/file';
import { formatCode } from '../utils/formatter';
import { aliasToRealPath } from './pathUtils';
import { assertWithinCwd } from '@/utils/pathSafety';
import { generateRequestFile as generateRequestFileContent } from './template';

export { generateInterfaceFiles } from './generators/interfaceGenerator';
export { generateRootIndexFile } from './generators/rootIndexGenerator';
export { generateTypeFiles } from './generators/typeGenerator';
export { generateSchemaFiles } from './generators/schemaGenerator';

/**
 * @description 生成请求函数文件
 * 生成统一的 HTTP 请求函数和相关配置
 * @param config API 配置
 * @param hooks 钩子函数
 *
 * @example
 * ```typescript
 * await generateRequestFile(config);
 * // 生成 request.ts 文件，包含 request 函数和 requestMethods 对象
 * ```
 */
export async function generateRequestFile(config: ApiConfig, hooks?: CliHooks): Promise<void> {
  const requestFilePath = aliasToRealPath(config.requestFunctionFilePath);
  // 安全护栏：禁止写入项目根目录之外
  assertWithinCwd(requestFilePath, 'requestFunctionFilePath');

  if (await fileExists(requestFilePath)) {
    if (process.env.DEBUG) {
      consola.debug(`请求文件已存在，跳过: ${requestFilePath}`);
    }
    return;
  }

  try {
    const requestFileContent = generateRequestFileContent(config);

    const formattedCode = await formatCode(requestFileContent, requestFilePath, config.indentSize);

    await writeFormattedFile(requestFilePath, formattedCode, hooks);

    consola.info(`创建请求函数文件: ${requestFilePath}`);
  } catch (error: any) {
    consola.error('生成请求文件失败:', error.message);
    throw error;
  }
}

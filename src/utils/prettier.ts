/*
 * @Author: shawicx d35f3153@proton.me
 * @Date: 2025-08-08 23:50:48
 * @LastEditors: shawicx d35f3153@proton.me
 * @LastEditTime: 2025-08-24 02:26:58
 * @Description:
 */
import consola from 'consola';
import fs from 'fs-extra';
import { memoize } from 'lodash';
import path from 'path';
import prettier from 'prettier';

/**
 * @description 获取 prettier 配置。
 * @param cwd 当前工作目录
 * @returns prettier 配置
 */
export async function getPrettier(cwd: string): Promise<typeof prettier> {
  const projectPrettierPath = path.join(cwd, 'node_modules/prettier');
  if (await fs.pathExists(projectPrettierPath)) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require(projectPrettierPath);
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('prettier');
}

/**
 * @description 获取 prettier 配置。
 * @returns prettier 配置
 */
export async function getPrettierOptions(): Promise<prettier.Options> {
  const prettierOptions: prettier.Options = {
    parser: 'typescript',
    printWidth: 120,
    tabWidth: 2,
    singleQuote: true,
    semi: true,
    trailingComma: 'none',
    bracketSpacing: false,
    endOfLine: 'lf',
  };

  const [prettierConfigPathErr, prettierConfigPath] = await (async () => {
    const result = await prettier.resolveConfigFile();
    const configPath = result;
    consola.debug('获取 prettier 配置路径', configPath);
    return [null, configPath];
  })();
  if (prettierConfigPathErr || !prettierConfigPath) {
    return prettierOptions;
  }

  const [prettierConfigErr, prettierConfig] = await (async () => {
    const config = await prettier.resolveConfig(prettierConfigPath);
    return [null, config];
  })();
  if (prettierConfigErr || !prettierConfig) {
    return prettierOptions;
  }

  return {
    ...prettierOptions,
    ...prettierConfig,
    parser: 'typescript',
  };
}

/**
 * @description 获取缓存的 prettier 配置。
 * @returns prettier 配置
 */
export const getCachedPrettierOptions = memoize(getPrettierOptions);

/**
 * @description 使用 prettier 格式化代码内容。
 * @param content 需要格式化的代码内容
 * @param options prettier 配置选项
 * @returns 格式化后的代码内容
 */
export async function formatCode(content: string, options?: prettier.Options): Promise<string> {
  consola.debug('开始格式化代码内容，内容长度:', content.length);
  try {
    const prettierOptions = options || (await getCachedPrettierOptions());
    consola.debug('使用 prettier 配置:', prettierOptions);

    const formattedContent = await prettier.format(content, prettierOptions);
    consola.debug('代码格式化成功，格式化后长度:', formattedContent.length);
    return formattedContent;
  } catch (error) {
    consola.warn('代码格式化失败，返回原始内容:', error);
    return content;
  }
}

/**
 * @description 使用 prettier 格式化文件内容。
 * @param filePath 文件路径
 * @param content 需要格式化的代码内容
 * @param options prettier 配置选项
 * @returns 格式化后的代码内容
 */
export async function formatFile(
  filePath: string,
  content: string,
  options?: prettier.Options,
): Promise<string> {
  consola.debug(`开始格式化文件: ${filePath}, 内容长度: ${content.length}`);
  try {
    const prettierOptions = options || (await getCachedPrettierOptions());

    // 根据文件扩展名自动选择 parser
    const ext = path.extname(filePath).toLowerCase();
    let parser: prettier.BuiltInParserName = 'typescript';

    if (ext === '.js' || ext === '.jsx') {
      parser = 'babel';
    } else if (ext === '.json') {
      parser = 'json';
    } else if (ext === '.md') {
      parser = 'markdown';
    } else if (ext === '.html') {
      parser = 'html';
    } else if (ext === '.css' || ext === '.scss' || ext === '.less') {
      parser = 'css';
    }

    consola.debug(`文件 ${filePath} 使用 parser: ${parser}`);

    const formatOptions = {
      ...prettierOptions,
      parser,
    };
    consola.debug('格式化选项:', formatOptions);
    const formattedContent = await prettier.format(content, formatOptions);
    return formattedContent;
  } catch (error) {
    consola.warn(`文件 ${filePath} 格式化失败，返回原始内容:`, error);
    return content;
  }
}

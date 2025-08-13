/*
 * @Author: shawicx d35f3153@proton.me
 * @Date: 2025-08-08 23:50:48
 * @LastEditors: shawicx d35f3153@proton.me
 * @LastEditTime: 2025-08-09 00:47:22
 * @Description:
 */
import consola from 'consola';
import fs from 'fs-extra';
import memoize from 'lodash/memoize';
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

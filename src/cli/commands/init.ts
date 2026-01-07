/**
 * @description 初始化命令 创建配置文件
 */

import { Command } from 'commander';
import consola from 'consola';
import { fileExists, writeFormattedFile } from '@/utils/file';
import { join } from 'path';
import { cwd } from 'process';
import { DEFAULT_CONFIG } from '../constants';
import { handleError } from '@/errors';

export const initCommand = new Command('init')
  .description('初始化一个新的 api-power.config.ts 配置文件')
  .option('-f, --force', '覆盖现有配置文件', false)
  .option('-v, --verbose', '显示详细的错误信息和堆栈跟踪', false)
  .action(async (options) => {
    const { verbose = false } = options;
    const configPath = join(cwd(), 'api-power.config.ts');

    try {
      // 检查文件是否存在
      if (!options.force) {
        if (await fileExists(configPath)) {
          consola.warn('配置文件已存在。使用 --force 覆盖。');
          return;
        }
      }

      await writeFormattedFile(configPath, DEFAULT_CONFIG);
      consola.success(`配置文件创建成功: ${configPath}`);
    } catch (error: any) {
      handleError(error, verbose);
    }
  });

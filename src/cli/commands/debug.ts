/**
 * @description 调试命令 启用调试输出生成代码
 */

import { Command } from 'commander';
import consola from 'consola';
import { generateCode } from '../../generator';

export const debugCommand = new Command('debug')
  .description('启用调试输出生成代码')
  .option('-c, --config <path>', '配置文件路径', 'api-power.config.ts')
  .action(async (options) => {
    try {
      // 启用调试模式
      process.env.DEBUG = 'true';
      await generateCode(options.config, false);
    } catch (error: any) {
      consola.error('调试生成失败:', error.message);
      process.exit(1);
    }
  });

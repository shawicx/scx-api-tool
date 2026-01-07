/**
 * @description 调试命令 启用调试输出生成代码
 */

import { Command } from 'commander';
import { generateCode } from '@/generator';
import { handleError } from '@/errors';

export const debugCommand = new Command('debug')
  .description('启用调试输出生成代码')
  .option('-c, --config <path>', '配置文件路径', 'api-power.config.ts')
  .option('-v, --verbose', '显示详细的错误信息和堆栈跟踪（debug 模式默认启用）', false)
  .action(async (options) => {
    // debug 模式默认 verbose
    const { verbose = true } = options;

    try {
      // 启用调试模式
      process.env.DEBUG = 'true';
      await generateCode(options.config);
    } catch (error: any) {
      handleError(error, verbose);
    }
  });

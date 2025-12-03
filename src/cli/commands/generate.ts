import { Command } from 'commander';
import consola from 'consola';
import { watch } from 'fs';
import { join } from 'path';
import { generateCode } from '../../generator';

export const generateCommand = new Command('generate')
  .alias('gen')
  .description('从 OpenAPI/Swagger 定义生成 API 请求函数和类型')
  .option('-c, --config <path>', '配置文件路径', 'api-power.config.ts')
  .option('-w, --watch', '监视更改并自动重新生成', false)
  .action(async (options) => {
    try {
      if (options.watch) {
        consola.info('正在监视更改...');
        // 监视配置文件更改
        const configPath = join(process.cwd(), options.config);
        watch(configPath, async () => {
          consola.info('配置已更改，正在重新生成...');
          try {
            await generateCode(options.config);
          } catch (error) {
            consola.error('重新生成失败:', error);
          }
        });
      }

      await generateCode(options.config);
    } catch (error: any) {
      consola.error('代码生成失败:', error.message);
      process.exit(1);
    }
  });

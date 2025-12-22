/**
 * @description 代码生成命令 支持单次生成和监视模式
 */

import { Command } from 'commander';
import { watch } from 'fs';
import { join } from 'path';
import { generateCode } from '@/generator';
import { getProgressManager, createMultiStepProgress } from '@/progress';

export const generateCommand = new Command('generate')
  .alias('gen')
  .description('从 OpenAPI/Swagger 定义生成 API 请求函数和类型')
  .option('-c, --config <path>', '配置文件路径', 'api-power.config.ts')
  .option('-w, --watch', '监视更改并自动重新生成', false)
  .action(async (options) => {
    const progressManager = getProgressManager();

    try {
      if (options.watch) {
        // Watch 模式的特殊处理
        progressManager.info('启动监视模式...');

        // 初始生成使用完整进度显示
        const progress = createMultiStepProgress({
          title: 'API Tool 监视模式初始化',
          steps: [
            { title: '加载配置文件', status: 'pending' },
            { title: '初始化代码生成', status: 'pending' },
            { title: '启动文件监视', status: 'pending' },
          ],
        });

        try {
          progress.startStep(0);
          const configPath = join(process.cwd(), options.config);
          progress.completeCurrentStep('配置文件加载完成');

          progress.startStep(1);
          await generateCode(options.config);
          progress.completeCurrentStep('初始代码生成完成');

          progress.startStep(2);

          // 监视配置文件更改
          watch(configPath, async () => {
            progressManager.info('检测到配置文件更改，开始重新生成...');

            // Watch 模式下使用简化的进度提示
            const watchSpinner = progressManager.createSpinner('正在重新生成代码...');

            try {
              await generateCode(options.config);
              watchSpinner?.complete('代码重新生成完成');
              progressManager.success('配置更新已应用，继续监视文件更改...');
            } catch (error) {
              watchSpinner?.fail(error instanceof Error ? error.message : String(error));
              progressManager.error('重新生成失败，请检查配置文件');
            }
          });

          progress.completeCurrentStep('文件监视已启动');
          progress.complete('监视模式已启动，正在监控配置文件更改...');

          // 显示 Watch 模式提示
          progressManager.info('🔍 监视模式运行中...');
          progressManager.info(`   监控文件: ${configPath}`);
          progressManager.info('   按 Ctrl+C 退出监视模式');
        } catch (error) {
          progress.fail(error instanceof Error ? error : new Error(String(error)));
          throw error;
        }
      } else {
        // 单次生成模式
        const progress = createMultiStepProgress({
          title: 'API Tool 代码生成',
          steps: [
            { title: '初始化生成环境', status: 'pending' },
            { title: '执行代码生成', status: 'pending' },
            { title: '完成生成任务', status: 'pending' },
          ],
        });

        try {
          progress.startStep(0);
          progress.completeCurrentStep('环境初始化完成');

          progress.startStep(1);
          await generateCode(options.config);
          progress.completeCurrentStep('代码生成完成');

          progress.startStep(2);
          progress.completeCurrentStep('生成任务完成');

          progress.complete('所有任务已完成！');
        } catch (error) {
          progress.fail(error instanceof Error ? error : new Error(String(error)));
          throw error;
        }
      }
    } catch (error: any) {
      progressManager.error(`代码生成失败: ${error.message}`);

      // 确保清理所有进度显示
      progressManager.stopAll();

      process.exit(1);
    }
  });

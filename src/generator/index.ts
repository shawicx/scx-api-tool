/**
 * @description 代码生成器主模块
 */

import { fetchData } from '../clients';
import { loadConfig } from '../config/loader';
import { processOpenApiData } from '../processors/openapi';
import { ApiConfig } from '../types';
import { generateFiles } from './codegen';
import { getProgressManager, createMultiStepProgress } from '../utils/progress';
import { getHookManager } from '../utils/hooks';

/**
 * @description 生成代码主入口
 * 从配置文件加载配置并执行完整的代码生成流程
 * @param configPath 配置文件路径
 *
 * @example
 * ```typescript
 * await generateCode('./api-power.config.ts');
 * // 执行完整的代码生成流程：
 * // 1. 加载配置
 * // 2. 获取 API 数据
 * // 3. 处理数据结构
 * // 4. 生成代码文件
 * ```
 */
export async function generateCode(configPath: string): Promise<void> {
  // 添加调试信息
  const startTime = Date.now();
  const progressManager = getProgressManager();

  try {
    progressManager.info('使用配置开始代码生成', configPath);

    // 加载配置
    const config: ApiConfig = await loadConfig(configPath);

    // 处理配置
    await processConfig(config);

    const duration = Date.now() - startTime;
    progressManager.success(`代码生成成功完成！(耗时: ${duration}ms)`);
  } catch (error: any) {
    progressManager.error('代码生成失败:', error.message);
    throw error;
  }
}

async function processConfig(config: ApiConfig): Promise<void> {
  const progressManager = getProgressManager();
  const progress = createMultiStepProgress({
    title: '处理配置和生成代码',
    steps: [
      { title: '配置验证', status: 'pending' },
      { title: '获取 API 数据', status: 'pending' },
      { title: '处理数据结构', status: 'pending' },
      { title: '生成代码文件', status: 'pending' },
    ],
  });

  try {
    // 步骤 1: 配置验证
    progress.startStep(0);
    if (process.env.DEBUG) {
      progressManager.info(
        `处理配置: serverUrl = ${config.serverUrl}, serverType = ${config.serverType}`,
      );
    }
    progress.completeCurrentStep('配置验证完成');

    // 调用 beforeGenerate 钩子
    await getHookManager().executeHook(config.hooks?.beforeGenerate);

    // 步骤 2: 获取 API 数据
    progress.startStep(1);
    const rawData = await fetchData(config);
    if (process.env.DEBUG) {
      progressManager.info('从 API 源获取原始数据成功');
    }
    progress.completeCurrentStep('API 数据获取完成');

    // 步骤 3: 处理数据结构
    progress.startStep(2);
    const processedData = processOpenApiData(rawData, config);

    // 显示处理统计
    const stats = {
      interfaces: processedData.interfaces.length,
      types: processedData.types.length,
      categories: processedData.categories.length,
    };

    if (process.env.DEBUG) {
      progressManager.info(`处理后的数据计数: ${JSON.stringify(stats)}`);
    }

    progressManager.info(
      `数据处理完成: ${stats.interfaces} 个接口, ${stats.types} 个类型, ${stats.categories} 个分类`,
    );
    progress.completeCurrentStep(`数据处理完成 (${stats.interfaces} 接口, ${stats.types} 类型)`);

    // 步骤 4: 生成代码文件
    progress.startStep(3);
    await generateFiles(processedData, config);
    progress.completeCurrentStep('代码文件生成完成');

    progress.complete('所有处理步骤完成');

    // 调用 afterGenerate 钩子
    await getHookManager().executeHook(config.hooks?.afterGenerate);
    progressManager.info(`输出目录: ${config.outputDir}`);
  } catch (error: any) {
    progress.failCurrentStep(error instanceof Error ? error : new Error(error.message));
    progressManager.error('处理配置失败:', error.message);
    throw error;
  }
}

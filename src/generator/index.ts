/**
 * @description 代码生成器主模块
 */

import { fetchData } from '../clients';
import { loadConfig } from '../config/loader';
import { processOpenApiData } from '../processors/openapi';
import { OpenApiDocument } from '../types';
import type { ApiConfig } from '../types';
import { generateFiles } from './codegen';
import { getProgressManager } from '../utils/progress';
import { getHookManager } from '../utils/hooks';
import { logger } from '@/utils/logger';

/**
 * @description 生成代码主入口
 * 从配置文件加载多服务配置，并发拉取各服务数据，串行生成代码文件
 * @param configPath 配置文件路径
 *
 * @example
 * ```typescript
 * await generateCode('./api-power.config.ts');
 * // 执行完整的代码生成流程：
 * // 1. 加载配置（返回 ApiConfig[]，每个元素为一个服务）
 * // 2. 并发获取各服务 API 数据
 * // 3. 逐服务处理数据结构并生成代码文件（串行，避免目录清理竞争）
 * ```
 */
export async function generateCode(configPath: string): Promise<void> {
  const startTime = Date.now();
  const progressManager = getProgressManager();

  try {
    progressManager.info('使用配置开始代码生成', configPath);

    // 加载配置（多服务，返回 ApiConfig[]）
    const configs: ApiConfig[] = await loadConfig(configPath);

    progressManager.info(`检测到 ${configs.length} 个服务`);

    // 调用 beforeGenerate 钩子（整体一次，取首个服务的 hooks）
    await getHookManager().executeHook(configs[0]?.hooks?.beforeGenerate);

    // 阶段 1：并发获取各服务 API 数据
    progressManager.info('并发获取各服务 API 数据...');
    const fetched: Array<{ config: ApiConfig; rawData: OpenApiDocument }> = await Promise.all(
      configs.map(async (config) => {
        logger.debug(
          `获取服务数据: serverUrl = ${config.serverUrl}, serverType = ${config.serverType}`,
        );
        const rawData = await fetchData(config);
        logger.debug('从 API 源获取原始数据成功');
        return { config, rawData };
      }),
    );

    // 阶段 2：串行处理数据结构并生成代码文件（避免各服务 cleanOutputDir 相互竞争）
    for (let i = 0; i < fetched.length; i++) {
      const { config, rawData } = fetched[i];
      progressManager.info(`处理服务 (${i + 1}/${fetched.length}): ${config.source}`);
      await processService(config, rawData);
    }

    // 调用 afterGenerate 钩子（整体一次）
    await getHookManager().executeHook(configs[0]?.hooks?.afterGenerate);

    const duration = Date.now() - startTime;
    progressManager.success(`代码生成成功完成！(共 ${configs.length} 个服务，耗时: ${duration}ms)`);
  } catch (error: any) {
    progressManager.error('代码生成失败:', error.message);
    throw error;
  }
}

/**
 * @description 处理单个服务：数据结构处理 + 代码文件生成
 * @param config 单服务运行时配置
 * @param rawData 已获取的 OpenAPI 原始数据
 */
async function processService(config: ApiConfig, rawData: OpenApiDocument): Promise<void> {
  const progressManager = getProgressManager();

  try {
    // 处理数据结构
    const processedData = processOpenApiData(rawData, config);

    const stats = {
      interfaces: processedData.interfaces.length,
      types: processedData.types.length,
      categories: processedData.categories.length,
    };

    logger.debug(`处理后的数据计数: ${JSON.stringify(stats)}`);

    progressManager.info(
      `数据处理完成: ${stats.interfaces} 个接口, ${stats.types} 个类型, ${stats.categories} 个分类`,
    );

    // 生成代码文件
    await generateFiles(processedData, config);

    progressManager.info(`输出目录: ${config.outputDir}`);
  } catch (error: any) {
    progressManager.error(`处理服务失败: ${config.source}`, error.message);
    throw error;
  }
}

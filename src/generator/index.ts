/**
 * @description 代码生成器主模块
 */

import { fetchData } from '../clients';
import { loadConfig } from '../config/loader';
import { processOpenApiData } from '../processors/openapi';
import type { ApiConfig, OpenApiDocument } from '../types';
import { generateFiles } from './codegen';
import { getProgressManager } from '../utils/progress';
import { getHookManager } from '../utils/hooks';
import { logger } from '@/utils/logger';

/** 单服务数据获取结果（失败隔离：单个服务失败不中断其他服务） */
type FetchResult =
  | { ok: true; config: ApiConfig; rawData: OpenApiDocument }
  | { ok: false; config: ApiConfig; error: unknown };

/**
 * @description 生成代码主入口
 * 从配置文件加载多服务配置，并发拉取各服务数据，串行生成代码文件。
 * 单个服务数据获取失败不会中断其他服务：失败服务被跳过并逐个报告，
 * 成功服务正常完成生成，最后以聚合错误退出（保证 CI 非零码）。
 *
 * 生命周期钩子语义（与 beforeWriteFile/afterWriteFile 一致，按服务执行）：
 * - 顶层公共 hooks 被每个服务继承，随各服务的生成各执行一次；
 * - 服务级 hooks 覆盖公共值，仅在该服务生成前后执行；
 * - 获取失败的服务未进入生成阶段，其 beforeGenerate/afterGenerate 均不执行。
 *
 * @param configPath 配置文件路径
 *
 * @example
 * ```typescript
 * await generateCode('./api-power.config.ts');
 * // 执行完整的代码生成流程：
 * // 1. 加载配置（返回 ApiConfig[]，每个元素为一个服务）
 * // 2. 并发获取各服务 API 数据（单服务失败不影响其他服务）
 * // 3. 逐服务执行 beforeGenerate → 处理数据并生成代码 → afterGenerate（串行，避免目录清理竞争）
 * // 4. 若存在失败服务，在成功服务生成完毕后抛出聚合错误
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

    // 阶段 1：并发获取各服务 API 数据（失败隔离，单服务失败不中断其他服务）
    progressManager.info('并发获取各服务 API 数据...');
    const results: FetchResult[] = await Promise.all(
      configs.map(async (config): Promise<FetchResult> => {
        try {
          logger.debug(
            `获取服务数据: serverUrl = ${config.serverUrl}, serverType = ${config.serverType}`,
          );
          const rawData = await fetchData(config);
          logger.debug('从 API 源获取原始数据成功');
          return { ok: true, config, rawData };
        } catch (error) {
          return { ok: false, config, error };
        }
      }),
    );

    const fetched = results.filter((r) => r.ok === true) as Array<
      Extract<FetchResult, { ok: true }>
    >;
    const failures = results.filter((r) => r.ok === false) as Array<
      Extract<FetchResult, { ok: false }>
    >;

    for (const { config, error } of failures) {
      const reason = error instanceof Error ? error.message : String(error);
      progressManager.error(`服务获取失败，已跳过: ${config.source}`, reason);
      // 明确标识旧产物风险：失败服务的输出目录不会清理/更新，
      // 其中的旧产物可能已过期，避免开发人员静默沿用
      progressManager.warn(
        `服务 ${config.source} 的输出目录 ${config.outputDir} 保留旧产物（本次未更新），内容可能已过期，请勿在未确认前沿用`,
      );
    }

    // 阶段 2：串行处理数据结构并生成代码文件（避免各服务 cleanOutputDir 相互竞争）；
    // 生命周期钩子按服务执行（公共 hooks 被各服务继承，服务级 hooks 仅自身执行）
    const hookManager = getHookManager();
    for (let i = 0; i < fetched.length; i++) {
      const { config, rawData } = fetched[i];
      progressManager.info(`处理服务 (${i + 1}/${fetched.length}): ${config.source}`);
      await hookManager.executeHook(config.hooks?.beforeGenerate);
      await processService(config, rawData);
      await hookManager.executeHook(config.hooks?.afterGenerate);
    }

    const duration = Date.now() - startTime;

    if (failures.length > 0) {
      // 成功的服务已生成完毕；聚合失败信息并抛错，保证进程以非零码退出
      const summary = failures
        .map(({ config, error }) => {
          const reason = error instanceof Error ? error.message : String(error);
          return `${config.source}（${reason}）`;
        })
        .join('；');
      throw new Error(
        `部分服务获取失败（成功 ${fetched.length}/${configs.length} 个，耗时 ${duration}ms）: ${summary}。` +
          `失败服务的输出目录保留了未更新的旧产物，内容可能已过期，请勿沿用`,
      );
    }

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

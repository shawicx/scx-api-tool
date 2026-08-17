/**
 * @description 诊断命令（dry-run 模式）
 * 加载配置、获取 API 定义、处理数据并打印诊断报告，但不生成任何文件
 *
 * 与 generate 命令的区别：debug 命令在「处理数据」阶段后停止，
 * 绝不调用 generateFiles，因此不会清空或写入输出目录
 */

import { Command } from 'commander';
import { loadConfig } from '@/config/loader';
import { fetchData } from '@/clients';
import { processOpenApiData } from '@/processors/openapi';
import { handleError } from '@/errors';
import { logger, setDebugEnabled } from '@/utils/logger';

/** 诊断报告中展示的摘要条目数量上限 */
const SUMMARY_LIMIT = 5;

export const debugCommand = new Command('debug')
  .description('诊断模式：检查 API 定义而不生成代码')
  .option('-c, --config <path>', '配置文件路径', 'api-power.config.ts')
  .option('-v, --verbose', '显示详细的错误信息和堆栈跟踪', true)
  .action(async (options) => {
    // 启用 debug 级别日志（运行时开关，不依赖 process.env.DEBUG 的导入时固化）
    setDebugEnabled(true);
    const { verbose = true } = options;

    try {
      // 步骤 1: 加载配置（多服务）
      const configs = await loadConfig(options.config);
      logger.info(`检测到 ${configs.length} 个服务`);

      // 逐服务诊断
      for (let idx = 0; idx < configs.length; idx++) {
        const config = configs[idx];
        logger.info(`\n========== 服务 (${idx + 1}/${configs.length}) ==========`);
        logger.info(`服务器: ${config.serverUrl} (${config.serverType})`);
        logger.info(`输出目录: ${config.outputDir}（dry-run 模式，不写入文件）`);

        // 步骤 2: 获取 API 数据
        const rawData = await fetchData(config);
        logger.info('API 数据获取成功');

        // 步骤 3: 处理数据结构（到此为止，不进入文件生成阶段）
        const processedData = processOpenApiData(rawData, config);

        // 打印诊断报告
        logger.success(`接口数: ${processedData.interfaces.length}`);
        logger.success(`类型数: ${processedData.types.length}`);
        logger.success(`分类数: ${processedData.categories.length}`);

        // 接口摘要
        if (processedData.interfaces.length > 0) {
          logger.info(`--- 接口摘要（前 ${SUMMARY_LIMIT} 个）---`);
          processedData.interfaces.slice(0, SUMMARY_LIMIT).forEach((iface) => {
            logger.info(`  ${iface.method.toUpperCase()} ${iface.path}`);
          });
        }

        // 类型摘要
        if (processedData.types.length > 0) {
          logger.info(`--- 类型摘要（前 ${SUMMARY_LIMIT} 个）---`);
          processedData.types.slice(0, SUMMARY_LIMIT).forEach((type) => {
            const suffix =
              type.originalName && type.originalName !== type.name
                ? ` (原: ${type.originalName})`
                : '';
            logger.info(`  ${type.name}${suffix}`);
          });
        }

        // 分类摘要
        if (processedData.categories.length > 0) {
          logger.info(`--- 分类（共 ${processedData.categories.length} 个）---`);
          processedData.categories.slice(0, SUMMARY_LIMIT).forEach((cat) => {
            logger.info(`  ${cat.name}${cat.description ? ` - ${cat.description}` : ''}`);
          });
        }
      }

      logger.success('\n诊断完成，未写入任何文件');
    } catch (error: unknown) {
      handleError(error, verbose);
    }
  });

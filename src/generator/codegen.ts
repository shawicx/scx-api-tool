/**
 * @description 代码生成协调器
 */

import consola from 'consola';
import { ProcessedApiData } from '../processors/openapi';
import { ApiConfig } from '../types';
import { generateInterfaceFiles, generateRequestFile, generateTypeFiles } from './fileGenerator';

export async function generateFiles(
  processedData: ProcessedApiData,
  config: ApiConfig,
): Promise<void> {
  // 如果启用，则记录调试信息
  if (process.env.DEBUG) {
    consola.debug('正在生成文件...');
    consola.debug('生成模式:', {
      typesOnly: config.typesOnly,
      apiOnly: config.apiOnly,
      target: config.target,
    });
  }

  try {
    // 根据 typesOnly 和 apiOnly 配置决定生成哪些文件
    if (config.apiOnly) {
      // apiOnly 模式：只生成接口文件
      consola.info('API Only 模式：只生成接口文件');
      await generateInterfaceFiles(processedData, config);
    } else if (config.typesOnly) {
      // typesOnly 模式：只生成类型文件
      consola.info('Types Only 模式：只生成类型文件');
      await generateTypeFiles(processedData, config);
    } else {
      // 默认模式：生成所有文件
      await generateRequestFile(config);
      await generateInterfaceFiles(processedData, config);
      await generateTypeFiles(processedData, config);
    }

    // 文件生成成功后，由上层 generateCode 输出成功消息
  } catch (error: any) {
    consola.error('生成文件失败:', error.message);
    throw error;
  }
}

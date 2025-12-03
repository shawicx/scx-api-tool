import consola from 'consola';
import { fetchData } from '../clients';
import { loadConfig } from '../config/loader';
import { processOpenApiData } from '../processors/openapi';
import { ApiConfig } from '../types';
import { generateFiles } from './codegen';

export async function generateCode(configPath: string): Promise<void> {
  try {
    consola.info('使用配置开始代码生成', configPath);
    // 加载配置
    const config: ApiConfig = await loadConfig(configPath);

    // 处理配置
    await processConfig(config);

    consola.success('代码生成成功完成！');
  } catch (error: any) {
    consola.error('代码生成失败:', error.message);
    throw error;
  }
}

async function processConfig(config: ApiConfig): Promise<void> {
  // 如果启用，则记录调试信息
  if (process.env.DEBUG) {
    consola.debug('处理配置:', JSON.stringify(config, null, 2));
  }

  try {
    // 从 API 源获取数据
    const rawData = await fetchData(config);

    if (process.env.DEBUG) {
      consola.debug('从 API 源获取原始数据', rawData);
    }

    // 处理 OpenAPI 数据
    const processedData = processOpenApiData(rawData, config);

    // 如果启用，则记录调试信息
    if (process.env.DEBUG) {
      consola.debug('处理后的数据计数:', {
        interfaces: processedData.interfaces.length,
        types: processedData.types.length,
        categories: processedData.categories.length,
      });
    }

    // 生成文件
    await generateFiles(processedData, config);

    consola.info(`使用 serverType 处理项目: ${config.serverType}`);
    consola.info(`输出目录: ${config.outputDir}`);
  } catch (error: any) {
    consola.error('处理配置失败:', error.message);
    throw error;
  }
}

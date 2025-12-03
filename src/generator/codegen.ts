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
  }

  try {
    // 如果不存在，则创建请求函数文件
    await generateRequestFile(config);

    // 生成接口文件
    await generateInterfaceFiles(processedData, config);

    // 生成类型文件
    await generateTypeFiles(processedData, config);

    consola.success('文件生成成功！');
  } catch (error: any) {
    consola.error('生成文件失败:', error.message);
    throw error;
  }
}

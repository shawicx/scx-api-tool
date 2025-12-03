import { existsSync } from 'fs';
import { resolve } from 'path';
import { pathToFileURL } from 'url';

export async function loadConfig(configPath: string): Promise<any> {
  const absolutePath = resolve(configPath);

  if (!existsSync(absolutePath)) {
    throw new Error(`Configuration file not found: ${absolutePath}`);
  }

  try {
    // 为 ESM 兼容性将文件路径转换为文件 URL
    const fileUrl = pathToFileURL(absolutePath).href;

    // 动态导入配置
    const configModule = await import(fileUrl);

    // 处理默认导出和命名导出
    const config = configModule.default || configModule;

    return config;
  } catch (error: any) {
    throw new Error(`从 ${absolutePath} 加载配置失败: ${error.message}`);
  }
}

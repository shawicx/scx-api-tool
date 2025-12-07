/**
 * @description 配置文件加载器
 */

import { existsSync } from 'fs';
import { resolve } from 'path';
import { pathToFileURL } from 'url';
import { ApiConfig, defineConfig } from '../types';

/**
 * 合并默认配置和用户配置
 */
function mergeWithDefaults(userConfig: Partial<ApiConfig>): ApiConfig {
  // 使用 defineConfig 函数来合并默认配置
  return defineConfig(userConfig as ApiConfig);
}

export async function loadConfig(configPath: string): Promise<ApiConfig> {
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
    const userConfig = configModule.default || configModule;

    // 合并默认配置和用户配置
    const finalConfig = mergeWithDefaults(userConfig);

    return finalConfig;
  } catch (error: any) {
    throw new Error(`从 ${absolutePath} 加载配置失败: ${error.message}`);
  }
}

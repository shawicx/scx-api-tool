/**
 * @description 配置文件加载器
 */

import { existsSync } from 'fs';
import { resolve } from 'path';
import { pathToFileURL } from 'url';
import type { ApiConfig } from '@/types';
import { defineConfig } from '@/utils/config';
import { validateConfiguration } from '@/validation';
import { ErrorFactory } from '@/errors';

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
    throw ErrorFactory.configNotFound(absolutePath);
  }

  try {
    // 为 ESM 兼容性将文件路径转换为文件 URL
    const fileUrl = pathToFileURL(absolutePath).href;

    // 动态导入配置
    const configModule = await import(fileUrl);

    // 处理默认导出和命名导出
    const userConfig = configModule.default || configModule;

    // 验证配置
    validateConfiguration(userConfig);

    // 合并默认配置和用户配置
    const finalConfig = mergeWithDefaults(userConfig);

    return finalConfig;
  } catch (error: any) {
    // 如果是我们自定义的错误，直接抛出
    if (error.code && error.code.startsWith('E1')) {
      throw error;
    }
    // 否则包装为配置解析错误
    throw ErrorFactory.configParseError(absolutePath, error);
  }
}

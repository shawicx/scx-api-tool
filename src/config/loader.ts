/**
 * @description 配置文件加载器
 */

import { existsSync } from 'fs';
import { resolve } from 'path';
import { pathToFileURL } from 'url';
import type { ApiConfig, UserConfig } from '@/types';
import { defineConfig } from '@/utils/config';
import { validateConfiguration } from '@/validation';
import { ErrorFactory } from '@/errors';

/**
 * 检查配置是否已经被 defineConfig 处理过
 */
function isProcessedConfig(config: any): config is ApiConfig {
  // 检查是否有所有必需的 ApiConfig 属性
  return (
    config &&
    typeof config === 'object' &&
    'serverUrl' in config &&
    'serverType' in config &&
    'source' in config &&
    'token' in config &&
    'generateApi' in config &&
    'generateTypes' in config &&
    'typesFormat' in config
  );
}

/**
 * 合并默认配置和用户配置
 */
function mergeWithDefaults(userConfig: Partial<ApiConfig>): ApiConfig {
  // 如果配置已经被 defineConfig 处理过，直接返回
  if (isProcessedConfig(userConfig)) {
    return userConfig as ApiConfig;
  }

  // 否则使用 defineConfig 函数来合并默认配置
  return defineConfig(userConfig as unknown as UserConfig);
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

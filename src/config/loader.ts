/**
 * @description 配置文件加载器
 * 支持配置缓存以提高性能
 */

import { existsSync } from 'fs';
import { resolve } from 'path';
import { pathToFileURL } from 'url';
import type { ApiConfig, UserConfig } from '@/types';
import { defineConfig } from '@/utils/config';
import { logger } from '@/utils/logger';
import { validateConfiguration, ConfigValidationError } from '@/validation';
import { ErrorFactory, BaseError } from '@/errors';

/**
 * @description 配置缓存条目
 */
interface ConfigCacheEntry {
  /** 配置对象 */
  config: ApiConfig;
  /** 缓存时间戳 */
  timestamp: number;
}

/**
 * @description 配置缓存管理器
 */
class ConfigCacheManager {
  private cache = new Map<string, ConfigCacheEntry>();
  private readonly defaultTTL = 5000; // 5秒缓存

  /**
   * 获取缓存的配置
   * @param configPath 配置文件路径
   * @param ttl 缓存有效期（毫秒）
   * @returns 缓存的配置或 null
   */
  get(configPath: string, ttl: number = this.defaultTTL): ApiConfig | null {
    const entry = this.cache.get(configPath);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > ttl) {
      // 缓存过期，删除
      this.cache.delete(configPath);
      return null;
    }

    return entry.config;
  }

  /**
   * 设置配置缓存
   * @param configPath 配置文件路径
   * @param config 配置对象
   */
  set(configPath: string, config: ApiConfig): void {
    this.cache.set(configPath, {
      config,
      timestamp: Date.now(),
    });
  }

  /**
   * 清除指定配置的缓存
   * @param configPath 配置文件路径
   */
  delete(configPath: string): void {
    this.cache.delete(configPath);
  }

  /**
   * 清除所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存大小
   */
  get size(): number {
    return this.cache.size;
  }
}

// 全局配置缓存实例
const configCache = new ConfigCacheManager();

/**
 * 检查配置是否已经被 defineConfig 处理过
 */
function isProcessedConfig(config: unknown): config is ApiConfig {
  // 检查是否有所有必需的 ApiConfig 属性
  return (config &&
    typeof config === 'object' &&
    'serverUrl' in config &&
    'serverType' in config &&
    'source' in config &&
    'token' in config &&
    'generateApi' in config &&
    'generateTypes' in config &&
    'typesFormat' in config) as boolean;
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

/**
 * @description 加载配置文件的内部实现
 * @param absolutePath 配置文件的绝对路径
 * @returns 完整的配置对象
 * @throws {BaseError} 如果配置文件不存在或解析失败
 */
async function loadConfigImpl(absolutePath: string): Promise<ApiConfig> {
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
}

/**
 * @description 加载配置文件
 * 支持配置缓存以提高重复加载的性能
 * @param configPath 配置文件路径
 * @param useCache 是否使用缓存（默认 true）
 * @param cacheTTL 缓存有效期（毫秒，默认 5000ms）
 * @returns 完整的配置对象
 * @throws {BaseError} 如果配置文件不存在或解析失败
 *
 * @example
 * ```typescript
 * // 首次加载，会读取并解析文件
 * const config1 = await loadConfig('./api-power.config.ts');
 *
 * // 5秒内再次加载，会使用缓存
 * const config2 = await loadConfig('./api-power.config.ts');
 *
 * // 强制重新加载，不使用缓存
 * const config3 = await loadConfig('./api-power.config.ts', false);
 * ```
 */
export async function loadConfig(
  configPath: string,
  useCache = true,
  cacheTTL = 5000,
): Promise<ApiConfig> {
  const absolutePath = resolve(configPath);

  if (!existsSync(absolutePath)) {
    throw ErrorFactory.configNotFound(absolutePath);
  }

  // 如果启用缓存，尝试从缓存获取
  if (useCache) {
    const cached = configCache.get(absolutePath, cacheTTL);
    if (cached) {
      logger.debug(`[ConfigCache] 使用缓存的配置: ${absolutePath}`);
      return cached;
    }
  }

  try {
    // 加载配置
    const config = await loadConfigImpl(absolutePath);

    // 如果启用缓存，将配置存入缓存
    if (useCache) {
      configCache.set(absolutePath, config);
      logger.debug(`[ConfigCache] 配置已缓存: ${absolutePath}`);
    }

    return config;
  } catch (error: unknown) {
    // 如果是我们自定义的错误，直接抛出
    if (error instanceof BaseError || error instanceof ConfigValidationError) {
      throw error;
    }
    // 否则包装为配置解析错误
    throw ErrorFactory.configParseError(
      absolutePath,
      error instanceof Error ? error : new Error(String(error)),
    );
  }
}

/**
 * @description 清除配置缓存
 * @param configPath 配置文件路径（可选，不提供则清除所有缓存）
 *
 * @example
 * ```typescript
 * // 清除特定配置的缓存
 * clearConfigCache('./api-power.config.ts');
 *
 * // 清除所有缓存
 * clearConfigCache();
 * ```
 */
export function clearConfigCache(configPath?: string): void {
  if (configPath) {
    const absolutePath = resolve(configPath);
    configCache.delete(absolutePath);
    logger.debug(`[ConfigCache] 已清除缓存: ${absolutePath}`);
  } else {
    configCache.clear();
    logger.debug('[ConfigCache] 已清除所有缓存');
  }
}

/**
 * @description 获取缓存统计信息
 * @returns 缓存大小
 */
export function getCacheStats(): { size: number } {
  return {
    size: configCache.size,
  };
}

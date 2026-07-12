/**
 * @description 客户端主模块
 * 负责与不同类型的 API 服务器通信
 * 支持插件化客户端架构
 */

import type { ApiConfig, OpenApiDocument } from '@/types';
import { clientRegistry } from './base/registry';
import { createSwaggerClient } from './implementations/SwaggerClient';
import { createApifoxClient } from './implementations/ApifoxClient';
import type { SwaggerClient } from './implementations/SwaggerClient';
import type { ApifoxClient } from './implementations/ApifoxClient';
import { redactConfig } from '@/utils/redact';
import { logger } from '@/utils/logger';

// ==================== 注册默认客户端 ====================

// 注册 Swagger 客户端（优先级 10，作为默认）
clientRegistry.register('swagger', createSwaggerClient, 10);

// 注册 Apifox 客户端（优先级 5）
clientRegistry.register('apifox', createApifoxClient, 5);

// ==================== 公共 API ====================

/**
 * @description 根据服务器类型获取 API 数据
 * 自动识别服务器类型并调用相应的数据获取函数
 * @param config API 配置
 * @returns OpenAPI 数据对象
 * @throws {Error} 如果服务器类型不支持或请求失败
 *
 * @example
 * ```typescript
 * const data = await fetchData(config);
 * // 根据配置自动选择：
 * // - ApifoxClient 如果 serverType === 'apifox'
 * // - SwaggerClient 如果 serverType === 'swagger'
 * // - 或根据 URL 模式自动识别
 * ```
 */
export async function fetchData(config: ApiConfig): Promise<OpenApiDocument> {
  logger.debug('正在使用配置获取数据:', redactConfig(config));

  try {
    // 使用客户端注册器自动选择合适的客户端
    const client = clientRegistry.autoSelectClient(config);
    const result = await client.fetch(config);

    logger.debug(`数据获取成功，来源: ${result.sourceType}`);

    return result.data;
  } catch (error: unknown) {
    // 确保错误信息清晰
    if (error instanceof Error && error.message) {
      logger.error('获取数据失败:', error.message);
    }
    throw error;
  }
}

/**
 * @description 根据服务器类型获取 API 数据（旧版 API，向后兼容）
 * @deprecated 使用 fetchData 替代
 * @param config API 配置
 * @returns OpenAPI 数据对象
 */
export async function fetchSwaggerData(config: ApiConfig): Promise<OpenApiDocument> {
  const client = clientRegistry.getClient<SwaggerClient>('swagger');
  const result = await client.fetch(config);
  return result.data;
}

/**
 * @description 从 Apifox 获取数据（旧版 API，向后兼容）
 * @deprecated 使用 fetchData 替代
 * @param config API 配置
 * @returns OpenAPI 数据对象
 */
export async function fetchApifoxData(config: ApiConfig): Promise<OpenApiDocument> {
  const client = clientRegistry.getClient<ApifoxClient>('apifox');
  const result = await client.fetch(config);
  return result.data;
}

// ==================== 导出类型和注册器 ====================

// 导出基础模块
export * from './base';

// 导出实现
export * from './implementations';

// 导出注册器（允许外部注册自定义客户端）
export { clientRegistry };

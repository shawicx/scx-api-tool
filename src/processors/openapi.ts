/**
 * @description OpenAPI 数据处理模块
 * 处理 OpenAPI 格式的数据，提取接口、类型和类别信息
 */

import type { ApiConfig } from '@/types';
import type { ApiCategory, ApiInterface, ApiTypeDefinition, OpenApiDocument } from '@/types';
import { sanitizeTypeName } from '@/naming';
import { logger } from '@/utils/logger';

export interface ProcessedApiData {
  interfaces: ApiInterface[];
  types: ApiTypeDefinition[];
  categories: ApiCategory[];
}

export { groupInterfacesByTag, extractUsedTypeNames } from './common';

/**
 * @description 处理 OpenAPI 数据
 * 从 OpenAPI 格式的数据中提取接口、类型和类别信息
 * @param data OpenAPI 原始数据
 * @param config API 配置
 * @returns 处理后的 API 数据
 *
 * @example
 * ```typescript
 * const processedData = processOpenApiData(rawData, config);
 * // processedData = {
 * //   interfaces: [{ path: '/user', method: 'get', operation: {...} }],
 * //   types: [{ name: 'User', schema: {...} }],
 * //   categories: [{ name: '用户管理', description: '...' }]
 * // }
 * ```
 */
export function processOpenApiData(data: OpenApiDocument, config: ApiConfig): ProcessedApiData {
  // 记录调试信息
  if (typeof data === 'object' && data !== null) {
    logger.debug('数据键:', Object.keys(data));
    // 记录第一个路径条目用于调试
    if (data.paths) {
      const firstPath = Object.keys(data.paths)[0];
      const firstMethod = Object.keys(data.paths[firstPath])[0];
      logger.debug('第一个路径条目:', firstPath, firstMethod);
      logger.debug('第一个操作键:', Object.keys(data.paths[firstPath][firstMethod]));
    }

    // 记录标签信息
    if (data.tags) {
      logger.debug('标签:', data.tags);
    }
  }

  const interfaces: ApiInterface[] = [];
  const types: ApiTypeDefinition[] = [];
  const categories: ApiCategory[] = [];

  // 处理包括 Apifox 在内的所有服务器类型的标准 OpenAPI 格式
  // 防御畸形输入：仅处理 paths 为对象的情况
  if (data.paths && typeof data.paths === 'object') {
    for (const [path, methods] of Object.entries(data.paths)) {
      // 应用路径前缀转换（字面字符串匹配，避免正则注入风险）
      const normalizedPath =
        config.pathPrefix && path.startsWith(config.pathPrefix)
          ? path.slice(config.pathPrefix.length)
          : path;

      // 防御畸形输入：仅处理 methods 为对象的情况
      if (!methods || typeof methods !== 'object') continue;

      for (const [method, operation] of Object.entries(methods)) {
        // 防御畸形输入：跳过非对象的 operation
        if (!operation || typeof operation !== 'object') continue;

        // 数据已由各客户端的 normalize() 标准化为统一 OpenAPI 格式
        // 记录前几个操作用于调试
        if (interfaces.length < 3) {
          logger.debug(`操作 ${path} ${method}:`, Object.keys(operation));
        }

        interfaces.push({
          path: normalizedPath,
          method,
          operation,
        });
      }
    }
  }

  // 提取 components/schemas 用于类型定义
  if (data.components?.schemas && typeof data.components.schemas === 'object') {
    for (const [name, schema] of Object.entries(data.components.schemas)) {
      types.push({
        name: sanitizeTypeName(name),
        originalName: name, // 保留原始名称用于调试
        schema,
      });
    }
  }

  // 处理类别提取 — Apifox 和 Swagger 均使用标签作为类别
  if (Array.isArray(data.tags)) {
    categories.push(...data.tags);
  }

  logger.debug(
    `Processed ${interfaces.length} interfaces, ${types.length} types, ${categories.length} categories`,
  );

  return {
    interfaces,
    types,
    categories,
  };
}

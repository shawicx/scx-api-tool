/**
 * @description Swagger/OpenAPI 客户端实现
 */

import { BaseClient, ClientMetadata, ClientOptions } from '../base/BaseClient';
import { httpFetch } from '../base/httpRequest';
import { mapRequestError } from '../base/requestErrorMapper';
import type { ApiConfig, OpenApiDocument } from '@/types';
import { logger } from '@/utils/logger';
import { makeRequestWithProgress } from '@/utils/progress';
import { ErrorFactory } from '@/errors';
import { FetchError } from '@/errors/errorClasses';

/**
 * @description Swagger/OpenAPI 客户端
 * 从 Swagger 或 OpenAPI 端点获取 API 定义
 */
export class SwaggerClient extends BaseClient {
  constructor(options: ClientOptions = {}) {
    super(options);
  }

  /**
   * @description 获取客户端元信息
   */
  getMetadata(): ClientMetadata {
    return {
      type: 'swagger',
      name: 'Swagger/OpenAPI',
      version: '1.0.0',
      urlPatterns: [
        // Swagger 2.0
        /swagger\.json$/,
        /swagger\.yaml$/,
        /api-docs\//,
        /api\/docs/,
        /swagger\/.*\.json$/,
        // OpenAPI 3.0
        /openapi\.json$/,
        /openapi\.yaml$/,
        /openapi\/.*\.json$/,
        // 通用模式
        /\/api\/.*/,
      ],
    };
  }

  /**
   * @description 检查配置是否适用于此客户端
   */
  supports(config: ApiConfig): boolean {
    // 首先检查 serverType
    if (config.serverType === 'swagger') {
      return true;
    }

    // 然后检查 URL 模式
    const metadata = this.getMetadata();
    return this.matchUrlPatterns(config.source, metadata.urlPatterns);
  }

  /**
   * @description 标准化原始数据
   * Swagger/OpenAPI 端点返回的已是标准格式，原样返回即可
   * @param rawData 原始获取数据
   * @returns 标准 OpenApiDocument
   */
  protected normalize(rawData: unknown): OpenApiDocument {
    return rawData as OpenApiDocument;
  }

  /**
   * @description 内部数据获取实现
   */
  protected async fetchDataInternal(config: ApiConfig): Promise<unknown> {
    const apiUrl = config.source;
    const timeout = this.options.timeout || 30000;

    // 如果启用，则记录调试信息
    logger.debug(`[SwaggerClient] 正在从以下位置获取数据: ${apiUrl}`);

    try {
      // 使用带进度显示的请求
      const response = await makeRequestWithProgress(
        async (onProgress) =>
          this.withTimeout(
            httpFetch({
              url: apiUrl,
              method: 'GET',
              timeout,
              onProgress: (loaded, total) => onProgress?.(loaded, total),
            }),
            timeout,
          ),
        {
          url: apiUrl,
          method: 'GET',
          timeout,
        },
      );

      if (response.statusCode !== 200) {
        throw ErrorFactory.fetchFailed(apiUrl, response.statusCode);
      }

      // 与历史 axios 行为对齐：优先按 JSON 解析，失败时（如 YAML 源）原样返回字符串
      try {
        return JSON.parse(response.body);
      } catch {
        return response.body;
      }
    } catch (error: unknown) {
      // 已是本项目的 FetchError，原样透传；其余映射为可读的 FetchError
      if (error instanceof FetchError) {
        throw error;
      }
      throw mapRequestError(error, apiUrl, timeout);
    }
  }
}

// 导出工厂函数
export function createSwaggerClient(options?: ClientOptions): SwaggerClient {
  return new SwaggerClient(options);
}

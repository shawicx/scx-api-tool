/**
 * @description Swagger/OpenAPI 客户端实现
 */

import axios from 'axios';
import consola from 'consola';
import { BaseClient, ClientMetadata, ClientOptions } from '../base/BaseClient';
import type { ApiConfig } from '@/types';
import { makeRequestWithProgress } from '@/utils/progress';

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
   * @description 内部数据获取实现
   */
  protected async fetchDataInternal(config: ApiConfig): Promise<any> {
    const apiUrl = config.source;

    // 如果启用，则记录调试信息
    if (process.env.DEBUG) {
      consola.debug(`[SwaggerClient] 正在从以下位置获取数据: ${apiUrl}`);
    }

    // 使用带进度显示的请求
    const response = await makeRequestWithProgress(
      async (onProgress) => {
        const requestPromise = axios.get(apiUrl, {
          onDownloadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              onProgress(progressEvent.loaded, progressEvent.total);
            }
          },
        });

        // 应用超时
        return this.withTimeout(requestPromise, this.options.timeout || 30000);
      },
      {
        url: apiUrl,
        method: 'GET',
      },
    );

    return response.data;
  }
}

// 导出工厂函数
export function createSwaggerClient(options?: ClientOptions): SwaggerClient {
  return new SwaggerClient(options);
}

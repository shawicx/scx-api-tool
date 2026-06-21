/**
 * @description Apifox 客户端实现
 */

import axios from 'axios';
import consola from 'consola';
import { BaseClient, ClientMetadata, ClientOptions } from '../base/BaseClient';
import type { ApiConfig } from '@/types';
import { makeRequestWithProgress } from '@/utils/progress';
import { redactHeaders } from '@/utils/redact';
import { ErrorFactory } from '@/errors';

/**
 * @description Apifox 客户端
 * 从 Apifox 平台获取 OpenAPI 定义
 */
export class ApifoxClient extends BaseClient {
  constructor(options: ClientOptions = {}) {
    super(options);
  }

  /**
   * @description 获取客户端元信息
   */
  getMetadata(): ClientMetadata {
    return {
      type: 'apifox',
      name: 'Apifox',
      version: '1.0.0',
      urlPatterns: [
        // Apifox URL 模式
        /apifox\.com/,
        /app\.apifox\.com/,
        /apifox\.cn/,
        /app\.apifox\.cn/,
      ],
    };
  }

  /**
   * @description 检查配置是否适用于此客户端
   */
  supports(config: ApiConfig): boolean {
    // 首先检查 serverType
    if (config.serverType === 'apifox') {
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
    const realUrl = `${config.source}?locale=zh-CN`;
    const { token } = config;

    if (!token) {
      throw new Error('Apifox 需要 token，但未提供');
    }

    const headers = {
      'X-Apifox-Api-Version': '2024-03-28',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Connection: 'keep-alive',
    };

    const requestBody = {
      scope: {
        type: 'ALL',
        excludedByTags: ['pet'],
      },
      options: {
        includeApifoxExtensionProperties: false,
        addFoldersToTags: false,
      },
      oasVersion: '3.1',
      exportFormat: 'JSON',
    };

    // 如果启用，则记录调试信息（Authorization 头已脱敏）
    if (process.env.DEBUG) {
      consola.debug('[ApifoxClient] API 请求配置:', redactHeaders(headers), requestBody, realUrl);
    }

    try {
      // 使用带进度显示的请求
      const response = await makeRequestWithProgress(
        async (onProgress) => {
          const requestPromise = axios.post(realUrl, requestBody, {
            headers,
            timeout: this.options.timeout || 30000,
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
          url: realUrl,
          method: 'POST',
          timeout: this.options.timeout || 30000,
        },
      );

      if (response.status !== 200) {
        throw ErrorFactory.fetchFailed(realUrl, response.status);
      }

      // 检查响应内容类型
      const contentType = (response.headers?.['content-type'] as string) || '';
      if (!contentType.includes('application/json')) {
        throw ErrorFactory.invalidResponse(realUrl, 'application/json');
      }

      if (process.env.DEBUG) {
        consola.debug('[ApifoxClient] 响应状态:', response.status);
        consola.debug('[ApifoxClient] 响应数据类型:', typeof response.data);
      }

      return response.data;
    } catch (error: any) {
      // 如果是我们自定义的错误，直接抛出
      if (error.code && error.code.startsWith('E2')) {
        throw error;
      }

      // 处理 Axios 错误
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;

        // 401 未授权
        if (statusCode === 401) {
          throw ErrorFactory.unauthorized(realUrl);
        }

        // 超时
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          throw ErrorFactory.timeout(realUrl, this.options.timeout || 30000);
        }

        // 网络错误
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
          throw ErrorFactory.fetchFailed(realUrl, statusCode, error);
        }

        // 其他 Axios 错误
        throw ErrorFactory.fetchFailed(realUrl, statusCode, error);
      }

      // 重新抛出其他错误
      throw error;
    }
  }
}

// 导出工厂函数
export function createApifoxClient(options?: ClientOptions): ApifoxClient {
  return new ApifoxClient(options);
}

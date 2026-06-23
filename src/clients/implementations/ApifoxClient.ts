/**
 * @description Apifox 客户端实现
 */

import axios from 'axios';
import consola from 'consola';
import { BaseClient, ClientMetadata, ClientOptions } from '../base/BaseClient';
import type {
  ApiConfig,
  OpenApiDocument,
  OpenApiOperation,
  OpenApiRequestBody,
  OpenApiResponse,
} from '@/types';
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
   * @description 将 Apifox 原始数据标准化为标准 OpenAPI 文档
   * Apifox 导出的参数/响应/请求体字段不完整，需补全默认值并统一为标准格式。
   * @param rawData Apifox 原始数据
   * @returns 标准 OpenApiDocument
   */
  protected normalize(rawData: unknown): OpenApiDocument {
    const data = rawData as OpenApiDocument;
    if (!data.paths || typeof data.paths !== 'object') return data;

    const normalizedPaths: OpenApiDocument['paths'] = {};
    for (const [path, methods] of Object.entries(data.paths)) {
      normalizedPaths[path] = {};
      // 防御畸形输入：跳过非对象的 methods
      if (!methods || typeof methods !== 'object') continue;
      for (const [method, operation] of Object.entries(methods)) {
        // 防御畸形输入：跳过非对象的 operation
        if (!operation || typeof operation !== 'object') {
          normalizedPaths[path][method] = operation as any;
          continue;
        }
        const originalOp = operation as Record<string, unknown>;
        const normalizedOp: OpenApiOperation = {
          ...originalOp,
          parameters: ApifoxClient.normalizeParameters(originalOp.parameters),
          responses: ApifoxClient.normalizeResponses(originalOp.responses),
          requestBody: ApifoxClient.normalizeRequestBody(originalOp.requestBody),
        };
        normalizedPaths[path][method] = normalizedOp;
      }
    }

    return { ...data, paths: normalizedPaths };
  }

  /**
   * @description 标准化 Apifox 参数（补全缺失的默认字段）
   */
  private static normalizeParameters(parameters: unknown): OpenApiOperation['parameters'] {
    if (!parameters || !Array.isArray(parameters)) return [];
    return parameters.map((param: any) => ({
      name: param.name,
      in: param.in || 'query',
      description: param.description || '',
      required: !!param.required,
      type: param.type || 'string',
    }));
  }

  /**
   * @description 标准化 Apifox 响应（统一为 content 包装格式）
   */
  private static normalizeResponses(responses: unknown): Record<string, OpenApiResponse> {
    if (!responses) return {};
    const processed: Record<string, OpenApiResponse> = {};
    for (const [statusCode, response] of Object.entries(responses as Record<string, any>)) {
      processed[statusCode] = {
        description: response.description || '',
        content: {
          'application/json': {
            schema: response.content?.['application/json']?.schema || response.schema || {},
          },
        },
      };
    }
    return processed;
  }

  /**
   * @description 标准化 Apifox 请求体（保留所有 content-type，无 content 时用 schema 兜底）
   */
  private static normalizeRequestBody(requestBody: any): OpenApiRequestBody | undefined {
    if (!requestBody) return undefined;

    if (requestBody.content && typeof requestBody.content === 'object') {
      const content: Record<string, any> = {};
      for (const [mediaType, mediaTypeObj] of Object.entries(requestBody.content)) {
        content[mediaType] = {
          schema: (mediaTypeObj as any).schema || {},
        };
      }
      return {
        description: requestBody.description,
        required: requestBody.required,
        content,
      };
    }

    return {
      content: {
        'application/json': {
          schema: requestBody.schema || {},
        },
      },
    };
  }

  /**
   * @description 内部数据获取实现
   */
  protected async fetchDataInternal(config: ApiConfig): Promise<unknown> {
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

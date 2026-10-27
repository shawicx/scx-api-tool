/**
 * @description Apifox 客户端实现
 */

import { BaseClient, ClientMetadata, ClientOptions } from '../base/BaseClient';
import { httpFetch } from '../base/httpRequest';
import { mapRequestError } from '../base/requestErrorMapper';
import type {
  ApiConfig,
  OpenApiDocument,
  OpenApiOperation,
  OpenApiRequestBody,
  OpenApiResponse,
} from '@/types';
import { logger } from '@/utils/logger';
import { isHttpMethod } from '@/utils/httpMethod';
import { makeRequestWithProgress } from '@/utils/progress';
import { redactHeaders } from '@/utils/redact';
import { ErrorFactory } from '@/errors';
import { FetchError } from '@/errors/errorClasses';

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
        // 白名单过滤：Path Item 的 $ref/summary/servers/parameters 等非操作字段
        // 原样透传，不参与操作级归一化（避免公共参数数组被误改写为操作对象）
        if (!isHttpMethod(method)) {
          normalizedPaths[path][method] = operation;
          continue;
        }
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
   *
   * 已有 content 时原样保留全部 content-type（如 SSE 的 text/event-stream，
   * 强改 application/json 会丢失其 schema，导致生成端退化 data: unknown）；
   * 无 content 的旧格式才兜底为 application/json + 顶层 schema。
   */
  private static normalizeResponses(responses: unknown): Record<string, OpenApiResponse> {
    if (!responses) return {};
    const processed: Record<string, OpenApiResponse> = {};
    for (const [statusCode, response] of Object.entries(responses as Record<string, any>)) {
      processed[statusCode] = {
        description: response.description || '',
        content:
          response.content && typeof response.content === 'object'
            ? response.content
            : { 'application/json': { schema: response.schema || {} } },
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

    const timeout = this.options.timeout || 30000;

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
    logger.debug('[ApifoxClient] API 请求配置:', redactHeaders(headers), requestBody, realUrl);

    try {
      // 使用带进度显示的请求
      const response = await makeRequestWithProgress(
        async (onProgress) =>
          this.withTimeout(
            httpFetch({
              url: realUrl,
              method: 'POST',
              headers,
              json: requestBody,
              timeout,
              onProgress: (loaded, total) => onProgress?.(loaded, total),
            }),
            timeout,
          ),
        {
          url: realUrl,
          method: 'POST',
          timeout,
        },
      );

      logger.debug('[ApifoxClient] 响应状态:', response.statusCode);

      if (response.statusCode !== 200) {
        throw ErrorFactory.fetchFailed(realUrl, response.statusCode);
      }

      // 检查响应内容类型
      const contentTypeHeader = response.headers['content-type'];
      const contentType =
        (Array.isArray(contentTypeHeader) ? contentTypeHeader[0] : contentTypeHeader) || '';
      if (!contentType.includes('application/json')) {
        throw ErrorFactory.invalidResponse(realUrl, 'application/json');
      }

      try {
        return JSON.parse(response.body);
      } catch {
        throw ErrorFactory.invalidResponse(realUrl, 'application/json');
      }
    } catch (error: unknown) {
      // 已是本项目的 FetchError（含 unauthorized/invalidResponse 等），原样透传
      if (error instanceof FetchError) {
        throw error;
      }

      // 其余错误（got 超时/HTTP 状态码/网络层错误等）映射为可读的 FetchError
      throw mapRequestError(error, realUrl, timeout);
    }
  }
}

// 导出工厂函数
export function createApifoxClient(options?: ClientOptions): ApifoxClient {
  return new ApifoxClient(options);
}

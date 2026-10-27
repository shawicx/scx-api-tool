/**
 * @description 基于 got 的 HTTP 请求封装
 * 供数据获取客户端（Apifox/Swagger）统一使用：
 * 禁用 got 内置重试（重试由 BaseClient.executeWithRetry 统一控制）、
 * 应用单次请求超时、透传下载进度，返回文本响应由上层自行解析
 */

import got from 'got';

/** HTTP 请求选项（客户端层使用的通用子集） */
export interface HttpFetchOptions {
  /** 请求地址 */
  url: string;
  /** HTTP 方法 */
  method: 'GET' | 'POST';
  /** 请求头 */
  headers?: Record<string, string>;
  /** JSON 请求体（由 got 自动序列化并设置 Content-Type） */
  json?: unknown;
  /** 单次请求超时（毫秒） */
  timeout: number;
  /** 下载进度回调（loaded 已传输字节，total 总字节） */
  onProgress?: (loaded: number, total: number) => void;
}

/** HTTP 响应（body 为文本，是否/如何解析由调用方决定） */
export interface HttpFetchResponse {
  /** HTTP 状态码 */
  statusCode: number;
  /** 响应头 */
  headers: Record<string, string | string[] | undefined>;
  /** 响应体文本 */
  body: string;
}

/**
 * @description 发送 HTTP 请求并返回文本响应
 * got 内置重试已显式禁用（limit: 0），失败重试统一由 BaseClient.executeWithRetry
 * 处理，避免两层重试叠加导致总耗时不可控
 * @param options 请求选项
 * @returns 文本形式的 HTTP 响应
 *
 * @example
 * ```typescript
 * const res = await httpFetch({
 *   url: 'https://example.com/openapi.json',
 *   method: 'GET',
 *   timeout: 30000,
 * });
 * if (res.statusCode === 200) JSON.parse(res.body);
 * ```
 */
export async function httpFetch(options: HttpFetchOptions): Promise<HttpFetchResponse> {
  const request = got(options.url, {
    method: options.method,
    headers: options.headers,
    json: options.json,
    timeout: { request: options.timeout },
    retry: { limit: 0 },
  }).on('downloadProgress', (progress) => {
    if (options.onProgress && progress.total) {
      options.onProgress(progress.transferred, progress.total);
    }
  });

  const response = await request;

  return {
    statusCode: response.statusCode,
    headers: response.headers,
    body: response.body,
  };
}

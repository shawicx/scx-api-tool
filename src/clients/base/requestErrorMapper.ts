/**
 * @description 请求错误映射模块
 * 将 got 抛出的底层错误转换为携带解决方案的可读 FetchError，
 * 并提供单行可读原因描述（供重试日志与最终错误信息列出失败明细）
 */

import { HTTPError, ParseError, RequestError, TimeoutError } from 'got';
import { ErrorFactory } from '@/errors';
import { ErrorCode } from '@/errors/errorCodes';
import { FetchError } from '@/errors/errorClasses';

/**
 * 不可重试的错误码：token 失效/响应格式错误属于确定性失败，
 * 重试不会成功，检测到后应立即终止重试
 */
const NON_RETRYABLE_CODES = new Set<ErrorCode>([
  ErrorCode.FETCH_UNAUTHORIZED,
  ErrorCode.FETCH_INVALID_RESPONSE,
]);

/** 网络层错误码 → 可读描述 */
const NETWORK_ERROR_MESSAGES: Record<string, string> = {
  ENOTFOUND: '域名解析失败（ENOTFOUND），请检查数据源 URL 的域名是否正确',
  EAI_AGAIN: '域名解析暂时失败（EAI_AGAIN），可能是网络波动或 DNS 服务不可用',
  ECONNREFUSED: '连接被拒绝（ECONNREFUSED），目标服务未启动或端口未开放',
  ECONNRESET: '连接被重置（ECONNRESET），网络中断或服务端主动断开连接',
  ETIMEDOUT: '连接超时（ETIMEDOUT），网络链路不通或服务端无响应',
  ENETUNREACH: '网络不可达（ENETUNREACH），请检查本机网络或代理设置',
  EACCES: '无权限访问网络（EACCES），请检查本机网络或代理设置',
  EPROTO: 'TLS 协议错误（EPROTO），请确认 URL 协议（http/https）是否正确',
  CERT_HAS_EXPIRED: '服务端 HTTPS 证书已过期',
  DEPTH_ZERO_SELF_SIGNED_CERT: '服务端使用自签名证书，浏览器类工具可访问但 Node 校验失败',
  UNABLE_TO_VERIFY_LEAF_SIGNATURE: '无法验证服务端证书签名（自签名或证书链不完整）',
};

/** HTTP 错误响应体中常见的错误信息字段（Apifox 等平台返回 JSON 错误结构） */
const HTTP_BODY_MESSAGE_KEYS = ['message', 'error', 'errors'] as const;

/**
 * @description 从 HTTP 错误响应体中提取可读错误信息
 * 仅识别 JSON 结构的 message/error/errors 字段，避免把整段 HTML 错误页拼进错误消息
 * @param error got 抛出的 HTTPError
 * @returns 提取到的错误信息（截断至 200 字符），无法提取时返回空字符串
 */
function extractHttpErrorDetail(error: HTTPError): string {
  const body = error.response?.body;
  if (typeof body === 'string' && body.length > 0) {
    try {
      const parsed = JSON.parse(body) as Record<string, unknown>;
      for (const key of HTTP_BODY_MESSAGE_KEYS) {
        const value = parsed[key];
        if (typeof value === 'string' && value.trim()) return value.slice(0, 200);
        if (Array.isArray(value) && typeof value[0] === 'string' && value[0].trim()) {
          return value[0].slice(0, 200);
        }
      }
    } catch {
      // 非 JSON 响应体（HTML 错误页等），不提取内容
    }
  }
  return error.response?.statusMessage ? error.response.statusMessage : '';
}

/**
 * @description 生成请求失败的单行可读原因描述
 * 用于重试过程中的日志输出与最终错误信息中的失败明细列表
 * @param error 请求过程中抛出的错误
 * @param timeoutMs 单次请求超时（毫秒），用于超时描述
 * @returns 单行可读原因文本
 *
 * @example
 * ```typescript
 * describeRequestError(new TimeoutError('Timeout awaiting request'), 30000);
 * // => '请求超时（超过 30000ms）'
 * ```
 */
export function describeRequestError(error: unknown, timeoutMs?: number): string {
  // 已是本项目的 FetchError：若底层是 got 错误（HTTP 状态码/网络错误码等），
  // 按底层错误分类生成描述；若底层是普通错误则透出其消息；否则消息本身可读
  if (error instanceof FetchError) {
    const underlying = error.originalError;
    if (
      underlying instanceof TimeoutError ||
      underlying instanceof ParseError ||
      underlying instanceof HTTPError ||
      underlying instanceof RequestError
    ) {
      return describeRequestError(underlying, timeoutMs);
    }
    const message = underlying?.message?.trim();
    return message && message.length > 0 ? message : error.message;
  }

  if (error instanceof TimeoutError) {
    return timeoutMs ? `请求超时（超过 ${timeoutMs}ms）` : '请求超时';
  }

  // ParseError 继承自 RequestError，需先于 RequestError 判断
  if (error instanceof ParseError) {
    return `响应解析失败：${error.message}`;
  }

  if (error instanceof HTTPError) {
    const status = error.response?.statusCode ?? 'unknown';
    const detail = extractHttpErrorDetail(error);
    return `服务端返回错误状态 ${status}${detail ? `（${detail}）` : ''}`;
  }

  if (error instanceof RequestError) {
    const code = error.code ?? '';
    const readable = code ? NETWORK_ERROR_MESSAGES[code] : undefined;
    if (readable) return readable;
    return `网络请求错误${code ? `（${code}）` : ''}：${error.message}`;
  }

  if (error instanceof Error) {
    // withTimeout 的超时竞争错误（"操作超时（30000ms）"）归类为超时
    if (error.message.includes('操作超时')) {
      return timeoutMs ? `请求超时（超过 ${timeoutMs}ms）` : '请求超时';
    }
    return error.message;
  }

  return String(error);
}

/**
 * @description 判断错误是否值得重试
 * token 失效（E2002）/响应格式错误（E2004）属于确定性失败，重试不会成功
 * @param error 请求过程中抛出的错误
 * @returns 是否可重试
 *
 * @example
 * ```typescript
 * isRetryableError(ErrorFactory.unauthorized(url)); // => false
 * isRetryableError(new Error('网络中断')); // => true
 * ```
 */
export function isRetryableError(error: unknown): boolean {
  return !(error instanceof FetchError && NON_RETRYABLE_CODES.has(error.code));
}

/**
 * @description 将请求错误映射为携带错误码与解决方案的 FetchError
 * 覆盖超时、HTTP 状态码（401/403/其他）、网络层错误码、响应解析失败等分支；
 * 已是 FetchError 的错误原样返回，避免重复包装
 * @param error 请求过程中抛出的错误
 * @param url 请求的 URL
 * @param timeoutMs 单次请求超时（毫秒）
 * @returns 可读的 FetchError（或原样返回的 FetchError）
 *
 * @example
 * ```typescript
 * try {
 *   await httpFetch({ url, method: 'GET', timeout: 30000 });
 * } catch (error) {
 *   throw mapRequestError(error, url, 30000); // FetchError（E2003）
 * }
 * ```
 */
export function mapRequestError(error: unknown, url: string, timeoutMs = 30000): Error {
  // 已是本项目的 FetchError，直接透传
  if (error instanceof FetchError) return error;

  if (error instanceof TimeoutError) {
    return ErrorFactory.timeout(url, timeoutMs);
  }

  if (error instanceof HTTPError) {
    const statusCode = error.response?.statusCode;
    if (statusCode === 401 || statusCode === 403) {
      return ErrorFactory.unauthorized(url);
    }
    return ErrorFactory.fetchFailed(url, statusCode, error);
  }

  if (error instanceof RequestError) {
    return ErrorFactory.networkError(url, error);
  }

  if (error instanceof Error) {
    // withTimeout 的超时竞争错误归类为超时
    if (error.message.includes('操作超时')) {
      return ErrorFactory.timeout(url, timeoutMs);
    }
    return ErrorFactory.fetchFailed(url, undefined, error);
  }

  return ErrorFactory.fetchFailed(url, undefined, new Error(String(error)));
}

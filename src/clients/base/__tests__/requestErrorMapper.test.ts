/**
 * @description 请求错误映射模块单元测试
 * 验证 got 底层错误 → 可读 FetchError 的映射、单行原因描述与重试判断
 */

import { describe, it, expect } from 'vitest';
import { HTTPError, ParseError, RequestError, TimeoutError } from 'got';
import { describeRequestError, isRetryableError, mapRequestError } from '../requestErrorMapper';
import { ErrorFactory } from '@/errors';
import { ErrorCode } from '@/errors/errorCodes';
import { FetchError } from '@/errors/errorClasses';

const TEST_URL = 'https://api.apifox.com/v1/projects/123/export-openapi';

/**
 * @description 构造带完整内部结构的 got HTTPError
 * got 的 HTTPError 构造函数会读取 response.request.options（method/url），
 * 且 error.response 依赖 request 对象上的 response 回链
 * @param statusCode HTTP 状态码
 * @param body 响应体
 * @returns HTTPError 实例
 */
function createHttpError(statusCode: number, body = ''): HTTPError {
  const fakeResponse = {
    statusCode,
    statusMessage: 'Error',
    body,
    headers: {},
  } as any;
  fakeResponse.request = {
    _onResponse: true,
    response: fakeResponse,
    options: { method: 'POST', url: new URL(TEST_URL) },
  };
  return new HTTPError(fakeResponse);
}

describe('describeRequestError', () => {
  it('超时错误应输出带超时毫秒数的可读描述', () => {
    const error = new TimeoutError('request', {} as any);
    expect(describeRequestError(error, 30000)).toBe('请求超时（超过 30000ms）');
  });

  it('常见网络错误码应映射为可读描述', () => {
    const notFound = new RequestError('getaddrinfo ENOTFOUND', { code: 'ENOTFOUND' } as any);
    expect(describeRequestError(notFound)).toContain('域名解析失败');

    const refused = new RequestError('connect ECONNREFUSED', { code: 'ECONNREFUSED' } as any);
    expect(describeRequestError(refused)).toContain('连接被拒绝');
  });

  it('未知网络错误码应保留原始 code 与消息', () => {
    const error = new RequestError('something odd', { code: 'EWHATEVER' } as any);
    expect(describeRequestError(error)).toContain('EWHATEVER');
    expect(describeRequestError(error)).toContain('something odd');
  });

  it('HTTPError 应包含状态码与响应体中的错误信息', () => {
    const error = createHttpError(429, JSON.stringify({ message: 'Too many requests' }));
    expect(describeRequestError(error)).toContain('429');
    expect(describeRequestError(error)).toContain('Too many requests');
  });

  it('FetchError 应优先透出底层 originalError 的消息', () => {
    const fetchError = ErrorFactory.fetchFailed(TEST_URL, 500, new Error('socket hang up'));
    expect(describeRequestError(fetchError)).toBe('socket hang up');
  });

  it('FetchError 包装 got HTTPError 时应按底层状态码分类描述', () => {
    const wrapped = ErrorFactory.fetchFailed(
      TEST_URL,
      404,
      createHttpError(404, JSON.stringify({ message: 'project not found' })),
    );
    expect(describeRequestError(wrapped)).toContain('404');
    expect(describeRequestError(wrapped)).toContain('project not found');
  });

  it('ParseError 应输出解析失败描述', () => {
    const fakeResponse = {
      request: { options: { url: new URL(TEST_URL) } },
    } as any;
    const error = new ParseError(new Error('Unexpected token'), fakeResponse);
    expect(describeRequestError(error)).toContain('响应解析失败');
  });

  it('withTimeout 的竞争错误应归类为超时', () => {
    const error = new Error('操作超时（30000ms）');
    expect(describeRequestError(error, 30000)).toBe('请求超时（超过 30000ms）');
  });
});

describe('isRetryableError', () => {
  it('unauthorized / invalidResponse 属于确定性失败，不可重试', () => {
    expect(isRetryableError(ErrorFactory.unauthorized(TEST_URL))).toBe(false);
    expect(isRetryableError(ErrorFactory.invalidResponse(TEST_URL, 'application/json'))).toBe(
      false,
    );
  });

  it('普通网络错误与其他 FetchError 可重试', () => {
    expect(isRetryableError(new Error('网络中断'))).toBe(true);
    expect(isRetryableError(ErrorFactory.timeout(TEST_URL, 30000))).toBe(true);
    expect(isRetryableError(createHttpError(500))).toBe(true);
  });
});

describe('mapRequestError', () => {
  it('已是 FetchError 时应原样返回', () => {
    const fetchError = ErrorFactory.timeout(TEST_URL, 30000);
    expect(mapRequestError(fetchError, TEST_URL)).toBe(fetchError);
  });

  it('401/403 应映射为 unauthorized（E2002）', () => {
    const unauthorized = mapRequestError(createHttpError(401), TEST_URL) as FetchError;
    expect(unauthorized.code).toBe(ErrorCode.FETCH_UNAUTHORIZED);

    const forbidden = mapRequestError(createHttpError(403), TEST_URL) as FetchError;
    expect(forbidden.code).toBe(ErrorCode.FETCH_UNAUTHORIZED);
  });

  it('其他 HTTP 状态码应映射为 fetchFailed（E2001）并保留状态码', () => {
    const error = mapRequestError(createHttpError(502), TEST_URL) as FetchError;
    expect(error.code).toBe(ErrorCode.FETCH_REQUEST_FAILED);
    expect(error.message).toContain('502');
  });

  it('TimeoutError 应映射为 timeout（E2003）', () => {
    const error = mapRequestError(new TimeoutError('request', {} as any), TEST_URL, 60000);
    expect((error as FetchError).code).toBe(ErrorCode.FETCH_TIMEOUT);
    expect(error.message).toContain('60000');
  });

  it('网络层错误应映射为 networkError（E2005）', () => {
    const networkError = new RequestError('connect ECONNREFUSED', { code: 'ECONNREFUSED' } as any);
    const error = mapRequestError(networkError, TEST_URL) as FetchError;
    expect(error.code).toBe(ErrorCode.FETCH_NETWORK_ERROR);
    expect(error.message).toContain(TEST_URL);
  });
});

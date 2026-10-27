/**
 * @description ApifoxClient 单元测试
 * 从旧版 apifox.ts 测试迁移而来，覆盖数据获取、错误分支（401/超时/网络错误）、
 * 响应 content-type 校验、以及 DEBUG 日志中的 token 脱敏
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HTTPError, TimeoutError, RequestError } from 'got';
import { logger } from '@/utils/logger';
import { ApifoxClient } from '../ApifoxClient';
import { apifoxApiConfig } from '../../../../tests/fixtures/mockData';
import type { OpenApiDocument } from '@/types';
import { FetchError } from '@/errors/errorClasses';
import { ErrorCode } from '@/errors/errorCodes';

/**
 * @description 暴露 protected normalize 以便测试
 */
class TestableApifoxClient extends ApifoxClient {
  publicNormalize(rawData: unknown): OpenApiDocument {
    return this.normalize(rawData);
  }
}

// Mock 统一 logger 模块（抑制日志噪音 + 便于断言 debug 调用）
vi.mock('@/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    success: vi.fn(),
  },
  setDebugEnabled: vi.fn(),
  isDebugEnabled: vi.fn(() => false),
}));

// Mock makeRequestWithProgress（透传内部请求函数）
vi.mock('@/utils/progress', () => ({
  makeRequestWithProgress: vi.fn(async (fn: any) => fn()),
}));

import { makeRequestWithProgress } from '@/utils/progress';
import { ErrorFactory } from '@/errors';

const mockMakeRequestWithProgress = vi.mocked(makeRequestWithProgress);

/**
 * @description 构造带完整内部结构的 got HTTPError
 * got 的 HTTPError 构造函数会读取 response.request.options（method/url），
 * 且 error.response 依赖 request 对象上的 response 回链，直接传扁平对象会崩溃
 * @param statusCode HTTP 状态码
 * @param body 响应体（字符串）
 * @returns 可用于 instanceof 判断的 HTTPError 实例
 */
function createHttpError(statusCode: number, body = ''): HTTPError {
  const fakeResponse = {
    statusCode,
    statusMessage: 'Error',
    body,
    headers: {},
  } as any;
  fakeResponse.request = {
    _onResponse: true, // 通过 got 内部的 isRequest 检查，使 error.response 生效
    response: fakeResponse,
    options: {
      method: 'POST',
      url: new URL('https://api.apifox.com/v1/projects/123456/export-openapi'),
    },
  };
  return new HTTPError(fakeResponse);
}

describe('ApifoxClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('成功获取时应返回响应数据', async () => {
    const mockData = { openapi: '3.1.0', info: { title: 'Apifox API' } };
    mockMakeRequestWithProgress.mockResolvedValueOnce({
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(mockData),
    });

    const client = new TestableApifoxClient({ maxRetries: 0 });
    const result = await client.fetch(apifoxApiConfig);

    expect(result.data).toEqual(mockData);
    expect(mockMakeRequestWithProgress).toHaveBeenCalledTimes(1);
  });

  it('token 缺失时应抛出配置错误', async () => {
    const client = new TestableApifoxClient({ maxRetries: 0 });
    const config = { ...apifoxApiConfig, token: undefined } as any;

    await expect(client.fetch(config)).rejects.toThrow();
  });

  it('响应 content-type 非 json 时应抛出 invalidResponse 错误', async () => {
    mockMakeRequestWithProgress.mockResolvedValueOnce({
      statusCode: 200,
      headers: { 'content-type': 'text/html' },
      body: '<html>not json</html>',
    });

    const client = new TestableApifoxClient({ maxRetries: 0 });
    await expect(client.fetch(apifoxApiConfig)).rejects.toThrow();
  });

  it('响应体不是有效 JSON 时应抛出 invalidResponse 错误', async () => {
    mockMakeRequestWithProgress.mockResolvedValueOnce({
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: '<html>broken</html>',
    });

    const client = new TestableApifoxClient({ maxRetries: 0 });
    await expect(client.fetch(apifoxApiConfig)).rejects.toMatchObject({
      code: ErrorCode.FETCH_INVALID_RESPONSE,
    });
  });

  it('DEBUG 日志中不应包含明文 token（脱敏回归）', async () => {
    const sensitiveConfig = { ...apifoxApiConfig, token: 'sk-secret-token-xxxxx' };
    mockMakeRequestWithProgress.mockResolvedValueOnce({
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ openapi: '3.1.0' }),
    });

    const client = new TestableApifoxClient({ maxRetries: 0 });
    await client.fetch(sensitiveConfig);

    // logger.debug 被调用时，参数中不应包含明文 token（应由 redactHeaders 脱敏）
    const allCalls = (logger.debug as any).mock.calls.map((call: any[]) =>
      call.map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg))).join(' '),
    );
    const combined = allCalls.join('\n');
    expect(combined).not.toContain('sk-secret-token-xxxxx');
  });

  it('401 响应应映射为 unauthorized 错误（E2002）且不重试', async () => {
    mockMakeRequestWithProgress.mockRejectedValue(
      createHttpError(401, JSON.stringify({ message: 'invalid token' })),
    );

    const client = new TestableApifoxClient({ maxRetries: 3, retryDelay: 1 });

    await expect(client.fetch(apifoxApiConfig)).rejects.toMatchObject({
      code: ErrorCode.FETCH_UNAUTHORIZED,
    });
    // token 失效属于确定性失败，不应触发重试
    expect(mockMakeRequestWithProgress).toHaveBeenCalledTimes(1);
  });

  it('超时错误应映射为 timeout 错误（E2003）', async () => {
    mockMakeRequestWithProgress.mockRejectedValue(new TimeoutError('request', {} as any));

    const client = new TestableApifoxClient({ maxRetries: 0 });

    await expect(client.fetch(apifoxApiConfig)).rejects.toMatchObject({
      code: ErrorCode.FETCH_TIMEOUT,
    });
  });

  it('域名解析失败应映射为 networkError 错误（E2005）', async () => {
    mockMakeRequestWithProgress.mockRejectedValue(
      new RequestError('getaddrinfo ENOTFOUND api.apifox.com', { code: 'ENOTFOUND' } as any),
    );

    const client = new TestableApifoxClient({ maxRetries: 0 });

    await expect(client.fetch(apifoxApiConfig)).rejects.toMatchObject({
      code: ErrorCode.FETCH_NETWORK_ERROR,
    });
  });

  it('所有重试均失败时应抛出带失败明细的 FetchError', async () => {
    mockMakeRequestWithProgress.mockRejectedValue(new Error('持续失败'));

    const client = new TestableApifoxClient({ maxRetries: 1, retryDelay: 1 });
    const error: any = await client.fetch(apifoxApiConfig).catch((e) => e);

    // 重试 1 次 + 首次尝试 = 2 次调用
    expect(mockMakeRequestWithProgress).toHaveBeenCalledTimes(2);
    expect(error).toBeInstanceOf(FetchError);
    expect(error.code).toBe(ErrorCode.FETCH_REQUEST_FAILED);
    // 错误消息应列出每次尝试的可读失败原因
    expect(error.message).toContain('失败明细（共尝试 2 次）');
    expect(error.message).toContain('第 1 次尝试: 持续失败');
    expect(error.message).toContain('第 2 次尝试: 持续失败');
  });
});

describe('ApifoxClient.normalize', () => {
  let client: TestableApifoxClient;

  beforeEach(() => {
    client = new TestableApifoxClient({ maxRetries: 0 });
  });

  it('应补全 Apifox 参数的默认字段', () => {
    const apifoxDoc = {
      openapi: '3.0.0',
      info: { title: 'Apifox API', version: '1.0.0' },
      paths: {
        '/users': {
          get: {
            summary: 'Get users',
            tags: ['user'],
            parameters: [
              { name: 'page', type: 'number', in: 'query', required: true },
              { name: 'filter', type: 'string' },
            ],
          },
        },
      },
    };

    const normalized = client.publicNormalize(apifoxDoc);
    const op = normalized.paths!['/users'].get;

    expect(op.parameters).toHaveLength(2);
    expect(op.parameters![0].name).toBe('page');
    expect(op.parameters![0].in).toBe('query');
    expect(op.parameters![0].required).toBe(true);
    expect(op.parameters![0].description).toBe('');
    // 第二个参数缺 in/required，应有默认值
    expect(op.parameters![1].in).toBe('query');
    expect(op.parameters![1].required).toBe(false);
    expect(op.parameters![1].description).toBe('');
  });

  it('应将裸 schema 响应标准化为 content 包装格式', () => {
    const apifoxDoc = {
      openapi: '3.0.0',
      paths: {
        '/users': {
          get: {
            responses: {
              '200': {
                description: 'Success',
                schema: { type: 'array', items: { $ref: '#/components/schemas/User' } },
              },
            },
          },
        },
      },
    };

    const normalized = client.publicNormalize(apifoxDoc);
    const response = normalized.paths!['/users'].get.responses!['200'];

    expect(response.description).toBe('Success');
    expect(response.content!['application/json'].schema).toBeDefined();
  });

  it('应保留已有的 content 字段响应', () => {
    const apifoxDoc = {
      openapi: '3.0.0',
      paths: {
        '/users': {
          get: {
            responses: {
              '200': {
                description: 'Success',
                content: {
                  'application/json': { schema: { $ref: '#/components/schemas/User' } },
                },
              },
            },
          },
        },
      },
    };

    const normalized = client.publicNormalize(apifoxDoc);
    const response = normalized.paths!['/users'].get.responses!['200'];

    expect(response.content!['application/json'].schema).toEqual({
      $ref: '#/components/schemas/User',
    });
  });

  it('应原样保留非 JSON content-type 的响应 schema（如 SSE）', () => {
    const apifoxDoc = {
      openapi: '3.0.0',
      paths: {
        '/ai/chat': {
          post: {
            responses: {
              '200': {
                description: 'SSE 事件流',
                content: {
                  'text/event-stream': { schema: { type: 'string' } },
                },
              },
            },
          },
        },
      },
    };

    const normalized = client.publicNormalize(apifoxDoc);
    const response = normalized.paths!['/ai/chat'].post.responses!['200'];

    // 不强改为 application/json，保留原始 content-type 与 schema
    expect(response.content).toEqual({
      'text/event-stream': { schema: { type: 'string' } },
    });
  });

  it('应处理带 content 的请求体（保留所有 content-type）', () => {
    const apifoxDoc = {
      openapi: '3.0.0',
      paths: {
        '/users': {
          post: {
            requestBody: {
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/CreateUserRequest' } },
              },
            },
          },
        },
      },
    };

    const normalized = client.publicNormalize(apifoxDoc);
    const { requestBody } = normalized.paths!['/users'].post;

    expect(requestBody).toBeDefined();
    expect(requestBody!.content['application/json'].schema).toEqual({
      $ref: '#/components/schemas/CreateUserRequest',
    });
  });

  it('应将裸 schema 请求体包装为 application/json', () => {
    const apifoxDoc = {
      openapi: '3.0.0',
      paths: {
        '/users': {
          post: { requestBody: { schema: { type: 'object' } } },
        },
      },
    };

    const normalized = client.publicNormalize(apifoxDoc);
    const { requestBody } = normalized.paths!['/users'].post;

    expect(requestBody).toBeDefined();
    expect(requestBody!.content['application/json'].schema).toEqual({ type: 'object' });
  });

  it('无请求体时应返回 undefined', () => {
    const apifoxDoc = {
      openapi: '3.0.0',
      paths: { '/users': { get: { summary: 'Get users' } } },
    };

    const normalized = client.publicNormalize(apifoxDoc);
    expect(normalized.paths!['/users'].get.requestBody).toBeUndefined();
  });

  it('null 参数应返回空数组', () => {
    const apifoxDoc = {
      openapi: '3.0.0',
      paths: { '/users': { get: { parameters: null } } },
    };

    const normalized = client.publicNormalize(apifoxDoc);
    expect(normalized.paths!['/users'].get.parameters).toEqual([]);
  });

  it('null 响应应返回空对象', () => {
    const apifoxDoc = {
      openapi: '3.0.0',
      paths: { '/users': { get: { responses: null } } },
    };

    const normalized = client.publicNormalize(apifoxDoc);
    expect(normalized.paths!['/users'].get.responses).toEqual({});
  });

  it('无 paths 的文档应原样返回', () => {
    const doc = { openapi: '3.0.0', info: { title: 'Empty' } };
    const normalized = client.publicNormalize(doc);
    expect(normalized).toEqual(doc);
  });

  it('Path Item 级公共参数应原样透传，不被改写为操作对象', () => {
    const pathLevelParams = [
      { name: 'orderId', in: 'path', required: true, type: 'string' },
      { name: 'traceId', in: 'header', type: 'string' },
    ];
    const apifoxDoc = {
      openapi: '3.0.0',
      paths: {
        '/orders/{orderId}': {
          parameters: pathLevelParams,
          get: {
            summary: '查询订单',
            parameters: [{ name: 'verbose', in: 'query', type: 'boolean' }],
          },
        },
      },
    };

    const normalized = client.publicNormalize(apifoxDoc);
    const pathItem = normalized.paths!['/orders/{orderId}'] as Record<string, any>;

    // 路径级公共参数数组保持原样（不得被补全为 parameters/responses 等操作字段）
    expect(Array.isArray(pathItem.parameters)).toBe(true);
    expect(pathItem.parameters).toEqual(pathLevelParams);
    expect(pathItem.parameters).not.toHaveProperty('responses');

    // 操作字段仍正常归一化
    expect(pathItem.get.parameters).toHaveLength(1);
    expect(pathItem.get.parameters[0].in).toBe('query');
    expect(pathItem.get.parameters[0].description).toBe('');
  });

  it('Path Item 的 $ref/summary/servers 字段应原样透传', () => {
    const apifoxDoc = {
      openapi: '3.0.0',
      paths: {
        '/common': { $ref: '#/components/pathItems/CommonPath' },
        '/users': {
          summary: '用户接口',
          servers: [{ url: 'https://api.example.com' }],
          get: { summary: 'Get users' },
        },
      },
    };

    const normalized = client.publicNormalize(apifoxDoc);

    expect(normalized.paths!['/common']).toEqual({ $ref: '#/components/pathItems/CommonPath' });
    const usersItem = normalized.paths!['/users'] as Record<string, any>;
    expect(usersItem.summary).toBe('用户接口');
    expect(usersItem.servers).toEqual([{ url: 'https://api.example.com' }]);
    // $ref 不应被当作操作归一化（如补全 responses 空对象等）
    expect((normalized.paths!['/common'] as any).responses).toBeUndefined();
  });
});

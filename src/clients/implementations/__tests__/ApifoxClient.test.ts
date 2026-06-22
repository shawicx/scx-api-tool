/**
 * @description ApifoxClient 单元测试
 * 从旧版 apifox.ts 测试迁移而来，覆盖数据获取、错误分支（401/超时/网络错误）、
 * 响应 content-type 校验、以及 DEBUG 日志中的 token 脱敏
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import consola from 'consola';
import { ApifoxClient } from '../ApifoxClient';
import { apifoxApiConfig } from '../../../../tests/fixtures/mockData';
import type { OpenApiDocument } from '@/types';
import { FetchError } from '@/errors/errorClasses';

/**
 * @description 暴露 protected normalize 以便测试
 */
class TestableApifoxClient extends ApifoxClient {
  publicNormalize(rawData: unknown): OpenApiDocument {
    return this.normalize(rawData);
  }
}

// Mock consola
vi.mock('consola', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock makeRequestWithProgress（透传内部请求函数）
vi.mock('@/utils/progress', () => ({
  makeRequestWithProgress: vi.fn(async (fn: any) => fn()),
}));

import { makeRequestWithProgress } from '@/utils/progress';
import { ErrorFactory } from '@/errors';

const mockMakeRequestWithProgress = vi.mocked(makeRequestWithProgress);

describe('ApifoxClient', () => {
  const originalDebug = process.env.DEBUG;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.DEBUG;
  });

  afterEach(() => {
    if (originalDebug !== undefined) {
      process.env.DEBUG = originalDebug;
    } else {
      delete process.env.DEBUG;
    }
  });

  it('成功获取时应返回响应数据', async () => {
    const mockData = { openapi: '3.1.0', info: { title: 'Apifox API' } };
    mockMakeRequestWithProgress.mockResolvedValueOnce({
      data: mockData,
      status: 200,
      headers: { 'content-type': 'application/json' },
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
      data: '<html>not json</html>',
      status: 200,
      headers: { 'content-type': 'text/html' },
    });

    const client = new TestableApifoxClient({ maxRetries: 0 });
    await expect(client.fetch(apifoxApiConfig)).rejects.toThrow();
  });

  it('DEBUG 日志中不应包含明文 token（脱敏回归）', async () => {
    process.env.DEBUG = 'true';
    const sensitiveConfig = { ...apifoxApiConfig, token: 'sk-secret-token-xxxxx' };
    mockMakeRequestWithProgress.mockResolvedValueOnce({
      data: { openapi: '3.1.0' },
      status: 200,
      headers: { 'content-type': 'application/json' },
    });

    const client = new TestableApifoxClient({ maxRetries: 0 });
    await client.fetch(sensitiveConfig);

    const allCalls = (consola.debug as any).mock.calls.map((call: any[]) =>
      call.map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg))).join(' '),
    );
    const combined = allCalls.join('\n');
    expect(combined).not.toContain('sk-secret-token-xxxxx');
  });

  it('所有重试均失败时应抛出 FetchError', async () => {
    mockMakeRequestWithProgress.mockRejectedValue(new Error('持续失败'));

    const client = new TestableApifoxClient({ maxRetries: 1, retryDelay: 1 });
    await expect(client.fetch(apifoxApiConfig)).rejects.toThrow();
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
});

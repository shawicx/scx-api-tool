/**
 * @description clients/index.ts 单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServerType } from '@/types';
import type { ApiConfig } from '@/types';

// Mock logger
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

// Mock 进度工具
vi.mock('@/utils/progress', () => ({
  makeRequestWithProgress: vi.fn((fn) => fn()),
}));

// Mock got 请求封装（客户端层统一经 httpFetch 发请求）
vi.mock('@/clients/base/httpRequest', () => ({
  httpFetch: vi.fn(),
}));

// Mock ErrorFactory
vi.mock('@/errors', () => ({
  ErrorFactory: {
    configInvalid: vi.fn((message: string) => new Error(message)),
    fetchError: vi.fn((message: string) => new Error(message)),
    unauthorized: vi.fn(() => new Error('Unauthorized')),
    timeout: vi.fn(() => new Error('Timeout')),
    fetchFailed: vi.fn((url: string, status?: number) => new Error(`Fetch failed: ${status}`)),
    invalidResponse: vi.fn(() => new Error('Invalid response')),
    networkError: vi.fn(() => new Error('Network error')),
  },
}));

import { fetchData, clientRegistry } from '../index';
import { httpFetch } from '@/clients/base/httpRequest';
import { ErrorFactory } from '@/errors';
import type { ConfigError } from '@/errors';

const mockHttpFetch = vi.mocked(httpFetch);
const mockConfigInvalid = vi.mocked(ErrorFactory.configInvalid);

describe('fetchData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call SwaggerClient for Swagger serverType', async () => {
    const swaggerConfig = {
      serverType: ServerType.Swagger,
      source: 'https://petstore.swagger.io/v2/swagger.json',
      token: '',
    } as ApiConfig;

    const mockResponse = { openapi: '3.0.0', info: { title: 'Swagger Test' } };
    mockHttpFetch.mockResolvedValueOnce({
      statusCode: 200,
      headers: {},
      body: JSON.stringify(mockResponse),
    });

    const result = await fetchData(swaggerConfig);

    expect(result).toEqual(mockResponse);
    expect(mockHttpFetch).toHaveBeenCalledTimes(1);
    expect(mockHttpFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://petstore.swagger.io/v2/swagger.json',
        method: 'GET',
      }),
    );
  });

  it('should call ApifoxClient for Apifox serverType', async () => {
    const apifoxConfig = {
      serverType: ServerType.Apifox,
      source: 'https://api.apifox.com/v1/projects/123/export-openapi',
      token: 'test-token',
    } as ApiConfig;

    const mockResponse = { openapi: '3.1.0', info: { title: 'Test' } };
    mockHttpFetch.mockResolvedValueOnce({
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(mockResponse),
    });

    const result = await fetchData(apifoxConfig);

    expect(result).toEqual(mockResponse);
    expect(mockHttpFetch).toHaveBeenCalledTimes(1);
    expect(mockHttpFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://api.apifox.com/v1/projects/123/export-openapi?locale=zh-CN',
        method: 'POST',
      }),
    );
  });

  it('should auto-detect Swagger client from URL pattern', async () => {
    const config = {
      serverType: undefined as any,
      source: 'https://example.com/api/swagger.json',
      token: '',
    } as ApiConfig;

    const mockResponse = { openapi: '3.0.0', info: { title: 'Auto-detected' } };
    mockHttpFetch.mockResolvedValueOnce({
      statusCode: 200,
      headers: {},
      body: JSON.stringify(mockResponse),
    });

    const result = await fetchData(config);

    expect(result).toEqual(mockResponse);
    expect(mockHttpFetch).toHaveBeenCalledTimes(1);
  });

  it('fetchMaxRetries 配置应透传到客户端（0 表示失败后不重试）', async () => {
    mockHttpFetch.mockRejectedValue(new Error('network down'));

    const config = {
      serverType: ServerType.Swagger,
      source: 'https://example.com/api/swagger.json',
      token: '',
      fetchMaxRetries: 0,
    } as ApiConfig;

    // 本文件 mock 了 ErrorFactory，包装后的错误消息为 mock 文本
    await expect(fetchData(config)).rejects.toThrow('Fetch failed');

    // fetchMaxRetries: 0 → 仅首次尝试，不重试
    expect(mockHttpFetch).toHaveBeenCalledTimes(1);
  });

  it('should throw error for unsupported server type', async () => {
    // mock 工厂返回原生 Error，此处断言为 ConfigError 以匹配真实签名
    const fakeError = new Error('配置不适用于当前配置的客户端') as unknown as ConfigError;
    mockConfigInvalid.mockReturnValue(fakeError);

    // 创建一个不匹配任何客户端的配置
    const unknownConfig = {
      serverType: 'unknown-type',
      source: 'https://unknown-service.com/api',
      token: '',
    } as unknown as ApiConfig;

    // 清除注册的客户端以确保失败
    const originalRegistry = clientRegistry;
    (clientRegistry as any).clear = vi.fn();

    await expect(fetchData(unknownConfig)).rejects.toThrow();

    expect(mockConfigInvalid).toHaveBeenCalled();
  });
});

describe('clientRegistry', () => {
  it('should have at least 2 registered clients', () => {
    const types = clientRegistry.getRegisteredTypes();
    expect(types.length).toBeGreaterThanOrEqual(2);
    expect(types).toContain('swagger');
    expect(types).toContain('apifox');
  });

  it('should provide metadata for all registered clients', () => {
    const metadata = clientRegistry.getAllMetadata();
    expect(metadata.length).toBeGreaterThanOrEqual(2);

    metadata.forEach((meta) => {
      expect(meta).toHaveProperty('type');
      expect(meta).toHaveProperty('name');
      expect(meta).toHaveProperty('version');
      expect(meta).toHaveProperty('urlPatterns');
      expect(Array.isArray(meta.urlPatterns)).toBe(true);
    });
  });
});

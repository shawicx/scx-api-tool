/**
 * @description SwaggerClient 单元测试
 * 从旧版 swagger.ts 测试迁移而来，覆盖数据获取、错误处理、DEBUG 日志
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import consola from 'consola';
import { SwaggerClient } from '../SwaggerClient';
import { minimalApiConfig } from '../../../../tests/fixtures/mockData';

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

const mockMakeRequestWithProgress = vi.mocked(makeRequestWithProgress);

describe('SwaggerClient', () => {
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
    const mockData = { openapi: '3.0.0', info: { title: 'Test API', version: '1.0.0' } };
    mockMakeRequestWithProgress.mockResolvedValueOnce({ data: mockData });

    const client = new SwaggerClient({ maxRetries: 0 });
    const result = await client.fetch(minimalApiConfig);

    expect(result.data).toEqual(mockData);
    expect(mockMakeRequestWithProgress).toHaveBeenCalledTimes(1);
  });

  it('DEBUG 模式应记录获取位置的日志', async () => {
    process.env.DEBUG = 'true';
    const mockData = { openapi: '3.0.0' };
    mockMakeRequestWithProgress.mockResolvedValueOnce({ data: mockData });

    const client = new SwaggerClient({ maxRetries: 0 });
    await client.fetch(minimalApiConfig);

    expect(consola.debug).toHaveBeenCalled();
    const combined = (consola.debug as any).mock.calls.map((c: any[]) => c.join(' ')).join('\n');
    expect(combined).toContain(minimalApiConfig.source);
  });

  it('非 DEBUG 模式不应输出 debug 日志', async () => {
    const mockData = { openapi: '3.0.0' };
    mockMakeRequestWithProgress.mockResolvedValueOnce({ data: mockData });

    const client = new SwaggerClient({ maxRetries: 0 });
    await client.fetch(minimalApiConfig);

    expect(consola.debug).not.toHaveBeenCalled();
  });

  it('获取失败时应抛出错误（而非吞掉）', async () => {
    mockMakeRequestWithProgress.mockRejectedValue(new Error('Network Error'));

    const client = new SwaggerClient({ maxRetries: 0 });
    await expect(client.fetch(minimalApiConfig)).rejects.toThrow();
  });
});

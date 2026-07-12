/**
 * @description SwaggerClient 单元测试
 * 从旧版 swagger.ts 测试迁移而来，覆盖数据获取、错误处理、DEBUG 日志
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from '@/utils/logger';
import { SwaggerClient } from '../SwaggerClient';
import { minimalApiConfig } from '../../../../tests/fixtures/mockData';

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

const mockMakeRequestWithProgress = vi.mocked(makeRequestWithProgress);

describe('SwaggerClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('成功获取时应返回响应数据', async () => {
    const mockData = { openapi: '3.0.0', info: { title: 'Test API', version: '1.0.0' } };
    mockMakeRequestWithProgress.mockResolvedValueOnce({ data: mockData });

    const client = new SwaggerClient({ maxRetries: 0 });
    const result = await client.fetch(minimalApiConfig);

    expect(result.data).toEqual(mockData);
    expect(mockMakeRequestWithProgress).toHaveBeenCalledTimes(1);
  });

  it('应通过 logger.debug 记录获取位置', async () => {
    const mockData = { openapi: '3.0.0' };
    mockMakeRequestWithProgress.mockResolvedValueOnce({ data: mockData });

    const client = new SwaggerClient({ maxRetries: 0 });
    await client.fetch(minimalApiConfig);

    // logger.debug 总是被调用（是否实际输出由 logger 内部 debugEnabled 控制）
    expect(logger.debug).toHaveBeenCalled();
    const combined = (logger.debug as any).mock.calls.map((c: any[]) => c.join(' ')).join('\n');
    expect(combined).toContain(minimalApiConfig.source);
  });

  it('获取失败时应抛出错误（而非吞掉）', async () => {
    mockMakeRequestWithProgress.mockRejectedValue(new Error('Network Error'));

    const client = new SwaggerClient({ maxRetries: 0 });
    await expect(client.fetch(minimalApiConfig)).rejects.toThrow();
  });
});

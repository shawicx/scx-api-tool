/**
 * @description swagger.ts 单元测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import consola from 'consola';
import { fetchSwaggerData } from '../swagger';
import { minimalApiConfig } from '../../../tests/fixtures/mockData';

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

// Mock makeRequestWithProgress
vi.mock('@/utils/progress', () => ({
  makeRequestWithProgress: vi.fn(),
}));

// Import the mocked module after vi.mock
import { makeRequestWithProgress } from '@/utils/progress';

const mockMakeRequestWithProgress = vi.mocked(makeRequestWithProgress);

describe('fetchSwaggerData', () => {
  const originalDebug = process.env.DEBUG;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.DEBUG;
  });

  afterEach(() => {
    // Restore original DEBUG value
    if (originalDebug !== undefined) {
      process.env.DEBUG = originalDebug;
    } else {
      delete process.env.DEBUG;
    }
  });

  it('should return response data on successful fetch', async () => {
    const mockData = { openapi: '3.0.0', info: { title: 'Test API', version: '1.0.0' } };
    mockMakeRequestWithProgress.mockResolvedValue({ data: mockData });

    const result = await fetchSwaggerData(minimalApiConfig);

    expect(result).toEqual(mockData);
    expect(mockMakeRequestWithProgress).toHaveBeenCalledTimes(1);

    // Verify the requestFn argument structure
    const requestFn = mockMakeRequestWithProgress.mock.calls[0][0];
    expect(typeof requestFn).toBe('function');

    // Verify the options argument
    const options = mockMakeRequestWithProgress.mock.calls[0][1];
    expect(options).toEqual({
      url: minimalApiConfig.source,
      method: 'GET',
    });
  });

  it('should throw error when fetch fails', async () => {
    const networkError = new Error('Network Error');
    mockMakeRequestWithProgress.mockRejectedValue(networkError);

    await expect(fetchSwaggerData(minimalApiConfig)).rejects.toThrow('Network Error');

    // Verify consola.error was called with the error message
    expect(consola.error).toHaveBeenCalledWith('从 Swagger 获取数据失败:', 'Network Error');
  });

  it('should log debug info when DEBUG env is set', async () => {
    process.env.DEBUG = 'true';
    const mockData = { openapi: '3.0.0' };
    mockMakeRequestWithProgress.mockResolvedValue({ data: mockData });

    await fetchSwaggerData(minimalApiConfig);

    expect(consola.debug).toHaveBeenCalledWith(
      `正在从以下位置获取 Swagger 数据: ${minimalApiConfig.source}`,
    );
  });

  it('should not log debug info when DEBUG env is not set', async () => {
    const mockData = { openapi: '3.0.0' };
    mockMakeRequestWithProgress.mockResolvedValue({ data: mockData });

    await fetchSwaggerData(minimalApiConfig);

    expect(consola.debug).not.toHaveBeenCalled();
  });
});

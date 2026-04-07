/**
 * @description apifox.ts 单元测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import consola from 'consola';
import { fetchApifoxData } from '../apifox';
import { apifoxApiConfig } from '../../../tests/fixtures/mockData';
import { FetchError } from '@/errors/errorClasses';

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

// Import mocked modules after vi.mock
import { makeRequestWithProgress } from '@/utils/progress';

const mockMakeRequestWithProgress = vi.mocked(makeRequestWithProgress);

describe('fetchApifoxData', () => {
  const originalDebug = process.env.DEBUG;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    delete process.env.DEBUG;
  });

  afterEach(() => {
    if (originalDebug !== undefined) {
      process.env.DEBUG = originalDebug;
    } else {
      delete process.env.DEBUG;
    }
  });

  it('should return response data on successful fetch', async () => {
    const mockData = { openapi: '3.1.0', info: { title: 'Apifox API' } };
    mockMakeRequestWithProgress.mockResolvedValue({
      data: mockData,
      status: 200,
      headers: { 'content-type': 'application/json' },
    });

    const result = await fetchApifoxData(apifoxApiConfig);

    expect(result).toEqual(mockData);
    expect(mockMakeRequestWithProgress).toHaveBeenCalledTimes(1);

    // Verify the options passed to makeRequestWithProgress
    const options = mockMakeRequestWithProgress.mock.calls[0][1];
    expect(options.url).toBe(`${apifoxApiConfig.source}?locale=zh-CN`);
    expect(options.method).toBe('POST');
    expect(options.timeout).toBe(30000);
  });

  it('should throw error when token is missing', async () => {
    const configWithoutToken = { ...apifoxApiConfig, token: '' };

    await expect(fetchApifoxData(configWithoutToken)).rejects.toThrow(
      'Apifox 需要 token，但未提供',
    );
  });

  it('should throw error when token is undefined', async () => {
    const configWithoutToken = { ...apifoxApiConfig, token: undefined };

    await expect(fetchApifoxData(configWithoutToken)).rejects.toThrow(
      'Apifox 需要 token，但未提供',
    );
  });

  it('should throw unauthorized error on 401 response', async () => {
    const axiosError = Object.create(new Error('Request failed with status code 401'));
    axiosError.isAxiosError = true;
    axiosError.response = { status: 401, data: {}, headers: {} };
    axiosError.code = 'ERR_BAD_RESPONSE';

    mockMakeRequestWithProgress.mockRejectedValue(axiosError);

    // Mock axios.isAxiosError to return true for our fake axios error
    vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

    await expect(fetchApifoxData(apifoxApiConfig)).rejects.toThrow();
    await expect(fetchApifoxData(apifoxApiConfig)).rejects.toSatisfy((err: Error) => {
      return err instanceof FetchError && err.message.includes('未授权访问');
    });
  });

  it('should throw timeout error on ECONNABORTED', async () => {
    const axiosError = Object.create(new Error('timeout of 30000ms exceeded'));
    axiosError.isAxiosError = true;
    axiosError.code = 'ECONNABORTED';

    mockMakeRequestWithProgress.mockRejectedValue(axiosError);
    vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

    await expect(fetchApifoxData(apifoxApiConfig)).rejects.toSatisfy((err: Error) => {
      return err instanceof FetchError && err.message.includes('请求超时');
    });
  });

  it('should throw timeout error when message includes timeout', async () => {
    const axiosError = Object.create(new Error('Request timeout'));
    axiosError.isAxiosError = true;
    axiosError.response = undefined;
    axiosError.code = undefined;

    mockMakeRequestWithProgress.mockRejectedValue(axiosError);
    vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

    await expect(fetchApifoxData(apifoxApiConfig)).rejects.toSatisfy((err: Error) => {
      return err instanceof FetchError && err.message.includes('请求超时');
    });
  });

  it('should throw fetch failed error on ENOTFOUND network error', async () => {
    const axiosError = Object.create(new Error('getaddrinfo ENOTFOUND api.apifox.com'));
    axiosError.isAxiosError = true;
    axiosError.code = 'ENOTFOUND';
    axiosError.response = undefined;

    mockMakeRequestWithProgress.mockRejectedValue(axiosError);
    vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

    await expect(fetchApifoxData(apifoxApiConfig)).rejects.toSatisfy((err: Error) => {
      return err instanceof FetchError && err.message.includes('API 请求失败');
    });
  });

  it('should throw fetch failed error on ECONNREFUSED network error', async () => {
    const axiosError = Object.create(new Error('connect ECONNREFUSED'));
    axiosError.isAxiosError = true;
    axiosError.code = 'ECONNREFUSED';
    axiosError.response = undefined;

    mockMakeRequestWithProgress.mockRejectedValue(axiosError);
    vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

    await expect(fetchApifoxData(apifoxApiConfig)).rejects.toSatisfy((err: Error) => {
      return err instanceof FetchError && err.message.includes('API 请求失败');
    });
  });

  it('should throw fetch failed error on non-200 status', async () => {
    mockMakeRequestWithProgress.mockResolvedValue({
      data: {},
      status: 500,
      headers: { 'content-type': 'application/json' },
    });

    await expect(fetchApifoxData(apifoxApiConfig)).rejects.toSatisfy((err: Error) => {
      return err instanceof FetchError && err.message.includes('API 请求失败');
    });
  });

  it('should throw invalid response error on non-JSON content type', async () => {
    mockMakeRequestWithProgress.mockResolvedValue({
      data: '<html>Not JSON</html>',
      status: 200,
      headers: { 'content-type': 'text/html' },
    });

    await expect(fetchApifoxData(apifoxApiConfig)).rejects.toSatisfy((err: Error) => {
      return err instanceof FetchError && err.message.includes('API 返回无效的响应格式');
    });
  });

  it('should re-throw custom errors with E2 code prefix', async () => {
    const customError = new FetchError('Custom fetch error', [
      { title: 'Test', steps: ['Step 1'] },
    ]);
    // FetchError has code E2001 which starts with 'E2'
    expect(customError.code).toMatch(/^E2/);

    mockMakeRequestWithProgress.mockRejectedValue(customError);

    await expect(fetchApifoxData(apifoxApiConfig)).rejects.toThrow(customError);
  });

  it('should re-throw non-Axios, non-custom errors as-is', async () => {
    const genericError = new Error('Some unknown error');
    mockMakeRequestWithProgress.mockRejectedValue(genericError);

    await expect(fetchApifoxData(apifoxApiConfig)).rejects.toThrow('Some unknown error');
  });

  it('should log debug info when DEBUG env is set', async () => {
    process.env.DEBUG = 'true';
    const mockData = { openapi: '3.1.0' };
    mockMakeRequestWithProgress.mockResolvedValue({
      data: mockData,
      status: 200,
      headers: { 'content-type': 'application/json' },
    });

    await fetchApifoxData(apifoxApiConfig);

    // Should log request config debug info
    expect(consola.debug).toHaveBeenCalled();
  });
});

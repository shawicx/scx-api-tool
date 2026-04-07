/**
 * @description clients/index.ts 单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServerType } from '@/types';
import type { ApiConfig } from '@/types';
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

// Mock both client modules
vi.mock('../apifox', () => ({
  fetchApifoxData: vi.fn(),
}));
vi.mock('../swagger', () => ({
  fetchSwaggerData: vi.fn(),
}));

// Mock ErrorFactory
vi.mock('@/errors', () => ({
  ErrorFactory: {
    configInvalid: vi.fn((message: string) => new Error(message)),
  },
}));

import { fetchData } from '../index';
import { fetchApifoxData } from '../apifox';
import { fetchSwaggerData } from '../swagger';
import { ErrorFactory } from '@/errors';

const mockFetchApifoxData = vi.mocked(fetchApifoxData);
const mockFetchSwaggerData = vi.mocked(fetchSwaggerData);
const mockConfigInvalid = vi.mocked(ErrorFactory.configInvalid);

describe('fetchData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call fetchApifoxData for Apifox serverType', async () => {
    const apifoxConfig = {
      serverType: ServerType.Apifox,
      source: 'https://api.apifox.com/v1/projects/123/export-openapi',
      token: 'test-token',
    } as ApiConfig;

    const mockResponse = { openapi: '3.1.0', info: { title: 'Test' } };
    mockFetchApifoxData.mockResolvedValue(mockResponse);

    const result = await fetchData(apifoxConfig);

    expect(result).toEqual(mockResponse);
    expect(mockFetchApifoxData).toHaveBeenCalledWith(apifoxConfig);
    expect(mockFetchApifoxData).toHaveBeenCalledTimes(1);
    expect(mockFetchSwaggerData).not.toHaveBeenCalled();
  });

  it('should call fetchSwaggerData for Swagger serverType', async () => {
    const swaggerConfig = {
      serverType: ServerType.Swagger,
      source: 'https://petstore.swagger.io/v2/swagger.json',
      token: '',
    } as ApiConfig;

    const mockResponse = { openapi: '3.0.0', info: { title: 'Swagger Test' } };
    mockFetchSwaggerData.mockResolvedValue(mockResponse);

    const result = await fetchData(swaggerConfig);

    expect(result).toEqual(mockResponse);
    expect(mockFetchSwaggerData).toHaveBeenCalledWith(swaggerConfig);
    expect(mockFetchSwaggerData).toHaveBeenCalledTimes(1);
    expect(mockFetchApifoxData).not.toHaveBeenCalled();
  });

  it('should throw error for unknown serverType', async () => {
    const unknownConfig = {
      serverType: 'unknown' as any,
      source: 'https://example.com/api',
      token: '',
    } as ApiConfig;

    const fakeError = new Error('不支持的服务器类型: unknown');
    mockConfigInvalid.mockReturnValue(fakeError);

    await expect(fetchData(unknownConfig)).rejects.toThrow('不支持的服务器类型: unknown');

    expect(mockConfigInvalid).toHaveBeenCalledWith(
      '不支持的服务器类型: unknown',
      expect.arrayContaining([
        expect.objectContaining({
          title: '检查服务器类型配置',
        }),
      ]),
    );

    expect(mockFetchApifoxData).not.toHaveBeenCalled();
    expect(mockFetchSwaggerData).not.toHaveBeenCalled();
  });
});

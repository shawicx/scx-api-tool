/**
 * @description generateCode 多服务失败隔离单元测试
 *
 * 关键设计：
 * - mock @/config/loader（loadConfig）、@/clients（fetchData）、@/generator/codegen（generateFiles）、
 *   @/processors/openapi（processOpenApiData）及 progress/hooks/logger
 * - 验证：单服务获取失败时其余服务仍完成生成，最终抛出聚合错误（CI 非零码）
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

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

vi.mock('@/utils/progress', () => ({
  getProgressManager: vi.fn(() => ({
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  })),
}));

vi.mock('@/utils/hooks', () => ({
  getHookManager: vi.fn(() => ({
    executeHook: vi.fn(async () => undefined),
  })),
}));

vi.mock('@/config/loader', () => ({
  loadConfig: vi.fn(),
}));

vi.mock('@/clients', () => ({
  fetchData: vi.fn(),
}));

vi.mock('@/processors/openapi', () => ({
  processOpenApiData: vi.fn(() => ({ interfaces: [], types: [], categories: [] })),
}));

vi.mock('@/generator/codegen', () => ({
  generateFiles: vi.fn(async () => undefined),
}));

import { generateCode } from '../index';
import { loadConfig } from '@/config/loader';
import { fetchData } from '@/clients';
import { generateFiles } from '@/generator/codegen';
import { ServerType, RequestMethodStyle } from '@/types';
import type { ApiConfig } from '@/types';

const mockLoadConfig = vi.mocked(loadConfig);
const mockFetchData = vi.mocked(fetchData);
const mockGenerateFiles = vi.mocked(generateFiles);

/** 构造最小可用的单服务运行时配置 */
function makeConfig(source: string): ApiConfig {
  return {
    serverUrl: 'https://example.com',
    serverType: ServerType.Swagger,
    source,
    generateApi: true,
    generateTypes: true,
    typesFormat: 'typescript',
    target: 'typescript',
    transformPath: (p: string) => p,
    outputDir: `tmp/test-out/${source}`,
    indentSize: 2,
    comment: true,
    prodEnvName: 'production',
    requestFunctionFilePath: 'src/service/request.ts',
    requestMethodStyle: RequestMethodStyle.CONFIG,
    requestFunctionName: 'request',
    requestMethodsObjectName: 'requestMethods',
    requestParamName: 'params',
    responseTypeName: 'Response',
    concurrency: 5,
  };
}

const RAW_DOC = { openapi: '3.0.0', info: { title: 'demo', version: '1.0.0' }, paths: {} };

describe('generateCode 多服务失败隔离', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadConfig.mockResolvedValue([]);
  });

  it('单个服务获取失败时，其余服务仍完成生成，且最终抛出聚合错误', async () => {
    const okConfig = makeConfig('https://ok.example.com/swagger.json');
    const badConfig = makeConfig('https://bad.example.com/swagger.json');
    mockLoadConfig.mockResolvedValue([okConfig, badConfig]);
    mockFetchData.mockImplementation(async (config: ApiConfig) => {
      if (config.source === badConfig.source) {
        throw new Error('connect ETIMEDOUT');
      }
      return RAW_DOC as any;
    });

    await expect(generateCode('./config.ts')).rejects.toThrow(/bad\.example\.com.*ETIMEDOUT/);

    // 成功的服务仍完成了生成
    expect(mockGenerateFiles).toHaveBeenCalledTimes(1);
    expect(mockGenerateFiles.mock.calls[0][1]).toBe(okConfig);
  });

  it('全部服务失败时不生成任何文件并抛错', async () => {
    mockLoadConfig.mockResolvedValue([makeConfig('https://a.example.com/s.json')]);
    mockFetchData.mockRejectedValue(new Error('network error'));

    await expect(generateCode('./config.ts')).rejects.toThrow(/成功 0\/1 个/);
    expect(mockGenerateFiles).not.toHaveBeenCalled();
  });

  it('全部成功时每个服务各生成一次且正常完成', async () => {
    const configs = [
      makeConfig('https://a.example.com/s.json'),
      makeConfig('https://b.example.com/s.json'),
    ];
    mockLoadConfig.mockResolvedValue(configs);
    mockFetchData.mockResolvedValue(RAW_DOC as any);

    await expect(generateCode('./config.ts')).resolves.toBeUndefined();
    expect(mockGenerateFiles).toHaveBeenCalledTimes(2);
  });
});

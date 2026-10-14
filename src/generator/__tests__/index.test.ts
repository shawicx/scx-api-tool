/**
 * @description generateCode 多服务失败隔离单元测试
 *
 * 关键设计：
 * - mock @/config/loader（loadConfig）、@/clients（fetchData）、@/generator/codegen（generateFiles）、
 *   @/processors/openapi（processOpenApiData）及 progress/hooks/logger
 * - 验证：单服务获取失败时其余服务仍完成生成，最终抛出聚合错误（CI 非零码）
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const progressWarn = vi.fn();

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
    warn: progressWarn,
  })),
}));

// 显式声明可选钩子参数，使 mock.calls 的参数元组可解构（用于钩子语义断言）
const executeHook = vi.fn(async (_hook?: (...args: any[]) => unknown) => undefined);

vi.mock('@/utils/hooks', () => ({
  getHookManager: vi.fn(() => ({
    executeHook,
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
import type { ApiConfig, CliHooks } from '@/types';

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
    generateHooks: false,
    hooksLibrary: 'react-query',
    queryKeyPrefix: [],
    hooksValidateResponse: false,
    transformPath: (p: string) => p,
    outputDir: `tmp/test-out/${source}`,
    indentSize: 2,
    comment: true,
    prodEnvName: 'production',
    requestFunctionFilePath: 'src/service/request.ts',
    requestMethodStyle: RequestMethodStyle.CONFIG,
    requestFunctionName: 'request',
    requestTimeout: 30000,
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

  it('失败服务的旧产物风险应被明确告警（不静默沿用旧结果）', async () => {
    const badConfig = { ...makeConfig('https://bad.example.com/swagger.json') };
    mockLoadConfig.mockResolvedValue([
      badConfig,
      makeConfig('https://ok.example.com/swagger.json'),
    ]);
    mockFetchData.mockImplementation(async (config: ApiConfig) => {
      if (config.source === badConfig.source) throw new Error('connect ETIMEDOUT');
      return RAW_DOC as any;
    });

    await expect(generateCode('./config.ts')).rejects.toThrow(/旧产物/);

    // 进度告警中应包含失败服务的输出目录与过期提示
    const warnText = progressWarn.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(warnText).toContain(badConfig.outputDir);
    expect(warnText).toContain('可能已过期');
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

// ==================== 生命周期钩子语义（服务级执行） ====================

describe('generateCode 生命周期钩子按服务执行', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadConfig.mockResolvedValue([]);
  });

  it('各服务的 beforeGenerate/afterGenerate 围绕自身生成各执行一次', async () => {
    const hooksA: CliHooks = {
      beforeGenerate: () => undefined,
      afterGenerate: () => undefined,
    };
    const hooksB: CliHooks = {
      beforeGenerate: () => undefined,
      afterGenerate: () => undefined,
    };
    const configA = { ...makeConfig('https://a.example.com/s.json'), hooks: hooksA };
    const configB = { ...makeConfig('https://b.example.com/s.json'), hooks: hooksB };
    mockLoadConfig.mockResolvedValue([configA, configB]);
    mockFetchData.mockResolvedValue(RAW_DOC as any);

    await generateCode('./config.ts');

    // 每个服务的钩子各执行一次（不再只取首个服务）
    expect(executeHook).toHaveBeenCalledTimes(4);
    expect(executeHook).toHaveBeenNthCalledWith(1, hooksA.beforeGenerate);
    expect(executeHook).toHaveBeenNthCalledWith(2, hooksA.afterGenerate);
    expect(executeHook).toHaveBeenNthCalledWith(3, hooksB.beforeGenerate);
    expect(executeHook).toHaveBeenNthCalledWith(4, hooksB.afterGenerate);
  });

  it('顶层公共 hooks 被每个服务继承时随各服务各执行一次（非仅首个服务一次）', async () => {
    const sharedHooks: CliHooks = { beforeGenerate: () => undefined };
    const configA = { ...makeConfig('https://a.example.com/s.json'), hooks: sharedHooks };
    const configB = { ...makeConfig('https://b.example.com/s.json'), hooks: sharedHooks };
    mockLoadConfig.mockResolvedValue([configA, configB]);
    mockFetchData.mockResolvedValue(RAW_DOC as any);

    await generateCode('./config.ts');

    // 两个服务各执行一次 beforeGenerate（继承语义）；executeHook 对未定义钩子的空调用不计入
    const beforeCalls = executeHook.mock.calls.filter(([h]) => h === sharedHooks.beforeGenerate);
    expect(beforeCalls).toHaveLength(2);
  });

  it('获取失败的服务未进入生成阶段，其生命周期钩子不执行', async () => {
    const hooksBad: CliHooks = {
      beforeGenerate: () => undefined,
      afterGenerate: () => undefined,
    };
    const badConfig = {
      ...makeConfig('https://bad.example.com/swagger.json'),
      hooks: hooksBad,
    };
    const okHooks: CliHooks = { afterGenerate: () => undefined };
    const okConfig = { ...makeConfig('https://ok.example.com/s.json'), hooks: okHooks };
    mockLoadConfig.mockResolvedValue([badConfig, okConfig]);
    mockFetchData.mockImplementation(async (config: ApiConfig) => {
      if (config.source === badConfig.source) throw new Error('network error');
      return RAW_DOC as any;
    });

    await expect(generateCode('./config.ts')).rejects.toThrow(/部分服务获取失败/);

    // 仅成功服务的 afterGenerate 执行；失败服务的钩子均不执行
    // （executeHook 对未定义钩子的空调用不计入，仅统计真实钩子函数）
    const realCalls = executeHook.mock.calls.filter(([h]) => typeof h === 'function');
    expect(realCalls).toHaveLength(1);
    expect(realCalls[0][0]).toBe(okHooks.afterGenerate);
    expect(executeHook).not.toHaveBeenCalledWith(hooksBad.beforeGenerate);
    expect(executeHook).not.toHaveBeenCalledWith(hooksBad.afterGenerate);
  });
});

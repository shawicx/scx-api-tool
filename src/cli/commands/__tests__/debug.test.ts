/**
 * @description CLI debug 命令单元测试
 * 覆盖 dry-run 诊断模式：启用 debug 日志、调用 loadConfig/fetchData/processOpenApiData、不调用 generateCode
 *
 * 关键设计：debug 命令不再调用 generateCode，而是直接调用数据获取和处理阶段后打印诊断报告，不写入文件。
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

vi.mock('@/errors', () => ({
  handleError: vi.fn(),
}));

vi.mock('@/config/loader', () => ({
  loadConfig: vi.fn(),
}));

vi.mock('@/clients', () => ({
  fetchData: vi.fn(),
}));

vi.mock('@/processors/openapi', () => ({
  processOpenApiData: vi.fn(),
}));

// 确保 generateCode 未被导入/调用
vi.mock('@/generator', () => ({
  generateCode: vi.fn(),
}));

import { debugCommand } from '../debug';
import { loadConfig } from '@/config/loader';
import { fetchData } from '@/clients';
import { processOpenApiData } from '@/processors/openapi';
import { setDebugEnabled } from '@/utils/logger';
import { minimalApiConfig, mockOpenApiDocument } from '../../../../tests/fixtures/mockData';

const mockLoadConfig = vi.mocked(loadConfig);
const mockFetchData = vi.mocked(fetchData);
const mockProcessOpenApiData = vi.mocked(processOpenApiData);
const mockSetDebugEnabled = vi.mocked(setDebugEnabled);

describe('debug command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadConfig.mockResolvedValue(minimalApiConfig);
    mockFetchData.mockResolvedValue(mockOpenApiDocument);
    mockProcessOpenApiData.mockReturnValue({
      interfaces: [
        { path: '/users', method: 'get', operation: {} as any },
        { path: '/users', method: 'post', operation: {} as any },
      ],
      types: [{ name: 'User', originalName: 'User', schema: {} as any }],
      categories: [{ name: '用户管理' }],
    });
  });

  it('应启用 debug 日志并执行 dry-run 诊断流程', async () => {
    await debugCommand.parseAsync(['node', 'debug', '-c', 'config.ts']);

    expect(mockSetDebugEnabled).toHaveBeenCalledWith(true);
    expect(mockLoadConfig).toHaveBeenCalledWith('config.ts');
    expect(mockFetchData).toHaveBeenCalledWith(minimalApiConfig);
    expect(mockProcessOpenApiData).toHaveBeenCalledWith(mockOpenApiDocument, minimalApiConfig);
  });

  it('未指定 -c 应使用默认 config 路径', async () => {
    await debugCommand.parseAsync(['node', 'debug']);

    expect(mockLoadConfig).toHaveBeenCalledWith('api-power.config.ts');
  });

  it('应打印诊断报告（接口数/类型数/分类数）', async () => {
    const { logger } = await import('@/utils/logger');

    await debugCommand.parseAsync(['node', 'debug']);

    // 应输出接口数、类型数、分类数
    const successCalls = (logger.success as any).mock.calls.map((c: any[]) => c.join(' '));
    expect(successCalls.some((s) => s.includes('接口数: 2'))).toBe(true);
    expect(successCalls.some((s) => s.includes('类型数: 1'))).toBe(true);
    expect(successCalls.some((s) => s.includes('分类数: 1'))).toBe(true);
    expect(successCalls.some((s) => s.includes('诊断完成'))).toBe(true);
  });
});

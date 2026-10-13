/**
 * @description multiService.ts 单元测试
 * 覆盖 requestMode（shared/isolated）解析、默认 request 路径计算与扩展名调整
 */

import { describe, it, expect, vi } from 'vitest';
import { resolveServiceConfigs } from '../multiService';
import type { MultiServiceConfig } from '@/types';

// Mock logger（validateConfiguration 内部会输出校验报告）
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

const SWAGGER_SOURCE = 'https://petstore.swagger.io/v2/swagger.json';

describe('resolveServiceConfigs - request 文件路径', () => {
  it('默认共享路径跟随 baseOutputDir', () => {
    const configs = resolveServiceConfigs({
      baseOutputDir: 'src/api',
      services: [{ name: 'user', source: SWAGGER_SOURCE }],
    });

    expect(configs[0]!.requestMode).toBe('shared');
    expect(configs[0]!.requestFunctionFilePath).toBe('src/api/request.ts');
  });

  it('baseOutputDir 缺省时默认路径为 src/service/request.ts（向后兼容）', () => {
    const configs = resolveServiceConfigs({
      services: [{ name: 'main', source: SWAGGER_SOURCE }],
    });

    expect(configs[0]!.requestFunctionFilePath).toBe('src/service/request.ts');
  });

  it('显式配置顶层 requestFunctionFilePath 时不做改写', () => {
    const configs = resolveServiceConfigs({
      baseOutputDir: 'src/api',
      requestFunctionFilePath: 'src/custom/request.ts',
      services: [{ name: 'user', source: SWAGGER_SOURCE }],
    });

    expect(configs[0]!.requestFunctionFilePath).toBe('src/custom/request.ts');
  });

  it('javascript target 下默认路径扩展名为 .js', () => {
    const configs = resolveServiceConfigs({
      baseOutputDir: 'src/api',
      target: 'javascript',
      services: [{ name: 'user', source: SWAGGER_SOURCE }],
    });

    expect(configs[0]!.requestFunctionFilePath).toBe('src/api/request.js');
  });
});

describe('resolveServiceConfigs - isolated 模式', () => {
  it('isolated 服务默认在本服务输出目录内生成独立 request 文件', () => {
    const configs = resolveServiceConfigs({
      baseOutputDir: 'src/api',
      services: [
        { name: 'user', source: SWAGGER_SOURCE },
        { name: 'order', source: SWAGGER_SOURCE, requestMode: 'isolated' },
      ],
    });

    expect(configs[0]!.requestMode).toBe('shared');
    expect(configs[0]!.requestFunctionFilePath).toBe('src/api/request.ts');
    expect(configs[1]!.requestMode).toBe('isolated');
    expect(configs[1]!.requestFunctionFilePath).toBe('src/api/order/request.ts');
  });

  it('isolated 服务显式配置 requestFunctionFilePath 时优先使用显式路径', () => {
    const configs = resolveServiceConfigs({
      baseOutputDir: 'src/api',
      services: [
        {
          name: 'order',
          source: SWAGGER_SOURCE,
          requestMode: 'isolated',
          requestFunctionFilePath: 'src/api/order/http.ts',
        },
      ],
    });

    expect(configs[0]!.requestFunctionFilePath).toBe('src/api/order/http.ts');
  });

  it('isolated 服务支持服务级 requestBaseURL 与 requestTimeout 覆盖', () => {
    const configs = resolveServiceConfigs({
      baseOutputDir: 'src/api',
      requestTimeout: 5000,
      services: [
        {
          name: 'order',
          source: SWAGGER_SOURCE,
          requestMode: 'isolated',
          requestBaseURL: '/order-api',
          requestTimeout: 10000,
        },
      ],
    });

    expect(configs[0]!.requestBaseURL).toBe('/order-api');
    expect(configs[0]!.requestTimeout).toBe(10000);
  });

  it('javascript target 下 isolated 默认路径扩展名为 .js', () => {
    const configs = resolveServiceConfigs({
      baseOutputDir: 'src/api',
      target: 'javascript',
      services: [{ name: 'order', source: SWAGGER_SOURCE, requestMode: 'isolated' }],
    });

    expect(configs[0]!.requestFunctionFilePath).toBe('src/api/order/request.js');
  });

  it('公共层 requestMode: isolated 时未覆盖的服务均生效', () => {
    const configs = resolveServiceConfigs({
      baseOutputDir: 'src/api',
      requestMode: 'isolated',
      services: [
        { name: 'user', source: SWAGGER_SOURCE },
        { name: 'order', source: SWAGGER_SOURCE, requestMode: 'shared' },
      ],
    });

    expect(configs[0]!.requestMode).toBe('isolated');
    expect(configs[0]!.requestFunctionFilePath).toBe('src/api/user/request.ts');
    expect(configs[1]!.requestMode).toBe('shared');
    expect(configs[1]!.requestFunctionFilePath).toBe('src/api/request.ts');
  });
});

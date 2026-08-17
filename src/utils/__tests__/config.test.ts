/**
 * @description config.ts 单元测试
 *
 * 适配多服务配置 API：defineConfig 接收 MultiServiceConfig（公共配置 + services 数组），
 * 返回 ApiConfig[]（每个元素为单服务运行时配置）。
 */

import { describe, it, expect, vi } from 'vitest';
import {
  defineConfig,
  parseSourceUrl,
  isGetLikeMethod,
  isPostLikeMethod,
  assertValidMethod,
  getFileExtension,
  HTTP_METHODS,
  PRESETS,
} from '../config';
import { RequestMethod, ServerType } from '@/types';
import type { MultiServiceConfig, ServiceConfig } from '@/types';

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

/** 公共测试常量：显式指定 baseOutputDir，便于断言计算后的 outputDir */
const BASE_OUTPUT_DIR = 'src/api';
/** 单服务测试默认数据源 */
const SWAGGER_SOURCE = 'https://petstore.swagger.io/v2/swagger.json';

describe('parseSourceUrl', () => {
  it('should parse a Swagger URL correctly', () => {
    const result = parseSourceUrl('https://petstore.swagger.io/v2/swagger.json');

    expect(result.serverUrl).toBe('https://petstore.swagger.io');
    expect(result.serverType).toBe(ServerType.Swagger);
    expect(result.apifoxProjectId).toBeUndefined();
  });

  it('should parse an Apifox URL and extract projectId', () => {
    const result = parseSourceUrl('https://api.apifox.com/v1/projects/6997172/export-openapi');

    expect(result.serverUrl).toBe('https://api.apifox.com');
    expect(result.serverType).toBe(ServerType.Apifox);
    expect(result.apifoxProjectId).toBe('6997172');
  });

  it('should parse an Apifox URL without extracting projectId when path has no project ID', () => {
    const result = parseSourceUrl('https://app.apifox.com/some/other/path');

    expect(result.serverUrl).toBe('https://app.apifox.com');
    expect(result.serverType).toBe(ServerType.Apifox);
    expect(result.apifoxProjectId).toBeUndefined();
  });

  it('should throw for an invalid URL', () => {
    expect(() => parseSourceUrl('not-a-valid-url')).toThrow('Invalid source URL format');
  });

  it('should throw for an empty string URL', () => {
    expect(() => parseSourceUrl('')).toThrow('Invalid source URL format');
  });

  it('should preserve port in serverUrl', () => {
    const result = parseSourceUrl('http://localhost:8080/api/docs');

    expect(result.serverUrl).toBe('http://localhost:8080');
    expect(result.serverType).toBe(ServerType.Swagger);
  });
});

/**
 * defineConfig 单服务场景：services 数组长度为 1，取 configs[0] 断言。
 * 每个用例显式设置 baseOutputDir 与 service name/folder，使 outputDir 断言清晰。
 */
describe('defineConfig (单服务)', () => {
  it('should create a standard config from a Swagger source', () => {
    const multiConfig: MultiServiceConfig = {
      baseOutputDir: BASE_OUTPUT_DIR,
      services: [
        {
          name: 'petstore',
          folder: '.',
          source: SWAGGER_SOURCE,
          token: '',
        },
      ],
    };

    const [config] = defineConfig(multiConfig);

    expect(config.serverUrl).toBe('https://petstore.swagger.io');
    expect(config.serverType).toBe(ServerType.Swagger);
    expect(config.source).toBe(SWAGGER_SOURCE);
    expect(config.token).toBe('');
    expect(config.generateApi).toBe(true);
    expect(config.generateTypes).toBe(true);
    expect(config.target).toBe('typescript');
    // folder='.' → outputDir = join('src/api', '.') = 'src/api'
    expect(config.outputDir).toBe('src/api');
    expect(config.indentSize).toBe(2);
    expect(config.comment).toBe(true);
    expect(config.concurrency).toBe(50);
  });

  it('should apply a preset when specified', () => {
    const multiConfig: MultiServiceConfig = {
      baseOutputDir: BASE_OUTPUT_DIR,
      preset: 'verbose',
      services: [
        {
          name: 'petstore',
          folder: '.',
          source: SWAGGER_SOURCE,
          token: '',
        },
      ],
    };

    const [config] = defineConfig(multiConfig);

    // verbose preset overrides indentSize to 4
    expect(config.indentSize).toBe(4);
    // verbose preset uses BOTH requestMethodStyle
    expect(config.requestMethodStyle).toBe('both');
  });

  it('should apply the minimal preset correctly', () => {
    const multiConfig: MultiServiceConfig = {
      baseOutputDir: BASE_OUTPUT_DIR,
      preset: 'minimal',
      services: [
        {
          name: 'petstore',
          folder: '.',
          source: SWAGGER_SOURCE,
          token: '',
        },
      ],
    };

    const [config] = defineConfig(multiConfig);

    // minimal preset sets generateApi to false and comment to false
    expect(config.generateApi).toBe(false);
    expect(config.comment).toBe(false);
    expect(config.generateTypes).toBe(true);
  });

  it('should adjust requestFunctionFilePath extension for javascript target', () => {
    const multiConfig: MultiServiceConfig = {
      baseOutputDir: BASE_OUTPUT_DIR,
      target: 'javascript',
      services: [
        {
          name: 'petstore',
          folder: '.',
          source: SWAGGER_SOURCE,
          token: '',
        },
      ],
    };

    const [config] = defineConfig(multiConfig);

    expect(config.target).toBe('javascript');
    // 未自定义 requestFunctionFilePath 时，.ts 自动改为 .js
    expect(config.requestFunctionFilePath).toBe('src/service/request.js');
  });

  it('should NOT adjust requestFunctionFilePath when user provides a custom path', () => {
    const multiConfig: MultiServiceConfig = {
      baseOutputDir: BASE_OUTPUT_DIR,
      target: 'javascript',
      requestFunctionFilePath: 'src/custom/request.ts',
      services: [
        {
          name: 'petstore',
          folder: '.',
          source: SWAGGER_SOURCE,
          token: '',
        },
      ],
    };

    const [config] = defineConfig(multiConfig);

    // When user explicitly sets requestFunctionFilePath, it should not be overridden
    expect(config.requestFunctionFilePath).toBe('src/custom/request.ts');
  });

  it('should pass namingStrategy through when provided', () => {
    const customStrategy = {
      interfaceName: () => 'CustomInterface',
    };

    const multiConfig: MultiServiceConfig = {
      baseOutputDir: BASE_OUTPUT_DIR,
      namingStrategy: customStrategy,
      services: [
        {
          name: 'petstore',
          folder: '.',
          source: SWAGGER_SOURCE,
          token: '',
        },
      ],
    };

    const [config] = defineConfig(multiConfig);

    expect(config.namingStrategy).toBe(customStrategy);
  });

  it('should pass hooks through when provided', () => {
    const hooks = {
      beforeGenerate: vi.fn(),
      afterGenerate: vi.fn(),
    };

    const multiConfig: MultiServiceConfig = {
      baseOutputDir: BASE_OUTPUT_DIR,
      hooks,
      services: [
        {
          name: 'petstore',
          folder: '.',
          source: SWAGGER_SOURCE,
          token: '',
        },
      ],
    };

    const [config] = defineConfig(multiConfig);

    expect(config.hooks).toBe(hooks);
  });

  it('should merge user values over preset values', () => {
    const multiConfig: MultiServiceConfig = {
      baseOutputDir: BASE_OUTPUT_DIR,
      preset: 'verbose',
      indentSize: 8, // override the verbose preset's indentSize of 4
      services: [
        {
          name: 'petstore',
          folder: '.',
          source: SWAGGER_SOURCE,
          token: '',
        },
      ],
    };

    const [config] = defineConfig(multiConfig);

    expect(config.indentSize).toBe(8);
  });
});

describe('isGetLikeMethod', () => {
  it('should return true for GET', () => {
    expect(isGetLikeMethod(RequestMethod.GET)).toBe(true);
  });

  it('should return true for OPTIONS', () => {
    expect(isGetLikeMethod(RequestMethod.OPTIONS)).toBe(true);
  });

  it('should return true for HEAD', () => {
    expect(isGetLikeMethod(RequestMethod.HEAD)).toBe(true);
  });

  it('should return false for POST', () => {
    expect(isGetLikeMethod(RequestMethod.POST)).toBe(false);
  });

  it('should return false for PUT', () => {
    expect(isGetLikeMethod(RequestMethod.PUT)).toBe(false);
  });

  it('should return false for DELETE', () => {
    expect(isGetLikeMethod(RequestMethod.DELETE)).toBe(false);
  });

  it('should return false for PATCH', () => {
    expect(isGetLikeMethod(RequestMethod.PATCH)).toBe(false);
  });
});

describe('isPostLikeMethod', () => {
  it('should return true for POST', () => {
    expect(isPostLikeMethod(RequestMethod.POST)).toBe(true);
  });

  it('should return true for PUT', () => {
    expect(isPostLikeMethod(RequestMethod.PUT)).toBe(true);
  });

  it('should return true for DELETE', () => {
    expect(isPostLikeMethod(RequestMethod.DELETE)).toBe(true);
  });

  it('should return true for PATCH', () => {
    expect(isPostLikeMethod(RequestMethod.PATCH)).toBe(true);
  });

  it('should return false for GET', () => {
    expect(isPostLikeMethod(RequestMethod.GET)).toBe(false);
  });

  it('should return false for OPTIONS', () => {
    expect(isPostLikeMethod(RequestMethod.OPTIONS)).toBe(false);
  });

  it('should return false for HEAD', () => {
    expect(isPostLikeMethod(RequestMethod.HEAD)).toBe(false);
  });
});

describe('assertValidMethod', () => {
  it('should not throw for valid HTTP methods', () => {
    expect(() => assertValidMethod('GET')).not.toThrow();
    expect(() => assertValidMethod('POST')).not.toThrow();
    expect(() => assertValidMethod('PUT')).not.toThrow();
    expect(() => assertValidMethod('DELETE')).not.toThrow();
    expect(() => assertValidMethod('PATCH')).not.toThrow();
    expect(() => assertValidMethod('HEAD')).not.toThrow();
    expect(() => assertValidMethod('OPTIONS')).not.toThrow();
  });

  it('should not throw for lowercase valid HTTP methods', () => {
    expect(() => assertValidMethod('get')).not.toThrow();
    expect(() => assertValidMethod('post')).not.toThrow();
  });

  it('should throw for invalid HTTP methods', () => {
    expect(() => assertValidMethod('INVALID')).toThrow('Invalid HTTP method: INVALID');
  });

  it('should throw for an empty string', () => {
    expect(() => assertValidMethod('')).toThrow('Invalid HTTP method');
  });
});

describe('getFileExtension', () => {
  it('should return .ts for typescript target', () => {
    expect(getFileExtension('typescript')).toBe('.ts');
  });

  it('should return .js for javascript target', () => {
    expect(getFileExtension('javascript')).toBe('.js');
  });
});

describe('HTTP_METHODS', () => {
  it('should contain all standard HTTP methods', () => {
    expect(HTTP_METHODS.GET).toBe('get');
    expect(HTTP_METHODS.POST).toBe('post');
    expect(HTTP_METHODS.PUT).toBe('put');
    expect(HTTP_METHODS.DELETE).toBe('delete');
    expect(HTTP_METHODS.PATCH).toBe('patch');
    expect(HTTP_METHODS.HEAD).toBe('head');
    expect(HTTP_METHODS.OPTIONS).toBe('options');
  });

  it('should have exactly 7 methods', () => {
    expect(Object.keys(HTTP_METHODS)).toHaveLength(7);
  });
});

describe('PRESETS', () => {
  it('should be re-exported and have minimal, standard, verbose keys', () => {
    expect(PRESETS).toBeDefined();
    expect(PRESETS.minimal).toBeDefined();
    expect(PRESETS.standard).toBeDefined();
    expect(PRESETS.verbose).toBeDefined();
  });

  it('should have correct minimal preset values', () => {
    expect(PRESETS.minimal.generateApi).toBe(false);
    expect(PRESETS.minimal.generateTypes).toBe(true);
    expect(PRESETS.minimal.comment).toBe(false);
  });

  it('should have correct verbose preset values', () => {
    expect(PRESETS.verbose.generateApi).toBe(true);
    expect(PRESETS.verbose.indentSize).toBe(4);
  });
});

/**
 * transformPath 规范化测试（多服务形式）：在 service 级配置 transformPath，
 * 断言 configs[0].transformPath 的行为。
 */
describe('defineConfig - transformPath normalization', () => {
  /** 单服务基础配置，transformPath 在 service 级注入 */
  const baseService: ServiceConfig = {
    name: 'x',
    source: 'https://petstore.swagger.io/v2/swagger.json',
    token: 'x',
  };

  it('undefined 时注入恒等函数', () => {
    const [config] = defineConfig({ services: [{ ...baseService }] });
    expect(typeof config.transformPath).toBe('function');
    expect(config.transformPath('/users')).toBe('/users');
    expect(config.transformPath('/api/users')).toBe('/api/users');
  });

  it('null 时注入恒等函数', () => {
    const [config] = defineConfig({ services: [{ ...baseService, transformPath: null as any }] });
    expect(typeof config.transformPath).toBe('function');
    expect(config.transformPath('/users')).toBe('/users');
  });

  it('function 时透传', () => {
    const fn = (p: string) => `/api${p}`;
    const [config] = defineConfig({ services: [{ ...baseService, transformPath: fn }] });
    expect(config.transformPath).toBe(fn);
    expect(config.transformPath('/users')).toBe('/api/users');
  });

  it('string 时抛校验错误', () => {
    // transformPath 非函数由 validateConfiguration 拦截，抛 ConfigValidationError
    expect(() =>
      defineConfig({ services: [{ ...baseService, transformPath: '/api' as any }] }),
    ).toThrow(/transformPath|函数|当前类型: string/);
  });

  it('number 时抛校验错误', () => {
    expect(() =>
      defineConfig({ services: [{ ...baseService, transformPath: 123 as any }] }),
    ).toThrow(/transformPath|函数|当前类型: number/);
  });

  it('对象时抛校验错误', () => {
    expect(() =>
      defineConfig({ services: [{ ...baseService, transformPath: { x: 1 } as any }] }),
    ).toThrow(/transformPath|函数|当前类型: object/);
  });

  it('数组时抛校验错误', () => {
    expect(() =>
      defineConfig({ services: [{ ...baseService, transformPath: [] as any }] }),
    ).toThrow(/transformPath|函数|当前类型: object/);
  });

  it('错误消息包含迁移示例', () => {
    try {
      defineConfig({ services: [{ ...baseService, transformPath: '/api' as any }] });
      throw new Error('should have thrown');
    } catch (e: any) {
      expect(e.message).toMatch(/transformPath.*函数|废弃/);
      // ConfigValidationError 的 validationReport 含迁移建议，应包含函数形式示例
      const report = e.validationReport || {};
      const errorStr = JSON.stringify(report);
      expect(errorStr).toMatch(/transformPath:/);
    }
  });
});

/**
 * 多服务专属测试：验证 services 数组解析、outputDir 计算、公共配置继承/覆盖与校验。
 */
describe('defineConfig (多服务)', () => {
  it('多个服务各自产出独立的 ApiConfig，outputDir 为 join(base, name)', () => {
    const configs = defineConfig({
      baseOutputDir: 'src/api',
      services: [
        { name: 'user', source: 'https://user-svc/v3/api-docs' },
        { name: 'order', source: 'https://order-svc/swagger.json' },
      ],
    });

    expect(configs).toHaveLength(2);
    // folder 省略默认取 name → outputDir = join(base, name)
    expect(configs[0].outputDir).toBe('src/api/user');
    expect(configs[1].outputDir).toBe('src/api/order');
    // 各自解析独立的服务器信息
    expect(configs[0].serverUrl).toBe('https://user-svc');
    expect(configs[1].serverUrl).toBe('https://order-svc');
  });

  it('folder 支持多段路径，outputDir = join(base, folder)', () => {
    const configs = defineConfig({
      baseOutputDir: 'src/api',
      services: [
        {
          name: 'order',
          folder: 'trade/order',
          source: SWAGGER_SOURCE,
        },
      ],
    });

    expect(configs).toHaveLength(1);
    expect(configs[0].outputDir).toBe('src/api/trade/order');
  });

  it('folder 省略时默认取服务 name', () => {
    const configs = defineConfig({
      baseOutputDir: 'src/api',
      services: [{ name: 'petstore', source: SWAGGER_SOURCE }],
    });

    expect(configs[0].outputDir).toBe('src/api/petstore');
  });

  it('服务名重复时抛校验错误', () => {
    // 服务名重复由 validateConfiguration 拦截，抛 ConfigValidationError
    expect(() =>
      defineConfig({
        services: [
          { name: 'dup', source: SWAGGER_SOURCE, folder: 'a' },
          { name: 'dup', source: SWAGGER_SOURCE, folder: 'b' },
        ],
      }),
    ).toThrow(/重复/);
  });

  it('两个服务 outputDir 完全相同时抛校验错误', () => {
    // 两个 folder 都为 '.' → outputDir 都为 baseOutputDir，完全相同
    expect(() =>
      defineConfig({
        baseOutputDir: 'src/api',
        services: [
          { name: 'a', source: SWAGGER_SOURCE, folder: '.' },
          { name: 'b', source: SWAGGER_SOURCE, folder: '.' },
        ],
      }),
    ).toThrow(/相同或嵌套/);
  });

  it('两个服务 outputDir 嵌套时抛校验错误', () => {
    // folder 'a' 与 'a/b' 嵌套 → 抛错
    expect(() =>
      defineConfig({
        baseOutputDir: 'src/api',
        services: [
          { name: 'a', source: SWAGGER_SOURCE, folder: 'a' },
          { name: 'b', source: SWAGGER_SOURCE, folder: 'a/b' },
        ],
      }),
    ).toThrow(/相同或嵌套/);
  });

  it('公共配置被 service 覆盖（service 级优先于公共级）', () => {
    const configs = defineConfig({
      baseOutputDir: 'src/api',
      concurrency: 50, // 公共级
      services: [
        {
          name: 'petstore',
          source: SWAGGER_SOURCE,
          concurrency: 5, // service 级覆盖
        },
      ],
    });

    expect(configs[0].concurrency).toBe(5);
  });

  it('公共配置被未覆盖的 service 继承', () => {
    const configs = defineConfig({
      baseOutputDir: 'src/api',
      concurrency: 30,
      indentSize: 6,
      services: [
        {
          name: 'petstore',
          source: SWAGGER_SOURCE,
          // 不覆盖 concurrency / indentSize，应继承公共配置
        },
      ],
    });

    expect(configs[0].concurrency).toBe(30);
    expect(configs[0].indentSize).toBe(6);
  });
});

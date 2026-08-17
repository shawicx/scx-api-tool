/**
 * @description config/loader.ts 单元测试
 *
 * 新 loader 职责：加载配置文件 → isProcessedConfig 类型守卫（确保是合法 ApiConfig[]）→ 返回 ApiConfig[]。
 * loader 不再调用 defineConfig / validateConfiguration，因此本测试不再 mock `@/validation` 与 `@/utils/config`。
 * 仅保留对 `@/utils/logger`（ErrorFactory 间接依赖）与 `@/errors`（ErrorFactory.configNotFound / configParseError）的 mock。
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolve, join } from 'path';
import { writeFileSync, mkdirSync, existsSync as realExistsSync, rmSync } from 'fs';

// Temp directory for config fixture files
const tempDir = resolve(import.meta.dirname, '__test_fixtures__');

// Ensure temp directory exists before mocking fs
if (!realExistsSync(tempDir)) {
  mkdirSync(tempDir, { recursive: true });
}

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

// Mock only existsSync from fs, keeping other fs functions real
vi.mock('fs', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('fs');
  return {
    ...actual,
    existsSync: vi.fn(),
  };
});

// Mock errors module（loader 仍依赖 ErrorFactory.configNotFound / configParseError）
vi.mock('@/errors', () => {
  return {
    ErrorFactory: {
      configNotFound: vi.fn((path: string) => {
        const error = new Error(`配置文件未找到: ${path}`);
        (error as any).code = 'E1001';
        return error;
      }),
      configParseError: vi.fn((path: string, originalError: Error) => {
        const error = new Error(`配置文件解析失败: ${path}`);
        (error as any).code = 'E1003';
        (error as any).originalError = originalError;
        return error;
      }),
    },
    BaseError: class extends Error {
      code = 'E1001';
      solutions: any[] = [];
      constructor(message: string) {
        super(message);
        this.name = 'BaseError';
      }
    },
  };
});

import { existsSync } from 'fs';
import { loadConfig } from '../loader';
import { ErrorFactory } from '@/errors';

const mockExistsSync = vi.mocked(existsSync);
const mockConfigNotFound = vi.mocked(ErrorFactory.configNotFound);
const mockConfigParseError = vi.mocked(ErrorFactory.configParseError);

/**
 * 完整的 ApiConfig 字面量（含全部必填字段）。
 * 用于构造「已是 ApiConfig[]」的 fixture，模拟 defineConfig 处理后的产物。
 */
function makeApiConfig(overrides: Record<string, any> = {}): Record<string, any> {
  return {
    serverUrl: 'https://petstore.swagger.io',
    serverType: 'swagger',
    source: 'https://petstore.swagger.io/v2/swagger.json',
    token: '',
    outputDir: 'src/service',
    generateApi: true,
    generateTypes: true,
    typesFormat: 'typescript',
    target: 'typescript',
    transformPath: '(p) => p',
    indentSize: 2,
    comment: true,
    prodEnvName: 'production',
    requestFunctionFilePath: 'src/service/request.ts',
    requestMethodStyle: 'config',
    requestFunctionName: 'request',
    requestMethodsObjectName: 'requestMethods',
    requestParamName: 'params',
    responseTypeName: 'Response',
    concurrency: 50,
    ...overrides,
  };
}

/**
 * Creates a temporary config fixture file that the dynamic import() can resolve.
 * Uses .mjs extension for direct ESM compatibility without needing tsx compilation.
 *
 * @param filename fixture 文件名（须以 .mjs 结尾）
 * @param defaultExport default 导出的源码片段（字符串，会被原样写入 `export default <source>;`）
 */
function createTempConfigFile(filename: string, defaultExport: string): string {
  const filePath = join(tempDir, filename);
  const fileContent = `export default ${defaultExport};\n`;
  writeFileSync(filePath, fileContent, 'utf-8');
  return filePath;
}

/**
 * Writes raw content to a fixture file（用于制造语法错误等场景）。
 */
function writeRawConfigFile(filename: string, content: string): string {
  const filePath = join(tempDir, filename);
  writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

describe('loadConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up temp files
    try {
      if (realExistsSync(tempDir)) {
        rmSync(tempDir, { recursive: true, force: true });
      }
      // Recreate temp dir for next test
      mkdirSync(tempDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should throw when config file is not found', async () => {
    mockExistsSync.mockReturnValue(false);
    const fakeError = new Error('配置文件未找到: /path/to/config.ts');
    mockConfigNotFound.mockReturnValue(fakeError);

    await expect(loadConfig('/path/to/config.ts')).rejects.toThrow('配置文件未找到');

    expect(mockExistsSync).toHaveBeenCalledWith(expect.stringContaining('config.ts'));
    expect(mockConfigNotFound).toHaveBeenCalledWith(expect.stringContaining('config.ts'));
  });

  it('should return processed config on successful load', async () => {
    // 夹具直接导出完整的 ApiConfig[] 字面量（defineConfig 处理后的产物）
    const processedConfig = makeApiConfig();
    const configPath = createTempConfigFile(
      'valid-config.mjs',
      JSON.stringify([processedConfig], null, 2),
    );
    mockExistsSync.mockReturnValue(true);

    const result = await loadConfig(configPath);

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject(processedConfig);
    // loader 不再调用 defineConfig / validateConfiguration，仅做类型守卫后原样返回
    expect(mockConfigParseError).not.toHaveBeenCalled();
  });

  it('should return config directly if already processed (multi-service ApiConfig[])', async () => {
    // 多服务场景：已是 ApiConfig[]，loader 直接返回，不再触发 defineConfig 合并
    const serviceA = makeApiConfig({
      source: 'https://a.example.com/v2/swagger.json',
      serverUrl: 'https://a.example.com',
      outputDir: 'src/service/a',
    });
    const serviceB = makeApiConfig({
      source: 'https://b.example.com/v2/swagger.json',
      serverUrl: 'https://b.example.com',
      serverType: 'swagger',
      outputDir: 'src/service/b',
    });
    const configPath = createTempConfigFile(
      'processed-config.mjs',
      JSON.stringify([serviceA, serviceB], null, 2),
    );
    mockExistsSync.mockReturnValue(true);

    const result = await loadConfig(configPath);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject(serviceA);
    expect(result[1]).toMatchObject(serviceB);
    expect(mockConfigParseError).not.toHaveBeenCalled();
  });

  it('should wrap unexpected errors (syntax error) in configParseError', async () => {
    // 配置文件存在语法错误，dynamic import 抛出原生错误，loader 包装为 configParseError
    const configPath = writeRawConfigFile(
      'broken-config.mjs',
      'export default { source: "https://example.com" this is broken };\n',
    );

    mockExistsSync.mockReturnValue(true);

    const wrappedError = new Error('配置文件解析失败');
    mockConfigParseError.mockReturnValue(wrappedError);

    await expect(loadConfig(configPath)).rejects.toThrow('配置文件解析失败');

    expect(mockConfigParseError).toHaveBeenCalledWith(
      expect.stringContaining('broken-config.mjs'),
      expect.any(Error),
    );
  });

  it('should throw configParseError when export is not a valid ApiConfig[] (plain object)', async () => {
    // 夹具导出一个普通对象（未用 defineConfig 包裹的原始 UserConfig），不满足 isProcessedConfig 类型守卫
    const configPath = createTempConfigFile(
      'invalid-export-object.mjs',
      JSON.stringify({ foo: 1, bar: 'not-an-api-config' }, null, 2),
    );
    mockExistsSync.mockReturnValue(true);

    const wrappedError = new Error('配置文件解析失败');
    mockConfigParseError.mockReturnValue(wrappedError);

    await expect(loadConfig(configPath)).rejects.toThrow('配置文件解析失败');

    expect(mockConfigParseError).toHaveBeenCalledWith(
      expect.stringContaining('invalid-export-object.mjs'),
      expect.any(Error),
    );
  });

  it('should throw configParseError when export is a raw (un-defineConfig-wrapped) config object', async () => {
    // 夹具导出的是「未经 defineConfig 处理」的原始单服务配置对象：
    // 缺少 serverUrl/serverType/outputDir 等 ApiConfig 必填字段，不满足 isApiConfig → 不满足 isProcessedConfig
    const configPath = createTempConfigFile(
      'raw-user-config.mjs',
      JSON.stringify(
        {
          source: 'https://petstore.swagger.io/v2/swagger.json',
          token: '',
        },
        null,
        2,
      ),
    );
    mockExistsSync.mockReturnValue(true);

    const wrappedError = new Error('配置文件解析失败');
    mockConfigParseError.mockReturnValue(wrappedError);

    await expect(loadConfig(configPath)).rejects.toThrow('配置文件解析失败');

    expect(mockConfigParseError).toHaveBeenCalledWith(
      expect.stringContaining('raw-user-config.mjs'),
      expect.any(Error),
    );
  });
});

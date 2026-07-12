/**
 * @description config/loader.ts 单元测试
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

// Mock validation module
vi.mock('@/validation', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('@/validation');
  return {
    ...actual,
    validateConfiguration: vi.fn(),
    ConfigValidationError: class extends Error {
      validationReport: any;
      constructor(report: any) {
        super('validation');
        this.name = 'ConfigValidationError';
        this.validationReport = report;
      }
    },
  };
});

// Mock defineConfig
vi.mock('@/utils/config', () => ({
  defineConfig: vi.fn(),
}));

// Mock errors module
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
import { validateConfiguration, ConfigValidationError, ValidationSeverity } from '@/validation';
import { defineConfig } from '@/utils/config';
import { ErrorFactory, BaseError } from '@/errors';

const mockExistsSync = vi.mocked(existsSync);
const mockValidateConfiguration = vi.mocked(validateConfiguration);
const mockDefineConfig = vi.mocked(defineConfig);
const mockConfigNotFound = vi.mocked(ErrorFactory.configNotFound);
const mockConfigParseError = vi.mocked(ErrorFactory.configParseError);

/**
 * Creates a temporary config fixture file that the dynamic import() can resolve.
 * Uses .mjs extension for direct ESM compatibility without needing tsx compilation.
 */
function createTempConfigFile(filename: string, content: Record<string, any>): string {
  const filePath = join(tempDir, filename);
  // Write a JS module that exports the config object as default
  const fileContent = `export default ${JSON.stringify(content)};\n`;
  writeFileSync(filePath, fileContent, 'utf-8');
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
    const userConfig = {
      source: 'https://petstore.swagger.io/v2/swagger.json',
      token: '',
    };

    const processedConfig = {
      ...userConfig,
      serverUrl: 'https://petstore.swagger.io',
      serverType: 'swagger',
      generateApi: true,
      generateTypes: true,
      typesFormat: 'typescript',
      target: 'typescript',
      pathPrefix: '',
      outputDir: 'src/service',
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
    };

    const configPath = createTempConfigFile('valid-config.mjs', userConfig);
    mockExistsSync.mockReturnValue(true);
    mockValidateConfiguration.mockReturnValue(undefined);
    mockDefineConfig.mockReturnValue(processedConfig as any);

    const result = await loadConfig(configPath);

    expect(result).toEqual(processedConfig);
    expect(mockValidateConfiguration).toHaveBeenCalledWith(userConfig);
    expect(mockDefineConfig).toHaveBeenCalledWith(userConfig);
  });

  it('should throw ConfigValidationError when validation fails', async () => {
    const userConfig = {
      source: 'invalid-url',
      token: '',
    };

    const configPath = createTempConfigFile('invalid-config.mjs', userConfig);
    mockExistsSync.mockReturnValue(true);

    const validationReport = {
      errors: [
        {
          field: 'source',
          code: 'INVALID_URL',
          message: 'Invalid URL',
          severity: ValidationSeverity.ERROR,
        },
      ],
      summary: { total: 1, errors: 1, warnings: 0, infos: 0 },
      hasBlockingErrors: true,
      hasErrors: true,
    };

    const validationError = new ConfigValidationError(validationReport);
    mockValidateConfiguration.mockImplementation(() => {
      throw validationError;
    });

    try {
      await loadConfig(configPath);
      expect.unreachable('Should have thrown');
    } catch (error: any) {
      expect(error).toBeInstanceOf(ConfigValidationError);
      expect(error.name).toBe('ConfigValidationError');
    }
  });

  it('should wrap unexpected errors in configParseError', async () => {
    // Create a config file with invalid JS syntax so dynamic import throws
    const configPath = join(tempDir, 'broken-config.mjs');
    writeFileSync(
      configPath,
      'export default { source: "https://example.com" this is broken };\n',
      'utf-8',
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

  it('should return config directly if already processed (has all ApiConfig fields)', async () => {
    // A config that already has all ApiConfig fields (isProcessedConfig returns true)
    const alreadyProcessedConfig = {
      source: 'https://petstore.swagger.io/v2/swagger.json',
      token: '',
      serverUrl: 'https://petstore.swagger.io',
      serverType: 'swagger',
      generateApi: true,
      generateTypes: true,
      typesFormat: 'typescript',
      target: 'typescript',
      pathPrefix: '',
      outputDir: 'src/service',
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
    };

    const configPath = createTempConfigFile('processed-config.mjs', alreadyProcessedConfig);
    mockExistsSync.mockReturnValue(true);
    mockValidateConfiguration.mockReturnValue(undefined);

    const result = await loadConfig(configPath);

    expect(result).toEqual(alreadyProcessedConfig);
    // defineConfig should NOT be called because config is already processed
    expect(mockDefineConfig).not.toHaveBeenCalled();
  });

  it('should re-throw BaseError as-is without wrapping', async () => {
    // Create a config that triggers a BaseError in validateConfiguration
    const userConfig = {
      source: 'https://petstore.swagger.io/v2/swagger.json',
      token: '',
    };

    const configPath = createTempConfigFile('base-error-config.mjs', userConfig);
    mockExistsSync.mockReturnValue(true);

    const baseError = new (BaseError as any)('Base error message');
    mockValidateConfiguration.mockImplementation(() => {
      throw baseError;
    });

    try {
      await loadConfig(configPath);
      expect.unreachable('Should have thrown');
    } catch (error: any) {
      expect(error).toBeInstanceOf(BaseError);
      expect(error.message).toBe('Base error message');
    }

    // configParseError should NOT have been called since BaseError is re-thrown directly
    expect(mockConfigParseError).not.toHaveBeenCalled();
  });
});

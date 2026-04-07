/**
 * @description codegen.ts 单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
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

// Hoist mock functions so they are available inside vi.mock factories
const {
  mockGenerateInterfaceFiles,
  mockGenerateRequestFile,
  mockGenerateTypeFiles,
  mockGenerateSchemaFiles,
  mockCleanOutputDir,
} = vi.hoisted(() => ({
  mockGenerateInterfaceFiles: vi.fn().mockResolvedValue(undefined),
  mockGenerateRequestFile: vi.fn().mockResolvedValue(undefined),
  mockGenerateTypeFiles: vi.fn().mockResolvedValue(undefined),
  mockGenerateSchemaFiles: vi.fn().mockResolvedValue(undefined),
  mockCleanOutputDir: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../fileGenerator', () => ({
  generateInterfaceFiles: mockGenerateInterfaceFiles,
  generateRequestFile: mockGenerateRequestFile,
  generateTypeFiles: mockGenerateTypeFiles,
  generateSchemaFiles: mockGenerateSchemaFiles,
}));

vi.mock('../../utils/file', () => ({
  cleanOutputDir: mockCleanOutputDir,
}));

import consola from 'consola';
import { generateFiles } from '../codegen';
import { minimalApiConfig, mockProcessedApiData } from '../../../tests/fixtures/mockData';

describe('generateFiles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call all generators in full mode (generateApi + generateTypes)', async () => {
    const config: ApiConfig = {
      ...minimalApiConfig,
      generateApi: true,
      generateTypes: true,
      typesFormat: 'typescript',
    };

    await generateFiles(mockProcessedApiData, config);

    // Should clean output dir
    expect(mockCleanOutputDir).toHaveBeenCalledWith(config.outputDir, [
      config.requestFunctionFilePath,
    ]);

    // Should generate interface files (shared by both generateApi and generateTypes)
    expect(mockGenerateInterfaceFiles).toHaveBeenCalledWith(
      mockProcessedApiData,
      config,
      config.hooks,
    );

    // Should generate request file (generateApi)
    expect(mockGenerateRequestFile).toHaveBeenCalledWith(config, config.hooks);

    // Should generate type files (generateTypes + typescript format)
    expect(mockGenerateTypeFiles).toHaveBeenCalledWith(mockProcessedApiData, config, config.hooks);

    // Should NOT generate schema files
    expect(mockGenerateSchemaFiles).not.toHaveBeenCalled();
  });

  it('should only generate interface and request files in apiOnly mode', async () => {
    const config: ApiConfig = {
      ...minimalApiConfig,
      generateApi: true,
      generateTypes: false,
    };

    await generateFiles(mockProcessedApiData, config);

    // Should generate interface files (generateApi is true)
    expect(mockGenerateInterfaceFiles).toHaveBeenCalledWith(
      mockProcessedApiData,
      config,
      config.hooks,
    );

    // Should generate request file
    expect(mockGenerateRequestFile).toHaveBeenCalledWith(config, config.hooks);

    // Should NOT generate type files or schema files
    expect(mockGenerateTypeFiles).not.toHaveBeenCalled();
    expect(mockGenerateSchemaFiles).not.toHaveBeenCalled();
  });

  it('should only generate interface and type files in typesOnly mode', async () => {
    const config: ApiConfig = {
      ...minimalApiConfig,
      generateApi: false,
      generateTypes: true,
      typesFormat: 'typescript',
    };

    await generateFiles(mockProcessedApiData, config);

    // Should generate interface files (generateTypes is true)
    expect(mockGenerateInterfaceFiles).toHaveBeenCalledWith(
      mockProcessedApiData,
      config,
      config.hooks,
    );

    // Should generate type files
    expect(mockGenerateTypeFiles).toHaveBeenCalledWith(mockProcessedApiData, config, config.hooks);

    // Should NOT generate request file
    expect(mockGenerateRequestFile).not.toHaveBeenCalled();

    // Should NOT generate schema files
    expect(mockGenerateSchemaFiles).not.toHaveBeenCalled();
  });

  it('should generate schema files instead of type files in zod mode', async () => {
    const config: ApiConfig = {
      ...minimalApiConfig,
      generateApi: true,
      generateTypes: true,
      typesFormat: 'zod',
    };

    await generateFiles(mockProcessedApiData, config);

    // Should generate schema files (zod mode)
    expect(mockGenerateSchemaFiles).toHaveBeenCalledWith(
      mockProcessedApiData,
      config,
      config.hooks,
    );

    // Should NOT generate type files (zod mode uses schema instead)
    expect(mockGenerateTypeFiles).not.toHaveBeenCalled();
  });

  it('should skip type generation when target is javascript', async () => {
    const config: ApiConfig = {
      ...minimalApiConfig,
      generateApi: true,
      generateTypes: true,
      typesFormat: 'typescript',
      target: 'javascript',
    };

    await generateFiles(mockProcessedApiData, config);

    // Should generate interface files (both flags true)
    expect(mockGenerateInterfaceFiles).toHaveBeenCalled();

    // Should generate request file (generateApi)
    expect(mockGenerateRequestFile).toHaveBeenCalled();

    // Should NOT generate type or schema files (javascript target)
    expect(mockGenerateTypeFiles).not.toHaveBeenCalled();
    expect(mockGenerateSchemaFiles).not.toHaveBeenCalled();
  });

  it('should exclude requestFunctionFilePath from cleanOutputDir when inside outputDir', async () => {
    const config: ApiConfig = {
      ...minimalApiConfig,
      outputDir: 'src/service',
      requestFunctionFilePath: 'src/service/request.ts',
    };

    await generateFiles(mockProcessedApiData, config);

    // Should exclude requestFunctionFilePath
    expect(mockCleanOutputDir).toHaveBeenCalledWith('src/service', ['src/service/request.ts']);
  });

  it('should re-throw errors after logging', async () => {
    const config: ApiConfig = { ...minimalApiConfig };
    const error = new Error('generation failed');
    mockCleanOutputDir.mockRejectedValueOnce(error);

    await expect(generateFiles(mockProcessedApiData, config)).rejects.toThrow('generation failed');

    expect(consola.error).toHaveBeenCalledWith('生成文件失败:', 'generation failed');
  });
});

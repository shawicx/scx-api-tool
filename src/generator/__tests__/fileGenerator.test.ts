/**
 * @description fileGenerator.ts 单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ApiConfig, CliHooks } from '@/types';

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

// Hoist mock functions so they are available inside vi.mock factories
const { mockFileExists, mockWriteFormattedFile, mockFormatCode, mockGenerateRequestFileContent } =
  vi.hoisted(() => ({
    mockFileExists: vi.fn().mockResolvedValue(false),
    mockWriteFormattedFile: vi.fn().mockResolvedValue(undefined),
    mockFormatCode: vi.fn().mockResolvedValue('formatted code'),
    mockGenerateRequestFileContent: vi.fn().mockReturnValue('generated content'),
  }));

vi.mock('../../utils/file', () => ({
  fileExists: mockFileExists,
  writeFormattedFile: mockWriteFormattedFile,
}));

vi.mock('../../utils/formatter', () => ({
  formatCode: mockFormatCode,
}));

vi.mock('../template', () => ({
  generateRequestFile: mockGenerateRequestFileContent,
}));

vi.mock('../pathUtils', () => ({
  aliasToRealPath: vi.fn((path: string) => path),
}));

import { logger } from '@/utils/logger';
import { generateRequestFile } from '../fileGenerator';
import { minimalApiConfig } from '../../../tests/fixtures/mockData';

describe('generateRequestFile', () => {
  let config: ApiConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    config = { ...minimalApiConfig, requestFunctionFilePath: 'src/service/request.ts' };
  });

  it('should generate, format, and write file when file does not exist', async () => {
    mockFileExists.mockResolvedValue(false);

    await generateRequestFile(config);

    // Should check if file exists
    expect(mockFileExists).toHaveBeenCalledWith('src/service/request.ts');

    // Should generate content from template
    expect(mockGenerateRequestFileContent).toHaveBeenCalledWith(config);

    // Should format the generated content
    expect(mockFormatCode).toHaveBeenCalledWith(
      'generated content',
      'src/service/request.ts',
      config.indentSize,
    );

    // Should write the formatted code to file
    expect(mockWriteFormattedFile).toHaveBeenCalledWith(
      'src/service/request.ts',
      'formatted code',
      undefined,
    );

    // Should log success message
    expect(logger.info).toHaveBeenCalledWith('创建请求函数文件: src/service/request.ts');
  });

  it('should skip generation when file already exists', async () => {
    mockFileExists.mockResolvedValue(true);

    await generateRequestFile(config);

    // Should check file existence
    expect(mockFileExists).toHaveBeenCalledWith('src/service/request.ts');

    // Should NOT generate content
    expect(mockGenerateRequestFileContent).not.toHaveBeenCalled();

    // Should NOT format or write
    expect(mockFormatCode).not.toHaveBeenCalled();
    expect(mockWriteFormattedFile).not.toHaveBeenCalled();
  });

  it('should throw and log error when generation fails', async () => {
    mockFileExists.mockResolvedValue(false);
    const error = new Error('write failed');
    mockWriteFormattedFile.mockRejectedValueOnce(error);

    await expect(generateRequestFile(config)).rejects.toThrow('write failed');

    expect(logger.error).toHaveBeenCalledWith('生成请求文件失败:', 'write failed');
  });

  it('should pass hooks to writeFormattedFile', async () => {
    mockFileExists.mockResolvedValue(false);
    const hooks: CliHooks = {
      beforeWriteFile: vi.fn().mockReturnValue('content'),
      afterWriteFile: vi.fn(),
    };
    const configWithHooks = { ...config, hooks };

    await generateRequestFile(configWithHooks, hooks);

    expect(mockWriteFormattedFile).toHaveBeenCalledWith(
      'src/service/request.ts',
      'formatted code',
      hooks,
    );
  });
});

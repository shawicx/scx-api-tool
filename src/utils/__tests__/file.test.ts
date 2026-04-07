/**
 * @description file.ts 单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

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

// Mock hooks module
vi.mock('../hooks', () => ({
  getHookManager: vi.fn().mockReturnValue({
    executeHook: vi.fn().mockResolvedValue(undefined),
    executeTransformHook: vi
      .fn()
      .mockImplementation(async (_fn: any, _path: string, content: string) => content),
  }),
}));

// Mock fs.promises
vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
    access: vi.fn().mockResolvedValue(undefined),
    readdir: vi.fn().mockResolvedValue([]),
    rm: vi.fn().mockResolvedValue(undefined),
  },
}));

import { promises as fs } from 'fs';
import { ensureDir, writeFormattedFile, fileExists, cleanOutputDir } from '../file';

describe('ensureDir', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create directory with recursive:true', async () => {
    await ensureDir('/some/nested/path');

    expect(fs.mkdir).toHaveBeenCalledWith('/some/nested/path', { recursive: true });
  });
});

describe('writeFormattedFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should write content to file', async () => {
    await writeFormattedFile('/output/test.ts', 'export const x = 1;');

    // Should create parent directory
    expect(fs.mkdir).toHaveBeenCalledWith('/output', { recursive: true });
    // Should write file with content
    expect(fs.writeFile).toHaveBeenCalledWith('/output/test.ts', 'export const x = 1;', 'utf-8');
  });

  it('should call beforeWriteFile hook and transform content', async () => {
    const { getHookManager } = await import('../hooks');
    const mockHookManager = {
      executeHook: vi.fn().mockResolvedValue(undefined),
      executeTransformHook: vi.fn().mockResolvedValue('// transformed\nexport const x = 1;'),
    };
    vi.mocked(getHookManager).mockReturnValue(mockHookManager as any);

    const beforeWriteFile = vi.fn();
    const hooks = { beforeWriteFile };

    await writeFormattedFile('/output/test.ts', 'export const x = 1;', hooks);

    expect(getHookManager).toHaveBeenCalled();
    expect(mockHookManager.executeTransformHook).toHaveBeenCalledWith(
      beforeWriteFile,
      '/output/test.ts',
      'export const x = 1;',
    );
    // Written content should be the transformed content
    expect(fs.writeFile).toHaveBeenCalledWith(
      '/output/test.ts',
      '// transformed\nexport const x = 1;',
      'utf-8',
    );
  });

  it('should call afterWriteFile hook after write', async () => {
    const { getHookManager } = await import('../hooks');
    const mockHookManager = {
      executeHook: vi.fn().mockResolvedValue(undefined),
      executeTransformHook: vi
        .fn()
        .mockImplementation(async (_fn: any, _path: string, content: string) => content),
    };
    vi.mocked(getHookManager).mockReturnValue(mockHookManager as any);

    const afterWriteFile = vi.fn();
    const hooks = { afterWriteFile };

    await writeFormattedFile('/output/test.ts', 'export const x = 1;', hooks);

    // Should have called afterWriteFile hook after writing
    expect(mockHookManager.executeHook).toHaveBeenCalledWith(afterWriteFile, '/output/test.ts');
    // File should be written before the hook is called
    expect(fs.writeFile).toHaveBeenCalled();
  });
});

describe('fileExists', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true for existing file', async () => {
    vi.mocked(fs.access).mockResolvedValue(undefined);

    const result = await fileExists('/path/to/existing/file.ts');

    expect(result).toBe(true);
    expect(fs.access).toHaveBeenCalledWith('/path/to/existing/file.ts');
  });

  it('should return false for non-existing file', async () => {
    vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'));

    const result = await fileExists('/path/to/missing/file.ts');

    expect(result).toBe(false);
    expect(fs.access).toHaveBeenCalledWith('/path/to/missing/file.ts');
  });
});

describe('cleanOutputDir', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should skip excluded files', async () => {
    // Directory exists
    vi.mocked(fs.access).mockResolvedValue(undefined);
    // Directory contains files
    vi.mocked(fs.readdir).mockResolvedValue(['user.ts', 'request.ts', 'types.ts'] as any);

    await cleanOutputDir('/output', ['/output/request.ts']);

    // Should remove non-excluded files
    expect(fs.rm).toHaveBeenCalledTimes(2);
    // request.ts should NOT be removed (excluded)
    const rmCalls = vi.mocked(fs.rm).mock.calls.map((call) => call[0]);
    expect(rmCalls).not.toContain('/output/request.ts');
    // user.ts and types.ts should be removed
    expect(rmCalls).toContain('/output/user.ts');
    expect(rmCalls).toContain('/output/types.ts');
  });

  it('should handle non-existent directory', async () => {
    // Directory does not exist
    vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'));

    await cleanOutputDir('/nonexistent');

    // Should not attempt to read or remove anything
    expect(fs.readdir).not.toHaveBeenCalled();
    expect(fs.rm).not.toHaveBeenCalled();
  });
});

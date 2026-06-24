/**
 * @description CLI init 命令单元测试
 * 覆盖配置文件创建、--force 覆盖、已存在时跳过
 *
 * 关键设计：
 * - mock @/utils/file（fileExists / writeFormattedFile）以隔离真实文件系统
 * - mock @/errors（handleError）避免真实错误处理副作用
 * - 通过 initCommand.parseAsync 触发 commander action
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('consola', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/errors', () => ({
  handleError: vi.fn(),
}));

const fileState = { exists: false };
const captured: { path: string; content: string } = { path: '', content: '' };

vi.mock('@/utils/file', () => ({
  fileExists: vi.fn(async () => fileState.exists),
  writeFormattedFile: vi.fn(async (filePath: string, content: string) => {
    captured.path = filePath;
    captured.content = content;
  }),
}));

import consola from 'consola';
import { initCommand } from '../init';
import { writeFormattedFile } from '@/utils/file';
import { DEFAULT_CONFIG } from '../../constants';

describe('init command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fileState.exists = false;
    captured.path = '';
    captured.content = '';
  });

  it('文件不存在时应写入默认配置', async () => {
    await initCommand.parseAsync(['node', 'init']);

    expect(writeFormattedFile).toHaveBeenCalled();
    expect(captured.content).toBe(DEFAULT_CONFIG);
    expect(captured.path).toContain('api-power.config.ts');
    expect(consola.success).toHaveBeenCalled();
  });

  it('文件已存在（无 --force）应 warn 且不写入', async () => {
    fileState.exists = true;
    await initCommand.parseAsync(['node', 'init']);

    expect(consola.warn).toHaveBeenCalled();
    expect(writeFormattedFile).not.toHaveBeenCalled();
  });

  it('--force 时即使已存在也应覆盖', async () => {
    fileState.exists = true;
    await initCommand.parseAsync(['node', 'init', '--force']);

    expect(writeFormattedFile).toHaveBeenCalled();
    expect(captured.content).toBe(DEFAULT_CONFIG);
  });
});

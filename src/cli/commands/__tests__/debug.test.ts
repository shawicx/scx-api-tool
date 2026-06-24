/**
 * @description CLI debug 命令单元测试
 * 覆盖 DEBUG 环境变量设置与 generateCode 调用
 *
 * 关键设计：mock @/generator（generateCode）+ @/errors（handleError），
 * 断言 process.env.DEBUG 被设为 'true' 且 generateCode 收到正确 config 路径。
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

vi.mock('@/generator', () => ({
  generateCode: vi.fn(async () => undefined),
}));

import { debugCommand } from '../debug';
import { generateCode } from '@/generator';

const mockGenerateCode = vi.mocked(generateCode);

describe('debug command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.DEBUG;
  });

  it('应设置 process.env.DEBUG=true 并调用 generateCode', async () => {
    await debugCommand.parseAsync(['node', 'debug', '-c', 'config.ts']);

    expect(process.env.DEBUG).toBe('true');
    expect(mockGenerateCode).toHaveBeenCalledWith('config.ts');
  });

  it('未指定 -c 应使用默认 config 路径', async () => {
    await debugCommand.parseAsync(['node', 'debug']);

    expect(mockGenerateCode).toHaveBeenCalledWith('api-power.config.ts');
  });
});

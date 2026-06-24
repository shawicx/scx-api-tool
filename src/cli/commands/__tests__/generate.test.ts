/**
 * @description CLI generate 命令单元测试（仅单次模式）
 *
 * watch 模式因启动 fs.watch 进程不退出，故跳过（见 spec P4 说明）。
 * 仅覆盖单次生成模式（非 watch）的 generateCode 调用与别名。
 *
 * 关键设计：
 * - mock @/generator（generateCode）+ @/errors（handleError）
 * - mock @/utils/progress（generate.ts 顶层引入 getProgressManager/createMultiStepProgress）
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

// mock progress 工具（generate 命令顶层引入；单次模式主要走 generateCode）
vi.mock('@/utils/progress', () => ({
  getProgressManager: vi.fn(() => ({
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  })),
  createMultiStepProgress: vi.fn(() => ({
    startStep: vi.fn(),
    completeCurrentStep: vi.fn(),
    complete: vi.fn(),
    failCurrentStep: vi.fn(),
  })),
}));

import { generateCommand } from '../generate';
import { generateCode } from '@/generator';

const mockGenerateCode = vi.mocked(generateCode);

describe('generate command (single-run)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('单次模式应使用默认 config 调用 generateCode', async () => {
    await generateCommand.parseAsync(['node', 'generate']);

    expect(mockGenerateCode).toHaveBeenCalledWith('api-power.config.ts');
  });

  it('-c 指定 config 应传递该路径', async () => {
    await generateCommand.parseAsync(['node', 'generate', '-c', 'custom.ts']);

    expect(mockGenerateCode).toHaveBeenCalledWith('custom.ts');
  });

  it('gen 别名应等价于 generate（使用默认 config 路径）', async () => {
    await generateCommand.parseAsync(['node', 'gen']);

    expect(mockGenerateCode).toHaveBeenCalledWith('api-power.config.ts');
  });
});

/**
 * @description hooks.ts 单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

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

import { logger } from '@/utils/logger';
import { getHookManager } from '../hooks';

describe('HookManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('executeHook', () => {
    it('should do nothing when hookFn is undefined', async () => {
      const manager = getHookManager();

      // Should not throw
      await expect(manager.executeHook(undefined)).resolves.toBeUndefined();
    });

    it('should execute synchronous hook function', async () => {
      const manager = getHookManager();
      const syncHook = vi.fn();

      await manager.executeHook(syncHook, 'arg1', 'arg2');

      expect(syncHook).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should await asynchronous hook function', async () => {
      const manager = getHookManager();
      const asyncHook = vi.fn().mockResolvedValue(undefined);

      await manager.executeHook(asyncHook, 'arg1');

      expect(asyncHook).toHaveBeenCalledWith('arg1');
    });

    it('should log warning and not throw when hook throws error', async () => {
      const manager = getHookManager();
      const errorHook = vi.fn().mockImplementation(() => {
        throw new Error('hook error');
      });

      // Should not throw
      await expect(manager.executeHook(errorHook)).resolves.toBeUndefined();

      // Should have logged a warning
      expect(logger.warn).toHaveBeenCalledWith('钩子执行失败:', 'hook error');
    });
  });

  describe('executeTransformHook', () => {
    it('should throw when hookFn is undefined', async () => {
      const manager = getHookManager();

      await expect(manager.executeTransformHook(undefined)).rejects.toThrow(
        'Original value not provided',
      );
    });

    it('should return result from synchronous transform function', async () => {
      const manager = getHookManager();
      const transformFn = vi.fn().mockReturnValue('transformed');

      const result = await manager.executeTransformHook(transformFn, 'input');

      expect(result).toBe('transformed');
      expect(transformFn).toHaveBeenCalledWith('input');
    });

    it('should return result from asynchronous transform function', async () => {
      const manager = getHookManager();
      const asyncTransformFn = vi.fn().mockResolvedValue('async transformed');

      const result = await manager.executeTransformHook(asyncTransformFn, 'input');

      expect(result).toBe('async transformed');
      expect(asyncTransformFn).toHaveBeenCalledWith('input');
    });

    it('should log warning and re-throw when transform hook throws error', async () => {
      const manager = getHookManager();
      const errorTransform = vi.fn().mockImplementation(() => {
        throw new Error('transform error');
      });

      await expect(manager.executeTransformHook(errorTransform)).rejects.toThrow('transform error');

      expect(logger.warn).toHaveBeenCalledWith('钩子执行失败，使用原始值:', 'transform error');
    });
  });

  describe('getHookManager', () => {
    it('should return same instance (singleton)', () => {
      // Note: the singleton is module-level, so we can't easily reset it.
      // We verify that multiple calls return the same object reference.
      const instance1 = getHookManager();
      const instance2 = getHookManager();

      expect(instance1).toBe(instance2);
    });
  });
});

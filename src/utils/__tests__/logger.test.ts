/**
 * @description logger 模块单元测试
 * 覆盖 setDebugEnabled / isDebugEnabled / logger.debug 的开关行为
 *
 * 关键设计：mock consola，断言 logger.debug 仅在 setDebugEnabled(true) 后调用 consola.debug，
 * 其余级别始终调用对应 consola 方法。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('consola', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import consola from 'consola';
import { logger, setDebugEnabled, isDebugEnabled } from '../logger';

describe('logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setDebugEnabled(false);
  });

  describe('isDebugEnabled / setDebugEnabled', () => {
    it('默认应返回 false（测试环境无 DEBUG）', () => {
      expect(isDebugEnabled()).toBe(false);
    });

    it('setDebugEnabled(true) 后应返回 true', () => {
      setDebugEnabled(true);
      expect(isDebugEnabled()).toBe(true);
    });

    it('setDebugEnabled(false) 后应返回 false', () => {
      setDebugEnabled(true);
      setDebugEnabled(false);
      expect(isDebugEnabled()).toBe(false);
    });
  });

  describe('logger.debug', () => {
    it('debug 关闭时不应调用 consola.debug', () => {
      logger.debug('test');
      expect(consola.debug).not.toHaveBeenCalled();
    });

    it('debug 开启时应调用 consola.debug', () => {
      setDebugEnabled(true);
      logger.debug('test', { a: 1 });
      expect(consola.debug).toHaveBeenCalledWith('test', { a: 1 });
    });

    it('debug 开启后关闭，应停止调用 consola.debug', () => {
      setDebugEnabled(true);
      logger.debug('first');
      expect(consola.debug).toHaveBeenCalledTimes(1);

      setDebugEnabled(false);
      logger.debug('second');
      expect(consola.debug).toHaveBeenCalledTimes(1);
    });
  });

  describe('非 debug 级别始终输出', () => {
    it('logger.info 应始终调用 consola.info', () => {
      logger.info('info msg');
      setDebugEnabled(true);
      logger.info('info msg 2');
      expect(consola.info).toHaveBeenCalledTimes(2);
    });

    it('logger.success 应始终调用 consola.success', () => {
      logger.success('done');
      expect(consola.success).toHaveBeenCalledWith('done');
    });

    it('logger.warn 应始终调用 consola.warn', () => {
      logger.warn('warning');
      expect(consola.warn).toHaveBeenCalledWith('warning');
    });

    it('logger.error 应始终调用 consola.error', () => {
      logger.error('error');
      expect(consola.error).toHaveBeenCalledWith('error');
    });
  });
});

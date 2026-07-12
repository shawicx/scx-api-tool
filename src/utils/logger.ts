/**
 * @description 统一日志模块
 * 基于 consola 封装，提供运行时 debug 开关，消除全项目的 if(process.env.DEBUG) 手动守卫
 *
 * 设计要点：consola 在模块导入时根据 process.env.DEBUG 固化日志级别，
 * 但 CLI 的 debug 命令在 action 中才设置该变量，导致 consola 内置级别检测失效。
 * 本模块通过运行时布尔开关解决该时序问题，debug 命令调用 setDebugEnabled(true) 即可激活 debug 日志。
 *
 * @example
 * ```typescript
 * import { logger, setDebugEnabled } from '@/utils/logger';
 *
 * // 普通日志，始终输出
 * logger.info('开始处理');
 * logger.success('处理完成');
 *
 * // debug 日志，仅 setDebugEnabled(true) 后输出
 * logger.debug('调试细节:', data);
 *
 * // 在 debug 命令中启用
 * setDebugEnabled(true);
 * ```
 */

import consola from 'consola';

/** 运行时 debug 开关，初始化时读取环境变量作为默认值 */
let debugEnabled = Boolean(process.env.DEBUG);

/**
 * @description 启用/禁用 debug 级别日志（运行时开关）
 * @param enabled 是否启用 debug 日志
 *
 * @example
 * ```typescript
 * setDebugEnabled(true);  // 启用 debug 日志
 * setDebugEnabled(false); // 关闭 debug 日志
 * ```
 */
export function setDebugEnabled(enabled: boolean): void {
  debugEnabled = enabled;
}

/**
 * @description 查询当前是否启用 debug 日志
 * @returns debug 日志是否启用
 */
export function isDebugEnabled(): boolean {
  return debugEnabled;
}

/**
 * @description Logger 接口定义，便于测试中 mock
 */
export interface Logger {
  debug: (...args: any[]) => void;
  info: (...args: any[]) => void;
  success: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
}

/**
 * 统一 logger 实例
 * - debug：受运行时开关控制，仅 setDebugEnabled(true) 后输出
 * - info/success/warn/error：始终输出
 */
export const logger: Logger = {
  /**
   * @description 输出 debug 级别日志（受运行时开关控制）
   * @param args 日志参数
   */
  debug(...args: any[]): void {
    if (debugEnabled) {
      (consola.debug as (...a: any[]) => void)(...args);
    }
  },

  /**
   * @description 输出 info 级别日志（始终输出）
   * @param args 日志参数
   */
  info(...args: any[]): void {
    (consola.info as (...a: any[]) => void)(...args);
  },

  /**
   * @description 输出 success 级别日志（始终输出）
   * @param args 日志参数
   */
  success(...args: any[]): void {
    (consola.success as (...a: any[]) => void)(...args);
  },

  /**
   * @description 输出 warn 级别日志（始终输出）
   * @param args 日志参数
   */
  warn(...args: any[]): void {
    (consola.warn as (...a: any[]) => void)(...args);
  },

  /**
   * @description 输出 error 级别日志（始终输出）
   * @param args 日志参数
   */
  error(...args: any[]): void {
    (consola.error as (...a: any[]) => void)(...args);
  },
};

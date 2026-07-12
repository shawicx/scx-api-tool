/**
 * @description 钩子管理器
 * 提供钩子函数的执行和错误处理
 */

import { logger } from '@/utils/logger';

/**
 * @description 钩子管理器类
 * 负责执行用户定义的钩子函数，并提供统一的错误处理
 */
class HookManager {
  /**
   * @description 执行普通钩子函数（无返回值）
   * @param hookFn 钩子函数（可选）
   * @param args 传递给钩子函数的参数
   *
   * @example
   * ```typescript
   * await hookManager.executeHook(hooks.beforeGenerate);
   * await hookManager.executeHook(hooks.beforeWriteFile, filePath, content);
   * ```
   */
  async executeHook(
    hookFn?: (...args: any[]) => void | Promise<void>,
    ...args: any[]
  ): Promise<void> {
    if (!hookFn) {
      return;
    }

    try {
      const result = hookFn(...args);
      if (result instanceof Promise) {
        await result;
      }
    } catch (error: any) {
      logger.warn('钩子执行失败:', error.message || error);
    }
  }

  /**
   * @description 执行转换钩子函数（有返回值）
   * @param hookFn 钩子函数（可选）
   * @param args 传递给钩子函数的参数
   * @returns 返回转换后的值，如果钩子未定义或失败则返回原始值
   *
   * @example
   * ```typescript
   * const transformedContent = await hookManager.executeTransformHook(
   *   hooks.beforeWriteFile,
   *   filePath,
   *   content
   * );
   * ```
   */
  async executeTransformHook<T>(
    hookFn?: (...args: any[]) => T | Promise<T>,
    ...args: any[]
  ): Promise<T> {
    if (!hookFn) {
      throw new Error('Original value not provided');
    }

    try {
      const result = hookFn(...args);
      return result instanceof Promise ? await result : result;
    } catch (error: any) {
      logger.warn('钩子执行失败，使用原始值:', error.message || error);
      throw error;
    }
  }
}

let defaultManager: HookManager | null = null;

/**
 * @description 获取钩子管理器实例
 * @returns 钩子管理器单例
 */
export function getHookManager(): HookManager {
  if (!defaultManager) {
    defaultManager = new HookManager();
  }
  return defaultManager;
}

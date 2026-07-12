/**
 * @description 错误处理装饰器
 * 提供统一的错误处理模式，减少重复的 try-catch 代码
 */

import { logger } from '@/utils/logger';

/**
 * @description 装饰器配置选项
 */
export interface DecoratorOptions {
  /** 是否在错误时返回默认值而不是抛出异常（支持函数形式） */
  fallbackValue?: unknown | ((...args: unknown[]) => unknown);
  /** 是否记录错误日志 */
  logError?: boolean;
  /** 自定义错误消息 */
  errorMessage?: string;
  /** 错误日志前缀 */
  logPrefix?: string;
  /** 是否包装为特定错误类型 */
  wrapAs?: 'fetch' | 'config' | 'parse';
}

/**
 * @description 异步函数包装器（函数式版本）
 * 用于不需要装饰器语法的地方。保留被包装函数的完整类型签名（参数与返回值）。
 *
 * @example
 * ```typescript
 * const safeFormat = withErrorHandler(formatCode, {
 *   fallbackValue: (_code, _filePath) => _code, // 返回原始输入
 *   logError: true,
 *   logPrefix: '[Format]'
 * });
 * ```
 */
export function withErrorHandler<A extends unknown[], R>(
  fn: (...args: A) => Promise<R>,
  options: DecoratorOptions = {},
): (...args: A) => Promise<R> {
  const { fallbackValue, logError = false, errorMessage, logPrefix = '[ErrorHandler]' } = options;

  return async function (this: unknown, ...args: A): Promise<R> {
    try {
      return await fn.apply(this, args);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));

      if (logError) {
        logger.error(`${logPrefix} ${errorMessage || err.message}`, err);
      }

      if (fallbackValue !== undefined) {
        // 如果 fallbackValue 是函数，调用它获取返回值
        return (
          typeof fallbackValue === 'function'
            ? (fallbackValue as (...args: A) => R)(...args)
            : (fallbackValue as R)
        ) as R;
      }

      throw err;
    }
  };
}

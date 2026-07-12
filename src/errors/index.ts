/**
 * @description 统一的错误处理系统
 * 提供结构化的错误类型和解决方案建议
 */
import { logger } from '@/utils/logger';
import { BaseError } from './errorClasses';

export { ErrorCode } from './errorCodes';
export { BaseError } from './errorClasses';
export type { ConfigError, FetchError, GenerateError, ErrorSolution } from './errorClasses';
export { ErrorFactory } from './errorFactory';

/**
 * @description 全局错误处理函数
 * 在 CLI 的顶层捕获所有错误并统一处理
 * @param error 错误对象
 * @param verbose 是否显示详细信息（堆栈跟踪、原始错误）
 * @returns never
 *
 * @example
 * ```typescript
 * try {
 *   await generateCode();
 * } catch (error) {
 *   handleError(error, true);
 * }
 * ```
 */
export function handleError(error: unknown, verbose = false): never {
  if (error instanceof BaseError) {
    error.print(verbose);
    process.exit(1);
  }

  if (error instanceof Error) {
    const message = error.message || '发生未知错误';
    logger.error(`✖ ${message}`);

    if (verbose) {
      logger.error('');
      logger.error('堆栈跟踪:');
      logger.error(error.stack);
    }

    process.exit(1);
  }

  const errorMessage = String(error);
  logger.error(`✖ ${errorMessage}`);
  process.exit(1);
}

/**
 * @description 异步包装器
 * 自动捕获并处理异步函数中的错误
 * @param fn 要包装的异步函数
 * @param verbose 是否显示详细信息
 * @returns 包装后的函数
 *
 * @example
 * ```typescript
 * const wrappedGenerate = withErrorHandling(generateCode, true);
 * await wrappedGenerate();
 * ```
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  verbose = false,
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, verbose);
    }
  }) as T;
}

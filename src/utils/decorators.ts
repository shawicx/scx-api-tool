/**
 * @description 错误处理装饰器
 * 提供统一的错误处理模式，减少重复的 try-catch 代码
 */

import consola from 'consola';
import type { ApiConfig } from '@/types';
import { ErrorFactory, BaseError } from '@/errors';

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
 * @description 错误处理装饰器
 * 捕获函数执行中的错误，支持返回默认值或记录日志
 *
 * @example
 * ```typescript
 * class MyClass {
 *   @handleError({ fallbackValue: '', logError: true })
 *   myMethod() {
 *     // 可能抛出错误的代码
 *   }
 * }
 * ```
 */
export function handleError(options: DecoratorOptions = {}) {
  const { fallbackValue, logError = false, errorMessage, logPrefix = '[ErrorHandler]' } = options;

  return function (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: unknown, ...args: unknown[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));

        if (logError) {
          consola.error(`${logPrefix} ${errorMessage || err.message}`, err);
        }

        if (fallbackValue !== undefined) {
          return fallbackValue;
        }

        throw err;
      }
    };

    return descriptor;
  };
}

/**
 * @description 异步函数包装器（函数式版本）
 * 用于不需要装饰器语法的地方
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
export function withErrorHandler<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options: DecoratorOptions = {},
): T {
  const { fallbackValue, logError = false, errorMessage, logPrefix = '[ErrorHandler]' } = options;

  return async function (this: unknown, ...args: unknown[]) {
    try {
      return await fn.apply(this, args);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));

      if (logError) {
        consola.error(`${logPrefix} ${errorMessage || err.message}`, err);
      }

      if (fallbackValue !== undefined) {
        // 如果 fallbackValue 是函数，调用它获取返回值
        return typeof fallbackValue === 'function'
          ? (fallbackValue as (...args: unknown[]) => unknown)(...args)
          : fallbackValue;
      }

      throw err;
    }
  } as T;
}

/**
 * @description 配置加载错误处理器
 * 专门用于配置加载场景的错误处理
 */
export function handleConfigLoadError(configPath: string, error: unknown): never {
  // 如果是我们自定义的错误，直接抛出
  if (error instanceof BaseError) {
    throw error;
  }

  // 否则包装为配置解析错误
  throw ErrorFactory.configParseError(configPath, error);
}

/**
 * @description 客户端错误处理器
 * 专门用于客户端数据获取的错误处理
 */
export function handleClientError(error: unknown, config: ApiConfig, clientName: string): never {
  // 如果已经是我们的错误类型，直接抛出
  if (error instanceof Error && error.name === 'FetchError') {
    throw error;
  }

  // 否则包装为 FetchError（保留 clientName 上下文）
  const message = error instanceof Error ? error.message : String(error);
  const wrappedError =
    error instanceof Error ? error : new Error(`${clientName} 客户端获取数据失败: ${message}`);
  throw ErrorFactory.fetchFailed(config.source, undefined, wrappedError);
}

/**
 * @description 重试装饰器
 * 为异步方法提供自动重试功能
 *
 * @example
 * ```typescript
 * class MyClient {
 *   @retryable({ maxRetries: 3, delay: 1000 })
 *   async fetchData() {
 *     // 可能失败的网络请求
 *   }
 * }
 * ```
 */
export function retryable(
  options: { maxRetries?: number; delay?: number; exponentialBackoff?: boolean } = {},
) {
  const { maxRetries = 3, delay = 1000, exponentialBackoff = true } = options;

  return function (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: unknown, ...args: unknown[]) {
      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error: unknown) {
          lastError = error instanceof Error ? error : new Error(String(error));

          // 最后一次重试失败，不再延迟
          if (attempt < maxRetries) {
            const delayMs = exponentialBackoff ? delay * Math.pow(2, attempt) : delay;
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }
        }
      }

      throw lastError;
    };

    return descriptor;
  };
}

/**
 * @description 超时装饰器
 * 为异步方法添加超时控制
 *
 * @example
 * ```typescript
 * class MyClient {
 *   @timeout(5000)
 *   async fetchData() {
 *     // 可能耗时很长的操作
 *   }
 * }
 * ```
 */
export function timeout(timeoutMs: number) {
  return function (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: unknown, ...args: unknown[]) {
      let timeoutId: NodeJS.Timeout;

      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`操作超时（${timeoutMs}ms）`));
        }, timeoutMs);
      });

      return Promise.race([originalMethod.apply(this, args), timeoutPromise]).then(
        (result) => {
          clearTimeout(timeoutId);
          return result;
        },
        (error) => {
          clearTimeout(timeoutId);
          throw error;
        },
      );
    };

    return descriptor;
  };
}

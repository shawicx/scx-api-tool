/**
 * @description 客户端抽象基类
 * 为所有 API 客户端提供统一的接口和通用功能
 */

import type { ApiConfig } from '@/types';
import { ErrorFactory } from '@/errors';

/**
 * @description API 数据获取结果
 */
export interface FetchResult<T = any> {
  /** 原始数据 */
  data: T;
  /** 数据来源类型 */
  sourceType: string;
  /** 获取时间戳 */
  timestamp: number;
}

/**
 * @description 客户端配置选项
 */
export interface ClientOptions {
  /** 请求超时时间（毫秒） */
  timeout?: number;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 重试延迟（毫秒） */
  retryDelay?: number;
}

/**
 * @description 客户端元信息
 */
export interface ClientMetadata {
  /** 客户端类型标识 */
  type: string;
  /** 客户端名称 */
  name: string;
  /** 客户端版本 */
  version: string;
  /** 支持的 URL 模式 */
  urlPatterns: RegExp[];
}

/**
 * @description 抽象客户端基类
 * 所有 API 客户端都应该继承此类并实现抽象方法
 */
export abstract class BaseClient {
  /** 客户端配置选项 */
  protected options: ClientOptions;

  constructor(options: ClientOptions = {}) {
    this.options = {
      timeout: 30000, // 默认 30 秒
      maxRetries: 3, // 默认重试 3 次
      retryDelay: 1000, // 默认重试延迟 1 秒
      ...options,
    };
  }

  /**
   * @description 获取客户端元信息
   * 子类必须实现此方法
   */
  abstract getMetadata(): ClientMetadata;

  /**
   * @description 验证配置是否适用于此客户端
   * @param config API 配置
   * @returns 是否支持
   */
  abstract supports(config: ApiConfig): boolean;

  /**
   * @description 获取 API 数据的核心方法
   * 子类必须实现此方法
   * @param config API 配置
   * @returns Promise<FetchResult>
   */
  protected abstract fetchDataInternal(config: ApiConfig): Promise<any>;

  /**
   * @description 公共的数据获取接口
   * 提供重试、超时、错误处理等通用功能
   * @param config API 配置
   * @returns Promise<FetchResult>
   */
  async fetch(config: ApiConfig): Promise<FetchResult> {
    const metadata = this.getMetadata();

    if (!this.supports(config)) {
      throw ErrorFactory.configInvalid(`配置不适用于 ${metadata.name} 客户端`, [
        {
          title: '检查配置兼容性',
          steps: [
            `确认 serverType 为 "${metadata.type}"`,
            `检查 source URL 是否符合 ${metadata.name} 格式`,
            `参考文档了解正确的配置方式`,
          ],
        },
      ]);
    }

    try {
      // 执行数据获取（带重试）
      const data = await this.executeWithRetry(() => this.fetchDataInternal(config));

      return {
        data,
        sourceType: metadata.type,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      throw this.wrapError(error, config);
    }
  }

  /**
   * @description 带重试机制的执行
   * @param fn 要执行的异步函数
   * @returns 执行结果
   */
  protected async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= (this.options.maxRetries || 0); attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;

        // 最后一次重试失败，不再延迟
        if (attempt < (this.options.maxRetries || 0)) {
          // 指数退避延迟
          const delay = (this.options.retryDelay || 1000) * Math.pow(2, attempt);
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * @description 包装客户端错误
   * @param error 原始错误
   * @param config API 配置
   * @returns 包装后的错误
   */
  protected wrapError(error: any, config: ApiConfig): Error {
    const metadata = this.getMetadata();

    // 如果已经是我们的错误类型，直接返回
    if (error.name === 'FetchError') {
      return error;
    }

    // 否则包装为 FetchError
    return ErrorFactory.fetchError(
      `${metadata.name} 客户端获取数据失败: ${error.message || error}`,
      config.source,
    );
  }

  /**
   * @description 延迟函数
   * @param ms 延迟毫秒数
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * @description 创建带超时的 Promise
   * @param promise 原始 Promise
   * @param timeoutMs 超时时间（毫秒）
   * @returns 带超时的 Promise
   */
  protected withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timeoutId: NodeJS.Timeout;

    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`操作超时（${timeoutMs}ms）`));
      }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]).then(
      (result) => {
        clearTimeout(timeoutId); // 清除定时器，防止阻止进程退出
        return result;
      },
      (error) => {
        clearTimeout(timeoutId); // 错误时也要清除定时器
        throw error;
      },
    );
  }

  /**
   * @description 验证 URL 是否匹配指定模式
   * @param url 要验证的 URL
   * @param patterns URL 模式数组
   * @returns 是否匹配
   */
  protected matchUrlPatterns(url: string, patterns: RegExp[]): boolean {
    return patterns.some((pattern) => pattern.test(url));
  }
}

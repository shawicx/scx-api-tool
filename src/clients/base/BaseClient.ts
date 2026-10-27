/**
 * @description 客户端抽象基类
 * 为所有 API 客户端提供统一的接口和通用功能
 */

import type { ApiConfig, OpenApiDocument } from '@/types';
import { ErrorFactory } from '@/errors';
import { FetchError } from '@/errors/errorClasses';
import { logger } from '@/utils/logger';
import { describeRequestError, isRetryableError } from './requestErrorMapper';

/**
 * @description 单次尝试的失败记录（用于日志与最终错误信息中的失败明细）
 */
export interface AttemptFailure {
  /** 尝试序号（从 1 开始） */
  attempt: number;
  /** 可读失败原因（单行） */
  reason: string;
}

/**
 * @description API 数据获取结果
 */
export interface FetchResult<T = unknown> {
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
  protected abstract fetchDataInternal(config: ApiConfig): Promise<unknown>;

  /**
   * @description 将原始获取数据标准化为标准 OpenAPI 文档
   * 各客户端实现特定平台的格式适配（如 Apifox 的非标准字段补全）。
   * 在 fetch() 内部于获取成功后自动调用，对上层透明。
   * @param rawData 原始获取数据
   * @returns 标准化后的 OpenApiDocument
   */
  protected abstract normalize(rawData: unknown): OpenApiDocument;

  /**
   * @description 公共的数据获取接口
   * 提供重试、超时、错误处理等通用功能
   * @param config API 配置
   * @returns Promise<FetchResult>
   */
  async fetch(config: ApiConfig): Promise<FetchResult<OpenApiDocument>> {
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

    const failures: AttemptFailure[] = [];

    try {
      // 执行数据获取（带重试），记录每次失败的可读原因
      const data = await this.executeWithRetry(
        () => this.fetchDataInternal(config),
        (failure) => failures.push(failure),
      );
      // 标准化为统一 OpenAPI 文档格式（平台特定适配在各客户端 normalize 中实现）
      const normalized = this.normalize(data);

      return {
        data: normalized,
        sourceType: metadata.type,
        timestamp: Date.now(),
      };
    } catch (error: unknown) {
      throw this.wrapError(error, config, failures);
    }
  }

  /**
   * @description 带重试机制的执行
   * 每次失败输出可读的警告日志；token 失效/响应格式错误等确定性失败不重试
   * @param fn 要执行的异步函数
   * @param onAttemptFailed 单次尝试失败回调（记录失败明细，可选）
   * @returns 执行结果
   */
  protected async executeWithRetry<T>(
    fn: () => Promise<T>,
    onAttemptFailed?: (failure: AttemptFailure) => void,
  ): Promise<T> {
    let lastError: Error | null = null;
    const maxRetries = this.options.maxRetries || 0;
    const totalAttempts = maxRetries + 1;

    for (let attempt = 1; attempt <= totalAttempts; attempt++) {
      try {
        return await fn();
      } catch (error: unknown) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const reason = describeRequestError(lastError);

        onAttemptFailed?.({ attempt, reason });

        // 确定性失败（token 失效/响应格式错误等）重试不会成功，直接终止
        if (!isRetryableError(lastError)) {
          throw lastError;
        }

        if (attempt < totalAttempts) {
          // 指数退避延迟
          const delay = (this.options.retryDelay || 1000) * Math.pow(2, attempt - 1);
          logger.warn(
            `请求失败（第 ${attempt}/${totalAttempts} 次尝试）：${reason}，${delay}ms 后重试`,
          );
          await this.sleep(delay);
        } else {
          logger.warn(`请求失败（第 ${attempt}/${totalAttempts} 次尝试）：${reason}`);
        }
      }
    }

    throw lastError;
  }

  /**
   * @description 包装客户端错误
   * 多次尝试均失败时，将失败明细列表（每次尝试的可读原因）附加到错误消息中
   * @param error 原始错误
   * @param config API 配置
   * @param failures 各次尝试的失败记录（来自 executeWithRetry）
   * @returns 包装后的错误
   */
  protected wrapError(error: unknown, config: ApiConfig, failures: AttemptFailure[] = []): Error {
    let base: FetchError;

    // 如果已经是我们的错误类型，保留其错误码与解决方案
    if (error instanceof FetchError) {
      base = error;
    } else {
      // 否则包装为 FetchError
      base = ErrorFactory.fetchFailed(
        config.source,
        undefined,
        error instanceof Error ? error : new Error(String(error)),
      );
    }

    // 多次尝试均失败时附加失败明细，单次失败保持原消息
    if (failures.length > 1) {
      const detail = failures.map((f) => `  第 ${f.attempt} 次尝试: ${f.reason}`).join('\n');
      return new FetchError(
        `${base.message}\n失败明细（共尝试 ${failures.length} 次）:\n${detail}`,
        base.solutions,
        base.originalError,
        base.code,
      );
    }

    return base;
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

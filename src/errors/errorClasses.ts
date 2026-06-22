import consola from 'consola';
import { ErrorCode } from './errorCodes';

/**
 * @description 错误解决方案接口
 * 定义错误解决方案的结构
 */
export interface ErrorSolution {
  /**
   * @description 解决方案标题
   */
  title: string;

  /**
   * @description 解决步骤列表
   */
  steps: string[];

  /**
   * @description 相关文档链接（可选）
   */
  documentation?: string;
}

/**
 * @description 基础错误类
 * 所有自定义错误的基类，提供统一的错误处理和解决方案展示
 *
 * @example
 * ```typescript
 * throw new BaseError(
 *   ErrorCode.CONFIG_INVALID,
 *   '配置文件无效',
 *   [{ title: '检查配置', steps: ['验证配置文件格式'] }]
 * );
 * ```
 */
export class BaseError extends Error {
  /**
   * @description 错误代码
   */
  code: ErrorCode;

  /**
   * @description 解决方案列表
   */
  solutions: ErrorSolution[];

  /**
   * @description 原始错误（如果存在）
   */
  originalError?: Error;

  /**
   * @param code 错误代码
   * @param message 错误消息
   * @param solutions 解决方案列表
   * @param originalError 原始错误（可选）
   */
  constructor(code: ErrorCode, message: string, solutions: ErrorSolution[], originalError?: Error) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.solutions = solutions;
    this.originalError = originalError;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * @description 格式化错误输出为字符串
   * @param verbose 是否显示详细信息（堆栈跟踪、原始错误）
   * @returns 格式化的错误字符串
   *
   * @example
   * ```typescript
   * const error = new BaseError(...);
   * console.log(error.format(false)); // 简洁输出
   * console.log(error.format(true));  // 详细输出
   * ```
   */
  format(verbose = false): string {
    const lines = [`✖ ${this.message}`, '', `错误代码: ${this.code}`];

    if (this.solutions.length > 0) {
      lines.push('', '💡 解决方案:');
      this.solutions.forEach((solution, index) => {
        lines.push('');
        lines.push(`${index + 1}. ${solution.title}`);
        solution.steps.forEach((step, i) => {
          lines.push(`   ${i + 1}. ${step}`);
        });
        if (solution.documentation) {
          lines.push(`   📖 ${solution.documentation}`);
        }
      });
    }

    if (verbose) {
      if (this.originalError) {
        lines.push('');
        lines.push('原始错误:');
        lines.push(this.originalError.toString());
      }
      if (this.stack) {
        lines.push('');
        lines.push('堆栈跟踪:');
        lines.push(this.stack);
      }
    }

    return lines.join('\n');
  }

  /**
   * @description 输出错误到控制台
   * @param verbose 是否显示详细信息
   *
   * @example
   * ```typescript
   * const error = new BaseError(...);
   * error.print();        // 输出到控制台
   * error.print(true);    // 输出详细信息
   * ```
   */
  print(verbose = false): void {
    consola.error(this.format(verbose));
  }
}

/**
 * @description 配置错误类
 * 用于表示配置相关的错误
 *
 * @example
 * ```typescript
 * throw new ConfigError('配置文件无效', [
 *   { title: '检查配置', steps: ['验证配置文件格式'] }
 * ]);
 * ```
 */
export class ConfigError extends BaseError {
  /**
   * @param message 错误消息
   * @param solutions 解决方案列表
   * @param originalError 原始错误（可选）
   * @param code 错误码（默认 CONFIG_INVALID，推荐通过 ErrorFactory 工厂方法传入精确码）
   */
  constructor(
    message: string,
    solutions: ErrorSolution[],
    originalError?: Error,
    code: ErrorCode = ErrorCode.CONFIG_INVALID,
  ) {
    super(code, message, solutions, originalError);
  }
}

/**
 * @description 网络请求错误类
 * 用于表示网络请求相关的错误
 *
 * @example
 * ```typescript
 * throw new FetchError('API 请求失败', [
 *   { title: '检查网络', steps: ['确认网络连接正常'] }
 * ]);
 * ```
 */
export class FetchError extends BaseError {
  /**
   * @param message 错误消息
   * @param solutions 解决方案列表
   * @param originalError 原始错误（可选）
   * @param code 错误码（默认 FETCH_REQUEST_FAILED，推荐通过 ErrorFactory 工厂方法传入精确码）
   */
  constructor(
    message: string,
    solutions: ErrorSolution[],
    originalError?: Error,
    code: ErrorCode = ErrorCode.FETCH_REQUEST_FAILED,
  ) {
    super(code, message, solutions, originalError);
  }
}

/**
 * @description 代码生成错误类
 * 用于表示代码生成相关的错误
 *
 * @example
 * ```typescript
 * throw new GenerateError('模板编译失败', [
 *   { title: '检查模板', steps: ['验证模板文件存在'] }
 * ]);
 * ```
 */
export class GenerateError extends BaseError {
  /**
   * @param message 错误消息
   * @param solutions 解决方案列表
   * @param originalError 原始错误（可选）
   * @param code 错误码（默认 GENERATE_TEMPLATE_ERROR，推荐通过 ErrorFactory 工厂方法传入精确码）
   */
  constructor(
    message: string,
    solutions: ErrorSolution[],
    originalError?: Error,
    code: ErrorCode = ErrorCode.GENERATE_TEMPLATE_ERROR,
  ) {
    super(code, message, solutions, originalError);
  }
}

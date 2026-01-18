/**
 * @description 验证错误类型定义
 * 定义验证过程中使用的错误类型和接口
 */

export enum ValidationSeverity {
  ERROR = 'error', // 阻止执行的严重错误
  WARNING = 'warning', // 警告信息
  INFO = 'info', // 提示信息
}

export interface ValidationError {
  /** 字段路径，支持嵌套路径如 'serverType' */
  field: string;
  /** 错误代码，用于程序化处理 */
  code: string;
  /** 错误描述信息 */
  message: string;
  /** 错误严重级别 */
  severity: ValidationSeverity;
  /** 修复建议 */
  suggestion?: string;
  /** 当前错误值 */
  value?: any;
}

export interface ValidationReport {
  /** 所有验证错误 */
  errors: ValidationError[];
  /** 错误统计 */
  summary: {
    total: number;
    errors: number;
    warnings: number;
    infos: number;
  };
  /** 是否有阻止执行的错误 */
  hasBlockingErrors: boolean;
  /** 是否有任何错误 */
  hasErrors: boolean;
}

/**
 * @description 创建验证错误
 * 创建一个标准的验证错误对象
 * @param field 字段路径
 * @param code 错误代码
 * @param message 错误描述信息
 * @param severity 错误严重级别
 * @param suggestion 修复建议（可选）
 * @param value 当前错误值（可选）
 * @returns 验证错误对象
 *
 * @example
 * ```typescript
 * const error = createValidationError(
 *   'source',
 *   'REQUIRED_FIELD',
 *   'source 是必需的',
 *   ValidationSeverity.ERROR,
 *   '请提供有效的 URL',
 *   'invalid-url'
 * );
 * ```
 */
export function createValidationError(
  field: string,
  code: string,
  message: string,
  severity: ValidationSeverity = ValidationSeverity.ERROR,
  suggestion?: string,
  value?: any,
): ValidationError {
  return {
    field,
    code,
    message,
    severity,
    suggestion,
    value,
  };
}

/**
 * @description 创建验证报告
 * 根据错误列表创建验证报告，包含统计信息
 * @param errors 验证错误数组
 * @returns 验证报告对象
 *
 * @example
 * ```typescript
 * const report = createValidationReport(errors);
 * // report = {
 * //   errors: [...],
 * //   summary: { total: 10, errors: 3, warnings: 5, infos: 2 },
 * //   hasBlockingErrors: true,
 * //   hasErrors: true
 * // }
 * ```
 */
export function createValidationReport(errors: ValidationError[]): ValidationReport {
  const summary = {
    total: errors.length,
    errors: errors.filter((e) => e.severity === ValidationSeverity.ERROR).length,
    warnings: errors.filter((e) => e.severity === ValidationSeverity.WARNING).length,
    infos: errors.filter((e) => e.severity === ValidationSeverity.INFO).length,
  };

  const hasBlockingErrors = summary.errors > 0;
  const hasErrors = summary.errors > 0 || summary.warnings > 0;

  return {
    errors,
    summary,
    hasBlockingErrors,
    hasErrors,
  };
}

/**
 * 配置验证异常类
 */
export class ConfigValidationError extends Error {
  readonly validationReport: ValidationReport;

  constructor(validationReport: ValidationReport) {
    const errorMessages = validationReport.errors
      .filter((e) => e.severity === ValidationSeverity.ERROR)
      .map((e) => `${e.field}: ${e.message}`)
      .join('; ');

    super(`配置验证失败: ${errorMessages}`);
    this.name = 'ConfigValidationError';
    this.validationReport = validationReport;
  }
}

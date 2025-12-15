/**
 * 验证错误类型定义
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
 * 创建验证错误
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
 * 创建验证报告
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

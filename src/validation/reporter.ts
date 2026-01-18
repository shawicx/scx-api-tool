/**
 * @description 验证结果报告器
 * 负责格式化并输出验证报告
 */

import consola from 'consola';
import { ValidationReport, ValidationSeverity, ValidationError } from './errors';

/**
 * @description 显示验证结果
 * 将验证报告格式化输出到控制台
 * @param report 验证报告对象
 *
 * @example
 * ```typescript
 * displayValidationResults(report);
 * // 输出验证结果，包括错误、警告和建议
 * ```
 */
export function displayValidationResults(report: ValidationReport): void {
  if (report.errors.length === 0) {
    consola.success('配置验证通过');
    return;
  }

  // 显示错误摘要
  displaySummary(report);

  // 按严重级别分组显示错误
  const errors = report.errors.filter((e) => e.severity === ValidationSeverity.ERROR);
  const warnings = report.errors.filter((e) => e.severity === ValidationSeverity.WARNING);
  const infos = report.errors.filter((e) => e.severity === ValidationSeverity.INFO);

  if (errors.length > 0) {
    consola.error(`\n发现 ${errors.length} 个错误：`);
    errors.forEach((error, index) => displayError(error, index + 1));
  }

  if (warnings.length > 0) {
    consola.warn(`\n发现 ${warnings.length} 个警告：`);
    warnings.forEach((warning, index) => displayWarning(warning, index + 1));
  }

  if (infos.length > 0) {
    consola.info(`\n${infos.length} 个建议：`);
    infos.forEach((info, index) => displayInfo(info, index + 1));
  }
}

/**
 * @description 显示错误摘要
 * 显示验证报告的摘要统计信息
 * @param report 验证报告对象
 *
 * @example
 * ```typescript
 * displaySummary(report);
 * // 输出：验证完成：发现 3 个错误，5 个警告，2 个建议
 * ```
 */
function displaySummary(report: ValidationReport): void {
  const { summary } = report;

  if (summary.errors > 0) {
    consola.error(
      `验证完成：发现 ${summary.errors} 个错误，${summary.warnings} 个警告，${summary.infos} 个建议`,
    );
  } else if (summary.warnings > 0) {
    consola.warn(`验证完成：发现 ${summary.warnings} 个警告，${summary.infos} 个建议`);
  } else if (summary.infos > 0) {
    consola.info(`验证完成：${summary.infos} 个建议`);
  }
}

/**
 * @description 显示错误信息
 * 格式化并输出单个错误信息
 * @param error 验证错误对象
 * @param index 错误序号
 *
 * @example
 * ```typescript
 * displayError(error, 1);
 * // 输出：1. source: source 是必需的
 * ```
 */
function displayError(error: ValidationError, index: number): void {
  consola.error(`${index}. ${error.field}: ${error.message}`);

  if (error.value !== undefined) {
    consola.error(`   当前值: ${JSON.stringify(error.value)}`);
  }

  if (error.suggestion) {
    consola.info(`   修复建议:`);
    error.suggestion.split('\n').forEach((line) => {
      if (line.trim()) {
        consola.info(`      ${line}`);
      }
    });
  }
}

/**
 * @description 显示警告信息
 * 格式化并输出单个警告信息
 * @param warning 验证错误对象（警告级别）
 * @param index 警告序号
 *
 * @example
 * ```typescript
 * displayWarning(warning, 1);
 * // 输出：1. source: 路径前缀不应该以 / 开头
 * ```
 */
function displayWarning(warning: ValidationError, index: number): void {
  consola.warn(`${index}. ${warning.field}: ${warning.message}`);

  if (warning.value !== undefined) {
    consola.info(`   当前值: ${JSON.stringify(warning.value)}`);
  }

  if (warning.suggestion) {
    consola.info(`   建议:`);
    warning.suggestion.split('\n').forEach((line) => {
      if (line.trim()) {
        consola.info(`      ${line}`);
      }
    });
  }
}

/**
 * @description 显示信息
 * 格式化并输出单个信息条目
 * @param info 验证错误对象（信息级别）
 * @param index 信息序号
 *
 * @example
 * ```typescript
 * displayInfo(info, 1);
 * // 输出：1. requestMethodStyle: 建议使用默认值
 * ```
 */
function displayInfo(info: ValidationError, index: number): void {
  consola.info(`${index}. ${info.field}: ${info.message}`);

  if (info.suggestion) {
    consola.info(`   说明:`);
    info.suggestion.split('\n').forEach((line) => {
      if (line.trim()) {
        consola.info(`      ${line}`);
      }
    });
  }
}

/**
 * @description 获取紧凑的错误摘要（用于异常消息）
 * 生成一个简短的错误摘要字符串，最多显示 5 个错误
 * @param report 验证报告对象
 * @returns 错误摘要字符串
 *
 * @example
 * ```typescript
 * const summary = getErrorSummary(report);
 * // summary = "source: ... ; token: ..." 或 "... 还有 3 个错误"
 * ```
 */
export function getErrorSummary(report: ValidationReport): string {
  const errors = report.errors.filter((e) => e.severity === ValidationSeverity.ERROR);

  if (errors.length === 0) {
    return '';
  }

  const errorMessages = errors
    .slice(0, 5) // 最多显示 5 个错误
    .map((e) => `${e.field}: ${e.message}`)
    .join('; ');

  if (errors.length > 5) {
    return `${errorMessages} ... 还有 ${errors.length - 5} 个错误`;
  }

  return errorMessages;
}

/**
 * @description 检查是否应该继续执行
 * 判断验证报告是否包含阻止执行的错误
 * @param report 验证报告对象
 * @returns 是否可以继续执行（true）或应该中止（false）
 *
 * @example
 * ```typescript
 * if (shouldContinue(report)) {
 *   // 继续执行代码生成
 * } else {
 *   // 终止执行
 * }
 * ```
 */
export function shouldContinue(report: ValidationReport): boolean {
  return !report.hasBlockingErrors;
}

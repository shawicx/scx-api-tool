/**
 * 验证结果报告器
 */

import consola from 'consola';
import { ValidationReport, ValidationSeverity, ValidationError } from './errors';

/**
 * 显示验证结果
 */
export function displayValidationResults(report: ValidationReport): void {
  if (report.errors.length === 0) {
    consola.success('✅ 配置验证通过');
    return;
  }

  // 显示错误摘要
  displaySummary(report);

  // 按严重级别分组显示错误
  const errors = report.errors.filter((e) => e.severity === ValidationSeverity.ERROR);
  const warnings = report.errors.filter((e) => e.severity === ValidationSeverity.WARNING);
  const infos = report.errors.filter((e) => e.severity === ValidationSeverity.INFO);

  if (errors.length > 0) {
    consola.error(`\n❌ 发现 ${errors.length} 个错误：`);
    errors.forEach((error, index) => displayError(error, index + 1));
  }

  if (warnings.length > 0) {
    consola.warn(`\n⚠️  发现 ${warnings.length} 个警告：`);
    warnings.forEach((warning, index) => displayWarning(warning, index + 1));
  }

  if (infos.length > 0) {
    consola.info(`\n💡 ${infos.length} 个建议：`);
    infos.forEach((info, index) => displayInfo(info, index + 1));
  }
}

/**
 * 显示错误摘要
 */
function displaySummary(report: ValidationReport): void {
  const { summary } = report;

  if (summary.errors > 0) {
    consola.error(
      `🔍 验证完成：发现 ${summary.errors} 个错误，${summary.warnings} 个警告，${summary.infos} 个建议`,
    );
  } else if (summary.warnings > 0) {
    consola.warn(`🔍 验证完成：发现 ${summary.warnings} 个警告，${summary.infos} 个建议`);
  } else if (summary.infos > 0) {
    consola.info(`🔍 验证完成：${summary.infos} 个建议`);
  }
}

/**
 * 显示错误信息
 */
function displayError(error: ValidationError, index: number): void {
  consola.error(`${index}. ${error.field}: ${error.message}`);

  if (error.value !== undefined) {
    consola.error(`   当前值: ${JSON.stringify(error.value)}`);
  }

  if (error.suggestion) {
    consola.log(`   💡 修复建议:`);
    error.suggestion.split('\n').forEach((line) => {
      if (line.trim()) {
        consola.log(`      ${line}`);
      }
    });
  }
}

/**
 * 显示警告信息
 */
function displayWarning(warning: ValidationError, index: number): void {
  consola.warn(`${index}. ${warning.field}: ${warning.message}`);

  if (warning.value !== undefined) {
    consola.log(`   当前值: ${JSON.stringify(warning.value)}`);
  }

  if (warning.suggestion) {
    consola.log(`   💡 建议:`);
    warning.suggestion.split('\n').forEach((line) => {
      if (line.trim()) {
        consola.log(`      ${line}`);
      }
    });
  }
}

/**
 * 显示信息
 */
function displayInfo(info: ValidationError, index: number): void {
  consola.info(`${index}. ${info.field}: ${info.message}`);

  if (info.suggestion) {
    consola.log(`   💡 说明:`);
    info.suggestion.split('\n').forEach((line) => {
      if (line.trim()) {
        consola.log(`      ${line}`);
      }
    });
  }
}

/**
 * 获取紧凑的错误摘要（用于异常消息）
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
 * 检查是否应该继续执行
 */
export function shouldContinue(report: ValidationReport): boolean {
  return !report.hasBlockingErrors;
}

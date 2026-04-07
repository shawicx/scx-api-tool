/**
 * @description 配置验证系统入口
 * 统一管理和调用所有验证规则
 */

import { createValidationReport, ConfigValidationError, createValidationError } from './errors';
import type { ValidationError, ValidationReport } from './errors';
import { ValidationSeverity } from './errors';
import { displayValidationResults, shouldContinue, getErrorSummary } from './reporter';
import {
  validateRequiredFields,
  validateEnumValues,
  validateStringFields,
  validateBooleanFields,
  validateNumberFields,
  validateArrayFields,
} from './validators/basic';
import { validateSourceUrl } from './validators/url';
import { validateConfigLogic } from './validators/logic';
import type { UserConfig } from '@/types';

/**
 * @description 验证用户配置
 * 执行所有配置验证规则，如果有错误则抛出异常
 * @param config 用户配置对象
 * @throws {ConfigValidationError} 如果有阻止执行的错误
 *
 * @example
 * ```typescript
 * try {
 *   validateConfiguration(config);
 *   // 验证通过，继续执行
 * } catch (error) {
 *   if (error instanceof ConfigValidationError) {
 *     // 显示验证错误
 *   }
 * }
 * ```
 */
export function validateConfiguration(config: UserConfig): void {
  // 执行所有验证
  const allErrors = [
    ...validateRequiredFields(config),
    ...validateEnumValues(config),
    ...validateStringFields(config),
    ...validateBooleanFields(config),
    ...validateNumberFields(config),
    ...validateArrayFields(),
    ...validateSourceUrl(config),
    ...validateConfigLogic(config),
  ];

  // 创建验证报告
  const report = createValidationReport(allErrors);

  // 显示验证结果
  displayValidationResults(report);

  // 如果有错误，抛出异常
  if (report.hasBlockingErrors) {
    throw new ConfigValidationError(report);
  }
}

// 导出错误类型和工具函数
export {
  ValidationError,
  ValidationReport,
  ValidationSeverity,
  ConfigValidationError,
  createValidationReport,
  createValidationError,
  displayValidationResults,
  shouldContinue,
  getErrorSummary,
};

// 导出验证器
export {
  validateRequiredFields,
  validateEnumValues,
  validateStringFields,
  validateBooleanFields,
  validateNumberFields,
  validateArrayFields,
  validateSourceUrl,
  validateConfigLogic,
};

/**
 * 配置验证系统入口
 */

import { createValidationReport, ConfigValidationError, createValidationError } from './errors';
import type { ValidationError, ValidationReport, ValidationSeverity } from './errors';
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
 * 验证用户配置
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

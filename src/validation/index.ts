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
} from './validators/basic';
import { validateSourceUrl } from './validators/url';
import { validateConfigLogic } from './validators/logic';
import { validateServiceOutputDirs } from './validators/serviceDirs';
import type { MultiServiceConfig, CommonServiceConfig } from '@/types';

/**
 * @description 验证多服务用户配置
 * 执行所有配置验证规则：公共配置部分 + 每个服务的字段与逻辑校验。如果有错误则抛出异常
 * @param config 多服务用户配置对象
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
export function validateConfiguration(config: MultiServiceConfig): void {
  const allErrors: ValidationError[] = [];

  // 1. services 数组非空校验
  if (!config.services || !Array.isArray(config.services) || config.services.length === 0) {
    allErrors.push(
      createValidationError(
        'services',
        'REQUIRED_FIELD',
        'services 是必需的，必须是非空数组',
        ValidationSeverity.ERROR,
        '请提供至少一个服务配置，例如：\'services: [{ name: "main", source: "https://..." }]\'',
        config.services,
      ),
    );
    // services 为空时无法继续逐服务校验，直接生成报告并抛出
    const report = createValidationReport(allErrors);
    displayValidationResults(report);
    if (report.hasBlockingErrors) {
      throw new ConfigValidationError(report);
    }
    return;
  }

  // 2. 公共配置部分校验（target / requestMethodStyle / preset / indentSize 等枚举与数值）
  const common = config as CommonServiceConfig;
  allErrors.push(
    ...validateEnumValues(common),
    ...validateNumberFields(common),
    ...validateBooleanFields(common),
  );

  // 3. 服务名唯一性校验
  const names = new Set<string>();
  for (const svc of config.services) {
    if (svc.name && names.has(svc.name)) {
      allErrors.push(
        createValidationError(
          `services[${svc.name}]`,
          'DUPLICATE_SERVICE_NAME',
          `服务名 "${svc.name}" 重复，服务名必须唯一`,
          ValidationSeverity.ERROR,
          '请确保 services 数组中每个服务的 name 字段唯一',
          svc.name,
        ),
      );
    }
    if (svc.name) names.add(svc.name);
  }

  // 4. outputDir 隔离校验：各服务计算后的 outputDir 不相同、不嵌套（避免 cleanOutputDir 相互清理）
  allErrors.push(...validateServiceOutputDirs(config.services, config.baseOutputDir));

  // 5. 逐服务校验：必需字段、字符串字段、source URL、服务级逻辑
  for (const svc of config.services) {
    allErrors.push(
      ...validateRequiredFields(svc),
      ...validateStringFields(svc),
      ...validateSourceUrl(svc),
      ...validateConfigLogic({ ...common, ...svc }),
    );
  }

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
  validateSourceUrl,
  validateConfigLogic,
};

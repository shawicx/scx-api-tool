/**
 * @description 逻辑关系验证器
 * 验证配置项之间的逻辑关系和一致性
 */

import { ValidationError, ValidationSeverity, createValidationError } from '../errors';
import type { UserConfig } from '@/types';

/**
 * @description 验证配置项之间的逻辑关系
 * 检查配置项之间是否存在逻辑冲突或不合理的使用
 * @param config 用户配置对象
 * @returns 验证错误数组
 *
 * @example
 * ```typescript
 * const errors = validateConfigLogic(config);
 * // errors = [
 * //   { field: 'generateApi & generateTypes', code: 'NO_GENERATION_MODE', ... }
 * // ]
 * ```
 */
export function validateConfigLogic(config: UserConfig): ValidationError[] {
  const errors: ValidationError[] = [];

  // 验证至少有一种生成模式被启用
  if (!config.generateApi && !config.generateTypes) {
    errors.push(
      createValidationError(
        'generateApi & generateTypes',
        'NO_GENERATION_MODE',
        '至少需要启用一种生成模式',
        ValidationSeverity.ERROR,
        '请至少选择一种生成模式：\n' +
          '  - generateApi: true 生成 API 请求方法\n' +
          '  - generateTypes: true 生成类型定义\n' +
          '  - 两者都为 true: 同时生成 API 请求方法和类型定义',
        { generateApi: config.generateApi, generateTypes: config.generateTypes },
      ),
    );
  }

  // 验证只生成 API 模式下 requestFunctionFilePath 的合理性
  if (
    config.generateApi &&
    !config.generateTypes &&
    config.requestFunctionFilePath &&
    config.requestFunctionFilePath.trim() !== ''
  ) {
    // 这个配置是合理的，不报错
  }

  // 验证只生成类型模式下 requestMethodStyle 的合理性
  if (
    !config.generateApi &&
    config.generateTypes &&
    config.requestMethodStyle &&
    config.requestMethodStyle !== 'config'
  ) {
    errors.push(
      createValidationError(
        'requestMethodStyle',
        'UNUSED_OPTION',
        '在只生成类型模式下 requestMethodStyle 配置不会生效',
        ValidationSeverity.WARNING,
        '只生成类型模式不生成请求函数，requestMethodStyle 配置不会生效，建议使用默认值或删除此配置',
        config.requestMethodStyle,
      ),
    );
  }

  // 验证 requestFunctionName 和 requestMethodsObjectName 的命名冲突
  if (
    config.requestFunctionName &&
    config.requestMethodsObjectName &&
    config.requestFunctionName === config.requestMethodsObjectName
  ) {
    errors.push(
      createValidationError(
        'requestFunctionName & requestMethodsObjectName',
        'NAMING_CONFLICT',
        'requestFunctionName 和 requestMethodsObjectName 不能相同',
        ValidationSeverity.ERROR,
        '请使用不同的名称避免命名冲突',
        {
          requestFunctionName: config.requestFunctionName,
          requestMethodsObjectName: config.requestMethodsObjectName,
        },
      ),
    );
  }

  // 验证 javascript 目标下的类型相关配置
  if (config.target === 'javascript') {
    if (config.generateTypes) {
      errors.push(
        createValidationError(
          'target & generateTypes',
          'JS_TARGET_IGNORES_TYPES',
          '当 target 为 "javascript" 时，generateTypes 配置将被忽略（不生成类型文件）',
          ValidationSeverity.WARNING,
          'JavaScript 目标生成 .js 文件，不包含类型定义。设置 generateTypes: false 可消除此警告。',
          { target: config.target, generateTypes: config.generateTypes },
        ),
      );
    }
    if (config.typesFormat === 'zod') {
      errors.push(
        createValidationError(
          'target & typesFormat',
          'JS_TARGET_IGNORES_ZOD',
          '当 target 为 "javascript" 时，typesFormat: "zod" 配置将被忽略',
          ValidationSeverity.WARNING,
          'JavaScript 目标不支持 Zod Schema 生成。设置 typesFormat: "typescript" 可消除此警告。',
          { target: config.target, typesFormat: config.typesFormat },
        ),
      );
    }
  }

  return errors;
}

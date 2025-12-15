/**
 * 逻辑关系验证器
 */

import { ValidationError, ValidationSeverity, createValidationError } from '../errors';
import type { UserConfig } from '@/types';

/**
 * 验证配置项之间的逻辑关系
 */
export function validateConfigLogic(config: UserConfig): ValidationError[] {
  const errors: ValidationError[] = [];

  // 验证 typesOnly 和 apiOnly 的互斥关系
  if (config.typesOnly && config.apiOnly) {
    errors.push(
      createValidationError(
        'typesOnly & apiOnly',
        'CONFLICTING_OPTIONS',
        'typesOnly 和 apiOnly 不能同时为 true',
        ValidationSeverity.ERROR,
        '请选择其中一种模式：\n' +
          '  - typesOnly: 只生成类型定义\n' +
          '  - apiOnly: 只生成 API 接口定义\n' +
          '  - 两者都为 false: 生成完整的类型和请求函数',
        { typesOnly: config.typesOnly, apiOnly: config.apiOnly },
      ),
    );
  }

  // 验证 requestFunctionFilePath 在 apiOnly 模式下的合理性
  if (
    config.apiOnly &&
    config.requestFunctionFilePath &&
    config.requestFunctionFilePath.trim() !== ''
  ) {
    errors.push(
      createValidationError(
        'requestFunctionFilePath',
        'UNUSED_OPTION',
        '在 apiOnly 模式下 requestFunctionFilePath 配置不会生效',
        ValidationSeverity.WARNING,
        'apiOnly 模式只生成接口定义，不生成请求函数，可以删除 requestFunctionFilePath 配置',
        config.requestFunctionFilePath,
      ),
    );
  }

  // 验证 requestMethodStyle 在 typesOnly 模式下的合理性
  if (config.typesOnly && config.requestMethodStyle && config.requestMethodStyle !== 'config') {
    errors.push(
      createValidationError(
        'requestMethodStyle',
        'UNUSED_OPTION',
        '在 typesOnly 模式下 requestMethodStyle 配置不会生效',
        ValidationSeverity.WARNING,
        'typesOnly 模式只生成类型定义，不涉及请求函数风格，建议使用默认值或删除此配置',
        config.requestMethodStyle,
      ),
    );
  }

  // 验证 pathPrefix 的使用
  if (config.pathPrefix && config.pathPrefix.trim() !== '') {
    const trimmedPrefix = config.pathPrefix.trim();

    // 检查是否以 / 开头
    if (trimmedPrefix.startsWith('/')) {
      errors.push(
        createValidationError(
          'pathPrefix',
          'INVALID_PATH_PREFIX',
          'pathPrefix 不应该以 / 开头',
          ValidationSeverity.WARNING,
          'pathPrefix 会自动添加，不需要包含前导 /，例如: "api" 而不是 "/api"',
          config.pathPrefix,
        ),
      );
    }

    // 检查是否以 / 结尾
    if (trimmedPrefix.endsWith('/')) {
      errors.push(
        createValidationError(
          'pathPrefix',
          'INVALID_PATH_PREFIX',
          'pathPrefix 不应该以 / 结尾',
          ValidationSeverity.WARNING,
          'pathPrefix 会自动处理路径分隔符，不需要包含尾部 /',
          config.pathPrefix,
        ),
      );
    }
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

  return errors;
}

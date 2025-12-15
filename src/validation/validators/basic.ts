/**
 * 基础类型验证器
 */

import { ValidationError, ValidationSeverity, createValidationError } from '../errors';
import type { UserConfig } from '@/types';
import { RequestMethodStyle } from '@/types';

/**
 * 验证必需字段
 */
export function validateRequiredFields(config: UserConfig): ValidationError[] {
  const errors: ValidationError[] = [];

  // 验证 source 字段
  if (!config.source || typeof config.source !== 'string' || config.source.trim() === '') {
    errors.push(
      createValidationError(
        'source',
        'REQUIRED_FIELD',
        'source 是必需的，必须是有效的 URL 字符串',
        ValidationSeverity.ERROR,
        '请提供有效的 API 数据源 URL，例如：\n' +
          '  - Apifox: https://api.apifox.com/v1/projects/123456/export-openapi\n' +
          '  - Swagger: https://petstore.swagger.io/v2/swagger.json',
        config.source,
      ),
    );
  }

  // 验证 token 字段
  if (!config.token || typeof config.token !== 'string' || config.token.trim() === '') {
    errors.push(
      createValidationError(
        'token',
        'REQUIRED_FIELD',
        'token 是必需的，必须是有效的认证令牌字符串',
        ValidationSeverity.ERROR,
        '请提供有效的认证令牌，确保令牌具有访问 API 数据的权限',
        config.token,
      ),
    );
  }

  return errors;
}

/**
 * 验证枚举值
 */
export function validateEnumValues(config: UserConfig): ValidationError[] {
  const errors: ValidationError[] = [];

  // 验证 target 枚举值
  if (config.target && !['typescript', 'javascript'].includes(config.target)) {
    errors.push(
      createValidationError(
        'target',
        'INVALID_ENUM_VALUE',
        `无效的 target 值: ${config.target}`,
        ValidationSeverity.ERROR,
        '支持的值: "typescript", "javascript"',
        config.target,
      ),
    );
  }

  // 验证 requestMethodStyle 枚举值
  if (
    config.requestMethodStyle &&
    !Object.values(RequestMethodStyle).includes(config.requestMethodStyle as RequestMethodStyle)
  ) {
    const validStyles = Object.values(RequestMethodStyle).join(', ');
    errors.push(
      createValidationError(
        'requestMethodStyle',
        'INVALID_ENUM_VALUE',
        `无效的 requestMethodStyle 值: ${config.requestMethodStyle}`,
        ValidationSeverity.ERROR,
        `支持的值: ${validStyles}`,
        config.requestMethodStyle,
      ),
    );
  }

  // 验证 preset 枚举值
  if (config.preset && !['minimal', 'standard', 'verbose'].includes(config.preset)) {
    errors.push(
      createValidationError(
        'preset',
        'INVALID_ENUM_VALUE',
        `无效的 preset 值: ${config.preset}`,
        ValidationSeverity.ERROR,
        '支持的值: "minimal", "standard", "verbose"',
        config.preset,
      ),
    );
  }

  return errors;
}

/**
 * 验证字符串字段
 */
export function validateStringFields(config: UserConfig): ValidationError[] {
  const errors: ValidationError[] = [];

  // 验证 outputDir
  if (config.outputDir !== undefined) {
    if (typeof config.outputDir !== 'string' || config.outputDir.trim() === '') {
      errors.push(
        createValidationError(
          'outputDir',
          'INVALID_STRING',
          'outputDir 必须是非空字符串',
          ValidationSeverity.ERROR,
          '请提供有效的输出目录路径，例如: "src/service"',
          config.outputDir,
        ),
      );
    }
  }

  // 验证 pathPrefix
  if (config.pathPrefix !== undefined) {
    if (typeof config.pathPrefix !== 'string') {
      errors.push(
        createValidationError(
          'pathPrefix',
          'INVALID_STRING',
          'pathPrefix 必须是字符串',
          ValidationSeverity.ERROR,
          'pathPrefix 应该是字符串，如果不使用路径前缀请删除此配置项',
          config.pathPrefix,
        ),
      );
    }
  }

  // 验证 prodEnvName
  if (config.prodEnvName !== undefined) {
    if (typeof config.prodEnvName !== 'string' || config.prodEnvName.trim() === '') {
      errors.push(
        createValidationError(
          'prodEnvName',
          'INVALID_STRING',
          'prodEnvName 必须是非空字符串',
          ValidationSeverity.ERROR,
          '请提供有效的生产环境名称，例如: "production"',
          config.prodEnvName,
        ),
      );
    }
  }

  // 验证 requestFunctionFilePath
  if (config.requestFunctionFilePath !== undefined) {
    if (
      typeof config.requestFunctionFilePath !== 'string' ||
      config.requestFunctionFilePath.trim() === ''
    ) {
      errors.push(
        createValidationError(
          'requestFunctionFilePath',
          'INVALID_STRING',
          'requestFunctionFilePath 必须是非空字符串',
          ValidationSeverity.ERROR,
          '请提供有效的请求函数文件路径，例如: "src/service/request.ts"',
          config.requestFunctionFilePath,
        ),
      );
    }
  }

  // 验证 requestFunctionName
  if (config.requestFunctionName !== undefined) {
    if (
      typeof config.requestFunctionName !== 'string' ||
      config.requestFunctionName.trim() === ''
    ) {
      errors.push(
        createValidationError(
          'requestFunctionName',
          'INVALID_STRING',
          'requestFunctionName 必须是非空字符串',
          ValidationSeverity.ERROR,
          '请提供有效的请求函数名称，例如: "request"',
          config.requestFunctionName,
        ),
      );
    }
  }

  // 验证 requestMethodsObjectName
  if (config.requestMethodsObjectName !== undefined) {
    if (
      typeof config.requestMethodsObjectName !== 'string' ||
      config.requestMethodsObjectName.trim() === ''
    ) {
      errors.push(
        createValidationError(
          'requestMethodsObjectName',
          'INVALID_STRING',
          'requestMethodsObjectName 必须是非空字符串',
          ValidationSeverity.ERROR,
          '请提供有效的方法对象名称，例如: "requestMethods"',
          config.requestMethodsObjectName,
        ),
      );
    }
  }

  return errors;
}

/**
 * 验证布尔字段
 */
export function validateBooleanFields(config: UserConfig): ValidationError[] {
  const errors: ValidationError[] = [];

  const booleanFields = ['typesOnly', 'apiOnly', 'comment'] as const;

  for (const field of booleanFields) {
    const value = config[field];
    if (value !== undefined && typeof value !== 'boolean') {
      errors.push(
        createValidationError(
          field,
          'INVALID_BOOLEAN',
          `${field} 必须是布尔值`,
          ValidationSeverity.ERROR,
          `${field} 应该是 true 或 false`,
          value,
        ),
      );
    }
  }

  return errors;
}

/**
 * 验证数值字段
 */
export function validateNumberFields(config: UserConfig): ValidationError[] {
  const errors: ValidationError[] = [];

  // 验证 indentSize
  if (config.indentSize !== undefined) {
    if (
      typeof config.indentSize !== 'number' ||
      !Number.isInteger(config.indentSize) ||
      config.indentSize < 1 ||
      config.indentSize > 8
    ) {
      errors.push(
        createValidationError(
          'indentSize',
          'INVALID_NUMBER',
          'indentSize 必须是 1-8 之间的整数',
          ValidationSeverity.ERROR,
          '请设置 1-8 范围内的整数值，推荐使用 2 或 4',
          config.indentSize,
        ),
      );
    }
  }

  return errors;
}

/**
 * 验证数组字段
 */
export function validateArrayFields(config: UserConfig): ValidationError[] {
  const errors: ValidationError[] = [];

  // 验证 categories
  if (config.categories !== undefined) {
    if (!Array.isArray(config.categories)) {
      errors.push(
        createValidationError(
          'categories',
          'INVALID_ARRAY',
          'categories 必须是数组',
          ValidationSeverity.ERROR,
          'categories 应该是分类对象数组',
          config.categories,
        ),
      );
    } else {
      // 验证每个 category 对象
      config.categories.forEach((category, index) => {
        if (!category || typeof category !== 'object') {
          errors.push(
            createValidationError(
              `categories[${index}]`,
              'INVALID_OBJECT',
              `categories[${index}] 必须是对象`,
              ValidationSeverity.ERROR,
              '每个分类应该包含 id 和可选的 getRequestFunctionName',
              category,
            ),
          );
        } else {
          // 验证 category.id
          if (
            category.id === undefined ||
            typeof category.id !== 'number' ||
            !Number.isInteger(category.id) ||
            category.id < 0
          ) {
            errors.push(
              createValidationError(
                `categories[${index}].id`,
                'INVALID_NUMBER',
                `categories[${index}].id 必须是非负整数`,
                ValidationSeverity.ERROR,
                '分类 ID 应该是正整数',
                category.id,
              ),
            );
          }

          // 验证 getRequestFunctionName（如果存在）
          if (
            category.getRequestFunctionName !== undefined &&
            typeof category.getRequestFunctionName !== 'function'
          ) {
            errors.push(
              createValidationError(
                `categories[${index}].getRequestFunctionName`,
                'INVALID_FUNCTION',
                `categories[${index}].getRequestFunctionName 必须是函数`,
                ValidationSeverity.ERROR,
                'getRequestFunctionName 应该是一个接受 interfaceInfo 和 changeCase 参数的函数',
                typeof category.getRequestFunctionName,
              ),
            );
          }
        }
      });
    }
  }

  return errors;
}

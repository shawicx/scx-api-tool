/**
 * @description 基础类型验证器
 * 验证配置中各个字段的基本类型和值
 */

import { ValidationError, ValidationSeverity, createValidationError } from '../errors';
import type { UserConfig } from '@/types';
import { RequestMethodStyle } from '@/types';
import { isWithinCwd } from '@/utils/pathSafety';

/**
 * @description 验证必需字段
 * 检查配置中所有必需的字段是否存在且有效
 * @param config 用户配置对象
 * @returns 验证错误数组
 *
 * @example
 * ```typescript
 * const errors = validateRequiredFields(config);
 * // errors = [
 * //   { field: 'source', code: 'REQUIRED_FIELD', message: '...' }
 * // ]
 * ```
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

  // 验证 token 字段（仅对 Apifox 必需）
  if (config.source.includes('apifox.com')) {
    if (!config.token || typeof config.token !== 'string' || config.token.trim() === '') {
      errors.push(
        createValidationError(
          'token',
          'REQUIRED_FIELD',
          'Apifox 源需要 token，必须是有效的认证令牌字符串',
          ValidationSeverity.ERROR,
          '请提供有效的认证令牌，确保令牌具有访问 API 数据的权限',
          config.token,
        ),
      );
    }
  }

  return errors;
}

/**
 * @description 验证枚举值
 * 检查配置中枚举类型字段的值是否在允许的范围内
 * @param config 用户配置对象
 * @returns 验证错误数组
 *
 * @example
 * ```typescript
 * const errors = validateEnumValues(config);
 * // errors = [
 * //   { field: 'target', code: 'INVALID_ENUM_VALUE', message: '...' }
 * // ]
 * ```
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
 * @description 验证字符串字段
 * 检查配置中字符串类型字段的有效性
 * @param config 用户配置对象
 * @returns 验证错误数组
 *
 * @example
 * ```typescript
 * const errors = validateStringFields(config);
 * // errors = [
 * //   { field: 'outputDir', code: 'INVALID_STRING', message: '...' }
 * // ]
 * ```
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
    } else if (!isWithinCwd(config.outputDir)) {
      // 安全护栏：禁止指向项目根目录之外，避免 cleanOutputDir 误删
      errors.push(
        createValidationError(
          'outputDir',
          'PATH_TRAVERSAL',
          'outputDir 不能指向项目根目录之外',
          ValidationSeverity.ERROR,
          '请使用项目内的相对路径（如 src/service），避免使用 .. 或绝对路径',
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
 * @description 验证布尔字段
 * 检查配置中布尔类型字段的值是否为布尔值
 * @param config 用户配置对象
 * @returns 验证错误数组
 *
 * @example
 * ```typescript
 * const errors = validateBooleanFields(config);
 * // errors = [
 * //   { field: 'comment', code: 'INVALID_BOOLEAN', message: '...' }
 * // ]
 * ```
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
 * @description 验证数值字段
 * 检查配置中数值类型字段的值是否在有效范围内
 * @param config 用户配置对象
 * @returns 验证错误数组
 *
 * @example
 * ```typescript
 * const errors = validateNumberFields(config);
 * // errors = [
 * //   { field: 'indentSize', code: 'INVALID_NUMBER', message: '...' }
 * // ]
 * ```
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
 * @description 验证数组字段
 * 检查配置中数组类型字段的有效性
 * @returns 验证错误数组
 *
 * @example
 * ```typescript
 * const errors = validateArrayFields();
 * // 目前没有需要验证的数组字段，返回空数组
 * ```
 */
export function validateArrayFields(): ValidationError[] {
  const errors: ValidationError[] = [];

  // 目前没有需要验证的数组字段

  return errors;
}

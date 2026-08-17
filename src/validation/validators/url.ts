/**
 * @description URL 相关验证器
 * 验证配置中 URL 字段的有效性
 */

import { ValidationError, ValidationSeverity, createValidationError } from '../errors';
import type { ServiceConfig } from '@/types';

/**
 * @description 验证 URL 格式
 * 检查 URL 是否为有效格式
 * @param url URL 字符串
 * @param field 字段名称
 * @returns 验证错误对象，如果验证通过则返回 null
 *
 * @example
 * ```typescript
 * const error = validateUrlFormat('https://api.example.com', 'source');
 * // error = null (验证通过)
 *
 * const error2 = validateUrlFormat('invalid-url', 'source');
 * // error2 = { field: 'source', code: 'INVALID_URL', ... }
 * ```
 */
export function validateUrlFormat(url: string, field: string): ValidationError | null {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return createValidationError(
      field,
      'INVALID_URL',
      `${field} 必须是有效的 URL 字符串`,
      ValidationSeverity.ERROR,
      '请提供完整的 URL，包括协议 (http:// 或 https://)',
      url,
    );
  }

  try {
    const urlObj = new URL(url.trim());

    // 检查协议
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return createValidationError(
        field,
        'INVALID_URL_PROTOCOL',
        `${field} 必须使用 http 或 https 协议`,
        ValidationSeverity.ERROR,
        '请使用 http:// 或 https:// 协议',
        url,
      );
    }

    // 检查主机名
    if (!urlObj.hostname) {
      return createValidationError(
        field,
        'INVALID_URL_HOST',
        `${field} 必须包含有效的主机名`,
        ValidationSeverity.ERROR,
        '请确保 URL 包含有效的主机名',
        url,
      );
    }

    return null;
  } catch (error) {
    return createValidationError(
      field,
      'INVALID_URL_FORMAT',
      `${field} 的 URL 格式无效: ${error instanceof Error ? error.message : '未知错误'}`,
      ValidationSeverity.ERROR,
      '请提供格式正确的 URL，例如: https://api.example.com/v1/openapi.json',
      url,
    );
  }
}

/**
 * @description 验证 source URL 格式和平台特定要求
 * 根据 URL 平台（Apifox 或 Swagger）验证特定格式
 * @param config 用户配置对象
 * @returns 验证错误数组
 *
 * @example
 * ```typescript
 * const errors = validateSourceUrl(config);
 * // errors = [
 * //   { field: 'source', code: 'INVALID_APIFOX_URL_FORMAT', ... }
 * // ]
 * ```
 */
export function validateSourceUrl(config: ServiceConfig): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!config.source) {
    return errors; // 必需字段验证会在其他地方处理
  }

  // 基础 URL 格式验证
  const urlError = validateUrlFormat(config.source, 'source');
  if (urlError) {
    errors.push(urlError);
    return errors; // 如果基础格式都不对，不需要进一步验证
  }

  try {
    const url = new URL(config.source.trim());
    const hostname = url.hostname.toLowerCase();

    // 检测服务器类型并验证特定格式
    if (hostname.includes('apifox.com')) {
      // Apifox 特定格式验证
      const apifoxError = validateApifoxUrl(config.source);
      if (apifoxError) {
        errors.push(apifoxError);
      }
    } else {
      // Swagger/OpenAPI URL 验证
      const swaggerError = validateSwaggerUrl(config.source);
      if (swaggerError) {
        errors.push(swaggerError);
      }
    }
  } catch {
    // URL 解析错误已在 validateUrlFormat 中处理
  }

  return errors;
}

/**
 * @description 验证 Apifox URL 格式
 * 检查 Apifox URL 是否符合正确的格式规范
 * @param source Apifox URL 字符串
 * @returns 验证错误对象，如果验证通过则返回 null
 *
 * @example
 * ```typescript
 * const error = validateApifoxUrl('https://api.apifox.com/v1/projects/123456/export-openapi');
 * // error = null (验证通过)
 *
 * const error2 = validateApifoxUrl('https://api.apifox.com/invalid');
 * // error2 = { field: 'source', code: 'INVALID_APIFOX_URL_FORMAT', ... }
 * ```
 */
function validateApifoxUrl(source: string): ValidationError | null {
  try {
    const url = new URL(source.trim());
    const { pathname } = url;

    // 验证路径格式: /v1/projects/{projectId}/export-openapi
    const pathMatch = pathname.match(/^\/v1\/projects\/(\d+)\/export-openapi\/?$/);

    if (!pathMatch) {
      return createValidationError(
        'source',
        'INVALID_APIFOX_URL_FORMAT',
        'Apifox URL 格式不正确',
        ValidationSeverity.ERROR,
        '正确的 Apifox URL 格式应该是: https://api.apifox.com/v1/projects/{项目ID}/export-openapi',
        source,
      );
    }

    const projectId = pathMatch[1];

    // 验证项目ID合理性
    if (projectId.length < 1) {
      return createValidationError(
        'source',
        'INVALID_APIFOX_PROJECT_ID',
        'Apifox 项目 ID 无效',
        ValidationSeverity.ERROR,
        '请确保 URL 中包含有效的项目 ID',
        source,
      );
    }

    return null;
  } catch (error) {
    return createValidationError(
      'source',
      'APIFOX_URL_PARSE_ERROR',
      `解析 Apifox URL 失败: ${error instanceof Error ? error.message : '未知错误'}`,
      ValidationSeverity.ERROR,
      '请检查 Apifox URL 格式是否正确',
      source,
    );
  }
}

/**
 * @description 验证 Swagger/OpenAPI URL
 * 检查 Swagger/OpenAPI URL 是否使用常见的路径格式
 * @param source Swagger/OpenAPI URL 字符串
 * @returns 验证错误对象，如果验证通过则返回 null
 *
 * @example
 * ```typescript
 * const error = validateSwaggerUrl('https://petstore.swagger.io/v2/swagger.json');
 * // error = null (验证通过)
 *
 * const error2 = validateSwaggerUrl('https://example.com/invalid');
 * // error2 = { field: 'source', code: 'INVALID_SWAGGER_URL_PATH', ... }
 * ```
 */
function validateSwaggerUrl(source: string): ValidationError | null {
  try {
    const url = new URL(source.trim());

    // 常见的 Swagger/OpenAPI 路径模式
    const validPaths = [
      /\/swagger\.json$/,
      /\/swagger\.yaml$/,
      /\/swagger\.yml$/,
      /\/openapi\.json$/,
      /\/openapi\.yaml$/,
      /\/openapi\.yml$/,
      /\/api-docs$/,
      /\/v1\/swagger\.json$/,
      /\/v2\/swagger\.json$/,
      /\/v3\/swagger\.json$/,
    ];

    const hasValidPath = validPaths.some((pattern) => pattern.test(url.pathname));

    if (!hasValidPath) {
      return createValidationError(
        'source',
        'INVALID_SWAGGER_URL_PATH',
        'Swagger/OpenAPI URL 路径可能不正确',
        ValidationSeverity.WARNING,
        '常见的 Swagger/OpenAPI 路径包括: /swagger.json, /openapi.json, /api-docs 等',
        source,
      );
    }

    return null;
  } catch (error) {
    return createValidationError(
      'source',
      'SWAGGER_URL_PARSE_ERROR',
      `解析 Swagger URL 失败: ${error instanceof Error ? error.message : '未知错误'}`,
      ValidationSeverity.ERROR,
      '请检查 Swagger URL 格式是否正确',
      source,
    );
  }
}

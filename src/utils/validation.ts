/*
 * @Author: shawicx d35f3153@proton.me
 * @Date: 2025-08-09 23:35:00
 * @LastEditors: shawicx d35f3153@proton.me
 * @LastEditTime: 2025-08-13 23:01:41
 * @Description: 验证工具函数
 */

/**
 * @description 检查值是否为空
 * @param value 要检查的值
 * @returns 是否为空
 */
export function isEmpty(value: any): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * @description 检查值是否不为空
 * @param value 要检查的值
 * @returns 是否不为空
 */
export function isNotEmpty(value: any): boolean {
  return !isEmpty(value);
}

/**
 * @description 检查值是否为有效的URL
 * @param url 要检查的URL
 * @returns 是否为有效的URL
 */
export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return !!urlObj;
  } catch {
    return false;
  }
}

/**
 * @description 检查值是否为有效的端口号
 * @param port 要检查的端口号
 * @returns 是否为有效的端口号
 */
export function isValidPort(port: number): boolean {
  return Number.isInteger(port) && port >= 1 && port <= 65535;
}

/**
 * @description 检查值是否为有效的项目ID
 * @param projectId 要检查的项目ID
 * @returns 是否为有效的项目ID
 */
export function isValidProjectId(projectId: string): boolean {
  return /^\d+$/.test(projectId);
}

/**
 * @description 检查值是否为有效的token
 * @param token 要检查的token
 * @returns 是否为有效的token
 */
export function isValidToken(token: string): boolean {
  return /^[a-f0-9]{64}$/i.test(token);
}

/**
 * @description 验证配置对象的必需字段
 * @param config 配置对象
 * @param requiredFields 必需字段数组
 * @returns 验证结果
 */
export function validateRequiredFields(
  config: Record<string, any>,
  requiredFields: string[],
): { isValid: boolean; missingFields: string[] } {
  const missingFields = requiredFields.filter((field) => !config[field]);
  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * @description 验证配置对象
 * @param config 配置对象
 * @returns 验证结果
 */
export function validateConfig(config: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config) {
    errors.push('配置对象不能为空');
    return { isValid: false, errors };
  }

  if (!config.serverUrl || !isValidUrl(config.serverUrl)) {
    errors.push('serverUrl必须是有效的URL');
  }

  if (config.serverType && !['swagger', 'apifox'].includes(config.serverType)) {
    errors.push('serverType必须是swagger或apifox之一');
  }

  if (
    config.serverType === 'apifox' &&
    (!config.apifoxProjectId || !isValidProjectId(config.apifoxProjectId))
  ) {
    errors.push('apifox项目ID必须是有效的数字');
  }

  if (!config.token || !isValidToken(config.token)) {
    errors.push('token必须是有效的64位十六进制字符串');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

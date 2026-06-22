/**
 * @description 命名策略模块
 * 提供统一的命名策略和名称清理功能
 */

export type { NamingContext, NamingStrategy } from './strategy';
export { defaultNamingStrategy, applyNamingStrategy } from './strategy';

export {
  sanitizeTypeName,
  sanitizeInterfaceName,
  sanitizeParamName,
  sanitizePropertyName,
} from './sanitizer';

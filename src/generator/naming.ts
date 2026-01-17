/**
 * @description 命名处理工具（向后兼容）
 * 此文件保留用于向后兼容，实际实现已迁移至 naming/ 目录
 * @deprecated 请直接从 './naming' 导入
 */

export {
  sanitizeTypeName,
  sanitizeInterfaceName,
  sanitizeParamName,
  sanitizePropertyName,
} from './naming/sanitizer';

export type { NamingContext, NamingStrategy } from './naming/strategy';

export { defaultNamingStrategy, applyNamingStrategy } from './naming/strategy';

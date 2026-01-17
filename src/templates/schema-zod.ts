/**
 * @description Zod Schema 模板系统（向后兼容）
 * 此文件保留用于向后兼容，实际实现已迁移至 schema-zod/ 目录
 * @deprecated 请直接从 './schema-zod' 导入
 */
export {
  getZodTypeTemplateByConfig,
  getZodImportStatement,
  generateZodTypeSchema,
  getZodInterfaceSchemaTemplateByConfig,
  generateZodInterfaceSchemaFile,
  getZodRequestSchemaContentByConfig,
  getZodResponseSchemaContentByConfig,
  generateZodRequestSchema,
  generateZodResponseSchema,
  getMergedSchemaTemplateByConfig,
  generateMergedSchemaFile,
  generateZodSchemaIndex,
} from './schema-zod/index';

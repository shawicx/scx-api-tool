/**
 * @description Zod Schema 模板系统
 * 统一导出 Zod Schema 相关的模板和生成函数
 */

export { generateZodTypeSchema } from './types';

export { generateZodSchemaFromOperation } from './interfaces';

export { generateMergedSchemaFile } from './merged';

/**
 * @description 生成 Zod Schema 索引文件内容
 * @param schemas schema 名称列表
 * @returns 索引文件代码
 */
export function generateZodSchemaIndex(schemas: string[]): string {
  let content = '// Zod Schema 导出\n\n';

  for (const schema of schemas) {
    content += `export { ${schema} } from './${schema}';\n`;
  }

  return content;
}

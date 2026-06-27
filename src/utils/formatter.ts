/**
 * @description 代码格式化工具
 * 使用 Prettier 格式化生成的代码
 */

import { format } from 'prettier';
import { withErrorHandler } from './decorators';

/**
 * @description 格式化代码
 * 使用 Prettier 格式化代码字符串
 * @param code 代码字符串
 * @param filePath 文件路径
 * @param indentSize 缩进大小（默认 2）
 * @returns 格式化后的代码字符串
 *
 * @example
 * ```typescript
 * const formatted = await formatCode('const x=1;', './test.ts');
 * // formatted = 'const x = 1;'
 * ```
 */
export const formatCode = withErrorHandler(
  async (code: string, filePath: string, indentSize = 2): Promise<string> => {
    // 根据文件扩展名确定解析器
    const parser = getFileParser(filePath);

    // 使用 prettier 格式化代码
    const formattedCode = await format(code, {
      parser,
      singleQuote: true,
      trailingComma: 'es5',
      tabWidth: typeof indentSize === 'number' ? indentSize : 2,
      semi: true,
    });

    return formattedCode;
  },
  {
    // 格式化失败时返回原始代码
    fallbackValue: (originalCode: string) => originalCode,
    logError: true,
    logPrefix: '[FormatCode]',
  },
);

function getFileParser(filePath: string): string {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    return 'typescript';
  }
  if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
    return 'babel';
  }
  if (filePath.endsWith('.json')) {
    return 'json';
  }
  return 'typescript'; // 默认使用 TypeScript 解析器
}

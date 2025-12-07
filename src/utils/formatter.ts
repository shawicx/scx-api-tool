/**
 * 代码格式化工具
 * 使用 Prettier 格式化生成的代码
 */

import consola from 'consola';
import { format } from 'prettier';

export async function formatCode(code: string, filePath: string): Promise<string> {
  try {
    // 根据文件扩展名确定解析器
    const parser = getFileParser(filePath);

    // 使用 prettier 格式化代码
    const formattedCode = await format(code, {
      parser,
      singleQuote: true,
      trailingComma: 'es5',
      tabWidth: 2,
      semi: true,
    });

    return formattedCode;
  } catch (error: any) {
    consola.warn('使用 Prettier 格式化代码失败，返回原始代码:', error.message);
    return code;
  }
}

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

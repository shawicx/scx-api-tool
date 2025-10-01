import consola from 'consola';
import { format } from 'prettier';

export async function formatCode(code: string, filePath: string): Promise<string> {
  try {
    // Determine parser based on file extension
    const parser = getFileParser(filePath);

    // Format the code using prettier
    const formattedCode = await format(code, {
      parser,
      singleQuote: true,
      trailingComma: 'es5',
      tabWidth: 2,
      semi: true,
    });

    return formattedCode;
  } catch (error: any) {
    consola.warn('Failed to format code with Prettier, returning original code:', error.message);
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
  return 'typescript'; // default
}

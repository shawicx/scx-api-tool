/**
 * @description 文件写入工具
 * 封装生成器中重复的「格式化 + 写入 + 调试日志」三连操作，
 * 消除 interfaceGenerator / typeGenerator / schemaGenerator 中的样板代码
 */

import consola from 'consola';
import type { ApiConfig, CliHooks } from '@/types';
import { writeFormattedFile } from '@/utils/file';
import { formatCode } from '@/utils/formatter';

/**
 * @description 格式化代码并写入文件，附带调试日志
 * 统一各生成器的文件写入流程
 * @param filePath 目标文件路径
 * @param code 待写入的代码字符串
 * @param config API 配置（用于读取 indentSize）
 * @param hooks CLI 钩子（可选）
 * @param debugLabel 调试日志标签（如「创建合并接口文件」）
 * @returns 无返回值
 *
 * @example
 * ```typescript
 * await writeGeneratedFile(
 *   join(dirPath, 'index.ts'),
 *   combinedCode,
 *   config,
 *   hooks,
 *   '创建合并接口文件',
 * );
 * ```
 */
export async function writeGeneratedFile(
  filePath: string,
  code: string,
  config: ApiConfig,
  hooks: CliHooks | undefined,
  debugLabel: string,
): Promise<void> {
  const formatted = await formatCode(code, filePath, config.indentSize);
  await writeFormattedFile(filePath, formatted, hooks);
  if (process.env.DEBUG) {
    consola.debug(`${debugLabel}: ${filePath}`);
  }
}

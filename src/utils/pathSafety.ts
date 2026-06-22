/**
 * @description 路径安全工具
 * 防御路径遍历攻击：确保 outputDir、requestFunctionFilePath 等用户可配置的路径
 * 不会逃逸到项目根目录（process.cwd()）之外，避免 cleanOutputDir 的递归删除造成误删。
 */

import { resolve, relative } from 'path';
import { ErrorFactory } from '@/errors';

/**
 * @description 判断目标路径是否位于项目根目录（cwd）之内
 * @param targetPath 待检查的路径（相对或绝对）
 * @returns true 表示安全（在 cwd 之内）
 *
 * @example
 * ```typescript
 * isWithinCwd('src/service');       // true
 * isWithinCwd('../../etc');         // false
 * isWithinCwd('/etc');              // false
 * ```
 */
export function isWithinCwd(targetPath: string): boolean {
  const resolved = resolve(process.cwd(), targetPath);
  const rel = relative(process.cwd(), resolved);
  // rel === '' 表示恰好是 cwd 本身（视为安全）
  if (rel === '') return true;
  // rel 以 '..' 开头表示在 cwd 之外
  // 跨盘符（Windows）或绝对路径时 rel 仍为绝对路径，视为越界
  if (rel.startsWith('..') || /^[A-Za-z]:[\\/]/.test(rel) || rel.startsWith('/')) return false;
  return true;
}

/**
 * @description 断言目标路径位于项目根目录之内，否则抛出配置错误
 * @param targetPath 待检查的路径
 * @param label 路径标签（如 'outputDir'），用于错误信息
 * @throws {ConfigError} 当路径逃逸到 cwd 之外时
 *
 * @example
 * ```typescript
 * assertWithinCwd(config.outputDir, 'outputDir');
 * assertWithinCwd(requestFilePath, 'requestFunctionFilePath');
 * ```
 */
export function assertWithinCwd(targetPath: string, label: string): void {
  if (!isWithinCwd(targetPath)) {
    throw ErrorFactory.configInvalid(`${label} 不能指向项目根目录之外: ${targetPath}`, [
      {
        title: '修正路径配置',
        steps: [
          `当前配置的 ${label} 解析后位于 ${resolve(process.cwd(), targetPath)}`,
          `项目根目录为 ${process.cwd()}`,
          '请使用项目内的相对路径（如 src/service），避免使用 .. 或绝对路径',
        ],
      },
    ]);
  }
}

/**
 * @description 代码注入防护工具
 * 对进入生成代码的远端自由文本进行转义，防止：
 * - JSDoc 注释逃逸（注释闭合序列闭合注释后注入可执行代码）
 * - 字符串字面量逃逸（单引号/反斜杠破坏字符串边界后注入代码）
 */

/**
 * @description 转义用于 JSDoc 注释的文本
 * 将注释闭合序列（星号+斜杠）转义为星号+反斜杠+斜杠，
 * 将注释开始序列（斜杠+星号）转义为斜杠+反斜杠+星号，
 * 防止注释提前闭合或嵌套，阻止恶意代码注入。
 * @param text 原始文本（来自远端 OpenAPI 的 summary/description 等）
 * @returns 转义后的安全文本
 *
 * @example
 * ```typescript
 * // 含注释闭合序列的恶意描述将被安全转义
 * const malicious = 'desc ' + String.fromCharCode(42, 47) + ' import("x")';
 * escapeJsDocComment(malicious); // 闭合序列被转义，无法逃逸 JSDoc
 * ```
 */
export function escapeJsDocComment(text: string): string {
  if (!text) return text;
  return text.replace(/\*\//g, '*\\/').replace(/\/\*/g, '/\\*');
}

/**
 * @description 转义用于单引号字符串字面量的文本
 * 转义反斜杠和单引号，防止破坏字符串边界后注入代码。
 * 用于 enum 值、path 等以 `'${value}'` 形式插入生成代码的字段。
 * @param text 原始文本
 * @returns 转义后的安全文本
 *
 * @example
 * ```typescript
 * escapeStringLiteral("'); require('fs')"); // → "\\'); require(\\'fs\\')"
 * ```
 */
export function escapeStringLiteral(text: string): string {
  if (!text) return text;
  return text.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

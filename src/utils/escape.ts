/**
 * @description 代码注入防护工具
 * 对进入生成代码的远端自由文本进行转义，防止：
 * - JSDoc 注释逃逸（注释闭合序列闭合注释后注入可执行代码）
 * - 字符串字面量逃逸（单引号/反斜杠破坏字符串边界后注入代码）
 * - 模板字符串逃逸（反引号/${} 破坏模板字符串边界后注入代码）
 */

import { sanitizePropertyName } from '@/naming';

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

/**
 * @description 路径插值结果
 * @property literal 是否为单引号字面量字符串（无 path 参数时为 true）
 * @property value 渲染后的完整字符串字面量（含外层引号或反引号）
 */
export interface InterpolatedPath {
  /** 是否为单引号字面量字符串（无 path 参数时为 true） */
  literal: boolean;
  /** 渲染后的完整字符串字面量（含外层引号或反引号） */
  value: string;
}

/** @description 匹配 OpenAPI 路径参数占位符，如 `{id}`、`{user-id}` */
const PATH_PARAM_PATTERN = /\{([^}]+)\}/g;

/**
 * @description 转义模板字符串字面量的静态文本部分
 * 转义反斜杠、反引号、`${` 序列，防止破坏模板字符串边界后注入代码。
 * @param text 原始静态文本（来自远端 OpenAPI 路径）
 * @returns 转义后可安全嵌入反引号模板字符串的文本
 *
 * @example
 * ```typescript
 * escapeTemplateLiteralStatic('normal'); // → 'normal'
 * escapeTemplateLiteralStatic('a`b'); // → 'a\\`b'
 * escapeTemplateLiteralStatic('a${b}'); // → 'a\\${b}'
 * ```
 */
function escapeTemplateLiteralStatic(text: string): string {
  if (!text) return text;
  return text
    .replace(/\\/g, '\\\\') // 先转义反斜杠（避免双重转义）
    .replace(/`/g, '\\`') // 转义反引号（终止模板字符串）
    .replace(/\$\{/g, '\\${'); // 转义 ${ 序列（启动插值）
}

/**
 * @description 生成参数访问表达式
 * 合法标识符用点访问（`params.code`），非法标识符用方括号访问（`params['user-id']`）。
 * @param requestParamName 请求参数变量名（如 `params`）
 * @param rawParamName 原始路径参数名（来自 `{paramName}` 占位符）
 * @returns 安全的成员访问表达式
 *
 * @example
 * ```typescript
 * buildParamAccess('params', 'code'); // → 'params.code'
 * buildParamAccess('params', 'user-id'); // → "params['user-id']"
 * ```
 */
function buildParamAccess(requestParamName: string, rawParamName: string): string {
  const sanitized = sanitizePropertyName(rawParamName);
  // sanitizePropertyName 对非法标识符会用引号包裹（如 "'user-id'"），此时需用方括号访问
  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(sanitized)) {
    return `${requestParamName}.${sanitized}`;
  }
  // sanitized 已是 'xxx' 形式（含引号），直接放入方括号
  return `${requestParamName}[${sanitized}]`;
}

/**
 * @description 将 OpenAPI 路径中的 `{param}` 占位符插值为 JS 模板字符串
 *
 * - 无 path 参数时：返回单引号字面量 `'/api/users'`（兼容旧行为，零变化）
 * - 有 path 参数时：返回反引号模板字符串 `` `/api/users/${params.id}` ``
 * - 支持多个 path 参数：`/users/{userId}/posts/{postId}` → `` `/users/${params.userId}/posts/${params.postId}` ``
 * - 安全：静态部分转义反引号、`${`、反斜杠；参数名经 `sanitizePropertyName` 处理
 *
 * @param path 原始 OpenAPI 路径（如 `/api/v1/stock/{code}`）
 * @param requestParamName 请求参数变量名（默认 `params`）
 * @param pathParamNames 路径参数名列表（用于校验占位符，可选；为空时按占位符自身处理）
 * @returns 插值结果，含 `literal` 标记和完整字符串字面量 `value`
 *
 * @example
 * ```typescript
 * interpolatePathParams('/api/users', 'params', []); // { literal: true, value: "'/api/users'" }
 * interpolatePathParams('/api/v1/stock/{code}', 'params', ['code']);
 * // → { literal: false, value: '`/api/v1/stock/${params.code}`' }
 * interpolatePathParams('/users/{userId}/posts/{postId}', 'params', ['userId', 'postId']);
 * // → { literal: false, value: '`/users/${params.userId}/posts/${params.postId}`' }
 * ```
 */
export function interpolatePathParams(
  path: string,
  requestParamName = 'params',
  pathParamNames: string[] = [],
): InterpolatedPath {
  if (!path) {
    return { literal: true, value: "''" };
  }

  // 无占位符 → 单引号字面量（保持旧行为）
  if (!PATH_PARAM_PATTERN.test(path)) {
    // 重置正则 lastIndex（全局标志副作用）
    PATH_PARAM_PATTERN.lastIndex = 0;
    return { literal: true, value: `'${escapeStringLiteral(path)}'` };
  }
  PATH_PARAM_PATTERN.lastIndex = 0;

  // pathParamNames 当前仅作为调用方的语义提示（标识已知 path 参数），
  // 插值时直接使用路径中的占位符名。保留参数以维持 API 契约的清晰度。
  if (pathParamNames.length === 0) {
    // no-op：仅引用参数避免未使用警告，参数语义已通过 JSDoc 说明
  }

  // 构建插值后的模板字符串内容：
  // 遍历路径，分别处理「静态部分」（转义反引号/${}）和「占位符」（替换为 ${params.xxx}）
  let interpolated = '';
  let lastIndex = 0;
  let match = PATH_PARAM_PATTERN.exec(path);

  while (match !== null) {
    const [fullMatch, rawParamName] = match;
    const matchStart = match.index;

    // 静态部分（占位符之前的文本）
    interpolated += escapeTemplateLiteralStatic(path.slice(lastIndex, matchStart));
    // 参数访问表达式
    interpolated += `\${${buildParamAccess(requestParamName, rawParamName as string)}}`;

    lastIndex = matchStart + fullMatch.length;
    match = PATH_PARAM_PATTERN.exec(path);
  }

  // 尾部静态部分
  interpolated += escapeTemplateLiteralStatic(path.slice(lastIndex));

  return { literal: false, value: `\`${interpolated}\`` };
}

/**
 * @description 敏感信息脱敏工具
 * 用于在日志输出（如 DEBUG 模式）中遮蔽 token、Authorization 头等敏感凭证，
 * 避免明文凭证泄露到控制台或 CI 日志。保留首尾少量字符以维持诊断价值。
 */

/**
 * @description token 的最小长度：短于此长度的 token 全量遮蔽，避免通过片段可还原
 */
const MIN_TOKEN_LENGTH = 8;

/**
 * @description 保留的 token 前缀字符数
 */
const TOKEN_PREFIX_LENGTH = 4;

/**
 * @description 保留的 token 后缀字符数
 */
const TOKEN_SUFFIX_LENGTH = 4;

/**
 * @description 对单个 token 进行脱敏
 * 保留首尾少量字符，中间以 `****` 替换。过短的 token 全量遮蔽为 `***`。
 * @param token 原始 token（可能为 undefined）
 * @returns 脱敏后的 token（若输入为 undefined 则原样返回）
 *
 * @example
 * ```typescript
 * redactToken('sk-abcdefghijklmn'); // → 'sk-a****klmn'
 * redactToken('abc');               // → '***'
 * redactToken(undefined);           // → undefined
 * ```
 */
export function redactToken(token: string | undefined): string | undefined {
  if (!token) return token;
  if (token.length <= MIN_TOKEN_LENGTH) return '***';
  return `${token.slice(0, TOKEN_PREFIX_LENGTH)}****${token.slice(-TOKEN_SUFFIX_LENGTH)}`;
}

/**
 * @description 对含 token 字段的配置对象进行脱敏（浅拷贝，不改原对象）
 * @param config 含 `token` 字段的配置对象
 * @returns 脱敏后的新对象，原对象保持不变
 *
 * @example
 * ```typescript
 * const safe = redactConfig({ source: '...', token: 'sk-secret' });
 * // safe.token → '***' 或脱敏片段，原 config 不变
 * ```
 */
export function redactConfig<T extends { token?: string }>(config: T): T {
  return { ...config, token: redactToken(config.token) };
}

/**
 * @description 对 HTTP headers 中的 Authorization 头进行脱敏（浅拷贝，不改原对象）
 * 支持 `Bearer xxx` 格式，仅遮蔽凭证部分，保留前缀以便识别认证方式。
 * @param headers 原始 headers 对象
 * @returns 脱敏后的新 headers 对象，原对象保持不变
 *
 * @example
 * ```typescript
 * const safe = redactHeaders({
 *   Authorization: 'Bearer sk-abcdefghijklmn',
 *   'Content-Type': 'application/json',
 * });
 * // safe.Authorization → 'Bearer sk-a****klmn'
 * ```
 */
export function redactHeaders(headers: Record<string, string>): Record<string, string> {
  const result = { ...headers };
  const auth = result.Authorization || result.authorization;
  if (!auth) return result;

  // 剥离 Bearer 前缀后脱敏凭证
  const match = auth.match(/^(Bearer\s+)(.+)$/i);
  if (match) {
    const masked = `${match[1]}${redactToken(match[2])}`;
    // 保持原 key 的大小写
    const key = result.Authorization ? 'Authorization' : 'authorization';
    result[key] = masked;
  } else {
    // 非 Bearer 格式，整体脱敏
    const key = result.Authorization ? 'Authorization' : 'authorization';
    result[key] = redactToken(auth) as string;
  }
  return result;
}

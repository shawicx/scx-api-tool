/**
 * @description Schema 安全工具
 * 防御远端 OpenAPI 数据的 DoS 攻击：通过递归深度上限和循环引用检测，
 * 防止恶意/畸形 schema 导致栈溢出或内存耗尽。
 */

/**
 * @description Schema 递归处理的最大深度
 * 超过此深度的 schema 将降级为 any，避免无限递归。
 * OpenAPI 规范的常见嵌套深度通常 < 10，20 提供充足余量。
 */
export const MAX_SCHEMA_DEPTH = 20;

/**
 * @description 判断当前递归深度是否已超限
 * @param depth 当前深度
 * @returns true 表示已超限，调用方应降级返回
 *
 * @example
 * ```typescript
 * function processSchema(schema, depth = 0) {
 *   if (isDepthExceeded(depth)) return { type: 'any' };
 *   // ... 正常处理
 * }
 * ```
 */
export function isDepthExceeded(depth: number): boolean {
  return depth >= MAX_SCHEMA_DEPTH;
}

/**
 * @description 循环引用检测器
 * 基于 WeakSet 跟踪「正在处理」的 schema 对象，命中即表示循环引用。
 */
export class CircularRefGuard {
  private readonly seen = new WeakSet<object>();

  /**
   * @description 标记 schema 开始处理。若该对象已在处理链中，返回 true（循环引用）
   * @param schema 待处理的 schema 对象
   * @returns true 表示检测到循环引用，调用方应跳过
   *
   * @example
   * ```typescript
   * const guard = new CircularRefGuard();
   * function processSchema(schema) {
   *   if (guard.begin(schema)) return null; // 循环引用，跳过
   *   const result = ...;
   *   guard.end(schema);
   *   return result;
   * }
   * ```
   */
  begin(schema: object): boolean {
    if (this.seen.has(schema)) return true;
    this.seen.add(schema);
    return false;
  }

  /**
   * @description 标记 schema 处理完成，从「正在处理」集合移除
   * @param schema 已处理的 schema 对象
   */
  end(schema: object): void {
    this.seen.delete(schema);
  }
}

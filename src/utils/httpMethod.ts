/**
 * @description OpenAPI Path Item 的 HTTP 方法白名单
 * OpenAPI 规范中 Path Item 对象除操作字段（get/post 等）外，还允许
 * $ref、summary、description、servers、parameters 等非操作字段；
 * 遍历 Path Item 时必须以白名单过滤，避免将非操作字段误识别为接口。
 */

/**
 * OpenAPI 3.x Path Item 允许的全部 8 种 HTTP 操作方法（规范规定为小写）
 */
const HTTP_METHODS = new Set(['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace']);

/**
 * @description 判断 Path Item 的某个键是否为 HTTP 方法（大小写不敏感，兼容非规范的大写键）
 * @param key Path Item 对象的键名
 * @returns 是否为 HTTP 操作方法
 *
 * @example
 * ```typescript
 * isHttpMethod('get');        // true
 * isHttpMethod('PATCH');      // true
 * isHttpMethod('parameters'); // false（Path Item 公共参数，非操作）
 * isHttpMethod('$ref');       // false（Path Item 引用，非操作）
 * ```
 */
export function isHttpMethod(key: string): boolean {
  return HTTP_METHODS.has(key.toLowerCase());
}

export { HTTP_METHODS };

/*
 * @Author: shawicx d35f3153@proton.me
 * @Date: 2025-08-08 23:27:42
 * @LastEditors: shawicx d35f3153@proton.me
 * @LastEditTime: 2025-08-09 06:39:38
 * @Description: 类型工具定义
 */

/**
 * @description 去除类型 T 中的 undefined。
 * @public
 * @example
 * ```typescript
 * type X = string | undefined
 * type Y = Defined<X> // => string
 * ```
 */
export type Defined<T> = Exclude<T, undefined>;

/**
 * @description 同 `T | T[]`。
 * @public
 * @example
 * ```typescript
 * type X = OneOrMore<number> // => number | number[]
 * ```
 */
export type OneOrMore<T> = T | T[];

// 第三方库类型导出已移至 index.ts 统一管理

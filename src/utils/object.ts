/*
 * @Author: shawicx d35f3153@proton.me
 * @Date: 2025-08-08 23:27:42
 * @LastEditors: shawicx d35f3153@proton.me
 * @LastEditTime: 2025-08-24 02:26:52
 * @Description: 对象处理工具函数
 */
import { forOwn, has, isPlainObject, omit } from 'lodash-es';
import { OmitStrict, OneOrMore } from './index.js';

/**
 * @description 遍历对象和数组。
 * @param value 要遍历的值
 * @param callback 遍历回调
 * @returns 返回结果
 * @example
 * ```typescript
 * traverse([1, 2, {3: 4}], value => {
 *   console.log(value)
 *   // => 1
 *   // => 2
 *   // => {3: 4}
 *   // => 4
 * })
 * ```
 */
export function traverse(
  value: any,
  callback: (value: any, key: string | number, parent: any) => any,
): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      callback(item, index, value);
      if (value[index] !== undefined) {
        traverse(item, callback);
      }
    });
  } else if (isPlainObject(value)) {
    forOwn(value, (item, key) => {
      callback(item, key, value);
      if (has(value, key)) {
        traverse(item, callback);
      }
    });
  }
}

/**
 * @description 同 {@link https://lodash.com/docs/4.17.15#omit | omit}，不过采用了严格的类型定义。
 * @public
 */
export const omitStrict = omit as any as <T extends Record<any, any>, K extends keyof T>(
  object: T,
  ...paths: Array<OneOrMore<K>>
) => OmitStrict<T, K>;

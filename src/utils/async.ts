/*
 * @Author: shawicx d35f3153@proton.me
 * @Description: 异步处理工具函数
 */
import { WaitResult } from '../types';

/**
 * @description 等待一段时间 resolve。
 * @public
 * @param milliseconds 等待时间(毫秒)
 * @param value resolve 值
 * @example
 * ```typescript
 * wait(1000).then(() => {
 *   console.log('ok')
 * }) // => 1秒后在控制台打印字符串: ok
 * ```
 */
export function wait<T>(milliseconds: number, value?: T): WaitResult<T> {
  let timer: any;
  const result = new Promise<T | undefined>((resolve) => {
    timer = setTimeout(() => resolve(value), milliseconds);
  }) as WaitResult<T>;
  result.cancel = () => clearTimeout(timer);
  return result;
}

/**
 * @description 等待一段时间后 reject。
 * @public
 * @param milliseconds 等待时间(毫秒)
 * @param value reject 值
 * @example
 * ```typescript
 * wait.reject(1000).catch(() => {
 *   console.log('ok')
 * }) // => 1秒后在控制台打印字符串: ok
 * ```
 */
wait.reject = function reject(milliseconds: number, value?: any): WaitResult<never> {
  const waitRes = wait(milliseconds);
  const res: WaitResult<never> = waitRes.then(() => Promise.reject(value)) as any;
  res.cancel = waitRes.cancel;
  return res;
};

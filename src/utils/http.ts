/*
 * @Author: shawicx d35f3153@proton.me
 * @Date: 2025-08-08 23:50:48
 * @LastEditors: shawicx d35f3153@proton.me
 * @LastEditTime: 2025-08-09 06:43:37
 * @Description:
 */
import nodeFetch from 'node-fetch';
import ProxyAgent from 'proxy-agent';
import { URL } from 'url';

/**
 * @description 获取 HTTP 请求。
 * @param url 请求 URL
 * @param query 请求参数
 * @returns 请求结果
 */
export async function httpGet<T>(url: string, query?: Record<string, any>): Promise<T> {
  const _url = new URL(url);
  if (query) {
    Object.keys(query).forEach((key) => {
      _url.searchParams.set(key, query[key]);
    });
  }
  const finalUrl = _url.toString();

  const res = await nodeFetch(finalUrl, {
    method: 'GET',
    agent: new ProxyAgent() as any,
  });

  return res.json();
}

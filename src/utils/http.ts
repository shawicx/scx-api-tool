/*
 * @Author: shawicx d35f3153@proton.me
 * @Date: 2025-08-08 23:50:48
 * @LastEditors: shawicx d35f3153@proton.me
 * @LastEditTime: 2025-08-14 22:44:14
 * @Description:
 */
import axios from 'axios';
import { ProxyAgent } from 'proxy-agent';
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

  const response = await axios.get(finalUrl, {
    method: 'GET',
    httpsAgent: new ProxyAgent() as any,
    httpAgent: new ProxyAgent() as any,
  });

  return response.data;
}

export const requestTemplate = `import type { AxiosRequestConfig } from 'axios';
import axios from 'axios';

export interface RequestConfig extends AxiosRequestConfig {
  url: string;
  method: string;
}

// 用于转发请求的代理地址
const BASE_LINE_PROXY_PATH = '/api';

// 超时时间
const TIMEOUT = 5 * 1000;

export default async function {{requestFunctionName}}<T = any>(config: RequestConfig): Promise<T> {
  try {
    const response = await axios({
      ...config,
      baseURL: BASE_LINE_PROXY_PATH,
      timeout: TIMEOUT,
    });

    return response.data;
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}
`;

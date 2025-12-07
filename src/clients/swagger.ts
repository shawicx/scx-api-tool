/**
 * @description 从 Swagger/OpenAPI 端点获取数据
 */

import axios from 'axios';
import consola from 'consola';
import type { ApiConfig } from '@/types';

export async function fetchSwaggerData(config: ApiConfig): Promise<any> {
  try {
    const apiUrl = config.serverUrl;

    // 如果启用，则记录调试信息
    if (process.env.DEBUG) {
      consola.debug(`正在从以下位置获取 Swagger 数据: ${apiUrl}`);
    }

    // 发起 API 请求
    const response = await axios.get(apiUrl);

    return response.data;
  } catch (error: any) {
    consola.error('从 Swagger 获取数据失败:', error.message);
    throw error;
  }
}

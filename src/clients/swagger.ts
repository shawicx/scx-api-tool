/**
 * @description 从 Swagger/OpenAPI 端点获取数据
 */

import axios from 'axios';
import consola from 'consola';
import type { ApiConfig } from '@/types';
import { makeRequestWithProgress } from '@/progress';

export async function fetchSwaggerData(config: ApiConfig): Promise<any> {
  try {
    const apiUrl = config.serverUrl;

    // 如果启用，则记录调试信息
    if (process.env.DEBUG) {
      consola.debug(`正在从以下位置获取 Swagger 数据: ${apiUrl}`);
    }

    // 使用带进度显示的请求
    const response = await makeRequestWithProgress(
      async (onProgress) => {
        return await axios.get(apiUrl, {
          onDownloadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              onProgress(progressEvent.loaded, progressEvent.total);
            }
          },
        });
      },
      {
        url: apiUrl,
        method: 'GET',
      },
    );

    return response.data;
  } catch (error: any) {
    consola.error('从 Swagger 获取数据失败:', error.message);
    throw error;
  }
}

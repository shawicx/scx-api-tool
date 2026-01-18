/**
 * @description 从 Swagger/OpenAPI 端点获取数据
 */

import axios from 'axios';
import consola from 'consola';
import type { ApiConfig } from '@/types';
import { makeRequestWithProgress } from '@/utils/progress';

/**
 * @description 从 Swagger/OpenAPI 获取数据
 * 直接从指定的 URL 获取 OpenAPI/Swagger 定义
 * @param config API 配置
 * @returns OpenAPI 数据对象
 * @throws {Error} 如果请求失败
 *
 * @example
 * ```typescript
 * const data = await fetchSwaggerData(config);
 * // data = { openapi: '3.0.0', paths: {...}, components: {...} }
 * ```
 */
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

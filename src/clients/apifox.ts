/**
 * @description 从 Apifox 平台获取 OpenAPI 数据
 */

import axios from 'axios';
import consola from 'consola';
import type { ApiConfig } from '@/types';
import { makeRequestWithProgress } from '@/progress';
import { ErrorFactory } from '@/errors';

export async function fetchApifoxData(config: ApiConfig): Promise<any> {
  try {
    const { token } = config;

    // 添加查询参数
    const realUrl = `${config.source}?locale=zh-CN`;

    const headers = {
      'X-Apifox-Api-Version': '2024-03-28',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Connection: 'keep-alive',
    };

    const requestBody = {
      scope: {
        type: 'ALL',
        excludedByTags: ['pet'],
      },
      options: {
        includeApifoxExtensionProperties: false,
        addFoldersToTags: false,
      },
      oasVersion: '3.1',
      exportFormat: 'JSON',
    };

    // 如果启用，则记录调试信息
    if (process.env.DEBUG) {
      consola.debug('Apifox API 请求配置:', headers, requestBody, realUrl);
    }

    // 使用带进度显示的请求
    const response = await makeRequestWithProgress(
      async (onProgress) => {
        return await axios.post(realUrl, requestBody, {
          headers,
          timeout: 30000, // 30秒超时
          onDownloadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              onProgress(progressEvent.loaded, progressEvent.total);
            }
          },
        });
      },
      {
        url: realUrl,
        method: 'POST',
        timeout: 30000,
        retries: 0,
      },
    );

    if (response.status !== 200) {
      throw ErrorFactory.fetchFailed(realUrl, response.status);
    }

    // 检查响应内容类型
    const contentType = response.headers['content-type'] || '';
    if (!contentType.includes('application/json')) {
      throw ErrorFactory.invalidResponse(realUrl, 'application/json');
    }

    if (process.env.DEBUG) {
      consola.debug('Apifox response status:', response.status);
      consola.debug('Apifox response data type:', typeof response.data);
    }

    return response.data;
  } catch (error: any) {
    // 如果是我们自定义的错误，直接抛出
    if (error.code && error.code.startsWith('E2')) {
      throw error;
    }

    // 处理 Axios 错误
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;

      // 401 未授权
      if (statusCode === 401) {
        throw ErrorFactory.unauthorized(realUrl);
      }

      // 超时
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw ErrorFactory.timeout(realUrl, 30000);
      }

      // 网络错误
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw ErrorFactory.fetchFailed(realUrl, statusCode, error);
      }

      // 其他 Axios 错误
      throw ErrorFactory.fetchFailed(realUrl, statusCode, error);
    }

    // 重新抛出其他错误
    throw error;
  }
}

/**
 * @description 从 Apifox 平台获取 OpenAPI 数据
 */

import axios from 'axios';
import consola from 'consola';
import type { ApiConfig } from '@/types';

export async function fetchApifoxData(config: ApiConfig): Promise<any> {
  try {
    const { serverUrl, apifoxProjectId: projectId, token } = config;

    if (!projectId) {
      throw new Error('Apifox 项目 ID 是必需的');
    }

    if (!token) {
      throw new Error('Apifox 项目 token 是必需的');
    }

    // 检查serverUrl是否已经包含完整路径
    let url: string;
    if (serverUrl.includes('/v1/projects/') && serverUrl.includes('/export-openapi')) {
      // 如果已经包含完整路径，直接使用
      url = serverUrl;
    } else {
      // 否则拼接完整路径
      const baseUrl = serverUrl.replace(/\/+$/, '');
      url = `${baseUrl}/v1/projects/${projectId}/export-openapi`;
    }

    // 添加查询参数
    url += '?locale=zh-CN';

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
      consola.debug('Apifox API 请求配置:', headers, requestBody, url);
    }

    const response = await axios.post(url, requestBody, {
      headers,
      timeout: 30000, // 30秒超时
    });

    if (response.status !== 200) {
      throw new Error(`Apifox API 请求失败: ${response.status} ${response.statusText}`);
    }

    // 检查响应内容类型
    const contentType = response.headers['content-type'] || '';
    if (!contentType.includes('application/json')) {
      throw new Error(`Apifox API 返回的不是JSON格式: ${contentType}`);
    }

    if (process.env.DEBUG) {
      consola.debug('Apifox response status:', response.status);
      consola.debug('Apifox response data type:', typeof response.data);
    }

    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      consola.error('Apifox API 请求失败 - axios错误:', error);
      throw new Error(`Apifox API 请求失败: ${message}`);
    }
    consola.error('从 Apifox 获取数据失败:', error.message);
    throw error;
  }
}

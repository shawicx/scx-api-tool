import axios from 'axios';
import type { OpenAPIV3 } from 'openapi-types';

export interface ApifoxExportOptions {
  scope?: {
    type?: 'ALL' | 'FOLDER' | 'INTERFACE';
    excludedByTags?: string[];
  };
  options?: {
    includeApifoxExtensionProperties?: boolean;
    addFoldersToTags?: boolean;
  };
  oasVersion?: '3.0' | '3.1';
  exportFormat?: 'JSON' | 'YAML';
}

export interface ApifoxConfig {
  serverUrl: string;
  token: string;
  projectId?: string;
  exportOptions?: ApifoxExportOptions;
}

/**
 * 从 Apifox 获取 OpenAPI 格式的数据
 * @param config Apifox 配置
 * @returns OpenAPI 文档
 */
export async function fetchApifoxOpenAPI(config: ApifoxConfig): Promise<OpenAPIV3.Document> {
  const {
    serverUrl,
    token,
    projectId, // 移除默认值，让调用方必须提供
    exportOptions = {
      scope: {
        type: 'ALL',
      },
      options: {
        includeApifoxExtensionProperties: false,
        addFoldersToTags: true,
      },
      oasVersion: '3.1',
      exportFormat: 'JSON',
    },
  } = config;

  if (!projectId) {
    throw new Error('Apifox 项目 ID 是必需的');
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
  };

  const requestBody = {
    scope: exportOptions.scope || {
      type: 'ALL',
    },
    options: exportOptions.options || {
      includeApifoxExtensionProperties: false,
      addFoldersToTags: true,
    },
    oasVersion: exportOptions.oasVersion || '3.1',
    exportFormat: exportOptions.exportFormat || 'JSON',
  };

  try {
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

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      throw new Error(`Apifox API 请求失败: ${message}`);
    }
    throw error;
  }
}

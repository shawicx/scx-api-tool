/**
 * 配置工具函数
 * 处理配置验证、解析和应用逻辑
 */

import {
  ApiConfig,
  UserConfig,
  PRESETS,
  ServerType,
  RequestMethodStyle,
  RequestMethod,
} from '@/types';

/**
 * 默认配置值
 */
const DEFAULT_CONFIG_VALUES: Omit<
  ApiConfig,
  'source' | 'token' | 'serverUrl' | 'serverType' | 'apifoxProjectId'
> = {
  typesOnly: false,
  target: 'typescript',
  pathPrefix: '',
  outputDir: 'src/service',
  indentSize: 2,
  comment: true, // 默认生成注释
  prodEnvName: 'production',
  requestFunctionFilePath: 'src/service/request.ts',
  requestMethodStyle: RequestMethodStyle.CONFIG, // 默认为标准配置方式
  requestFunctionName: 'request',
  requestMethodsObjectName: 'requestMethods',
  categories: [],
};

/**
 * HTTP 方法映射
 */
export const HTTP_METHODS = {
  GET: 'get',
  POST: 'post',
  PUT: 'put',
  DELETE: 'delete',
  PATCH: 'patch',
  HEAD: 'head',
  OPTIONS: 'options',
} as const;

/**
 * 验证 HTTP 方法有效性
 */
export function assertValidMethod(method: string): asserts method is keyof typeof HTTP_METHODS {
  if (!Object.keys(HTTP_METHODS).includes(method.toUpperCase())) {
    throw new Error(`Invalid HTTP method: ${method}`);
  }
}

/**
 * @description 判断是否为 GET 类请求。
 * @param method 请求方式
 * @returns 是否为 GET 类请求
 */
export function isGetLikeMethod(method: RequestMethod): boolean {
  return method === 'GET' || method === 'OPTIONS' || method === 'HEAD';
}

/**
 * @description 判断是否为 POST 类请求。
 * @param method 请求方式
 * @returns 是否为 POST 类请求
 */
export function isPostLikeMethod(method: RequestMethod): boolean {
  return !isGetLikeMethod(method);
}

/**
 * 从 source URL 解析服务器信息
 */
export function parseSourceUrl(source: string): {
  serverUrl: string;
  serverType: ServerType;
  apifoxProjectId?: string;
} {
  try {
    const url = new URL(source);

    // 检测服务器类型
    let serverType: ServerType;
    let apifoxProjectId: string | undefined;

    if (url.hostname.includes('apifox.com')) {
      serverType = ServerType.Apifox;
      // 从路径中提取项目 ID: https://api.apifox.com/v1/projects/6997172/export-openapi
      const pathMatch = url.pathname.match(/\/projects\/(\d+)/);
      if (pathMatch) {
        apifoxProjectId = pathMatch[1];
      }
    } else {
      serverType = ServerType.Swagger;
    }

    // 确保返回完整的 serverUrl
    const serverUrl = `${url.protocol}//${url.host}`;

    return {
      serverUrl,
      serverType,
      apifoxProjectId,
    };
  } catch (error) {
    console.error('parseSourceUrl error:', error);
    throw new Error(`Invalid source URL format: ${source}`);
  }
}

/**
 * 验证配置
 */
export function validateConfig(config: UserConfig): void {
  // 验证必需字段
  if (!config.source) {
    throw new Error('配置验证失败：source 是必需的');
  }

  if (!config.token) {
    throw new Error('配置验证失败：token 是必需的');
  }

  // 验证预设类型
  if (config.preset && !['minimal', 'standard', 'verbose'].includes(config.preset)) {
    throw new Error(`无效的预设类型: ${config.preset}，支持的预设类型: minimal, standard, verbose`);
  }

  // 验证 source URL 格式
  try {
    // eslint-disable-next-line no-new
    new URL(config.source);
  } catch {
    throw new Error(`无效的 source URL: ${config.source}`);
  }

  // 验证 HTTP 方法
  if (
    config.requestMethodStyle === RequestMethodStyle.METHOD_SPECIFIC ||
    config.requestMethodStyle === RequestMethodStyle.BOTH
  ) {
    // 这里可以添加额外的验证逻辑
  }
}

/**
 * 应用预设配置
 * @param config 用户配置
 * @returns 应用预设后的配置
 */
function applyPreset(
  config: UserConfig,
): Omit<ApiConfig, 'serverUrl' | 'serverType' | 'apifoxProjectId' | 'source' | 'token'> {
  // 获取预设配置
  const presetConfig = config.preset ? PRESETS[config.preset] : {};

  // 合并配置：默认值 < 预设值 < 用户自定义值
  return {
    ...DEFAULT_CONFIG_VALUES,
    ...presetConfig,
    ...config,
    categories: config.categories || [],
  };
}

/**
 * 定义配置
 * @param config 配置对象
 * @returns 配置对象
 */
export function defineConfig(config: UserConfig): ApiConfig {
  // 验证配置
  validateConfig(config);

  // 从 source 解析服务器信息
  const { serverUrl, serverType, apifoxProjectId } = parseSourceUrl(config.source);

  // 应用预设和用户配置
  const mergedConfig = applyPreset(config);

  // 创建最终配置，确保解析的服务器信息不被覆盖
  const finalConfig: ApiConfig = {
    ...mergedConfig,
    serverUrl,
    serverType,
    apifoxProjectId,
    source: config.source,
    token: config.token,
  };

  return finalConfig;
}

// 导出预设常量
export { PRESETS };

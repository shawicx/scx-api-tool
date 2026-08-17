/**
 * @description 配置工具模块
 * 提供配置解析、验证和预设应用功能
 */

import {
  ApiConfig,
  MultiServiceConfig,
  CommonServiceConfig,
  PRESETS,
  ServerType,
  RequestMethodStyle,
  RequestMethod,
  TypesFormat,
  CliHooks,
} from '@/types';
import { logger } from '@/utils/logger';
import { ErrorFactory } from '@/errors';
import { resolveServiceConfigs } from './multiService';

/**
 * 默认配置值（公共部分，不含 source/token/server 信息与 outputDir）
 */

const DEFAULT_CONFIG_VALUES: Omit<
  ApiConfig,
  'source' | 'token' | 'serverUrl' | 'serverType' | 'apifoxProjectId' | 'outputDir'
> = {
  generateApi: true, // 默认生成 API 请求方法
  generateTypes: true, // 默认生成类型定义
  typesFormat: 'typescript' as TypesFormat, // 默认使用 TypeScript 格式
  target: 'typescript',
  transformPath: ((p: string) => p) as (path: string) => string,
  indentSize: 2,
  comment: true, // 默认生成注释
  prodEnvName: 'production',
  requestFunctionFilePath: 'src/service/request.ts',
  requestMethodStyle: RequestMethodStyle.CONFIG, // 默认为标准配置方式
  requestFunctionName: 'request',
  requestMethodsObjectName: 'requestMethods',
  requestParamName: 'params',
  responseTypeName: 'Response',
  concurrency: 50, // 默认并发数
  hooks: undefined as CliHooks | undefined, // 钩子函数
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
    logger.error('parseSourceUrl error:', error);
    throw new Error(`Invalid source URL format: ${source}`);
  }
}

/**
 * @description 规范化 transformPath：统一为函数形式。
 * - function：透传
 * - undefined/null：注入恒等函数
 * - 其他类型（含 string）：抛 E1002 配置错误（0.6.0 起硬废弃 string 形式）
 * @param value 用户配置的 transformPath 值
 * @returns 规范化后的函数
 * @throws {ConfigError} 当值为非函数非 undefined/null 时
 *
 * @example
 * ```typescript
 * normalizeTransformPath(undefined)        // 返回恒等函数
 * normalizeTransformPath((p) => '/api'+p)  // 透传
 * normalizeTransformPath('/api')           // 抛 E1002
 * ```
 */
export function normalizeTransformPath(value: unknown): (path: string) => string {
  if (value === undefined || value === null) {
    return (p: string) => p;
  }
  if (typeof value === 'function') {
    return value as (path: string) => string;
  }
  const actualType = Array.isArray(value) ? 'array' : typeof value;
  throw ErrorFactory.configInvalid(
    `transformPath 配置无效：期望类型为函数，实际类型为 ${actualType}` +
      `（字符串形式已在 0.6.0 版本废弃）`,
    [
      {
        title: '迁移到函数形式',
        steps: [
          '去除前缀：transformPath: (p) => p.startsWith("/api") ? p.slice(4) : p',
          '添加前缀：transformPath: (p) => "/api/v1" + p',
          '不做修改：删除 transformPath 配置项即可',
        ],
      },
    ],
  );
}

/**
 * @description 应用预设配置（作用于公共配置部分）
 * 合并优先级：默认值 < 预设值 < 用户自定义值
 * @param config 公共配置对象
 * @returns 应用预设后的公共配置（不含 source/token/outputDir 等服务级字段）
 */
export function applyPreset(config: CommonServiceConfig): CommonServiceConfig {
  // 获取预设配置
  const presetConfig = config.preset ? PRESETS[config.preset] : {};

  // 合并配置：默认值 < 预设值 < 用户自定义值
  return {
    ...DEFAULT_CONFIG_VALUES,
    ...presetConfig,
    ...config,
  };
}

/**
 * @description 定义配置（多服务配置入口）
 *
 * 不向后兼容：统一使用多服务配置方式，单源即 services 数组长度为 1。
 * 多服务解析逻辑（公共配置合并、outputDir 计算与隔离校验）见 `./multiService`。
 *
 * @param config 多服务用户配置
 * @returns ApiConfig[] 每个元素为单服务运行时配置
 *
 * @example
 * ```typescript
 * // 多服务：公共配置继承 + 服务级覆盖
 * const configs = defineConfig({
 *   baseOutputDir: 'src/api',
 *   typesFormat: 'typescript',
 *   services: [
 *     { name: 'user', source: 'https://user-svc/v3/api-docs', token: 'APS-xxx' },
 *     { name: 'order', source: 'https://order-svc/swagger.json', token: 'APS-yyy' },
 *   ],
 * });
 *
 * // 单源：services 数组长度为 1
 * const [config] = defineConfig({
 *   services: [{ name: 'main', source: 'https://petstore.swagger.io/v2/swagger.json' }],
 * });
 * ```
 */
export function defineConfig(config: MultiServiceConfig): ApiConfig[] {
  return resolveServiceConfigs(config);
}

/**
 * @description 根据目标语言获取文件扩展名
 * @param target 目标语言
 * @returns 文件扩展名（包含点号）
 */
export function getFileExtension(target: 'javascript' | 'typescript'): '.ts' | '.js' {
  return target === 'javascript' ? '.js' : '.ts';
}

// 导出预设常量
export { PRESETS };

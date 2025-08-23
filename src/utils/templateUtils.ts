/*
 * @Author: shawicx d35f3153@proton.me
 * @Date: 2025-08-23 03:20:48
 * @LastEditors: shawicx d35f3153@proton.me
 * @LastEditTime: 2025-08-24 03:22:52
 * @Description: 模版工具函数 - 自动生成，请勿手动修改
 */

// 构建时自动注入的模板内容
const TEMPLATES = {
  config: `// @ts-ignore @ts-nocheck 模版文件不需要检查错误
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig([
  {
    // 方式1：使用基础URL + apifoxProjectId配置
    serverUrl: 'https://api.apifox.com',
    serverType: 'apifox',
    apifoxProjectId: '6720131', // 新增：Apifox项目ID配置
    // 方式2：也可以直接在serverUrl中包含项目ID（向后兼容）
    // serverUrl: 'https://api.apifox.com/v1/projects/6720131/export-openapi',
    // serverType: 'apifox',
    // 此时可以不设置apifoxProjectId，代码会自动从URL中提取
    typesOnly: false,
    target: '{{TARGET}}',
    // 统一去掉接口路径的某部分，例如 '/api'
    pathPrefix: '',
    // 输出目录配置
    outputDir: 'src/service',
    // 代码缩进配置
    indentSize: 2,
    reactHooks: {
      enabled: false,
    },
    prodEnvName: 'production',
    requestFunctionFilePath: 'src/api/request.{{EXTENSION}}',
    dataKey: 'data',
    projects: [
      {
        token: 'token', // Swagger项目不需要token
        categories: [
          {
            id: 0,
            // getRequestFunctionName(interfaceInfo, changeCase) {
            //   以接口全路径生成请求函数名
            //   return changeCase.camelCase(interfaceInfo.path)
            //   若生成的请求函数名存在语法关键词报错、或想通过某个关键词触发 IDE 自动引入提示，可考虑加前缀，如:
            //   return changeCase.camelCase(\`api_\${interfaceInfo.path}\`)
            //   若生成的请求函数名有重复报错，可考虑将接口请求方式纳入生成条件，如:
            //   return changeCase.camelCase(\`\${interfaceInfo.method}_\${interfaceInfo.path}\`)
            // },
          },
        ],
      },
    ],
  },
]);
`,
  request: `// @ts-nocheck
import { Request_Method } from '@scxfe/api-tool';
import type { AxiosRequestConfig } from 'axios';
import axios from 'axios';
import { AESToken } from '.';

type Method = ValueOf<typeof Request_Method>;

// 用于转发请求的代理地址
const BASE_LINE_PROXY_PATH = '/api';
// 用于 token 加密（基线）
const BASE_LINE_KEY_24 = 'HKCADQN7E5WJ3KQRPACNZ3QH';

// 取消请求白名单
const CANCEL_WHITE_LIST: Array<{ path: string; method: Method }> = [];

// 超时时间
const TIMEOUT = 5 * 1000;

// token 报错
const TOKEN_ERROR_STATUS = 3001;

// 请求队列
const pendingRequests = new Map();

// token 请求状态码
const HttpStatus = {
  OK: 200,
  Redirection: 300,
  OK_OTHER: 9200,
  BadRequest: 400,
  Unauthorized: 401,
  Forbidden: 403,
  NotFound: 404,
  InternalServerError: 500,
  UnKnownError: 9300,
  ClientError: 9400,
  ServerError: 9500,
} as const;

type HttpStatus = (typeof HttpStatus)[keyof typeof HttpStatus];

// https 状态提示语
const HttpStatusMessage = new Map<HttpStatus, string>([
  [HttpStatus.BadRequest, ['参数错误']],
  [HttpStatus.Unauthorized, ['未授权']],
  [HttpStatus.Forbidden, ['禁止访问']],
  [HttpStatus.NotFound, ['请求不存在']],
  [HttpStatus.InternalServerError, ['服务器错误']],
  [HttpStatus.ClientError, ['客户端错误']],
  [HttpStatus.ServerError, ['服务器错误']],
  [HttpStatus.UnKnownError, ['未知错误']],
]);

function hashObject(obj: unknown): string {
  const str = JSON.stringify(obj);
  // 使用简单的哈希算法，在实际使用时可以选择 crypto
  return str
    .split('')
    .reduce((hash, char) => {
      return ((hash << 5) - hash + char.charCodeAt(0)) | 0;
    }, 0)
    .toString(36);
}

// 根据请求得到的唯一值，用于取消重复请求
function getRequestKey(url: string, { method, params, data }: AxiosRequestConfig): string {
  // 使用 URL 对象处理 url
  const urlObj = new URL(url, window.location.origin);

  // 使用 crypto 生成更短的唯一标识
  const paramsHash = params ? hashObject(params) : '';
  const dataHash = data ? hashObject(data) : '';

  return \`\${method}:\${urlObj.pathname}:\${paramsHash}:\${dataHash}\`;
}

function handleError(error: Error) {
  if (axios.isCancel(error)) {
    console.log('请求取消的错误', error.message);
  } else {
    console.log('其他未知的错误', (error as Error).message);
  }
}

function getHttpStatus(statusCode: number): HttpStatus {
  // 请求完成
  if (statusCode === HttpStatus.OK) {
    return HttpStatus.OK;
  }

  if (statusCode > HttpStatus.OK && statusCode < HttpStatus.Redirection) {
    return HttpStatus.OK_OTHER;
  }

  if (statusCode >= HttpStatus.Redirection && statusCode < HttpStatus.BadRequest) {
    return HttpStatus.Redirection;
  }

  if (statusCode >= HttpStatus.BadRequest && statusCode < HttpStatus.ServerError) {
    switch (statusCode) {
      case HttpStatus.BadRequest:
        return HttpStatus.BadRequest;
      case HttpStatus.Unauthorized:
        return HttpStatus.Unauthorized;
      case HttpStatus.Forbidden:
        return HttpStatus.Forbidden;
      case HttpStatus.NotFound:
        return HttpStatus.NotFound;
      default:
        return HttpStatus.ClientError;
    }
  }

  if (statusCode > HttpStatus.InternalServerError) {
    return HttpStatus.ServerError;
  }

  return HttpStatus.UnKnownError;
}

export default async function request(url: string, config: AxiosRequestConfig) {
  const controller = new AbortController();
  // 生成请求键值
  const requestKey = getRequestKey(url, config);
  const { signal } = controller;
  config.signal = signal;
  // 如果重复请求 且不是白名单中的请求路径,取消前一个
  if (
    pendingRequests.has(requestKey) &&
    !CANCEL_WHITE_LIST.some((item) => item.path === url && item.method === config.method)
  ) {
    pendingRequests.get(requestKey).abort();
  }
  pendingRequests.set(requestKey, controller);

  const secret = AESToken(BASE_LINE_KEY_24);
  const { headers = {}, params: configParams, ...axiosRequestConfig } = config;

  // 防止 GET 请求缓存GET
  const t = new Date().getTime();
  const isGetRequest = config.method === 'GET';
  const params = isGetRequest ? { ...(configParams || {}), t } : { t };
  try {
    const response = await axios(url, {
      headers: {
        ...headers,
        token: secret,
      },
      ...axiosRequestConfig,
      baseURL: BASE_LINE_PROXY_PATH,
      timeout: TIMEOUT,
      params: isGetRequest ? params : configParams,
    });
    const { status } = response;
    const httpStatus = getHttpStatus(status);
    const httpStatusMessage = HttpStatusMessage.get(httpStatus);

    if ([HttpStatus.OK, HttpStatus.OK_OTHER, HttpStatus.Redirection].includes(httpStatus)) {
      if (!response.data.success && response.data.status === TOKEN_ERROR_STATUS) {
        return null;
      }
      if (!response.data.success) {
        return null;
      }
      return response.data;
    } else {
      const message = httpStatusMessage?.[0] ?? '未知错误';
      return new Error(message);
    }
  } catch (error) {
    handleError(error as Error);
    throw error;
  } finally {
    pendingRequests.delete(requestKey);
  }
}`,
};

/**
 * @description 获取模板内容
 * @param templateName 模板名称
 * @returns 模板内容
 */
export function getTemplate(templateName: keyof typeof TEMPLATES): string {
  const template = TEMPLATES[templateName];
  if (!template) {
    throw new Error(`模板不存在: ${templateName}`);
  }
  return template;
}

/**
 * @description 替换模板中的变量
 * @param template 模板内容
 * @param variables 变量映射
 * @returns 替换后的内容
 */
export function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>,
): string {
  let result = template;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder, 'g'), value);
  }

  return result;
}

/**
 * @description 生成配置文件内容
 * @param outputConfigFileType 输出配置文件类型
 * @returns 生成的配置文件内容
 */
export function generateConfigContent(outputConfigFileType: string): string {
  const template = getTemplate('config');

  const target = outputConfigFileType === 'js' ? 'javascript' : 'typescript';
  const extension = outputConfigFileType;

  const variables = {
    TARGET: target,
    EXTENSION: extension,
  };

  return replaceTemplateVariables(template, variables);
}

import { Request_Method, ValueOf } from '@scxfe/api-tool';
import type { AxiosRequestConfig } from 'axios';
import axios from 'axios';
// import { AESToken } from '.';

type Method = ValueOf<typeof Request_Method>;

// 用于转发请求的代理地址
const BASE_LINE_PROXY_PATH = '/api';
// 用于 token 加密（基线）
// const BASE_LINE_KEY_24 = 'HKCADQN7E5WJ3KQRPACNZ3QH';

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
  [HttpStatus.BadRequest, '参数错误'],
  [HttpStatus.Unauthorized, '未授权'],
  [HttpStatus.Forbidden, '禁止访问'],
  [HttpStatus.NotFound, '请求不存在'],
  [HttpStatus.InternalServerError, '服务器错误'],
  [HttpStatus.ClientError, '客户端错误'],
  [HttpStatus.ServerError, '服务器错误'],
  [HttpStatus.UnKnownError, '未知错误'],
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

  return `${method}:${urlObj.pathname}:${paramsHash}:${dataHash}`;
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

  // const secret = AESToken(BASE_LINE_KEY_24);
  const { headers = {}, params: configParams, ...axiosRequestConfig } = config;

  // 防止 GET 请求缓存GET
  const t = new Date().getTime();
  const isGetRequest = config.method === 'GET';
  const params = isGetRequest ? { ...(configParams || {}), t } : { t };
  try {
    const response = await axios(url, {
      headers: {
        ...headers,
        token: 'secret',
      },
      ...axiosRequestConfig,
      baseURL: BASE_LINE_PROXY_PATH,
      timeout: TIMEOUT,
      params: isGetRequest ? params : configParams,
    });
    const { status } = response;
    const httpStatus = getHttpStatus(status);
    const httpStatusMessage = HttpStatusMessage.get(httpStatus);

    if (
      [HttpStatus.OK, HttpStatus.OK_OTHER, HttpStatus.Redirection].includes(
        httpStatus as ValueOf<HttpStatus>,
      )
    ) {
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
}

/**
 * @description 请求文件生成器
 * 生成 HTTP 请求函数文件（request.ts / request.js）
 */

import { RequestMethodStyle } from '../../types';
import type { ApiConfig } from '../../types';
import { ensureRegistered } from './compiler';
import { generatePrecompiledMethodMap } from './templateDefinitions';

/**
 * @description 生成无 body 的方法函数（get, delete, head, options）
 */
function generateNoBodyMethod(method: string, requestFunctionName: string, isJS: boolean): string {
  const methodUpper = method.toUpperCase();
  const tsGeneric = isJS ? '' : '<T = any>';
  const tsParams = isJS ? 'url, params' : 'url: string, params?: any';
  const optionsParam = isJS
    ? 'options = {}'
    : "options: Omit<RequestConfig, 'url' | 'method' | 'data' | 'params'> = {}";
  const tsConfigType = isJS ? 'config' : 'config: RequestConfig';
  const tsReturn = isJS ? '' : '<T>';

  return `  ${method}: ${tsGeneric}(${tsParams}, ${optionsParam}) => {
    const ${tsConfigType} = { ...options, url, method: '${methodUpper}' };
    if (params !== undefined) {
      config.params = params;
    }
    return ${requestFunctionName}${tsReturn}(config);
  },`;
}

/**
 * @description 生成有 body 的方法函数（post, put, patch）
 */
function generateBodyMethod(method: string, requestFunctionName: string, isJS: boolean): string {
  const methodUpper = method.toUpperCase();
  const tsGeneric = isJS ? '' : '<T = any>';
  const tsParams = isJS ? 'url, data, params' : 'url: string, data?: any, params?: any';
  const optionsParam = isJS
    ? 'options = {}'
    : "options: Omit<RequestConfig, 'url' | 'method' | 'data' | 'params'> = {}";
  const tsConfigType = isJS ? 'config' : 'config: RequestConfig';
  const tsReturn = isJS ? '' : '<T>';

  return `  ${method}: ${tsGeneric}(${tsParams}, ${optionsParam}) => {
    const ${tsConfigType} = { ...options, url, method: '${methodUpper}' };
    if (data !== undefined) {
      config.data = data;
    }
    if (params !== undefined) {
      config.params = params;
    }
    return ${requestFunctionName}${tsReturn}(config);
  },`;
}

/**
 * @description 格式化超时常量为可读表达式
 * 整千毫秒输出为 `N * 1000`（保持默认 5s 的既有形态），否则输出原始数值
 * @param ms 超时毫秒数
 * @returns 常量表达式字符串
 *
 * @example
 * ```typescript
 * formatTimeout(5000); // => '5 * 1000'
 * formatTimeout(1500); // => '1500'
 * ```
 */
function formatTimeout(ms: number): string {
  return ms > 0 && ms % 1000 === 0 ? `${ms / 1000} * 1000` : String(ms);
}

/**
 * @description 生成 FormData 请求体的 Content-Type 剥离片段
 * multipart 请求的 boundary 由运行时生成，固定 Content-Type 会导致后端解析失败，
 * 因此对 FormData 请求过滤掉调用方误传的 Content-Type 头
 * @param isJS 是否生成 JavaScript 代码
 * @returns 代码片段
 */
function generateStripContentTypeSnippet(isJS: boolean): string {
  const cast = isJS ? '' : " as RequestConfig['headers']";
  return `    if (config.data instanceof FormData) {
      // multipart 的 boundary 由运行时生成，剥离调用方误传的固定 Content-Type
      config.headers = Object.fromEntries(
        Object.entries(config.headers ?? {}).filter(
          ([headerKey]) => headerKey.toLowerCase() !== 'content-type',
        ),
      )${cast};
    }`;
}

/**
 * @description 生成请求客户端扩展点函数
 * 请求文件仅首次生成（已存在则跳过），用户在 customizeAxios 中的自定义不会被重新生成覆盖，
 * 可在此注入 baseURL、拦截器、Token 等项目级 axios 行为，避免整份另写 request
 * @param isJS 是否生成 JavaScript 代码
 * @returns 扩展点代码片段
 */
function generateCustomizeAxios(isJS: boolean): string {
  const instanceType = isJS ? 'instance' : 'instance: typeof axios';
  const returnType = isJS ? '' : ': void';
  return `/**
 * 请求客户端扩展点：模块加载时调用一次，可在此自定义 axios 全局行为
 * （baseURL、请求/响应拦截器、Token 注入等）。本文件仅在首次生成时创建，
 * 后续重新生成不会覆盖此文件，此处自定义可长期保留。
 */
export function customizeAxios(${instanceType})${returnType} {
  // 按需自定义，例如：
  // instance.defaults.baseURL = '/api';
  // instance.interceptors.request.use((config) => {
  //   config.headers.Authorization = \`Bearer \${getToken()}\`;
  //   return config;
  // });
}

customizeAxios(axios);`;
}

/**
 * @description 生成请求文件内容
 * @param config 配置对象
 * @returns 生成的请求文件代码字符串
 */
export function generateRequestFile(config: ApiConfig): string {
  ensureRegistered();

  const isJS = config.target === 'javascript';
  const requestFunctionName = config.requestFunctionName || 'request';
  const requestMethodsObjectName = config.requestMethodsObjectName || 'requestMethods';
  const configType = isJS ? 'config' : 'config: RequestConfig';
  const genericDecl = isJS ? '' : '<T = any>';
  const returnType = isJS ? '' : ': Promise<T>';

  const importSection = `${isJS ? '' : "import type { AxiosRequestConfig } from 'axios';\n"}import axios from 'axios';
import consola from 'consola';`;

  const requestConfigInterface = isJS
    ? ''
    : `export interface RequestConfig extends AxiosRequestConfig {
  url: string;
  method: string;
}`;

  const uploadDataExpression = isJS
    ? 'const isUploadData = (data) =>\n  data instanceof FormData || data instanceof Blob;'
    : 'const isUploadData = (data: unknown): boolean =>\n  data instanceof FormData || data instanceof Blob;';

  const constants = `// 超时时间（可通过 defineConfig 的 requestTimeout 配置；上传类请求不受此默认超时限制）
const TIMEOUT = ${formatTimeout(config.requestTimeout ?? 5 * 1000)};

${uploadDataExpression}`;

  const mainRequestFunction = `export async function ${requestFunctionName}${genericDecl}(${configType})${returnType} {
  try {
${generateStripContentTypeSnippet(isJS)}

    const response = await axios({
      ...config,
      timeout: config.timeout ?? (isUploadData(config.data) ? 0 : TIMEOUT),
    });

    return response.data;
  } catch (error) {
    consola.error('Request failed:', error);
    throw error;
  }
}`;

  const customizeAxiosSection = generateCustomizeAxios(isJS);

  const sections = [
    importSection,
    requestConfigInterface,
    constants,
    mainRequestFunction,
    customizeAxiosSection,
  ].filter(Boolean);

  // 方法特定函数
  if (
    config.requestMethodStyle === RequestMethodStyle.METHOD_SPECIFIC ||
    config.requestMethodStyle === RequestMethodStyle.BOTH
  ) {
    const noBodyMethods = ['get', 'delete', 'head', 'options']
      .map((m) => generateNoBodyMethod(m, requestFunctionName, isJS))
      .join('\n');

    const bodyMethods = ['post', 'put', 'patch']
      .map((m) => generateBodyMethod(m, requestFunctionName, isJS))
      .join('\n');

    const methodFunctions = `export const ${requestMethodsObjectName} = {
${noBodyMethods}
${bodyMethods}
};`;

    sections.push(methodFunctions);
  }

  // METHOD_MAP（仅 TypeScript + BOTH 模式）
  if (!isJS && config.requestMethodStyle === RequestMethodStyle.BOTH) {
    sections.push(generatePrecompiledMethodMap(requestMethodsObjectName));
  }

  return sections.join('\n\n');
}

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
  const tsParams = isJS ? '(url, params)' : '(url: string, params?: any)';
  const tsConfigType = isJS ? 'config' : 'config: RequestConfig';
  const tsReturn = isJS ? '' : '<T>';

  return `  ${method}: ${tsGeneric}${tsParams} => {
    const ${tsConfigType} = { url, method: '${methodUpper}' };
    if (params) {
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
  const tsParams = isJS ? '(url, data, params)' : '(url: string, data?: any, params?: any)';
  const tsConfigType = isJS ? 'config' : 'config: RequestConfig';
  const tsReturn = isJS ? '' : '<T>';

  return `  ${method}: ${tsGeneric}${tsParams} => {
    const ${tsConfigType} = { url, method: '${methodUpper}' };
    if (data) {
      config.data = data;
    }
    if (params) {
      config.params = params;
    }
    return ${requestFunctionName}${tsReturn}(config);
  },`;
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

  const constants = `// 用于转发请求的代理地址
const BASE_LINE_PROXY_PATH = '/api';

// 超时时间
const TIMEOUT = 5 * 1000;`;

  const mainRequestFunction = `export async function ${requestFunctionName}${genericDecl}(${configType})${returnType} {
  try {
    const response = await axios({
      ...config,
      baseURL: BASE_LINE_PROXY_PATH,
      timeout: TIMEOUT,
    });

    return response.data;
  } catch (error) {
    consola.error('Request failed:', error);
    throw error;
  }
}`;

  const sections = [importSection, requestConfigInterface, constants, mainRequestFunction].filter(
    Boolean,
  );

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

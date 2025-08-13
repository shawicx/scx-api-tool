/*
 * @Author: shawicx d35f3153@proton.me
 * @Date: 2025-08-08 23:27:42
 * @LastEditors: shawicx d35f3153@proton.me
 * @LastEditTime: 2025-08-13 23:03:07
 * @Description: 请求相关类型定义
 */
import { JSONSchema4 } from 'json-schema';
import { QueryStringArrayFormat, Request_Method, RequestBodyType, ResponseBodyType } from './enums';
import type { OneOrMore } from './types';

/**
 * @description 请求配置。
 */
export interface RequestConfig<
  MockUrl extends string = string,
  DevUrl extends string = string,
  ProdUrl extends string = string,
  Path extends string = string,
  DataKey extends OneOrMore<string> | undefined = OneOrMore<string> | undefined,
  ParamName extends string = string,
  QueryName extends string = string,
  RequestDataOptional extends boolean = boolean,
> {
  /** 接口 Mock 地址，结尾无 `/` */
  mockUrl: MockUrl;
  /** 接口测试环境地址，结尾无 `/` */
  devUrl: DevUrl;
  /** 接口生产环境地址，结尾无 `/` */
  prodUrl: ProdUrl;
  /** 接口路径，以 `/` 开头 */
  path: Path;
  /** 请求方法 */
  method: Request_Method;
  /** 请求头，除了 Content-Type 的所有头 */
  requestHeaders: Record<string, string>;
  /** 请求数据类型 */
  requestBodyType: RequestBodyType;
  /** 返回数据类型 */
  responseBodyType: ResponseBodyType;
  /** 数据所在键 */
  dataKey: DataKey;
  /** 路径参数的名称列表 */
  paramNames: ParamName[];
  /** 查询参数的名称列表 */
  queryNames: QueryName[];
  /** 请求数据是否可选 */
  requestDataOptional: RequestDataOptional;
  /** 请求数据的 JSON Schema (仅开启了 JSON Schema 生成时生效) */
  requestDataJsonSchema: JSONSchema4;
  /** 返回数据的 JSON Schema (仅开启了 JSON Schema 生成时生效) */
  responseDataJsonSchema: JSONSchema4;
  /** 请求函数名称 */
  requestFunctionName: string;
  /** 如何格式化查询字符串中的数组值 */
  queryStringArrayFormat: QueryStringArrayFormat;
  /** 额外信息 */
  extraInfo: Record<string, any>;
}

/**
 * @description 请求参数。
 */
export interface RequestFunctionParams extends RequestConfig {
  /** 原始数据 */
  rawData: Record<string, any>;
  /** 请求数据，不含文件数据 */
  data: Record<string, any>;
  /** 是否有文件数据 */
  hasFileData: boolean;
  /** 请求文件数据 */
  fileData: Record<string, any>;
  /** 所有请求数据，包括 data、fileData */
  allData: Record<string, any>;
  /** 获取全部请求数据（包含文件）的 FormData 实例 */
  getFormData: () => FormData;
}

/**
 * @description 请求函数的额外参数
 */
export type RequestFunctionRestArgs<T extends (...args: any[]) => any> = T extends (
  payload: any,
  ...args: infer R
) => any
  ? R
  : never;

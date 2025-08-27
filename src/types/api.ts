/*
 * @Author: shawicx d35f3153@proton.me
 * @Description: API相关的类型定义
 */

import { JSONSchema4 } from 'json-schema';
import { ParsedPath } from 'path';
import type { LiteralUnion, OmitStrict } from './utils';

/** 接口定义 */
export interface Interface {
  /** 接口 ID */
  _id: number;
  /** 所属分类信息（由 @scxfe/api-tool 自行实现） */
  _category: OmitStrict<Category, 'list'>;
  /** 所属项目信息（由 @scxfe/api-tool 自行实现） */
  _project: Project;
  /** 接口在 YApi 上的地址（由 @scxfe/api-tool 自行实现） */
  _url: string;
  /** 接口名称 */
  title: string;
  /** 状态 */
  status: LiteralUnion<'done' | 'undone', string>;
  /** 接口备注 */
  markdown: string;
  /** 请求路径 */
  path: string;
  /** 请求方式，HEAD、OPTIONS 处理与 GET 相似，其余处理与 POST 相似 */
  method: string;
  /** 所属项目 id */
  project_id: number;
  /** 所属分类 id */
  catid: number;
  /** 标签列表 */
  tag: string[];
  /** 请求头 */
  req_headers: Array<{
    /** 名称 */
    name: string;
    /** 值 */
    value: string;
    /** 备注 */
    desc: string;
    /** 示例 */
    example: string;
    /** 是否必需 */
    required: string;
  }>;
  /** 路径参数 */
  req_params: Array<{
    /** 名称 */
    name: string;
    /** 备注 */
    desc: string;
    /** 示例 */
    example: string;
    /** 类型（YApi-X） */
    type?: string;
  }>;
  /** 仅 GET：请求串 */
  req_query: Array<{
    /** 名称 */
    name: string;
    /** 备注 */
    desc: string;
    /** 示例 */
    example: string;
    /** 是否必需 */
    required: string;
    /** 类型（YApi-X） */
    type?: string;
  }>;
  /** 仅 POST：请求内容类型。为 text, file, raw 时不必特殊处理。 */
  req_body_type: string;
  /** `req_body_type = json` 时是否为 json schema */
  req_body_is_json_schema: boolean;
  /** `req_body_type = form` 时的请求内容 */
  req_body_form: Array<{
    /** 名称 */
    name: string;
    /** 类型 */
    type: string;
    /** 备注 */
    desc: string;
    /** 示例 */
    example: string;
    /** 是否必需 */
    required: string;
  }>;
  /** `req_body_type = json` 时的请求内容 */
  req_body_other: string;
  /** 返回数据类型 */
  res_body_type: string;
  /** `res_body_type = json` 时是否为 json schema */
  res_body_is_json_schema: boolean;
  /** 返回数据 */
  res_body: string;
  /** 创建时间（unix时间戳） */
  add_time: number;
  /** 更新时间（unix时间戳） */
  up_time: number;
  /** 创建人 ID */
  uid: number;
  [key: string]: any;
}

/** 扩展接口定义 */
export interface ExtendedInterface extends Interface {
  parsedPath: ParsedPath;
}

/** 接口列表 */
export type InterfaceList = Interface[];

/** 分类信息 */
export interface Category {
  /** ID */
  _id: number;
  /** 分类在 YApi 上的地址（由 @scxfe/api-tool 自行实现） */
  _url?: string;
  /** 分类名称 */
  name: string;
  /** 分类备注 */
  desc: string;
  /** 分类接口列表 */
  list?: InterfaceList;
  /** 创建时间（unix时间戳） */
  add_time: number;
  /** 更新时间（unix时间戳） */
  up_time: number;
}

/** 分类列表，对应数据导出的 json 内容 */
export type CategoryList = Category[];

/** 项目信息 */
export interface Project {
  /** ID */
  _id: number;
  /** 项目在 YApi 上的地址（由 @scxfe/api-tool 自行实现） */
  _url?: string;
  /** 名称 */
  name: string;
  /** 描述 */
  desc: string;
  /** 基本路径 */
  basepath: string;
  /** 标签 */
  tag: string[];
  /** 环境配置 */
  env: Array<{
    /** 环境名称 */
    name: string;
    /** 环境域名 */
    domain: string;
  }>;
}

/** 属性定义 */
export interface PropDefinition {
  /** 属性名称 */
  name: string;
  /** 是否必需 */
  required: boolean;
  /** 类型 */
  type: JSONSchema4['type'];
  /** 注释 */
  comment: string;
}

/** 属性定义列表 */
export type PropDefinitions = PropDefinition[];

/** 大小写转换工具 */
export interface ChangeCase {
  /**
   * @example
   * changeCase.camelCase('test string') // => 'testString'
   */
  camelCase: (value: string) => string;
  /**
   * @example
   * changeCase.constantCase('test string') // => 'TEST_STRING'
   */
  constantCase: (value: string) => string;
  /**
   * @example
   * changeCase.dotCase('test string') // => 'test.string'
   */
  dotCase: (value: string) => string;
  /**
   * @example
   * changeCase.headerCase('test string') // => 'Test-String'
   */
  headerCase: (value: string) => string;
  /**
   * @example
   * changeCase.lowerCase('TEST STRING') // => 'test string'
   */
  lowerCase: (value: string) => string;
  /**
   * @example
   * changeCase.lowerCaseFirst('TEST') // => 'tEST'
   */
  lowerCaseFirst: (value: string) => string;
  /**
   * @example
   * changeCase.paramCase('test string') // => 'test-string'
   */
  paramCase: (value: string) => string;
  /**
   * @example
   * changeCase.pascalCase('test string') // => 'TestString'
   */
  pascalCase: (value: string) => string;
  /**
   * @example
   * changeCase.pathCase('test string') // => 'test/string'
   */
  pathCase: (value: string) => string;
  /**
   * @example
   * changeCase.sentenceCase('testString') // => 'Test string'
   */
  sentenceCase: (value: string) => string;
  /**
   * @example
   * changeCase.snakeCase('test string') // => 'test_string'
   */
  snakeCase: (value: string) => string;
  /**
   * @example
   * changeCase.swapCase('Test String') // => 'tEST sTRING'
   */
  swapCase: (value: string) => string;
  /**
   * @example
   * changeCase.titleCase('a simple test') // => 'A Simple Test'
   */
  titleCase: (value: string) => string;
  /**
   * @example
   * changeCase.upperCase('test string') // => 'TEST STRING'
   */
  upperCase: (value: string) => string;
  /**
   * @example
   * changeCase.upperCaseFirst('test') // => 'Test'
   */
  upperCaseFirst: (value: string) => string;
}

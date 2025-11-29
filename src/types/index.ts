/*
 * @Author: shawicx d35f3153@proton.me
 * @Description: 类型定义
 */

/** 请求方式 */
export enum RequestMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
  PATCH = 'PATCH',
}

/** 是否必需 */
export enum Required {
  /** 不必需 */
  false = '0',
  /** 必需 */
  true = '1',
}

/** 请求数据类型 */
export enum RequestBodyType {
  /** 查询字符串 */
  query = 'query',
  /** 表单 */
  form = 'form',
  /** JSON */
  json = 'json',
  /** 纯文本 */
  text = 'text',
  /** 文件 */
  file = 'file',
  /** 原始数据 */
  raw = 'raw',
  /** 无请求数据 */
  none = 'none',
}

/** 请求路径参数类型 */
export enum RequestParamType {
  /** 字符串 */
  string = 'string',
  /** 数字 */
  number = 'number',
}

/** 请求查询参数类型 */
export enum RequestQueryType {
  /** 字符串 */
  string = 'string',
  /** 数字 */
  number = 'number',
}

/** 请求表单条目类型 */
export enum RequestFormItemType {
  /** 纯文本 */
  text = 'text',
  /** 文件 */
  file = 'file',
}

/** 返回数据类型 */
export enum ResponseBodyType {
  /** JSON */
  json = 'json',
  /** 纯文本 */
  text = 'text',
  /** XML */
  xml = 'xml',
  /** 原始数据 */
  raw = 'raw',
}

/** 查询字符串数组格式化方式 */
export enum QueryStringArrayFormat {
  /** 示例: \`a[]=b&a[]=c\` */
  'brackets' = 'brackets',
  /** 示例: \`a[0]=b&a[1]=c\` */
  'indices' = 'indices',
  /** 示例: \`a=b&a=c\` */
  'repeat' = 'repeat',
  /** 示例: \`a=b,c\` */
  'comma' = 'comma',
  /** 示例: \`a=["b","c"]\` */
  'json' = 'json',
}

/** 服务类型 */
export const ServerType = {
  /** Apifox */
  Apifox: 'apifox',
  /** Swagger/OpenAPI */
  Swagger: 'swagger',
} as const;

/**
 * @description 判断是否为 GET 类请求。
 * @param method 请求方式
 * @returns 是否为 GET 类请求
 */
export function isGetLikeMethod(method: RequestMethod): boolean {
  return (
    method === RequestMethod.GET ||
    method === RequestMethod.OPTIONS ||
    method === RequestMethod.HEAD
  );
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
 * 输出文件列表
 */
export interface OutputFileList {
  /** 类型定义文件 */
  types: string[];
  /** 接口定义文件 */
  interfaces: string[];
  /** 请求函数文件 */
  request: string[];
}

/**
 * 请求函数配置
 */
export interface RequestFunctionConfig {
  /** 请求函数文件路径 */
  filePath: string;
  /** 请求函数名称 */
  functionName: string;
}

/**
 * 接口定义
 */
export interface InterfaceInfo {
  /** 接口路径 */
  path: string;
  /** 请求方法 */
  method: RequestMethod;
  /** 接口名称 */
  name: string;
  /** 接口描述 */
  description: string;
  /** 请求参数 */
  parameters: any[];
  /** 请求体 */
  requestBody: any;
  /** 响应 */
  responses: any;
  /** 所属分类 */
  category: string;
}

/**
 * 分类信息
 */
export interface CategoryInfo {
  /** 分类ID */
  id: number;
  /** 分类名称 */
  name: string;
  /** 分类描述 */
  description: string;
}

/**
 * 项目信息 */
export interface ProjectInfo {
  /** 项目名称 */
  name: string;
  /** 项目版本 */
  version: string;
  /** 项目描述 */
  description: string;
}

/**
 * API 配置接口
 */
export interface ApiConfig {
  /** 服务器地址 */
  serverUrl: string;
  /** 服务器类型 */
  serverType: ServerType;
  /** Apifox 项目 ID */
  apifoxProjectId?: string;
  /** 是否只生成类型 */
  typesOnly: boolean;
  /** 目标语言 */
  target: 'javascript' | 'typescript';
  /** 路径前缀 */
  pathPrefix: string;
  /** 输出目录 */
  outputDir: string;
  /** 缩进大小 */
  indentSize: number;
  /** React Hooks 配置 */
  reactHooks: {
    enabled: boolean;
  };
  /** 生产环境名称 */
  prodEnvName: string;
  /** 请求函数文件路径 */
  requestFunctionFilePath: string;
  /** 项目配置 */
  project: {
    /** 项目 token */
    token?: string;
    /** 分类配置 */
    categories: Array<{
      /** 分类 ID */
      id: number;
      /** 获取请求函数名称的钩子 */
      getRequestFunctionName?: (interfaceInfo: any, changeCase: any) => string;
    }>;
  };
}

/**
 * CLI 钩子函数
 */
export interface CliHooks {
  /** 开始生成前的钩子 */
  beforeGenerate?: () => void;
  /** 生成完成后的钩子 */
  afterGenerate?: () => void;
  /** 生成单个文件前的钩子 */
  beforeWriteFile?: (filePath: string, content: string) => string;
  /** 生成单个文件后的钩子 */
  afterWriteFile?: (filePath: string) => void;
}

/**
 * 定义配置的函数
 * @param config 配置对象
 * @returns 配置对象
 */
export function defineConfig(config: ApiConfig): ApiConfig {
  return config;
}

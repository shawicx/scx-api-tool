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

/** 服务类型枚举 */
export enum ServerType {
  /** Apifox */
  Apifox = 'apifox',
  /** Swagger/OpenAPI */
  Swagger = 'swagger',
}

/**
 * 请求方法调用风格
 */
export enum RequestMethodStyle {
  /** 标准配置方式 - request(config) */
  CONFIG = 'config',
  /** 方法特定方式 - request.get/post/delete 等 */
  METHOD_SPECIFIC = 'method-specific',
  /** 两者都提供 - 用户可以选择使用方式 */
  BOTH = 'both',
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
 * 项目信息
 */
export interface ProjectInfo {
  /** 项目名称 */
  name: string;
  /** 项目版本 */
  version: string;
  /** 项目描述 */
  description: string;
}

/**
 * 预设类型
 */
export type PresetType = 'minimal' | 'standard' | 'verbose';

/**
 * 预设配置
 */
export const PRESETS: Record<
  PresetType,
  Partial<Omit<ApiConfig, 'source' | 'token' | 'serverUrl' | 'serverType' | 'apifoxProjectId'>>
> = {
  minimal: {
    typesOnly: true,
    apiOnly: false,
    comment: false,
    requestMethodStyle: RequestMethodStyle.CONFIG,
  },
  standard: {
    typesOnly: false,
    apiOnly: false,
    comment: true,
    requestMethodStyle: RequestMethodStyle.CONFIG,
  },
  verbose: {
    typesOnly: false,
    apiOnly: false,
    comment: true,
    indentSize: 4,
    requestMethodStyle: RequestMethodStyle.BOTH,
  },
};

/**
 * 用户配置接口 (用户提供的配置)
 */
export interface UserConfig {
  /** 预设类型 */
  preset?: PresetType;

  /** API 数据源 URL (包含完整的服务器信息) */
  source: string;
  /** 认证令牌 */
  token: string;

  /** 是否只生成类型 */
  typesOnly?: boolean;
  /** 是否只生成API接口（不包括请求函数） */
  apiOnly?: boolean;
  /** 目标语言 */
  target?: 'javascript' | 'typescript';
  /** 路径前缀 */
  pathPrefix?: string;
  /** 输出目录 */
  outputDir?: string;
  /** 缩进大小 */
  indentSize?: number;
  /** 是否生成注释 */
  comment?: boolean;
  /** 生产环境名称 */
  prodEnvName?: string;
  /** 请求函数文件路径 */
  requestFunctionFilePath?: string;
  /** 请求方法调用风格 */
  requestMethodStyle?: RequestMethodStyle;
  /** 自定义请求函数名 */
  requestFunctionName?: string;
  /** 自定义方法对象名 */
  requestMethodsObjectName?: string;
  /** 分类配置 */
  categories?: Array<{
    /** 分类 ID */
    id: number;
    /** 获取请求函数名称的钩子 */
    getRequestFunctionName?: (interfaceInfo: any, changeCase: any) => string;
  }>;
}

/**
 * 完整的 API 配置接口
 */
export interface ApiConfig {
  /** 服务器地址 (从 source 解析) */
  serverUrl: string;
  /** 服务器类型 (从 source 解析) */
  serverType: ServerType;
  /** Apifox 项目 ID (从 source 解析) */
  apifoxProjectId?: string;

  /** API 数据源 URL (包含完整的服务器信息) */
  source: string;
  /** 认证令牌 */
  token: string;

  /** 是否只生成类型 */
  typesOnly: boolean;
  /** 是否只生成API接口（不包括请求函数） */
  apiOnly: boolean;
  /** 目标语言 */
  target: 'javascript' | 'typescript';
  /** 路径前缀 */
  pathPrefix: string;
  /** 输出目录 */
  outputDir: string;
  /** 缩进大小 */
  indentSize: number;
  /** 是否生成注释 */
  comment: boolean;
  /** 生产环境名称 */
  prodEnvName: string;
  /** 请求函数文件路径 */
  requestFunctionFilePath: string;
  /** 请求方法调用风格 */
  requestMethodStyle: RequestMethodStyle;
  /** 自定义请求函数名 */
  requestFunctionName: string;
  /** 自定义方法对象名 */
  requestMethodsObjectName: string;
  /** 分类配置 */
  categories: Array<{
    /** 分类 ID */
    id: number;
    /** 获取请求函数名称的钩子 */
    getRequestFunctionName?: (interfaceInfo: any, changeCase: any) => string;
  }>;
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

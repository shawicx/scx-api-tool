/*
 * @Author: shawicx d35f3153@proton.me
 * @Description: 配置相关类型定义
 */

import { RequestMethodStyle } from './enums';

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
  /** 并发写入数量（用于文件生成的并发控制） */
  concurrency?: number;
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
  serverType: import('./enums').ServerType;
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
  /** 并发写入数量（用于文件生成的并发控制） */
  concurrency: number;
  /** 分类配置 */
  categories: Array<{
    /** 分类 ID */
    id: number;
    /** 获取请求函数名称的钩子 */
    getRequestFunctionName?: (interfaceInfo: any, changeCase: any) => string;
  }>;
}

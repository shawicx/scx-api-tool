/*
 * @Author: shawicx d35f3153@proton.me
 * @Description: 配置相关的类型定义
 */

import { JSONSchema4TypeName } from 'json-schema';
import type { ChangeCase, ExtendedInterface, Interface } from './api';
import { QueryStringArrayFormat } from './enums';
import type { AsyncOrSync, OneOrMore } from './utils';

/** 支持生成 React Hooks 代码的相关配置 */
export interface ReactHooksConfig {
  enabled: boolean;
  requestHookMakerFilePath?: string;
  getRequestHookName?: (interfaceInfo: ExtendedInterface, changeCase: ChangeCase) => string;
}

/** 支持生成 JSON Schema 的相关配置 */
export interface JsonSchemaConfig {
  enabled: boolean;
  requestData?: boolean;
  responseData?: boolean;
}

/** 支持生成注释的相关配置 */
export interface CommentConfig {
  enabled?: boolean;
  title?: boolean;
  category?: boolean;
  tag?: boolean;
  requestHeader?: boolean;
  updateTime?: boolean;
  link?: boolean;
  extraTags?: (interfaceInfo: ExtendedInterface) => Array<{
    name: string;
    value: string;
    position?: 'start' | 'end';
  }>;
}

/** 共享的配置 */
export interface SharedConfig {
  target?: 'typescript' | 'javascript';
  typesOnly?: boolean;
  pathPrefix?: string;
  devEnvName?: string;
  prodEnvName?: string;
  outputDir?: string;
  requestFunctionFilePath?: string;
  dataKey?: OneOrMore<string>;
  reactHooks?: ReactHooksConfig;
  jsonSchema?: JsonSchemaConfig;
  comment?: CommentConfig;
  customTypeMapping?: Record<string, JSONSchema4TypeName>;
  queryStringArrayFormat?: QueryStringArrayFormat;
  setRequestFunctionExtraInfo?: (
    interfaceInfo: Interface,
    changeCase: ChangeCase,
  ) => Record<string, any>;
  preproccessInterface?: (
    interfaceInfo: Interface,
    changeCase: ChangeCase,
    syntheticalConfig: SyntheticalConfig,
  ) => Interface | false;
  indentSize?: number;
  getRequestFunctionName?: (interfaceInfo: ExtendedInterface, changeCase: ChangeCase) => string;
  getRequestDataTypeName?: (interfaceInfo: ExtendedInterface, changeCase: ChangeCase) => string;
  getResponseDataTypeName?: (interfaceInfo: ExtendedInterface, changeCase: ChangeCase) => string;
}

/** 分类的配置 */
export interface CategoryConfig extends SharedConfig {
  id: number | number[];
}

/** 项目的配置 */
export interface ProjectConfig extends SharedConfig {
  token: string | string[];
  categories: CategoryConfig[];
}

/** 服务器的配置 */
export interface ServerConfig extends SharedConfig {
  serverUrl: string;
  serverType?: 'yapi' | 'swagger' | 'apifox';
  apifoxProjectId?: string;
  projects: ProjectConfig[];
}

/** 混合的配置 */
export type SyntheticalConfig = Partial<
  ServerConfig &
    ServerConfig['projects'][0] &
    ServerConfig['projects'][0]['categories'][0] & {
      mockUrl: string;
      devUrl: string;
      prodUrl: string;
      fileDirectory?: string;
    }
>;

/** 配置 */
export type Config = ServerConfig | ServerConfig[];

/** 命令行钩子 */
export interface CliHooks {
  success?: () => AsyncOrSync<void>;
  fail?: () => AsyncOrSync<void>;
  complete?: () => AsyncOrSync<void>;
}

export type ConfigWithHooks = Config & {
  hooks?: CliHooks;
};

/** 定义配置 */
export function defineConfig(config: Config, hooks?: CliHooks): ConfigWithHooks {
  if (hooks) {
    Object.defineProperty(config, 'hooks', {
      value: hooks,
      configurable: false,
      enumerable: false,
      writable: false,
    });
  }
  return config;
}

/** 输出文件列表 */
export interface OutputFileList {
  [outputFilePath: string]: {
    syntheticalConfig: SyntheticalConfig;
    content: string[];
    requestFunctionFilePath: string;
    requestHookMakerFilePath: string;
  };
}

/** 请求函数配置 */
export interface RequestFunctionConfig {
  name: string;
  type: string;
  path: string;
  method: string;
  useTemplate: boolean;
}

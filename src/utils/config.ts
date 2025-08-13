/*
 * @Author: shawicx d35f3153@proton.me
 * @Date: 2025-08-08 23:27:42
 * @LastEditors: shawicx d35f3153@proton.me
 * @LastEditTime: 2025-08-09 00:34:00
 * @Description: 配置相关工具函数和类型定义
 */
import { JSONSchema4TypeName } from 'json-schema';
import type { ChangeCase, ExtendedInterface, Interface } from './apiTypes';
import { QueryStringArrayFormat } from './enums';
import type { AsyncOrSync, OneOrMore } from './index';

/** 支持生成 React Hooks 代码的相关配置 */
export interface ReactHooksConfig {
  /**
   * 是否开启该项功能。
   */
  enabled: boolean;

  /**
   * 请求 Hook 函数制造者文件路径。
   *
   * @default 与 `outputFilePath` 同级目录下的 `makeRequestHook.ts` 文件
   * @example 'src/api/makeRequestHook.ts'
   */
  requestHookMakerFilePath?: string;

  /**
   * 获取请求 Hook 的名称。
   *
   * @default `use${changeCase.pascalCase(requestFunctionName)}`
   * @param interfaceInfo 接口信息
   * @param changeCase 常用的大小写转换函数集合对象
   * @returns 请求 Hook 的名称
   */
  getRequestHookName?: (interfaceInfo: ExtendedInterface, changeCase: ChangeCase) => string;
}

/** 支持生成 JSON Schema 的相关配置 */
export interface JsonSchemaConfig {
  /**
   * 是否开启该项功能。
   */
  enabled: boolean;

  /**
   * 是否生成请求数据的 JSON Schema。
   *
   * @default true
   */
  requestData?: boolean;

  /**
   * 是否生成返回数据的 JSON Schema。
   *
   * @default true
   */
  responseData?: boolean;
}

/** 支持生成注释的相关配置 */
export interface CommentConfig {
  /**
   * 是否开启该项功能。
   *
   * @default true
   */
  enabled?: boolean;

  /**
   * 是否有标题。
   *
   * @default true
   */
  title?: boolean;

  /**
   * 是否有分类名称。
   *
   * @default true
   */
  category?: boolean;

  /**
   * 是否有标签。
   *
   * @default true
   */
  tag?: boolean;

  /**
   * 是否有请求头。
   *
   * @default true
   */
  requestHeader?: boolean;

  /**
   * 是否有更新时间。
   *
   * @default true
   */
  updateTime?: boolean;

  /**
   * 是否为标题、分类名称添加链接。
   *
   * @default true
   */
  link?: boolean;

  /**
   * 额外的注释标签。生成的内容形如：`@{name} {value}`。
   */
  extraTags?: (interfaceInfo: ExtendedInterface) => Array<{
    /**
     * 标签名。
     */
    name: string;

    /**
     * 标签值。
     */
    value: string;

    /**
     * 标签位置，即将新标签插在标签列表的开头还是末尾。
     *
     * @default 'end'
     */
    position?: 'start' | 'end';
  }>;
}

/**
 * 共享的配置。
 */
export interface SharedConfig {
  /**
   * 要生成的目标代码类型。
   * 默认为 `typescript`，若设为 `javascript`，会将生成的 `.ts` 文件转换为 `.js` + `.d.ts` 文件并删除原 `.ts` 文件。
   *
   * @default DEFAULT_CONFIG.TARGET
   */
  target?: 'typescript' | 'javascript';

  /**
   * 是否只生成接口请求内容和返回内容的 TypeSript 类型，是则请求文件和请求函数都不会生成。
   *
   * @default DEFAULT_CONFIG.TYPES_ONLY
   */
  typesOnly?: boolean;

  /**
   * 统一去掉接口路径的某部分。
   * 例如设置为 '/api' 时，接口路径 '/api/user/list' 会变成 '/user/list'。
   *
   * @example '/api'
   */
  pathPrefix?: string;

  /**
   * 测试环境名称。
   *
   * **用于获取测试环境域名。**
   *
   * 获取方式：打开项目 --> `设置` --> `环境配置` --> 点开或新增测试环境 --> 复制测试环境名称。
   *
   * @example 'dev'
   */
  devEnvName?: string;

  /**
   * 生产环境名称。
   *
   * **用于获取生产环境域名。**
   *
   * 获取方式：打开项目 --> `设置` --> `环境配置` --> 点开或新增生产环境 --> 复制生产环境名称。
   *
   * @example 'prod'
   */
  prodEnvName?: string;

  /**
   * 输出目录路径。
   *
   * 生成的代码文件将输出到此目录下。
   *
   * @default DEFAULT_CONFIG.OUTPUT_DIR
   * @example 'src/api'
   */
  outputDir?: string;

  /**
   * 请求函数文件路径。
   *
   * @default DEFAULT_CONFIG.REQUEST_FUNCTION_FILE_PATH
   * @example 'src/api/request.ts'
   */
  requestFunctionFilePath?: string;

  /**
   * 如果接口响应的结果是 `JSON` 对象，
   * 且我们想要的数据在该对象下，
   * 那我们就可将 `dataKey` 设为我们想要的数据对应的键。
   *
   * 比如该对象为 `{ code: 0, msg: '成功', data: 100 }`，
   * 我们想要的数据为 `100`，
   * 则我们可将 `dataKey` 设为 `data`。
   *
   * @example 'data'
   */
  dataKey?: OneOrMore<string>;

  /**
   * 支持生成 React Hooks 代码的相关配置。
   */
  reactHooks?: ReactHooksConfig;

  /**
   * 支持生成 JSON Schema 的相关配置。
   */
  jsonSchema?: JsonSchemaConfig;

  /**
   * 支持生成注释的相关配置。
   */
  comment?: CommentConfig;

  /**
   * 将自定义类型转为 JSONSchema 类型的映射表，自定义类型名称大小写不敏感。
   */
  customTypeMapping?: Record<string, JSONSchema4TypeName>;

  /**
   * 如何格式化查询字符串中的数组值。
   *
   * @default QueryStringArrayFormat.brackets
   */
  queryStringArrayFormat?: QueryStringArrayFormat;

  /**
   * 设置传给请求函数的参数中的 extraInfo 的值。
   *
   * @param interfaceInfo 接口信息
   * @param changeCase 常用的大小写转换函数集合对象
   * @returns 返回要赋给 extraInfo 的值
   */
  setRequestFunctionExtraInfo?: (
    interfaceInfo: Interface,
    changeCase: ChangeCase,
  ) => Record<string, any>;

  /**
   * 预处理接口信息，返回新的接口信息。可返回 false 排除当前接口。
   *
   * 譬如你想对接口的 `path` 进行某些处理或者想排除某些接口，就可使用该方法。
   *
   * @param interfaceInfo 接口信息
   * @param changeCase 常用的大小写转换函数集合对象
   * @param syntheticalConfig 作用到当前接口的最终配置
   * @example
   *
   * ```js
   * interfaceInfo => {
   *   interfaceInfo.path = interfaceInfo.path.replace('v1', 'v2')
   *   return interfaceInfo
   * }
   * ```
   */
  preproccessInterface?: (
    interfaceInfo: Interface,
    changeCase: ChangeCase,
    syntheticalConfig: SyntheticalConfig,
  ) => Interface | false;

  /**
   * 代码缩进配置。
   *
   * @default DEFAULT_CONFIG.INDENT_SIZE
   */
  indentSize?: number;

  /**
   * 获取请求函数的名称。
   *
   * @default changeCase.camelCase(interfaceInfo.parsedPath.name)
   * @param interfaceInfo 接口信息
   * @param changeCase 常用的大小写转换函数集合对象
   * @returns 请求函数的名称
   */
  getRequestFunctionName?: (interfaceInfo: ExtendedInterface, changeCase: ChangeCase) => string;

  /**
   * 获取请求数据类型的名称。
   *
   * @default changeCase.pascalCase(`${requestFunctionName}Request`)
   * @param interfaceInfo 接口信息
   * @param changeCase 常用的大小写转换函数集合对象
   * @returns 请求数据类型的名称
   */
  getRequestDataTypeName?: (interfaceInfo: ExtendedInterface, changeCase: ChangeCase) => string;

  /**
   * 获取响应数据类型的名称。
   *
   * @default changeCase.pascalCase(`${requestFunctionName}Response`)
   * @param interfaceInfo 接口信息
   * @param changeCase 常用的大小写转换函数集合对象
   * @returns 响应数据类型的名称
   */
  getResponseDataTypeName?: (interfaceInfo: ExtendedInterface, changeCase: ChangeCase) => string;
}

/**
 * 分类的配置。
 */
export interface CategoryConfig extends SharedConfig {
  /**
   * 分类 ID，可以设置多个。设为 `0` 时表示全部分类。
   *
   * 如果需要获取全部分类，同时排除指定分类，可以这样：`[0, -20, -21]`，分类 ID 前面的负号表示排除。
   *
   * 获取方式：打开项目 --> 点开分类 --> 复制浏览器地址栏 `/api/cat_` 后面的数字。
   *
   * @example 20
   */
  id: number | number[];
}

/**
 * 项目的配置。
 */
export interface ProjectConfig extends SharedConfig {
  /**
   * 项目的唯一标识。支持多个项目。
   *
   * 获取方式：打开项目 --> `设置` --> `token配置` --> 复制 token。
   *
   * @example 'e02a47122259d0c1973a9ff81cabb30685d64abc72f39edaa1ac6b6a792a647d'
   */
  token: string | string[];

  /**
   * 分类列表。
   */
  categories: CategoryConfig[];
}

/**
 * 服务器的配置。
 */
export interface ServerConfig extends SharedConfig {
  /**
   * 服务地址。若服务类型为 `yapi`，此处填其首页地址；若服务类型为 `swagger`，此处填其 json 地址。
   *
   * @example 'http://yapi.foo.bar'
   */
  serverUrl: string;

  /**
   * 服务类型。
   *
   * @default DEFAULT_CONFIG.SERVER_TYPE
   */
  serverType?: 'yapi' | 'swagger' | 'apifox';

  /**
   * Apifox 项目 ID。仅在 serverType 为 'apifox' 时生效。
   *
   * @example '6720131'
   */
  apifoxProjectId?: string;

  /**
   * 项目列表。
   */
  projects: ProjectConfig[];
}

/** 混合的配置。 */
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

/** 配置。 */
export type Config = ServerConfig | ServerConfig[];

/** 命令行钩子 */
export interface CliHooks {
  /** 生成成功时触发 */
  success?: () => AsyncOrSync<void>;
  /** 生成失败时触发 */
  fail?: () => AsyncOrSync<void>;
  /** 生成完毕时触发（无论成功、失败） */
  complete?: () => AsyncOrSync<void>;
}

export type ConfigWithHooks = Config & {
  hooks?: CliHooks;
};

/**
 * 定义配置。
 *
 * @param config 配置
 */
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

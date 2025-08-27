/*
 * @Author: shawicx d35f3153@proton.me
 * @Description: 工具类型定义
 */

/**
 * @description 去除类型 T 中的 undefined。
 * @public
 * @example
 * ```typescript
 * type X = string | undefined
 * type Y = Defined<X> // => string
 * ```
 */
export type Defined<T> = Exclude<T, undefined>;

/**
 * @description 同 `T | T[]`。
 * @public
 * @example
 * ```typescript
 * type X = OneOrMore<number> // => number | number[]
 * ```
 */
export type OneOrMore<T> = T | T[];

// 第三方库类型导出
export type {
  AnyArray,
  AsyncOrSync,
  Buildable,
  ElementOf,
  Head,
  Merge,
  DeepNonNullable as NonNullableDeep,
  DeepNullable as NullableDeep,
  OmitProperties as OmitBy,
  DeepOmit as OmitDeep,
  StrictOmit as OmitStrict,
  OptionalKeys,
  MarkOptional as PartialBy,
  DeepPartial as PartialDeep,
  PickProperties as PickBy,
  DeepReadonly as ReadonlyDeep,
  ReadonlyKeys,
  MarkRequired as RequiredBy,
  DeepRequired as RequiredDeep,
  RequiredKeys,
  Tail,
  ValueOf,
  Writable,
  DeepWritable as WritableDeep,
  WritableKeys,
  XOR,
} from 'ts-essentials';

export type {
  Asyncify,
  AsyncReturnType,
  CamelCase,
  Class,
  ScreamingSnakeCase as ConstantCase,
  DelimiterCase,
  Finite,
  FixedLengthArray,
  Integer,
  JsonArray,
  JsonObject,
  JsonValue,
  KebabCase,
  LiteralUnion,
  Negative,
  NegativeInfinity,
  NegativeInteger,
  NonNegative,
  NonNegativeInteger,
  PackageJson,
  PascalCase,
  PositiveInfinity,
  RequireAllOrNone,
  RequireAtLeastOne,
  SetRequiredDeep as RequiredDeepBy,
  RequireExactlyOne,
  Simplify,
  SnakeCase,
  TsConfigJson,
  UnionToIntersection,
  UnionToTuple,
} from 'type-fest';

// 等待结果接口定义
/**
 * @public
 */
export interface WaitResult<T> extends Promise<T> {
  /**
   * 取消等待，不执行后续逻辑。
   */
  cancel: () => void;
}

/** 请求配置 */
export interface RequestConfig<TRequestData = any, TRequestResult = any> {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  data?: TRequestData;
  params?: Record<string, any>;
  timeout?: number;
  onSuccess?: (result: TRequestResult) => void;
  onError?: (error: Error) => void;
}

/** Apifox配置 */
export interface ApifoxConfig {
  projectId: string;
  token: string;
  serverUrl: string;
  format?: 'json' | 'yaml';
}

/**
 * @description 请求配置。
 */
export interface ApiRequestConfig<
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
  method: string;
  /** 请求头，除了 Content-Type 的所有头 */
  requestHeaders: Record<string, string>;
  /** 请求数据类型 */
  requestBodyType: string;
  /** 返回数据类型 */
  responseBodyType: string;
  /** 数据所在键 */
  dataKey: DataKey;
  /** 路径参数的名称列表 */
  paramNames: ParamName[];
  /** 查询参数的名称列表 */
  queryNames: QueryName[];
  /** 请求数据是否可选 */
  requestDataOptional: RequestDataOptional;
  /** 请求数据的 JSON Schema (仅开启了 JSON Schema 生成时生效) */
  requestDataJsonSchema: any;
  /** 返回数据的 JSON Schema (仅开启了 JSON Schema 生成时生效) */
  responseDataJsonSchema: any;
  /** 请求函数名称 */
  requestFunctionName: string;
  /** 如何格式化查询字符串中的数组值 */
  queryStringArrayFormat: string;
  /** 额外信息 */
  extraInfo: Record<string, any>;
}

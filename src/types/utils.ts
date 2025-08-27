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

/** Apifox配置 */
export interface ApifoxConfig {
  projectId: string;
  token: string;
  serverUrl: string;
  format?: 'json' | 'yaml';
}

/**
 * @description 错误代码枚举
 * 定义项目中所有错误类型的唯一标识
 */
export enum ErrorCode {
  // 配置错误 (1xxx)
  /**
   * @description 配置文件未找到
   * @example 当运行 `npx api-power generate` 但找不到配置文件时抛出此错误
   */
  CONFIG_FILE_NOT_FOUND = 'E1001',

  /**
   * @description 配置无效
   * @example 当配置文件中存在非法值或不满足验证规则时抛出此错误
   */
  CONFIG_INVALID = 'E1002',

  /**
   * @description 配置解析失败
   * @example 当 TypeScript 配置文件编译失败时抛出此错误
   */
  CONFIG_PARSE_ERROR = 'E1003',

  /**
   * @description 配置缺少必需字段
   * @example 当配置文件中缺少如 `source` 等必需字段时抛出此错误
   */
  CONFIG_MISSING_REQUIRED = 'E1004',

  /**
   * @description 无效的 URL 格式
   * @example 当配置的 URL 不是有效的 HTTP/HTTPS URL 时抛出此错误
   */
  CONFIG_INVALID_URL = 'E1005',

  // 网络请求错误 (2xxx)
  /**
   * @description 网络请求失败
   * @example 当 API 请求因网络问题或其他原因失败时抛出此错误
   */
  FETCH_REQUEST_FAILED = 'E2001',

  /**
   * @description 未授权访问
   * @example 当 API token 无效或缺少权限时抛出此错误
   */
  FETCH_UNAUTHORIZED = 'E2002',

  /**
   * @description 请求超时
   * @example 当 API 请求超过配置的超时时间时抛出此错误
   */
  FETCH_TIMEOUT = 'E2003',

  /**
   * @description 无效的响应格式
   * @example 当 API 返回的响应不符合预期的 OpenAPI 格式时抛出此错误
   */
  _FETCH_INVALID_RESPONSE = 'E2004',

  /**
   * @description 网络错误
   * @example 当网络连接中断或 DNS 解析失败时抛出此错误
   */
  FETCH_NETWORK_ERROR = 'E2005',

  // 代码生成错误 (3xxx)
  /**
   * @description 模板编译失败
   * @example 当 Handlebars 模板编译出错时抛出此错误
   */
  GENERATE_TEMPLATE_ERROR = 'E3001',

  /**
   * @description 文件写入失败
   * @example 当无法写入生成的代码文件时抛出此错误
   */
  GENERATE_WRITE_ERROR = 'E3002',

  /**
   * @description 类型生成失败
   * @example 当生成 TypeScript 类型定义出错时抛出此错误
   */
  GENERATE_TYPE_ERROR = 'E3003',

  /**
   * @description Schema 生成失败
   * @example 当生成 Zod Schema 出错时抛出此错误
   */
  GENERATE_SCHEMA_ERROR = 'E3004',
}

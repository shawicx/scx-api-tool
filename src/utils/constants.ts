/*
 * @Author: shawicx d35f3153@proton.me
 * @Description: 配置默认常量
 */

/**
 * 配置默认值常量
 */
export const DEFAULT_CONFIG = {
  // 输出目录默认值
  OUTPUT_DIR: 'src/service',

  // 请求函数文件路径默认值
  REQUEST_FUNCTION_FILE_PATH: 'src/templates/request.ts',

  // 代码缩进默认值
  INDENT_SIZE: 2,

  // 目标代码类型默认值
  TARGET: 'typescript' as const,

  // 服务类型默认值
  SERVER_TYPE: 'swagger' as const,

  // 生产环境名称默认值
  PROD_ENV_NAME: 'production',

  // 开发环境名称默认值
  DEV_ENV_NAME: 'dev',

  // 数据键默认值
  DATA_KEY: 'data',

  // 是否只生成类型默认值
  TYPES_ONLY: false,

  // React Hooks 默认配置
  REACT_HOOKS: {
    enabled: false,
  },

  // 注释配置默认值
  COMMENT: {
    enabled: true,
    title: true,
    category: true,
    tag: true,
    requestHeader: true,
    updateTime: true,
    link: true,
  },

  // JSON Schema 配置默认值
  JSON_SCHEMA: {
    enabled: false,
    requestData: true,
    responseData: true,
  },
} as const;

/**
 * 文件扩展名常量
 */
export const FILE_EXTENSIONS = {
  TYPESCRIPT: '.ts',
  JAVASCRIPT: '.js',
  TYPESCRIPT_JSX: '.tsx',
  JAVASCRIPT_JSX: '.jsx',
} as const;

/**
 * 请求方法常量
 */
export const REQUEST_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
  HEAD: 'HEAD',
  OPTIONS: 'OPTIONS',
} as const;

/**
 * HTTP 状态码常量
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

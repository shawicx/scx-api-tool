/**
 * @description API 相关类型定义
 */

import { RequestMethod } from './enums';

// ==================== OpenAPI Schema 相关类型 ====================

/**
 * OpenAPI Schema 对象
 * 描述 OpenAPI 中组件/参数/响应等的 Schema 结构
 */
export interface OpenApiSchema {
  /** 引用路径，如 '#/components/schemas/User' */
  $ref?: string;
  /** 类型：string, number, boolean, object, array 等 */
  type?: string;
  /** 格式，如 'int64', 'date-time' */
  format?: string;
  /** 描述 */
  description?: string;
  /** 对象属性 */
  properties?: Record<string, OpenApiSchema>;
  /** 必需属性名列表 */
  required?: string[];
  /** 数组项 Schema */
  items?: OpenApiSchema;
  /** 对象额外属性 Schema（OpenAPI 规范允许 boolean: true 表示任意值） */
  additionalProperties?: OpenApiSchema | boolean;
  /** 枚举值 */
  enum?: string[];
  /** 只读 */
  readOnly?: boolean;
  /** nullable */
  nullable?: boolean;
  /** 默认值 */
  default?: unknown;
  /** 示例值 */
  example?: unknown;
  /** allOf 组合 */
  allOf?: OpenApiSchema[];
  /** oneOf 组合 */
  oneOf?: OpenApiSchema[];
  /** anyOf 组合 */
  anyOf?: OpenApiSchema[];
  /** 允许的额外字段 */
  [key: string]: unknown;
}

/**
 * OpenAPI 操作参数
 */
export interface OpenApiParameter {
  /** 参数名 */
  name: string;
  /** 参数位置：query, path, header, cookie */
  in: string;
  /** 参数描述 */
  description?: string;
  /** 是否必需 */
  required?: boolean;
  /** 参数类型（简化格式） */
  type?: string;
  /** 参数 Schema */
  schema?: OpenApiSchema;
}

/**
 * OpenAPI 请求体媒体类型
 */
export interface OpenApiMediaType {
  /** 媒体类型的 Schema */
  schema?: OpenApiSchema;
  [key: string]: unknown;
}

/**
 * OpenAPI 请求体
 */
export interface OpenApiRequestBody {
  /** 请求体描述 */
  description?: string;
  /** 是否必需 */
  required?: boolean;
  /** 媒体类型映射 */
  content: Record<string, OpenApiMediaType>;
}

/**
 * OpenAPI 响应
 */
export interface OpenApiResponse {
  /** 响应描述 */
  description?: string;
  /** 媒体类型映射 */
  content?: Record<string, OpenApiMediaType>;
  /** 响应 Schema（简化格式） */
  schema?: OpenApiSchema;
}

/**
 * OpenAPI 操作对象
 * 描述一个 API 端点的操作信息
 */
export interface OpenApiOperation {
  /** 操作摘要 */
  summary?: string;
  /** 操作详细描述 */
  description?: string;
  /** 操作 ID */
  operationId?: string;
  /** 所属标签 */
  tags?: string[];
  /** 请求已废弃 */
  deprecated?: boolean;
  /** 操作参数 */
  parameters?: OpenApiParameter[];
  /** 请求体 */
  requestBody?: OpenApiRequestBody;
  /** 响应映射 */
  responses?: Record<string, OpenApiResponse>;
  [key: string]: unknown;
}

/**
 * OpenAPI 原始文档数据
 */
export interface OpenApiDocument {
  /** API 路径 */
  paths?: Record<string, Record<string, OpenApiOperation>>;
  /** 组件定义 */
  components?: {
    /** Schema 定义 */
    schemas?: Record<string, OpenApiSchema>;
    [key: string]: unknown;
  };
  /** 标签列表 */
  tags?: ApiCategory[];
  /** API 信息 */
  info?: {
    title?: string;
    version?: string;
    description?: string;
  };
  [key: string]: unknown;
}

// ==================== 处理后的数据类型 ====================

/**
 * API 接口信息（处理后的）
 * 由 processOpenApiData 生成，按 path+method 粒度
 */
export interface ApiInterface {
  /** 接口路径 */
  path: string;
  /** HTTP 方法 */
  method: string;
  /** 操作详情 */
  operation: OpenApiOperation;
}

/**
 * API 类型定义（处理后的）
 */
export interface ApiTypeDefinition {
  /** 类型名称（已 sanitize） */
  name: string;
  /** 原始名称 */
  originalName?: string;
  /** OpenAPI Schema */
  schema: OpenApiSchema;
  /**
   * 类型种类标记，用于生成器区分渲染方式：
   * - `jsonValue`：内置的递归 JsonValue 类型（任意 JSON 值）
   * - `jsonValueAlias`：Jackson 动态类型（JsonNode 等），渲染为 `type X = JsonValue`
   * - 缺省：普通 interface 类型
   */
  kind?: 'jsonValue' | 'jsonValueAlias';
}

/**
 * API 分类信息
 */
export interface ApiCategory {
  /** 分类 ID */
  id?: number;
  /** 分类名称 */
  name: string;
  /** 分类描述 */
  description?: string;
}

/**
 * 属性信息（提取后的请求/响应属性）
 */
export interface ApiProperty {
  /** 属性名 */
  name: string;
  /** TypeScript 类型字符串 */
  type: string;
  /** 属性描述 */
  description: string;
  /** 是否必需 */
  required: boolean;
}

// ==================== 模板数据类型 ====================

/**
 * 接口函数模板数据
 * 传递给 Handlebars 模板编译的数据结构
 */
export interface InterfaceTemplateData {
  /** 接口名称 */
  interfaceName?: string;
  /** 请求类型名称 */
  requestTypeName: string;
  /** 响应类型名称 */
  responseTypeName: string;
  /** 请求 Schema 名称 */
  requestSchemaName?: string;
  /** 响应 Schema 名称 */
  responseSchemaName?: string;
  /** 函数名称 */
  functionName: string;
  /** API 路径 */
  path: string;
  /** HTTP 方法（大写） */
  method: string;
  /** 接口描述 */
  description: string;
  /** 是否有参数 */
  hasParameters: boolean;
  /** 请求参数列表 */
  parameters: ApiProperty[];
  /** 是否有响应 */
  hasResponse: boolean;
  /** 响应属性列表 */
  responseProperties: ApiProperty[];
  /** 是否有请求体 */
  hasBody: boolean;
  /** 是否为 multipart/form-data 请求 */
  isFormData?: boolean;
  /** 请求方法调用风格 */
  requestMethodStyle?: string;
  /** 请求函数名称 */
  requestFunctionName: string;
  /** 请求方法对象名称 */
  requestMethodsObjectName: string;
  /** 请求参数变量名 */
  requestParamName: string;
  /** 请求 Schema 内容（Zod 模式） */
  requestSchema?: string;
  /** 响应 Schema 内容（Zod 模式） */
  responseSchema?: string;
}

// ==================== 兼容旧代码的接口 ====================

/**
 * 分类信息（兼容旧接口）
 * @deprecated 请使用 ApiCategory
 */
export type CategoryInfo = ApiCategory & { id: number };

/**
 * 接口定义（旧格式，兼容使用）
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
  parameters: ApiProperty[];
  /** 请求体 */
  requestBody: unknown;
  /** 响应 */
  responses: unknown;
  /** 所属分类 */
  category: string;
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

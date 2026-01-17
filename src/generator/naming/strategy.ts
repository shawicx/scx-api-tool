/**
 * @description 命名策略模块
 * 提供灵活的命名策略接口和默认实现
 * 用于统一管理接口、函数、类型名称的生成逻辑
 */

import { ApiConfig } from '../../types';
import { sanitizeInterfaceName, sanitizeParamName } from './sanitizer';

/**
 * @description 接口命名信息接口
 * 提供命名策略所需的上下文信息
 *
 * @example
 * ```typescript
 * const info: NamingContext = {
 *   info: {
 *     path: '/api/users/{id}',
 *     method: 'GET',
 *     summary: '获取用户信息',
 *     description: '根据 ID 获取用户详细信息',
 *     operationId: 'getUserById',
 *     tags: ['用户']
 *   },
 *   config: apiConfig
 * };
 * ```
 */
export interface NamingContext {
  /** API 路径 */
  path: string;
  /** HTTP 方法 */
  method: string;
  /** 操作描述 */
  summary?: string;
  /** 操作详细描述 */
  description?: string;
  /** 操作 ID */
  operationId?: string;
  /** 标签 */
  tags?: string[];
  /** 配置对象 */
  config: ApiConfig;
}

/**
 * @description 命名策略接口
 * 定义接口名称、函数名称、请求类型名称、响应类型名称的生成方法
 *
 * @example
 * ```typescript
 * const customStrategy: NamingStrategy = {
 *   interfaceName: (ctx) => {
 *     return `${ctx.method.toUpperCase()}_${ctx.path.replace(/\//g, '_')}`;
 *   },
 *   functionName: (ctx) => {
 *     return `${ctx.method.toLowerCase()}${ctx.path.replace(/\//g, '_')}`;
 *   },
 *   requestTypeName: (ctx) => {
 *     return `${ctx.interfaceName}Request`;
 *   },
 *   responseTypeName: (ctx) => {
 *     return `${ctx.interfaceName}Response`;
 *   }
 * };
 * ```
 */
export interface NamingStrategy {
  /**
   * @description 生成接口名称
   * @param ctx 命名上下文
   * @returns 接口名称字符串
   *
   * @example
   * ```typescript
   * interfaceName: (ctx) => {
   *   return `I${ctx.path.replace(/\//g, '_')}`;
   * }
   * ```
   */
  interfaceName?: (ctx: NamingContext) => string;

  /**
   * @description 生成函数名称
   * @param ctx 命名上下文
   * @returns 函数名称字符串
   *
   * @example
   * ```typescript
   * functionName: (ctx) => {
   *   return `${ctx.method.toLowerCase()}${ctx.path.replace(/\//g, '_')}`;
   * }
   * ```
   */
  functionName?: (ctx: NamingContext) => string;

  /**
   * @description 生成请求类型名称
   * @param ctx 命名上下文
   * @returns 请求类型名称字符串
   *
   * @example
   * ```typescript
   * requestTypeName: (ctx) => {
   *   return `${ctx.interfaceName}RequestType`;
   * }
   * ```
   */
  requestTypeName?: (ctx: NamingContext) => string;

  /**
   * @description 生成响应类型名称
   * @param ctx 命名上下文
   * @returns 响应类型名称字符串
   *
   * @example
   * ```typescript
   * responseTypeName: (ctx) => {
   *   return `${ctx.interfaceName}Result`;
   * }
   * ```
   */
  responseTypeName?: (ctx: NamingContext) => string;
}

/**
 * @description 默认命名策略
 * 提供标准的命名规则，确保生成的代码符合 TypeScript 命名规范
 */
export const defaultNamingStrategy: Required<NamingStrategy> = {
  /**
   * @description 默认接口名称生成
   * 格式：Method + Path + Parameters
   * 例如：GET /api/users/{id} → GetUsersById
   */
  interfaceName: (ctx: NamingContext): string => {
    const { path, method } = ctx;

    // 提取路径参数
    const paramMatches = path.match(/\{([^}]+)\}/g) || [];

    // 移除路径参数，清理路径
    let pathName = path.replace(/\{[^}]+\}/g, '');
    pathName = pathName
      .replace(/^\//, '') // 移除开头的 /
      .replace(/^api-?/i, '') // 移除开头的 api- 或 api/
      .replace(/\//g, '-') // / → -
      .replace(/^-+|-+$/g, ''); // 移除前导/尾随 -

    // 分割并处理每个单词
    const words = pathName.split('-');
    const camelCaseWords = words.map((word) => {
      // 如果单词已经是驼峰命名（包含大写字母或数字），保持不变
      if (/[A-Z0-9]/.test(word.charAt(0))) {
        return word;
      }
      // 否则首字母大写
      return word.charAt(0).toUpperCase() + word.slice(1);
    });

    pathName = camelCaseWords.join('');

    // 为每个路径参数添加 By 前缀（驼峰化）
    const paramsPart = paramMatches
      .map((param) => {
        const paramName = param.replace(/\{([^}]+)\}/, '$1');
        const capitalized = paramName.charAt(0).toUpperCase() + paramName.slice(1);
        return `By${capitalized}`;
      })
      .join('');

    // 组合：方法（首字母大写）+ 路径名 + 参数
    const methodCapitalized = method.charAt(0).toUpperCase() + method.slice(1).toLowerCase();
    const interfaceName = methodCapitalized + pathName + paramsPart;

    return sanitizeInterfaceName(interfaceName);
  },

  /**
   * @description 默认函数名称生成
   * 格式：method + Path + Parameters + Api
   * 例如：GET /api/users/{id} → getUsersByIdApi
   */
  functionName: (ctx: NamingContext): string => {
    const { path, method } = ctx;

    // 提取路径参数
    const paramMatches = path.match(/\{([^}]+)\}/g) || [];

    // 移除路径参数，清理路径
    let pathName = path.replace(/\{[^}]+\}/g, '');
    pathName = pathName
      .replace(/^\//, '') // 移除开头的 /
      .replace(/^api-?/i, '') // 移除开头的 api- 或 api/
      .replace(/\//g, '-') // / → -
      .replace(/^-+|-+$/g, ''); // 移除前导/尾随 -

    // 分割并处理每个单词（全部转为 PascalCase）
    const words = pathName.split('-');
    const pascalCaseWords = words.map((word) => {
      // 如果单词已经是驼峰命名（包含大写字母或数字），保持不变
      if (/[A-Z0-9]/.test(word.charAt(0))) {
        return word;
      }
      // 否则首字母大写
      return word.charAt(0).toUpperCase() + word.slice(1);
    });

    const pascalCasePathName = pascalCaseWords.join('');

    // 为每个路径参数添加 By 前缀（驼峰化）
    const paramsPart = paramMatches
      .map((param) => {
        const paramName = param.replace(/\{[^}]+\}/, '$1');
        const capitalized = paramName.charAt(0).toUpperCase() + paramName.slice(1);
        return `By${capitalized}`;
      })
      .join('');

    // 组合：方法（小写开头）+ 路径名（PascalCase） + 参数 + Func 后缀
    const functionName = `${method.toLowerCase() + pascalCasePathName + paramsPart}Func`;

    return sanitizeParamName(functionName);
  },

  /**
   * @description 默认请求类型名称生成
   * 格式：InterfaceName + RequestType
   * 例如：GetUsersById → GetUsersByIdRequestType
   */
  requestTypeName: (ctx: NamingContext): string => {
    const interfaceName = defaultNamingStrategy.interfaceName(ctx);
    return `${interfaceName}RequestType`;
  },

  /**
   * @description 默认响应类型名称生成
   * 格式：InterfaceName + Result
   * 例如：GetUsersById → GetUsersByIdResult
   */
  responseTypeName: (ctx: NamingContext): string => {
    const interfaceName = defaultNamingStrategy.interfaceName(ctx);
    return `${interfaceName}Result`;
  },
};

/**
 * @description 应用命名策略
 * 合并自定义策略和默认策略，自定义策略优先
 * @param ctx 命名上下文
 * @param customStrategy 自定义策略（可选）
 * @returns 应用策略后的命名结果
 *
 * @example
 * ```typescript
 * const result = applyNamingStrategy({ info, config });
 * console.log(result.interfaceName);
 * console.log(result.functionName);
 * console.log(result.requestTypeName);
 * console.log(result.responseTypeName);
 * ```
 */
export function applyNamingStrategy(
  ctx: NamingContext,
  customStrategy?: Partial<NamingStrategy>,
): {
  interfaceName: string;
  functionName: string;
  requestTypeName: string;
  responseTypeName: string;
} {
  const strategy = customStrategy
    ? { ...defaultNamingStrategy, ...customStrategy }
    : defaultNamingStrategy;

  return {
    interfaceName: strategy.interfaceName(ctx),
    functionName: strategy.functionName(ctx),
    requestTypeName: strategy.requestTypeName(ctx),
    responseTypeName: strategy.responseTypeName(ctx),
  };
}

/**
 * @description 命名策略模块
 * 提供灵活的命名策略接口和默认实现
 * 用于统一管理接口、函数、类型名称的生成逻辑
 */

import type { NamingContext, NamingStrategy } from '@/types';
import { sanitizeInterfaceName, sanitizeParamName } from './sanitizer';

export type { NamingContext, NamingStrategy };

/**
 * @description 路径处理结果接口
 */
interface ProcessedPathInfo {
  /** 处理后的路径名称（PascalCase） */
  pascalCasePathName: string;
  /** 参数部分（如 ById ByUserId） */
  paramsPart: string;
  /** 原始路径参数数组 */
  paramMatches: string[];
}

/**
 * @description 预编译的正则表达式模式（性能优化）
 */
const PATH_PATTERNS = {
  /** 提取路径中的参数 */
  extractParams: /\{([^}]+)\}/g,
  /** 移除路径参数 */
  removeParams: /\{[^}]+\}/g,
  /** 移除开头的斜杠 */
  leadingSlash: /^\//,
  /** 移除 api 前缀 */
  apiPrefix: /^api-?/i,
  /** 斜杠转短横线 */
  slashToDash: /\//g,
  /** 移除前导/尾随短横线 */
  trailingDashes: /^-+|-+$/g,
  /** 检测首字母大写或数字 */
  uppercaseOrDigit: /[A-Z0-9]/,
} as const;

/**
 * @description 路径信息提取器
 * 将原始路径解析为结构化信息，供命名策略使用
 * @param path 原始路径（如 /api/users/{id}）
 * @returns 处理后的路径信息
 *
 * @example
 * ```typescript
 * const info = extractPathInfo('/api/users/{id}');
 * // {
 * //   pascalCasePathName: 'Users',
 * //   paramsPart: 'ById',
 * //   paramMatches: ['{id}']
 * // }
 * ```
 */
function extractPathInfo(path: string): ProcessedPathInfo {
  // 提取路径参数（用于生成 ById 等后缀）
  const paramMatches = path.match(PATH_PATTERNS.extractParams) || [];

  // 移除路径参数，清理路径
  let pathName = path.replace(PATH_PATTERNS.removeParams, '');
  pathName = pathName
    .replace(PATH_PATTERNS.leadingSlash, '') // 移除开头的 /
    .replace(PATH_PATTERNS.apiPrefix, '') // 移除开头的 api- 或 api/
    .replace(PATH_PATTERNS.slashToDash, '-') // / → -
    .replace(PATH_PATTERNS.trailingDashes, ''); // 移除前导/尾随 -

  // 分割并处理每个单词
  const words = pathName.split('-');
  const pascalCaseWords = words.map((word) => {
    // 如果单词已经是驼峰命名（包含大写字母或数字），保持不变
    if (PATH_PATTERNS.uppercaseOrDigit.test(word.charAt(0))) {
      return word;
    }
    // 否则首字母大写
    return word.charAt(0).toUpperCase() + word.slice(1);
  });

  const pascalCasePathName = pascalCaseWords.join('');

  // 为每个路径参数添加 By 前缀（驼峰化）
  const paramsPart = paramMatches
    .map((param) => {
      // 使用单独的正则表达式提取参数名（不带全局标志）
      const paramName = param.replace(/\{([^}]+)\}/, '$1');
      const capitalized = paramName.charAt(0).toUpperCase() + paramName.slice(1);
      return `By${capitalized}`;
    })
    .join('');

  return {
    pascalCasePathName,
    paramsPart,
    paramMatches,
  };
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

    // 使用公共的路径处理逻辑
    const { pascalCasePathName, paramsPart } = extractPathInfo(path);

    // 组合：方法（首字母大写）+ 路径名 + 参数
    const methodCapitalized = method.charAt(0).toUpperCase() + method.slice(1).toLowerCase();
    const interfaceName = methodCapitalized + pascalCasePathName + paramsPart;

    return sanitizeInterfaceName(interfaceName);
  },

  /**
   * @description 默认函数名称生成
   * 格式：method + Path + Parameters + Api
   * 例如：GET /api/users/{id} → getUsersByIdApi
   */
  functionName: (ctx: NamingContext): string => {
    const { path, method } = ctx;

    // 使用公共的路径处理逻辑
    const { pascalCasePathName, paramsPart } = extractPathInfo(path);

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

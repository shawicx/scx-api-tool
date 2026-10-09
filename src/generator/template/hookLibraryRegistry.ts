/**
 * @description Hook 库适配器注册表
 * 将「库差异」（模板选择、签名组装、import 语句）从 hookGenerator 中剥离，
 * 通过统一的 HookLibraryAdapter 接口按 hooksLibrary 配置路由到具体适配器
 */

import type { HookLibrary } from '../../types';
import { reactQueryAdapter } from './adapters/reactQueryAdapter';
import { swrAdapter } from './adapters/swrAdapter';
import { ahooksAdapter } from './adapters/ahooksAdapter';

/** 单个接口的 Hook 渲染所需数据（库无关，由 hookGenerator 统一构建） */
export interface HookInterfaceData {
  /** 是否生成 JSDoc 注释 */
  comment: boolean;
  /** Hook 名称（useXxx） */
  hookName: string;
  /** 被包装的 API 函数名 */
  functionName: string;
  /** 请求参数名（config.requestParamName） */
  requestParamName: string;
  /** 接口描述（已转义） */
  description: string;
  /** 请求类型名（无类型注解时为 'any'） */
  requestTypeName: string;
  /** 响应类型名（无类型注解时为 'any'） */
  responseTypeName: string;
  /** 是否有请求参数 */
  hasParameters: boolean;
  /** 是否生成类型注解（TS 且 generateTypes） */
  hasTypeAnnotations: boolean;
  /** queryKey 前缀配置 */
  queryKeyPrefix: string[];
}

/** 适配器渲染库相关 import 语句所需的上下文 */
export interface HookImportContext {
  /** 是否为 JavaScript 目标 */
  isJS: boolean;
  /** 文件内是否包含 query hook */
  hasQuery: boolean;
  /** 文件内是否包含 mutation hook */
  hasMutation: boolean;
}

/**
 * @description Hook 库适配器接口
 * 每个受支持的 hooksLibrary 实现一份，封装该库的模板、签名与 import 拼接逻辑
 */
export interface HookLibraryAdapter {
  /** peer dependency 提示文案（含版本要求） */
  peerDependencyHint: string;
  /** 渲染单个 query hook（GET/HEAD） */
  renderQuery(data: HookInterfaceData): string;
  /** 渲染单个 mutation hook（POST/PUT/PATCH/DELETE） */
  renderMutation(data: HookInterfaceData): string;
  /** 渲染库相关的 import 语句段（API 函数与类型模块 import 由生成器统一拼接） */
  renderLibraryImports(ctx: HookImportContext): string;
}

/**
 * @description 获取指定 Hook 库的适配器
 * @param library hooksLibrary 配置值
 * @returns 对应的适配器实例
 * @throws 当库未实现时抛出明确错误（正常情况下校验层已拦截）
 *
 * @example
 * ```typescript
 * const adapter = getHookLibraryAdapter('swr');
 * adapter.renderQuery(data);
 * ```
 */
export function getHookLibraryAdapter(library: HookLibrary): HookLibraryAdapter {
  const registry: Record<string, HookLibraryAdapter> = {
    'react-query': reactQueryAdapter,
    swr: swrAdapter,
    ahooks: ahooksAdapter,
  };

  const adapter = registry[library];
  if (!adapter) {
    throw new Error(
      `hooksLibrary "${library}" 当前版本未实现，已支持：react-query / swr / ahooks（vue-query 预留）`,
    );
  }
  return adapter;
}

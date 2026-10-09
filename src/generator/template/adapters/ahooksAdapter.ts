/**
 * @description ahooks v3 适配器（ahooks@^3 useRequest）
 * query：useRequest 自动模式（params 变化不会自动重新请求，需透传 refreshDeps 或手动 refresh；
 *        queryKeyPrefix 非空时映射为 cacheKey 供其内置缓存使用）
 * mutation：useRequest manual 模式（通过 run(variables) 触发）
 */

import { compileTemplate } from '../compiler';
import {
  getAhooksQueryHookTemplate,
  getAhooksMutationHookTemplate,
} from '../hookTemplateDefinitions';
import {
  appendResponseValidation,
  type HookInterfaceData,
  type HookImportContext,
  type HookLibraryAdapter,
} from '../hookLibraryRegistry';

/** ahooks 未导出 Options 类型，用 Parameters 技巧从 useRequest 签名推导 */
const AHOOKS_OPTIONS_TYPE = 'Parameters<typeof useRequest>[1]';

/**
 * @description 构建 useRequest 第二参数：有前缀时生成 cacheKey，否则直接透传 options
 * @param data 接口渲染数据
 * @returns 模板字符串片段，如 `, options` 或 `, { cacheKey: 'user:getUserFunc', ...(options ?? {}) }`
 */
function buildOptionsArgument(data: HookInterfaceData): string {
  if (data.queryKeyPrefix.length === 0) {
    return ', options';
  }
  const cacheKey = [...data.queryKeyPrefix, data.functionName].join(':');
  return `, { cacheKey: '${cacheKey}', ...(options ?? {}) }`;
}

/**
 * @description ahooks 适配器实现
 */
export const ahooksAdapter: HookLibraryAdapter = {
  peerDependencyHint:
    '已启用 Hooks 生成（ahooks v3）：请确保项目中已安装 peer dependency "ahooks@^3"',

  renderQuery(data: HookInterfaceData): string {
    const compiled = compileTemplate(getAhooksQueryHookTemplate());
    return compiled({
      ...data,
      paramsSignature: data.hasTypeAnnotations
        ? `${data.requestParamName}: ${data.requestTypeName}${data.hasParameters ? '' : ` = {} as ${data.requestTypeName}`}`
        : `${data.requestParamName}${data.hasParameters ? '' : ' = {}'}`,
      optionsSignature: data.hasTypeAnnotations
        ? `options: ${AHOOKS_OPTIONS_TYPE} = {}`
        : 'options = {}',
      optionsArgument: buildOptionsArgument(data),
      fetcherExpression: appendResponseValidation(
        `() => ${data.functionName}(${data.requestParamName})`,
        data,
      ),
    });
  },

  renderMutation(data: HookInterfaceData): string {
    const compiled = compileTemplate(getAhooksMutationHookTemplate());
    return compiled({
      ...data,
      optionsSignature: data.hasTypeAnnotations
        ? `options: ${AHOOKS_OPTIONS_TYPE} = {}`
        : 'options = {}',
      fetcherSignature: data.hasTypeAnnotations
        ? `${data.requestParamName}: ${data.requestTypeName}`
        : data.requestParamName,
      fetcherBody: appendResponseValidation(`${data.functionName}(${data.requestParamName})`, data),
    });
  },

  renderLibraryImports(_ctx: HookImportContext): string {
    return `import { useRequest } from 'ahooks';\n`;
  },
};

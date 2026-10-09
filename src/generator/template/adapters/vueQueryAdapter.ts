/**
 * @description vue-query v5 适配器（@tanstack/vue-query）
 * vue-query 与 react-query v5 API 同形（对象式 useQuery / useMutation），
 * 复用 react-query 模板，仅 import 来源与注释中的返回类型名不同；
 * 用户项目需注册 VueQueryPlugin
 */

import { compileTemplate } from '../compiler';
import {
  getReactQueryHookTemplate,
  getReactMutationHookTemplate,
} from '../hookTemplateDefinitions';
import {
  appendResponseValidation,
  type HookInterfaceData,
  type HookImportContext,
  type HookLibraryAdapter,
} from '../hookLibraryRegistry';

/**
 * @description 构建 queryKey 数组项字符串（前缀 + 函数名 + 参数对象）
 * @param data 接口渲染数据
 * @returns 逗号分隔的数组项字符串
 */
function buildQueryKeyItems(data: HookInterfaceData): string {
  const items = data.queryKeyPrefix.map((p) => `'${p}'`);
  items.push(`'${data.functionName}'`);
  items.push(data.requestParamName);
  return items.join(', ');
}

/**
 * @description vue-query 适配器实现
 */
export const vueQueryAdapter: HookLibraryAdapter = {
  peerDependencyHint:
    '已启用 Hooks 生成（vue-query v5）：请确保项目中已安装 peer dependency "@tanstack/vue-query@^5" 并注册 VueQueryPlugin',

  renderQuery(data: HookInterfaceData): string {
    const compiled = compileTemplate(getReactQueryHookTemplate());
    return compiled({
      ...data,
      queryResultTypeName: 'UseQueryReturnType',
      paramsSignature: data.hasTypeAnnotations
        ? `${data.requestParamName}: ${data.requestTypeName}${data.hasParameters ? '' : ` = {} as ${data.requestTypeName}`}`
        : `${data.requestParamName}${data.hasParameters ? '' : ' = {}'}`,
      queryOptionsSignature: data.hasTypeAnnotations
        ? `options: Omit<UseQueryOptions<${data.responseTypeName}, Error>, 'queryKey' | 'queryFn'> = {}`
        : 'options = {}',
      queryKeyItems: buildQueryKeyItems(data),
      queryFnExpression: appendResponseValidation(
        `({ signal }) => ${data.functionName}(${data.requestParamName}, { signal })`,
        data,
      ),
    });
  },

  renderMutation(data: HookInterfaceData): string {
    const compiled = compileTemplate(getReactMutationHookTemplate());
    const paramsSignature = data.hasTypeAnnotations
      ? `${data.requestParamName}: ${data.requestTypeName}`
      : data.requestParamName;
    return compiled({
      ...data,
      mutationResultTypeName: 'UseMutationReturnType',
      mutationOptionsSignature: data.hasTypeAnnotations
        ? `options: Omit<UseMutationOptions<${data.responseTypeName}, Error, ${data.requestTypeName}, unknown>> = {}`
        : 'options = {}',
      mutationFnExpression: appendResponseValidation(
        `(${paramsSignature}) => ${data.functionName}(${data.requestParamName})`,
        data,
      ),
    });
  },

  renderLibraryImports(ctx: HookImportContext): string {
    let imports = '';

    const hookFns: string[] = [];
    if (ctx.hasQuery) hookFns.push('useQuery');
    if (ctx.hasMutation) hookFns.push('useMutation');
    imports += `import { ${hookFns.join(', ')} } from '@tanstack/vue-query';\n`;

    if (!ctx.isJS) {
      const optionTypes: string[] = [];
      if (ctx.hasQuery) optionTypes.push('UseQueryOptions');
      if (ctx.hasMutation) optionTypes.push('UseMutationOptions');
      imports += `import type { ${optionTypes.join(', ')} } from '@tanstack/vue-query';\n`;
    }

    return imports;
  },
};

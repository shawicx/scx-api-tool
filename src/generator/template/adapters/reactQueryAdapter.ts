/**
 * @description react-query v5 适配器（@tanstack/react-query）
 * query：useQuery 对象式 API，queryFn 透传 signal 支持请求取消
 * mutation：useMutation，mutationFn 接收 variables
 */

import { compileTemplate } from '../compiler';
import {
  getReactQueryHookTemplate,
  getReactMutationHookTemplate,
} from '../hookTemplateDefinitions';
import type {
  HookInterfaceData,
  HookImportContext,
  HookLibraryAdapter,
} from '../hookLibraryRegistry';

/**
 * @description 构建 queryKey 数组项字符串（前缀 + 函数名 + 参数对象）
 * @param data 接口渲染数据
 * @returns 逗号分隔的数组项字符串，如 `'user', 'getUserFunc', params`
 */
function buildQueryKeyItems(data: HookInterfaceData): string {
  const items = data.queryKeyPrefix.map((p) => `'${p}'`);
  items.push(`'${data.functionName}'`);
  items.push(data.requestParamName);
  return items.join(', ');
}

/**
 * @description react-query 适配器实现
 */
export const reactQueryAdapter: HookLibraryAdapter = {
  peerDependencyHint:
    '已启用 Hooks 生成（react-query v5）：请确保项目中已安装 peer dependency "@tanstack/react-query@^5" 并配置了 QueryClientProvider',

  renderQuery(data: HookInterfaceData): string {
    const compiled = compileTemplate(getReactQueryHookTemplate());
    return compiled({
      ...data,
      paramsSignature: data.hasTypeAnnotations
        ? `${data.requestParamName}: ${data.requestTypeName}${data.hasParameters ? '' : ` = {} as ${data.requestTypeName}`}`
        : `${data.requestParamName}${data.hasParameters ? '' : ' = {}'}`,
      queryOptionsSignature: data.hasTypeAnnotations
        ? `options: Omit<UseQueryOptions<${data.responseTypeName}, Error>, 'queryKey' | 'queryFn'> = {}`
        : 'options = {}',
      queryKeyItems: buildQueryKeyItems(data),
    });
  },

  renderMutation(data: HookInterfaceData): string {
    const compiled = compileTemplate(getReactMutationHookTemplate());
    return compiled({
      ...data,
      mutationOptionsSignature: data.hasTypeAnnotations
        ? `options: Omit<UseMutationOptions<${data.responseTypeName}, Error, ${data.requestTypeName}, unknown>> = {}`
        : 'options = {}',
      mutationFnSignature: data.hasTypeAnnotations
        ? `${data.requestParamName}: ${data.requestTypeName}`
        : data.requestParamName,
    });
  },

  renderLibraryImports(ctx: HookImportContext): string {
    let imports = '';

    const hookFns: string[] = [];
    if (ctx.hasQuery) hookFns.push('useQuery');
    if (ctx.hasMutation) hookFns.push('useMutation');
    imports += `import { ${hookFns.join(', ')} } from '@tanstack/react-query';\n`;

    if (!ctx.isJS) {
      const optionTypes: string[] = [];
      if (ctx.hasQuery) optionTypes.push('UseQueryOptions');
      if (ctx.hasMutation) optionTypes.push('UseMutationOptions');
      imports += `import type { ${optionTypes.join(', ')} } from '@tanstack/react-query';\n`;
    }

    return imports;
  },
};

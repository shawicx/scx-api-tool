/**
 * @description SWR v2 适配器（swr@^2）
 * query：useSWR 数组 key（key 变化自动重新请求，无 signal 透传——SWR fetcher 签名不支持）
 * mutation：useSWRMutation（swr/mutation 子模块，通过 trigger 触发）
 */

import { compileTemplate } from '../compiler';
import { getSwrQueryHookTemplate, getSwrMutationHookTemplate } from '../hookTemplateDefinitions';
import type {
  HookInterfaceData,
  HookImportContext,
  HookLibraryAdapter,
} from '../hookLibraryRegistry';

/**
 * @description 构建 SWR key 数组项字符串（query 含参数对象，mutation 仅前缀 + 函数名）
 * @param data 接口渲染数据
 * @param includeParams key 是否包含参数对象（query 为 true，mutation 为 false）
 * @returns 逗号分隔的数组项字符串
 */
function buildKeyItems(data: HookInterfaceData, includeParams: boolean): string {
  const items = data.queryKeyPrefix.map((p) => `'${p}'`);
  items.push(`'${data.functionName}'`);
  if (includeParams) {
    items.push(data.requestParamName);
  }
  return items.join(', ');
}

/**
 * @description SWR 适配器实现
 */
export const swrAdapter: HookLibraryAdapter = {
  peerDependencyHint: '已启用 Hooks 生成（swr v2）：请确保项目中已安装 peer dependency "swr@^2"',

  renderQuery(data: HookInterfaceData): string {
    const compiled = compileTemplate(getSwrQueryHookTemplate());
    return compiled({
      ...data,
      paramsSignature: data.hasTypeAnnotations
        ? `${data.requestParamName}: ${data.requestTypeName}${data.hasParameters ? '' : ` = {} as ${data.requestTypeName}`}`
        : `${data.requestParamName}${data.hasParameters ? '' : ' = {}'}`,
      optionsSignature: data.hasTypeAnnotations
        ? `options: SWRConfiguration<${data.responseTypeName}, Error> = {}`
        : 'options = {}',
      keyItems: buildKeyItems(data, true),
    });
  },

  renderMutation(data: HookInterfaceData): string {
    const compiled = compileTemplate(getSwrMutationHookTemplate());
    return compiled({
      ...data,
      optionsSignature: data.hasTypeAnnotations
        ? `options: SWRMutationConfiguration<${data.responseTypeName}, Error, undefined, ${data.requestTypeName}> = {}`
        : 'options = {}',
      keyItems: buildKeyItems(data, false),
      fetcherSignature: data.hasTypeAnnotations
        ? `(_, { arg }: { arg: ${data.requestTypeName} }) => ${data.functionName}(arg)`
        : `(_, { arg }) => ${data.functionName}(arg)`,
    });
  },

  renderLibraryImports(ctx: HookImportContext): string {
    let imports = '';

    if (ctx.hasQuery) {
      imports += `import useSWR from 'swr';\n`;
      if (!ctx.isJS) {
        imports += `import type { SWRConfiguration } from 'swr';\n`;
      }
    }
    if (ctx.hasMutation) {
      imports += `import useSWRMutation from 'swr/mutation';\n`;
      if (!ctx.isJS) {
        imports += `import type { SWRMutationConfiguration } from 'swr/mutation';\n`;
      }
    }

    return imports;
  },
};

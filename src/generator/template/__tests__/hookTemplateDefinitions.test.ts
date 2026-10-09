/**
 * @description hookTemplateDefinitions.ts 单元测试
 * 覆盖 query / mutation 模板的渲染分支（注释开关、签名注入、queryKey 拼接）
 */

import { describe, it, expect } from 'vitest';
import { compileTemplate } from '../compiler';
import {
  getReactQueryHookTemplate,
  getReactMutationHookTemplate,
  getReactHookTemplateByKind,
  getSwrQueryHookTemplate,
  getSwrMutationHookTemplate,
  getSwrHookTemplateByKind,
  getAhooksQueryHookTemplate,
  getAhooksMutationHookTemplate,
  getAhooksHookTemplateByKind,
} from '../hookTemplateDefinitions';
import { getHookLibraryAdapter, appendResponseValidation } from '../hookLibraryRegistry';

const baseData = {
  comment: true,
  hookName: 'useGetApiUsersFunc',
  functionName: 'getApiUsersFunc',
  requestParamName: 'params',
  description: '获取用户列表',
  requestTypeName: 'GetApiUsersRequestType',
  responseTypeName: 'GetApiUsersResultType',
};

describe('getReactQueryHookTemplate', () => {
  it('渲染带注释的 query hook（JSDoc + queryKey + signal 透传）', () => {
    const compiled = compileTemplate(getReactQueryHookTemplate());
    const code = compiled({
      ...baseData,
      queryResultTypeName: 'UseQueryResult',
      paramsSignature: 'params: GetApiUsersRequestType',
      queryOptionsSignature:
        "options: Omit<UseQueryOptions<GetApiUsersResultType, Error>, 'queryKey' | 'queryFn'> = {}",
      queryKeyItems: "'getApiUsersFunc', params",
      queryFnExpression: '({ signal }) => getApiUsersFunc(params, { signal })',
    });

    expect(code).toContain(' * @description 获取用户列表');
    expect(code).toContain('export function useGetApiUsersFunc(');
    expect(code).toContain("queryKey: ['getApiUsersFunc', params],");
    expect(code).toContain('queryFn: ({ signal }) => getApiUsersFunc(params, { signal }),');
    expect(code).toContain('...options,');
  });

  it('comment 为 false 时不渲染 JSDoc', () => {
    const compiled = compileTemplate(getReactQueryHookTemplate());
    const code = compiled({
      ...baseData,
      comment: false,
      paramsSignature: 'params',
      queryOptionsSignature: 'options = {}',
      queryKeyItems: "'getApiUsersFunc', params",
    });

    expect(code).not.toContain('@description');
    expect(code).toContain('export function useGetApiUsersFunc(');
  });
});

describe('getReactMutationHookTemplate', () => {
  it('渲染 mutation hook（variables 签名 + mutationFn）', () => {
    const compiled = compileTemplate(getReactMutationHookTemplate());
    const code = compiled({
      ...baseData,
      hookName: 'usePostApiUsersFunc',
      mutationResultTypeName: 'UseMutationResult',
      mutationOptionsSignature:
        'options: Omit<UseMutationOptions<GetApiUsersResultType, Error, GetApiUsersRequestType, unknown>> = {}',
      mutationFnExpression: '(params: GetApiUsersRequestType) => getApiUsersFunc(params)',
    });

    expect(code).toContain('export function usePostApiUsersFunc(');
    expect(code).toContain(
      'mutationFn: (params: GetApiUsersRequestType) => getApiUsersFunc(params),',
    );
    expect(code).toContain('...options,');
  });
});

describe('getReactHookTemplateByKind', () => {
  it('按 kind 返回对应模板', () => {
    expect(getReactHookTemplateByKind('query')).toBe(getReactQueryHookTemplate());
    expect(getReactHookTemplateByKind('mutation')).toBe(getReactMutationHookTemplate());
  });
});

describe('swr templates', () => {
  it('渲染 useSWR query（数组 key + fetcher + options 直传）', () => {
    const compiled = compileTemplate(getSwrQueryHookTemplate());
    const code = compiled({
      ...baseData,
      paramsSignature: 'params: GetApiUsersRequestType',
      optionsSignature: 'options: SWRConfiguration<GetApiUsersResultType, Error> = {}',
      keyItems: "'user', 'getApiUsersFunc', params",
      fetcherExpression: '() => getApiUsersFunc(params)',
    });

    expect(code).toContain(' * @description 获取用户列表');
    expect(code).toContain("['user', 'getApiUsersFunc', params],");
    expect(code).toContain('() => getApiUsersFunc(params),');
    expect(code).toContain('    options,\n');
  });

  it('渲染 useSWRMutation（trigger 触发 + arg 签名）', () => {
    const compiled = compileTemplate(getSwrMutationHookTemplate());
    const code = compiled({
      ...baseData,
      optionsSignature: 'options: SWRMutationConfiguration<GetApiUsersResultType, Error> = {}',
      keyItems: "'user', 'getApiUsersFunc'",
      fetcherSignature: '(_, { arg }: { arg: GetApiUsersRequestType }) => getApiUsersFunc(arg)',
    });

    expect(code).toContain('useSWRMutation(');
    expect(code).toContain(
      '(_, { arg }: { arg: GetApiUsersRequestType }) => getApiUsersFunc(arg),',
    );
  });

  it('getSwrHookTemplateByKind 按 kind 路由', () => {
    expect(getSwrHookTemplateByKind('query')).toBe(getSwrQueryHookTemplate());
    expect(getSwrHookTemplateByKind('mutation')).toBe(getSwrMutationHookTemplate());
  });
});

describe('ahooks templates', () => {
  it('渲染 useRequest 自动模式（options 直传）', () => {
    const compiled = compileTemplate(getAhooksQueryHookTemplate());
    const code = compiled({
      ...baseData,
      paramsSignature: 'params: GetApiUsersRequestType',
      optionsSignature: 'options: Parameters<typeof useRequest>[1] = {}',
      optionsArgument: ', options',
      fetcherExpression: '() => getApiUsersFunc(params)',
    });

    expect(code).toContain('useRequest(() => getApiUsersFunc(params), options);');
    expect(code).toContain('@returns useRequest 查询结果');
  });

  it('渲染 useRequest manual 模式（cacheKey 不被 HTML 转义）', () => {
    const compiled = compileTemplate(getAhooksMutationHookTemplate());
    const code = compiled({
      ...baseData,
      optionsSignature: 'options: Parameters<typeof useRequest>[1] = {}',
      fetcherSignature: 'params: GetApiUsersRequestType',
      fetcherBody: 'getApiUsersFunc(params)',
    });

    expect(code).toContain('useRequest(');
    expect(code).toContain('{ manual: true, ...(options ?? {}) },');
  });

  it('getAhooksHookTemplateByKind 按 kind 路由', () => {
    expect(getAhooksHookTemplateByKind('query')).toBe(getAhooksQueryHookTemplate());
    expect(getAhooksHookTemplateByKind('mutation')).toBe(getAhooksMutationHookTemplate());
  });
});

describe('getHookLibraryAdapter', () => {
  it('按配置路由到对应适配器（四库均已实现）', () => {
    expect(getHookLibraryAdapter('react-query').peerDependencyHint).toContain(
      '@tanstack/react-query@^5',
    );
    expect(getHookLibraryAdapter('vue-query').peerDependencyHint).toContain(
      '@tanstack/vue-query@^5',
    );
    expect(getHookLibraryAdapter('swr').peerDependencyHint).toContain('swr@^2');
    expect(getHookLibraryAdapter('ahooks').peerDependencyHint).toContain('ahooks@^3');
  });
});

describe('appendResponseValidation', () => {
  it('开启校验时追加 zod parse，关闭时原样返回', () => {
    const data = {
      validateResponse: true,
      responseSchemaName: 'GetApiUsersResultTypeSchema',
    } as Parameters<typeof appendResponseValidation>[1];
    expect(appendResponseValidation('() => fn(params)', data)).toBe(
      '() => fn(params).then((res) => GetApiUsersResultTypeSchema.parse(res))',
    );
    const off = { validateResponse: false, responseSchemaName: '' } as Parameters<
      typeof appendResponseValidation
    >[1];
    expect(appendResponseValidation('() => fn(params)', off)).toBe('() => fn(params)');
  });
});

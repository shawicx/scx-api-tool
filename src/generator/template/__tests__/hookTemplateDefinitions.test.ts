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
} from '../hookTemplateDefinitions';

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
      paramsSignature: 'params: GetApiUsersRequestType',
      queryOptionsSignature:
        "options: Omit<UseQueryOptions<GetApiUsersResultType, Error>, 'queryKey' | 'queryFn'> = {}",
      queryKeyItems: "'getApiUsersFunc', params",
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
      mutationOptionsSignature:
        'options: Omit<UseMutationOptions<GetApiUsersResultType, Error, GetApiUsersRequestType, unknown>> = {}',
      mutationFnSignature: 'params: GetApiUsersRequestType',
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

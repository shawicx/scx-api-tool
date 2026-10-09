/**
 * @description Hook 模板字符串定义
 * 提供 React Query v5（@tanstack/react-query）query / mutation 两种 Hook 的 Handlebars 模板
 * 类型注解等 JS/TS 差异通过模板数据（预渲染字符串 + 三花括号）注入，避免模板分支爆炸
 */

// ==================== Query Hook 模版（GET / HEAD） ====================

/** React Query useQuery Hook 模板（注释开关由模板数据 comment 控制） */
export function getReactQueryHookTemplate(): string {
  return `{{#if comment}}
/**
 * @description {{description}}
 * @param {{requestParamName}} {{requestTypeName}}
 * @returns useQuery 查询结果（UseQueryResult<{{responseTypeName}}, Error>）
 */
{{/if}}
export function {{hookName}}(
  {{{paramsSignature}}},
  {{{queryOptionsSignature}}}
) {
  return useQuery({
    queryKey: [{{{queryKeyItems}}}],
    queryFn: ({ signal }) => {{functionName}}({{requestParamName}}, { signal }),
    ...options,
  });
}
`;
}

// ==================== Mutation Hook 模版（POST / PUT / PATCH / DELETE） ====================

/** React Query useMutation Hook 模板（注释开关由模板数据 comment 控制） */
export function getReactMutationHookTemplate(): string {
  return `{{#if comment}}
/**
 * @description {{description}}（mutation：通过 mutate / mutateAsync 触发）
 * @param variables {{requestTypeName}}
 * @returns useMutation 结果（UseMutationResult<{{responseTypeName}}, Error, {{requestTypeName}}>）
 */
{{/if}}
export function {{hookName}}({{{mutationOptionsSignature}}}) {
  return useMutation({
    mutationFn: ({{{mutationFnSignature}}}) => {{functionName}}({{requestParamName}}),
    ...options,
  });
}
`;
}

/**
 * @description 根据配置获取 Hook 模板
 * @param kind Hook 类型：query（GET/HEAD）或 mutation（POST/PUT/PATCH/DELETE）
 * @returns Handlebars 模板字符串
 *
 * @example
 * ```typescript
 * const template = getReactHookTemplateByKind('query');
 * const code = compileTemplate(template)(data);
 * ```
 */
export function getReactHookTemplateByKind(kind: 'query' | 'mutation'): string {
  return kind === 'query' ? getReactQueryHookTemplate() : getReactMutationHookTemplate();
}

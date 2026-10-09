/**
 * @description Hook 模板字符串定义
 * 提供 react-query v5 / swr v2 / ahooks v3 三种库的 query / mutation Hook Handlebars 模板
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

// ==================== SWR 模版（swr@^2） ====================

/** SWR useSWR Hook 模板（query，数组 key 支持参数变化自动重新请求） */
export function getSwrQueryHookTemplate(): string {
  return `{{#if comment}}
/**
 * @description {{description}}
 * @param {{requestParamName}} {{requestTypeName}}
 * @returns SWR 查询结果（SWRResponse<{{responseTypeName}}, Error>，key 变化自动重新请求）
 */
{{/if}}
export function {{hookName}}(
  {{{paramsSignature}}},
  {{{optionsSignature}}}
) {
  return useSWR(
    [{{{keyItems}}}],
    () => {{functionName}}({{requestParamName}}),
    options,
  );
}
`;
}

/** SWR useSWRMutation Hook 模板（mutation，通过 trigger/ run 触发） */
export function getSwrMutationHookTemplate(): string {
  return `{{#if comment}}
/**
 * @description {{description}}（mutation：通过 trigger 触发）
 * @param variables {{requestTypeName}}
 * @returns useSWRMutation 结果（SWRMutationResponse<{{responseTypeName}}, Error, undefined, {{requestTypeName}}>）
 */
{{/if}}
export function {{hookName}}({{{optionsSignature}}}) {
  return useSWRMutation(
    [{{{keyItems}}}],
    {{{fetcherSignature}}},
    options,
  );
}
`;
}

/**
 * @description 根据配置获取 SWR Hook 模板
 * @param kind Hook 类型：query 或 mutation
 * @returns Handlebars 模板字符串
 */
export function getSwrHookTemplateByKind(kind: 'query' | 'mutation'): string {
  return kind === 'query' ? getSwrQueryHookTemplate() : getSwrMutationHookTemplate();
}

// ==================== ahooks 模版（ahooks@^3） ====================

/** ahooks useRequest Hook 模板（query，参数变化需 refreshDeps 或手动 refresh） */
export function getAhooksQueryHookTemplate(): string {
  return `{{#if comment}}
/**
 * @description {{description}}
 * @param {{requestParamName}} {{requestTypeName}}
 * @returns useRequest 查询结果（params 变化不会自动重新请求，可透传 refreshDeps 或手动 refresh）
 */
{{/if}}
export function {{hookName}}(
  {{{paramsSignature}}},
  {{{optionsSignature}}}
) {
  return useRequest(() => {{functionName}}({{requestParamName}}){{{optionsArgument}}});
}
`;
}

/** ahooks useRequest manual 模式 Hook 模板（mutation，通过 run 触发） */
export function getAhooksMutationHookTemplate(): string {
  return `{{#if comment}}
/**
 * @description {{description}}（manual 模式：通过 run(variables) 触发）
 * @param variables {{requestTypeName}}
 * @returns useRequest 结果（含 run / runAsync / data / loading / error）
 */
{{/if}}
export function {{hookName}}({{{optionsSignature}}}) {
  return useRequest(
    ({{{fetcherSignature}}}) => {{functionName}}({{requestParamName}}),
    { manual: true, ...(options ?? {}) },
  );
}
`;
}

/**
 * @description 根据配置获取 ahooks Hook 模板
 * @param kind Hook 类型：query 或 mutation
 * @returns Handlebars 模板字符串
 */
export function getAhooksHookTemplateByKind(kind: 'query' | 'mutation'): string {
  return kind === 'query' ? getAhooksQueryHookTemplate() : getAhooksMutationHookTemplate();
}

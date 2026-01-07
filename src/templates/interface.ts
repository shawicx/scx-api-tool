/*
 * @description 接口模板
 */
export const interfaceTemplate = `import { RequestConfig, request } from './request';

// {{interfaceName}} 的接口定义
export interface {{interfaceName}}RequestType {
  {{#if hasParameters}}
  {{#each parameters}}
  /** {{description}} */
  {{{name}}}{{#unless required}}?{{/unless}}: {{{type}}};
  {{/each}}
  {{/if}}
}

export interface {{interfaceName}}ResponseType {
  {{#if hasResponse}}
  {{#each responseProperties}}
  /** {{description}} */
  {{{name}}}: {{{type}}};
  {{/each}}
  {{/if}}
}

/**
 * @description {{description}}
 * @param params 请求参数
 * @returns Promise<{{interfaceName}}ResponseType>
 */
export async function {{functionName}}(params: {{interfaceName}}RequestType): Promise<{{interfaceName}}ResponseType> {
  const config: RequestConfig = {
    url: '{{path}}',
    method: '{{method}}',
    {{#if hasParameters}}
    {{#if hasBody}}
    data: params,
    {{else}}
    params,
    {{/if}}
    {{/if}}
  };

  return request(config);
}
`;

/*
 * @description API Only 模式的接口模板 - 只生成请求方法，不包含类型定义
 */
export const apiOnlyTemplate = `import { request } from './request';

/**
 * @description {{description}}
 * @param params {{interfaceName}}RequestType
 * @returns Promise<{{interfaceName}}ResponseType>
 */
export async function {{functionName}}(
  params
) {
  const config = {
    url: '{{path}}',
    method: '{{method}}',
    {{#if hasParameters}}
    {{#if hasBody}}
    data: params,
    {{else}}
    params,
    {{/if}}
    {{/if}}
  };
  return request(config);
}
`;

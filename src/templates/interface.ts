/*
 * @Author: shawicx d35f3153@proton.me
 * @Description:
 */
export const interfaceTemplate = `import { RequestConfig, request } from './request';

// Interface for {{interfaceName}}
export interface {{interfaceName}}Request {
  {{#if hasParameters}}
  {{#each parameters}}
  /** {{description}} */
  {{name}}{{#unless required}}?{{/unless}}: {{{type}}};
  {{/each}}
  {{/if}}
}

export interface {{interfaceName}}Response {
  {{#if hasResponse}}
  {{#each responseProperties}}
  /** {{description}} */
  {{name}}: {{{type}}};
  {{/each}}
  {{/if}}
}

/**
 * @description {{description}}
 * @param params 请求参数
 * @returns Promise<{{interfaceName}}Response>
 */
export async function {{functionName}}(params: {{interfaceName}}Request): Promise<{{interfaceName}}Response> {
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

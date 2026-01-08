/*
 * @description 接口模板
 */
export const interfaceTemplate = `import { RequestConfig, {{requestFunctionName}} } from './request';

// {{interfaceName}} 的接口定义
export interface {{requestTypeName}} {
  {{#if hasParameters}}
  {{#each parameters}}
  /** {{description}} */
  {{{name}}}{{#unless required}}?{{/unless}}: {{{type}}};
  {{/each}}
  {{/if}}
}

export interface {{responseTypeName}} {
  {{#if hasResponse}}
  {{#each responseProperties}}
  /** {{description}} */
  {{{name}}}: {{{type}}};
  {{/each}}
  {{/if}}
}

/**
 * @description {{description}}
 * @param {{requestParamName}} {{requestTypeName}}
 * @returns Promise<{{responseTypeName}}>
 */
export async function {{functionName}}({{requestParamName}}: {{requestTypeName}}): Promise<{{responseTypeName}}> {
  const config: RequestConfig = {
    url: '{{path}}',
    method: '{{method}}',
    {{#if hasParameters}}
    {{#if hasBody}}
    data: {{requestParamName}},
    {{else}}
    {{requestParamName}},
    {{/if}}
    {{/if}}
  };

  return {{requestFunctionName}}(config);
}
`;

/*
 * @description API Only 模式的接口模板 - 只生成请求方法，不包含类型定义
 */
export const apiOnlyTemplate = `import { {{requestFunctionName}} } from './request';

/**
 * @description {{description}}
 * @param {{requestParamName}} {{requestTypeName}}
 * @returns Promise<{{responseTypeName}}>
 */
export async function {{functionName}}({{requestParamName}}: {{requestTypeName}}): Promise<{{responseTypeName}}> {
  const config = {
    url: '{{path}}',
    method: '{{method}}',
    {{#if hasParameters}}
    {{#if hasBody}}
    data: {{requestParamName}},
    {{else}}
    {{requestParamName}},
    {{/if}}
    {{/if}}
  };

  return {{requestFunctionName}}(config);
}
`;

import { RequestMethodStyle, HTTP_METHODS } from '../types';
import Handlebars from 'handlebars';

// 注册辅助函数
export function registerTemplateHelpers() {
  Handlebars.registerHelper('toLowerCase', (str: string) => str.toLowerCase());
  Handlebars.registerHelper('eq', (a: any, b: any) => a === b);
  Handlebars.registerHelper('httpMethod', (method: string) => {
    return HTTP_METHODS[method as keyof typeof HTTP_METHODS] || method.toLowerCase();
  });
  Handlebars.registerHelper('requestFunctionName', (config: any) => {
    return config.requestFunctionName || 'request';
  });
  Handlebars.registerHelper('requestMethodsObjectName', (config: any) => {
    return config.requestMethodsObjectName || 'requestMethods';
  });
}

// 注册 partials
export function registerTemplatePartials() {
  Handlebars.registerPartial(
    'functionBody',
    `
{{#if (eq requestMethodStyle 'method-specific')}}
  {{#if (eq method 'GET')}}
    {{#if hasParameters}}
  // GET 请求 - 只有查询参数
  return {{requestMethodsObjectName}}.get<{{interfaceName}}Response>('{{path}}', params);
    {{else}}
  // GET 请求 - 没有参数
  return {{requestMethodsObjectName}}.get<{{interfaceName}}Response>('{{path}}');
    {{/if}}
  {{/if}}
  {{#if (eq method 'DELETE')}}
    {{#if hasParameters}}
  // DELETE 请求 - 只有查询参数
  return {{requestMethodsObjectName}}.delete<{{interfaceName}}Response>('{{path}}', params);
    {{else}}
  // DELETE 请求 - 没有参数
  return {{requestMethodsObjectName}}.delete<{{interfaceName}}Response>('{{path}}');
    {{/if}}
  {{/if}}
  {{#if (eq method 'HEAD')}}
  // HEAD 请求 - 没有请求体
  return {{requestMethodsObjectName}}.head<{{interfaceName}}Response>('{{path}}'{{#if hasParameters}}, params{{/if}});
  {{/if}}
  {{#if (eq method 'OPTIONS')}}
  // OPTIONS 请求 - 没有请求体
  return {{requestMethodsObjectName}}.options<{{interfaceName}}Response>('{{path}}'{{#if hasParameters}}, params{{/if}});
  {{/if}}
  {{#if (eq method 'POST')}}
    {{#if hasParameters}}
  // POST 请求 - 有请求体参数
  return {{requestMethodsObjectName}}.post<{{interfaceName}}Response>('{{path}}', params);
    {{else}}
  // POST 请求 - 没有参数
  return {{requestMethodsObjectName}}.post<{{interfaceName}}Response>('{{path}}');
    {{/if}}
  {{/if}}
  {{#if (eq method 'PUT')}}
    {{#if hasParameters}}
  // PUT 请求 - 有请求体参数
  return {{requestMethodsObjectName}}.put<{{interfaceName}}Response>('{{path}}', params);
    {{else}}
  // PUT 请求 - 没有参数
  return {{requestMethodsObjectName}}.put<{{interfaceName}}Response>('{{path}}');
    {{/if}}
  {{/if}}
  {{#if (eq method 'PATCH')}}
    {{#if hasParameters}}
  // PATCH 请求 - 有请求体参数
  return {{requestMethodsObjectName}}.patch<{{interfaceName}}Response>('{{path}}', params);
    {{else}}
  // PATCH 请求 - 没有参数
  return {{requestMethodsObjectName}}.patch<{{interfaceName}}Response>('{{path}}');
    {{/if}}
  {{/if}}
{{else}}
  const config: RequestConfig = {
    url: '{{path}}',
    method: '{{method}}',
    {{#if hasBody}}data: params,{{/if}}{{#unless hasBody}}{{#if hasParameters}}params,{{/if}}{{/unless}}
  };
  return {{requestFunctionName}}<{{interfaceName}}Response>(config);
{{/if}}
`,
  );

  Handlebars.registerPartial(
    'importStatement',
    `
import type { AxiosRequestConfig } from 'axios';
import axios from 'axios';
import consola from 'consola';
`,
  );
}

// 预编译方法映射 - 性能优化
export function generatePrecompiledMethodMap(requestMethodsObjectName = 'requestMethods'): string {
  let template = '\n// 预编译的方法映射，避免运行时字符串操作\n';
  template += 'const METHOD_MAP = {\n';
  template += `  GET: ${requestMethodsObjectName}.get,\n`;
  template += `  POST: ${requestMethodsObjectName}.post,\n`;
  template += `  PUT: ${requestMethodsObjectName}.put,\n`;
  template += `  DELETE: ${requestMethodsObjectName}.delete,\n`;
  template += `  PATCH: ${requestMethodsObjectName}.patch,\n`;
  template += `  HEAD: ${requestMethodsObjectName}.head,\n`;
  template += `  OPTIONS: ${requestMethodsObjectName}.options,\n`;
  template += '} as const;\n';
  return template;
}

// 完整的接口模板 - 保持向后兼容
export function getInterfaceTemplate(): string {
  return '{{#if comment}}/**\n * @description {{description}}\n{{#if hasParameters}}\n * @param params {{interfaceName}}Request\n{{/if}}\n * @returns Promise<{{interfaceName}}Response>\n */{{/if}}\nexport interface {{interfaceName}}Request {\n{{#if hasParameters}}\n{{#each parameters}}{{#if ../comment}}  /** @description {{description}} */{{/if}}\n  {{name}}{{#unless required}}?{{/unless}}: {{{type}}};\n{{/each}}{{/if}}\n}\n\n{{#if comment}}/**\n * @description {{description}} 的返回数据类型\n */{{/if}}\nexport interface {{interfaceName}}Response {\n{{#if hasResponse}}\n{{#each responseProperties}}{{#if ../comment}}  /** @description {{description}} */{{/if}}\n  {{name}}: {{{type}}};\n{{/each}}{{/if}}\n}\n\n{{#if comment}}/**\n * @description {{description}}\n * @param params {{interfaceName}}Request\n * @returns Promise<{{interfaceName}}Response>\n */{{/if}}\nexport async function {{functionName}}(params: {{interfaceName}}Request): Promise<{{interfaceName}}Response> {\n  {{> functionBody}}\n}\n';
}

// 类型模板 - 保持向后兼容
export function getTypeTemplate(): string {
  return '{{#if comment}}/**\n * @description {{description}}\n */\n{{/if}}export interface {{typeName}} {\n{{#each properties}}{{#if ../comment}}  /** @description {{description}} */\n{{/if}}  {{name}}{{#unless required}}?{{/unless}}: {{{type}}};\n{{/each}}\n}\n';
}

// Simple template function to handle basic Handlebars-like syntax (for backward compatibility)
export function compileTemplate(template: string): (data: any) => string {
  // 确保注册了所有的辅助函数和 partials
  registerTemplateHelpers();
  registerTemplatePartials();

  return Handlebars.compile(template);
}

// 生成请求文件内容
export function generateRequestFile(config: any): string {
  registerTemplateHelpers();
  registerTemplatePartials();

  const requestFunctionName = config.requestFunctionName || 'request';
  const requestMethodsObjectName = config.requestMethodsObjectName || 'requestMethods';

  // 基础模板 - 使用字符串拼接而不是模板字面量
  let template = "import type { AxiosRequestConfig } from 'axios';\n";
  template += "import axios from 'axios';\n";
  template += "import consola from 'consola';\n\n";
  template += 'export interface RequestConfig extends AxiosRequestConfig {\n';
  template += '  url: string;\n';
  template += '  method: string;\n';
  template += '}\n\n';
  template += '// 用于转发请求的代理地址\n';
  template += "const BASE_LINE_PROXY_PATH = '/api';\n\n";
  template += '// 超时时间\n';
  template += 'const TIMEOUT = 5 * 1000;\n\n';
  template += `export async function ${
    requestFunctionName
  }<T = any>(config: RequestConfig): Promise<T> {\n`;
  template += '  try {\n';
  template += '    const response = await axios({\n';
  template += '      ...config,\n';
  template += '      baseURL: BASE_LINE_PROXY_PATH,\n';
  template += '      timeout: TIMEOUT,\n';
  template += '    });\n\n';
  template += '    return response.data;\n';
  template += '  } catch (error) {\n';
  template += "    consola.error('Request failed:', error);\n";
  template += '    throw error;\n';
  template += '  }\n';
  template += '}';

  if (
    config.requestMethodStyle === RequestMethodStyle.METHOD_SPECIFIC ||
    config.requestMethodStyle === RequestMethodStyle.BOTH
  ) {
    // 添加方法特定扩展
    template += '\n\n';
    template += `export const ${requestMethodsObjectName} = {\n`;
    template += '  get: <T = any>(url: string, params?: any) => {\n';
    template += "    const config: RequestConfig = { url, method: 'GET' };\n";
    template += '    if (params) {\n';
    template += '      config.params = params;\n';
    template += '    }\n';
    template += `    return ${requestFunctionName}<T>(config);\n`;
    template += '  },\n';
    template += '  post: <T = any>(url: string, data?: any, params?: any) => {\n';
    template += "    const config: RequestConfig = { url, method: 'POST' };\n";
    template += '    if (data) {\n';
    template += '      config.data = data;\n';
    template += '    }\n';
    template += '    if (params) {\n';
    template += '      config.params = params;\n';
    template += '    }\n';
    template += `    return ${requestFunctionName}<T>(config);\n`;
    template += '  },\n';
    template += '  put: <T = any>(url: string, data?: any, params?: any) => {\n';
    template += "    const config: RequestConfig = { url, method: 'PUT' };\n";
    template += '    if (data) {\n';
    template += '      config.data = data;\n';
    template += '    }\n';
    template += '    if (params) {\n';
    template += '      config.params = params;\n';
    template += '    }\n';
    template += `    return ${requestFunctionName}<T>(config);\n`;
    template += '  },\n';
    template += '  delete: <T = any>(url: string, params?: any) => {\n';
    template += "    const config: RequestConfig = { url, method: 'DELETE' };\n";
    template += '    if (params) {\n';
    template += '      config.params = params;\n';
    template += '    }\n';
    template += `    return ${requestFunctionName}<T>(config);\n`;
    template += '  },\n';
    template += '  patch: <T = any>(url: string, data?: any, params?: any) => {\n';
    template += "    const config: RequestConfig = { url, method: 'PATCH' };\n";
    template += '    if (data) {\n';
    template += '      config.data = data;\n';
    template += '    }\n';
    template += '    if (params) {\n';
    template += '      config.params = params;\n';
    template += '    }\n';
    template += `    return ${requestFunctionName}<T>(config);\n`;
    template += '  },\n';
    template += '  head: <T = any>(url: string, params?: any) => {\n';
    template += "    const config: RequestConfig = { url, method: 'HEAD' };\n";
    template += '    if (params) {\n';
    template += '      config.params = params;\n';
    template += '    }\n';
    template += `    return ${requestFunctionName}<T>(config);\n`;
    template += '  },\n';
    template += '  options: <T = any>(url: string, params?: any) => {\n';
    template += "    const config: RequestConfig = { url, method: 'OPTIONS' };\n";
    template += '    if (params) {\n';
    template += '      config.params = params;\n';
    template += '    }\n';
    template += `    return ${requestFunctionName}<T>(config);\n`;
    template += '  },\n';
    template += '};';
  }

  if (config.requestMethodStyle === RequestMethodStyle.BOTH) {
    template += generatePrecompiledMethodMap(requestMethodsObjectName);
  }

  return template;
}

// 生成接口函数内容
export function generateInterfaceFunction(interfaceInfo: any, config: any): string {
  registerTemplateHelpers();
  registerTemplatePartials();

  const template = getInterfaceTemplate();
  const compiledTemplate = Handlebars.compile(template);

  const result = compiledTemplate({
    ...interfaceInfo,
    requestFunctionName: config.requestFunctionName || 'request',
    requestMethodsObjectName: config.requestMethodsObjectName || 'requestMethods',
    requestMethodStyle: config.requestMethodStyle,
  });

  return result;
}

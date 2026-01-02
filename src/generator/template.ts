import { RequestMethodStyle } from '../types';
import { HTTP_METHODS } from '../utils/config';
import Handlebars from 'handlebars';
import consola from 'consola';

// 模板编译缓存
const templateCache = new Map<string, HandlebarsTemplateDelegate>();

/**
 * 获取缓存统计
 */
export function getTemplateCacheStats(): { size: number; keys: string[] } {
  return {
    size: templateCache.size,
    keys: Array.from(templateCache.keys()),
  };
}

/**
 * 清空模板缓存
 */
export function clearTemplateCache(): void {
  const { size } = templateCache;
  templateCache.clear();
  if (process.env.DEBUG && size > 0) {
    consola.debug(`模板缓存已清空：清理了 ${size} 个模板`);
  }
}

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

// ==================== 接口模版 ====================

/**
 * 完整的接口模板 - 带注释
 * 包含 Request/Response 类型定义和请求方法
 */
export function getInterfaceTemplateWithComment(): string {
  return `/**
 * @description {{description}}
{{#if hasParameters}}
 * @param params {{interfaceName}}Request
{{/if}}
 * @returns Promise<{{interfaceName}}Response>
 */
export interface {{interfaceName}}Request {
{{#if hasParameters}}
{{#each parameters}}
  /** @description {{description}} */
  {{name}}{{#unless required}}?{{/unless}}: {{{type}}};
{{/each}}
{{/if}}
}

/**
 * @description {{description}} 的返回数据类型
 */
export interface {{interfaceName}}Response {
{{#if hasResponse}}
{{#each responseProperties}}
  /** @description {{description}} */
  {{name}}: {{{type}}};
{{/each}}
{{/if}}
}

/**
 * @description {{description}}
 * @param params {{interfaceName}}Request
 * @returns Promise<{{interfaceName}}Response>
 */
export async function {{functionName}}(params: {{interfaceName}}Request): Promise<{{interfaceName}}Response> {
  {{> functionBody}}
}
`;
}

/**
 * 完整的接口模板 - 不带注释
 * 包含 Request/Response 类型定义和请求方法
 */
export function getInterfaceTemplateWithoutComment(): string {
  return `export interface {{interfaceName}}Request {
{{#if hasParameters}}
{{#each parameters}}
  {{name}}{{#unless required}}?{{/unless}}: {{{type}}};
{{/each}}
{{/if}}
}

export interface {{interfaceName}}Response {
{{#if hasResponse}}
{{#each responseProperties}}
  {{name}}: {{{type}}};
{{/each}}
{{/if}}
}

export async function {{functionName}}(params: {{interfaceName}}Request): Promise<{{interfaceName}}Response> {
  {{> functionBody}}
}
`;
}

// ==================== API Only 模版 ====================

/**
 * API Only 模式的接口模板 - 带注释
 * 只生成请求方法，不包含类型定义
 */
export function getApiOnlyTemplateWithComment(): string {
  return `/**
 * @description {{description}}
 * @param params {{interfaceName}}Request
 * @returns Promise<{{interfaceName}}Response>
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
}

/**
 * API Only 模式的接口模板 - 不带注释
 * 只生成请求方法，不包含类型定义
 */
export function getApiOnlyTemplateWithoutComment(): string {
  return `export async function {{functionName}}(
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
}

// ==================== 类型模版 ====================

/**
 * 类型模板 - 带注释
 */
export function getTypeTemplateWithComment(): string {
  return `/**
 * @description {{description}}
 */
export interface {{typeName}} {
{{#each properties}}
  /** @description {{description}} */
  {{name}}{{#unless required}}?{{/unless}}: {{{type}}};
{{/each}}
}
`;
}

/**
 * 类型模板 - 不带注释
 */
export function getTypeTemplateWithoutComment(): string {
  return `export interface {{typeName}} {
{{#each properties}}
  {{name}}{{#unless required}}?{{/unless}}: {{{type}}};
{{/each}}
}
`;
}

// ==================== TypesOnly 模版 ====================

/**
 * TypesOnly 模式的接口模板 - 带注释
 * 只生成 Request/Response 类型定义，不生成请求方法
 */
export function getTypesOnlyTemplateWithComment(): string {
  return `/**
 * @description {{description}}
{{#if hasParameters}}
 * @param params {{interfaceName}}Request
{{/if}}
 * @returns Promise<{{interfaceName}}Response>
 */
export interface {{interfaceName}}Request {
{{#if hasParameters}}
{{#each parameters}}
  /** @description {{description}} */
  {{name}}{{#unless required}}?{{/unless}}: {{{type}}};
{{/each}}
{{/if}}
}

/**
 * @description {{description}} 的返回数据类型
 */
export interface {{interfaceName}}Response {
{{#if hasResponse}}
{{#each responseProperties}}
  /** @description {{description}} */
  {{name}}: {{{type}}};
{{/each}}
{{/if}}
}
`;
}

/**
 * TypesOnly 模式的接口模板 - 不带注释
 * 只生成 Request/Response 类型定义，不生成请求方法
 */
export function getTypesOnlyTemplateWithoutComment(): string {
  return `export interface {{interfaceName}}Request {
{{#if hasParameters}}
{{#each parameters}}
  {{name}}{{#unless required}}?{{/unless}}: {{{type}}};
{{/each}}
{{/if}}
}

export interface {{interfaceName}}Response {
{{#if hasResponse}}
{{#each responseProperties}}
  {{name}}: {{{type}}};
{{/each}}
{{/if}}
}
`;
}

/**
 * 根据配置获取 TypesOnly 模板
 */
export function getTypesOnlyTemplateByConfig(comment: boolean): string {
  return comment ? getTypesOnlyTemplateWithComment() : getTypesOnlyTemplateWithoutComment();
}

// ==================== 向后兼容的接口 ====================

/**
 * @deprecated 使用 getInterfaceTemplateWithComment 或 getInterfaceTemplateWithoutComment
 * 获取完整的接口模板（根据 comment 配置）
 */
export function getInterfaceTemplate(): string {
  return getInterfaceTemplateWithComment();
}

/**
 * @deprecated 使用 getApiOnlyTemplateWithComment 或 getApiOnlyTemplateWithoutComment
 * 获取 API Only 模式的接口模板（根据 comment 配置）
 */
export function getApiOnlyTemplate(): string {
  return getApiOnlyTemplateWithComment();
}

/**
 * @deprecated 使用 getTypeTemplateWithComment 或 getTypeTemplateWithoutComment
 * 获取类型模板（根据 comment 配置）
 */
export function getTypeTemplate(): string {
  return getTypeTemplateWithComment();
}

// ==================== 新的获取模板方法 ====================

/**
 * 根据配置获取接口模板
 */
export function getInterfaceTemplateByConfig(comment: boolean): string {
  return comment ? getInterfaceTemplateWithComment() : getInterfaceTemplateWithoutComment();
}

/**
 * 根据配置获取 API Only 模板
 */
export function getApiOnlyTemplateByConfig(comment: boolean): string {
  return comment ? getApiOnlyTemplateWithComment() : getApiOnlyTemplateWithoutComment();
}

/**
 * 根据配置获取类型模板
 */
export function getTypeTemplateByConfig(comment: boolean): string {
  return comment ? getTypeTemplateWithComment() : getTypeTemplateWithoutComment();
}

// 简单的模板函数，用于处理基本的 Handlebars 语法（向后兼容）
export function compileTemplate(template: string): (data: any) => string {
  // 检查缓存
  if (templateCache.has(template)) {
    if (process.env.DEBUG) {
      consola.debug('模板缓存命中');
    }
    return templateCache.get(template)!;
  }

  // 确保注册了所有的辅助函数和 partials
  registerTemplateHelpers();
  registerTemplatePartials();

  // 编译模板并存入缓存
  const compiledTemplate = Handlebars.compile(template);
  templateCache.set(template, compiledTemplate);

  if (process.env.DEBUG) {
    consola.debug(`模板已编译并缓存，当前缓存数量：${templateCache.size}`);
  }

  return compiledTemplate;
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

/**
 * 生成接口函数内容
 * 根据 typesOnly、apiOnly、comment 配置选择合适的模板
 */
export function generateInterfaceFunction(interfaceInfo: any, config: any): string {
  // 根据 typesOnly、apiOnly 和 comment 配置选择模板
  let template: string;
  const comment = config.comment !== false;

  if (config.typesOnly) {
    // TypesOnly 模式：只生成类型定义，不生成请求方法
    template = getTypesOnlyTemplateByConfig(comment);
  } else if (config.apiOnly) {
    // API Only 模式：只生成请求方法，不包含类型定义
    template = getApiOnlyTemplateByConfig(comment);
  } else {
    // 完整模式：生成类型定义和请求方法
    template = getInterfaceTemplateByConfig(comment);
  }

  // 使用缓存的 compileTemplate 函数
  const compiledTemplate = compileTemplate(template);

  const result = compiledTemplate({
    ...interfaceInfo,
    requestFunctionName: config.requestFunctionName || 'request',
    requestMethodsObjectName: config.requestMethodsObjectName || 'requestMethods',
    requestMethodStyle: config.requestMethodStyle,
  });

  return result;
}

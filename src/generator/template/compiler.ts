/**
 * @description 模板编译器模块
 * 提供模板字符串定义和编译功能
 * 注意：此文件包含大量模板字符串，行数超过 360 行是预期的
 */

import Handlebars from 'handlebars';
import { RequestMethodStyle } from '../../types';
import consola from 'consola';
import {
  getTemplateFromCache,
  isTemplateCached,
  setTemplateCache,
  templateCache,
} from './templateCache';
import { registerTemplateHelpers } from './templateHelpers';
import { registerTemplatePartials } from './templatePartials';

/**
 * @description 预编译方法映射 - 性能优化
 * 生成 METHOD_MAP 常量，避免运行时字符串操作
 * @param requestMethodsObjectName 请求方法对象名称（默认: 'requestMethods'）
 * @returns METHOD_MAP 常量代码字符串
 *
 * @example
 * ```typescript
 * const code = generatePrecompiledMethodMap('requestMethods');
 * console.log(code);
 * // 输出:
 * // const METHOD_MAP = {
 * //   GET: requestMethods.get,
 * //   POST: requestMethods.post,
 * //   ...
 * // } as const;
 * ```
 */
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
 * @description 完整的接口模板 - 带注释
 * 包含 Request/Response 类型定义和请求方法
 * @returns 模板字符串
 *
 * @example
 * ```typescript
 * const template = getInterfaceTemplateWithComment();
 * const compiled = Handlebars.compile(template);
 * const result = compiled({ ... });
 * ```
 */
export function getInterfaceTemplateWithComment(): string {
  return `/**
 * @description {{description}}
 {{#if hasParameters}}
 * @param params {{requestTypeName}}
 {{/if}}
 * @returns Promise<{{responseTypeName}}>
 */
export interface {{requestTypeName}} {
 {{#if hasParameters}}
 {{#each parameters}}
   /** @description {{description}} */
   {{{name}}}{{#unless required}}?{{/unless}}: {{{type}}};
 {{/each}}
 {{/if}}
}

/**
 * @description {{description}} 的返回数据类型
 */
export interface {{responseTypeName}} {
 {{#if hasResponse}}
 {{#each responseProperties}}
   /** @description {{description}} */
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
   {{> functionBody}}
}
`;
}

/**
 * @description 完整的接口模板 - 不带注释
 * 包含 Request/Response 类型定义和请求方法
 * @returns 模板字符串
 */
export function getInterfaceTemplateWithoutComment(): string {
  return `export interface {{requestTypeName}} {
 {{#if hasParameters}}
 {{#each parameters}}
   {{{name}}}{{#unless required}}?{{/unless}}: {{{type}}};
 {{/each}}
 {{/if}}
}

export interface {{responseTypeName}} {
 {{#if hasResponse}}
 {{#each responseProperties}}
   {{{name}}}: {{{type}}};
 {{/each}}
 {{/if}}
}

export async function {{functionName}}({{requestParamName}}: {{requestTypeName}}): Promise<{{responseTypeName}}> {
   {{> functionBody}}
}
`;
}

// ==================== API Only 模版 ====================

/**
 * @description API Only 模式的接口模板 - 带注释
 * 只生成请求方法，不包含类型定义
 * @returns 模板字符串
 */
export function getApiOnlyTemplateWithComment(): string {
  return `/**
 * @description {{description}}
 * @param {{requestParamName}} {{requestTypeName}}
 * @returns Promise<{{responseTypeName}}>
 */
export async function {{functionName}}(
   {{requestParamName}}
) {
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
}

/**
 * @description API Only 模式的接口模板 - 不带注释
 * 只生成请求方法，不包含类型定义
 * @returns 模板字符串
 */
export function getApiOnlyTemplateWithoutComment(): string {
  return `export async function {{functionName}}(
   {{requestParamName}}
) {
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
}

// ==================== Zod 模板 ====================

/**
 * @description Zod 接口模板 - 带注释
 * 导入并使用 Zod Schema 作为类型
 * @returns 模板字符串
 */
export function getZodInterfaceTemplateWithComment(): string {
  return `/**
 * @description {{description}}
 * @param {{requestParamName}} {{requestTypeName}}
 * @returns Promise<{{responseTypeName}}>
 */
export async function {{functionName}}(
   {{requestParamName}}: {{requestTypeName}}
): Promise<{{responseTypeName}}> {
   const config = {
     url: '{{path}}',
     method: '{{method}}',
 {{#if hasParameters}}
 {{#if hasBody}}
     data: {{requestParamName}},
 {{else}}
     params: {{requestParamName}},
 {{/if}}
 {{/if}}
   };
   return {{requestFunctionName}}(config);
}
`;
}

/**
 * @description Zod 接口模板 - 不带注释
 * 导入并使用 Zod Schema 作为类型
 * @returns 模板字符串
 */
export function getZodInterfaceTemplateWithoutComment(): string {
  return `export async function {{functionName}}(
   {{requestParamName}}: {{requestTypeName}}
): Promise<{{responseTypeName}}> {
   const config = {
     url: '{{path}}',
     method: '{{method}}',
 {{#if hasParameters}}
 {{#if hasBody}}
     data: {{requestParamName}},
 {{else}}
     params: {{requestParamName}},
 {{/if}}
 {{/if}}
   };
   return {{requestFunctionName}}(config);
}
`;
}

/**
 * @description Zod ApiOnly 模式的接口模板 - 带注释
 * 只生成请求方法，不生成类型注解
 * @returns 模板字符串
 */
export function getZodApiOnlyTemplateWithComment(): string {
  return `/**
 * @description {{description}}
 * @param {{requestParamName}} {{requestTypeName}}
 * @returns Promise<{{responseTypeName}}>
 */
export async function {{functionName}}(
   {{requestParamName}}
) {
   const config = {
     url: '{{path}}',
     method: '{{method}}',
 {{#if hasParameters}}
 {{#if hasBody}}
     data: {{requestParamName}},
 {{else}}
     params: {{requestParamName}},
 {{/if}}
 {{/if}}
   };
   return {{requestFunctionName}}(config);
}
`;
}

/**
 * @description Zod ApiOnly 模式的接口模板 - 不带注释
 * 只生成请求方法，不生成类型注解
 * @returns 模板字符串
 */
export function getZodApiOnlyTemplateWithoutComment(): string {
  return `export async function {{functionName}}(
   {{requestParamName}}
) {
   const config = {
     url: '{{path}}',
     method: '{{method}}',
 {{#if hasParameters}}
 {{#if hasBody}}
     data: {{requestParamName}},
 {{else}}
     params: {{requestParamName}},
 {{/if}}
 {{/if}}
   };
   return {{requestFunctionName}}(config);
}
`;
}

/**
 * @description 根据配置获取 Zod 接口模板
 * @param comment 是否包含注释
 * @returns 模板字符串
 */
export function getZodInterfaceTemplateByConfig(comment: boolean): string {
  return comment ? getZodInterfaceTemplateWithComment() : getZodInterfaceTemplateWithoutComment();
}

/**
 * @description Zod TypesOnly 模式的接口模板 - 带注释
 * 只生成 Schema 定义，不生成请求方法
 * @returns 模板字符串
 */
export function getZodTypesOnlyTemplateWithComment(): string {
  return `import { z } from 'zod';

/**
 * @description {{description}}
 {{#if hasParameters}}
 * @param params {{requestTypeName}}
 {{/if}}
 * @returns Promise<{{responseTypeName}}>
 */
export const {{requestTypeName}}Schema = {{{requestSchema}}};

export const {{responseTypeName}}Schema = {{{responseSchema}}};

export type {{requestTypeName}} = z.infer<typeof {{requestTypeName}}Schema>;
export type {{responseTypeName}} = z.infer<typeof {{responseTypeName}}Schema>;
`;
}

/**
 * @description Zod TypesOnly 模式的接口模板 - 不带注释
 * 只生成 Schema 定义，不生成请求方法
 * @returns 模板字符串
 */
export function getZodTypesOnlyTemplateWithoutComment(): string {
  return `import { z } from 'zod';

export const {{requestTypeName}}Schema = {{{requestSchema}}};

export const {{responseTypeName}}Schema = {{{responseSchema}}};

export type {{requestTypeName}} = z.infer<typeof {{requestTypeName}}Schema>;
export type {{responseTypeName}} = z.infer<typeof {{responseTypeName}}Schema>;
`;
}

/**
 * @description 根据配置获取 Zod TypesOnly 模板
 * @param comment 是否包含注释
 * @returns 模板字符串
 */
export function getZodTypesOnlyTemplateByConfig(comment: boolean): string {
  return comment ? getZodTypesOnlyTemplateWithComment() : getZodTypesOnlyTemplateWithoutComment();
}

// ==================== 类型模版 ====================

/**
 * @description 类型模板 - 带注释
 * @returns 模板字符串
 */
export function getTypeTemplateWithComment(): string {
  return `/**
 * @description {{description}}
 */
export interface {{typeName}} {
 {{#each properties}}
   /** @description {{description}} */
   {{{name}}}{{#unless required}}?{{/unless}}: {{{type}}};
 {{/each}}
}
`;
}

/**
 * @description 类型模板 - 不带注释
 * @returns 模板字符串
 */
export function getTypeTemplateWithoutComment(): string {
  return `export interface {{typeName}} {
 {{#each properties}}
   {{{name}}}{{#unless required}}?{{/unless}}: {{{type}}};
 {{/each}}
}
`;
}

// ==================== TypesOnly 模版 ====================

/**
 * @description TypesOnly 模式的接口模板 - 带注释
 * 只生成 Request/Response 类型定义，不生成请求方法
 * @returns 模板字符串
 */
export function getTypesOnlyTemplateWithComment(): string {
  return `/**
 * @description {{description}}
 {{#if hasParameters}}
 * @param params {{requestTypeName}}
 {{/if}}
 * @returns Promise<{{responseTypeName}}>
 */
export interface {{requestTypeName}} {
 {{#if hasParameters}}
 {{#each parameters}}
   /** @description {{description}} */
   {{{name}}}{{#unless required}}?{{/unless}}: {{{type}}};
 {{/each}}
 {{/if}}
}

/**
 * @description {{description}} 的返回数据类型
 */
export interface {{responseTypeName}} {
 {{#if hasResponse}}
 {{#each responseProperties}}
   /** @description {{description}} */
   {{{name}}}: {{{type}}};
 {{/each}}
 {{/if}}
}
`;
}

/**
 * @description TypesOnly 模式的接口模板 - 不带注释
 * 只生成 Request/Response 类型定义，不生成请求方法
 * @returns 模板字符串
 */
export function getTypesOnlyTemplateWithoutComment(): string {
  return `export interface {{requestTypeName}} {
 {{#if hasParameters}}
 {{#each parameters}}
   {{{name}}}{{#unless required}}?{{/unless}}: {{{type}}};
 {{/each}}
 {{/if}}
}

export interface {{responseTypeName}} {
 {{#if hasResponse}}
 {{#each responseProperties}}
   {{{name}}}: {{{type}}};
 {{/each}}
 {{/if}}
}
`;
}

/**
 * @description 根据配置获取 TypesOnly 模板
 * @param comment 是否包含注释
 * @returns 模板字符串
 */
export function getTypesOnlyTemplateByConfig(comment: boolean): string {
  return comment ? getTypesOnlyTemplateWithComment() : getTypesOnlyTemplateWithoutComment();
}

// ==================== 向后兼容的接口 ====================

/**
 * @deprecated 使用 getInterfaceTemplateWithComment 或 getInterfaceTemplateWithoutComment
 * @description 获取完整的接口模板（向后兼容，默认带注释）
 * @returns 模板字符串
 */
export function getInterfaceTemplate(): string {
  return getInterfaceTemplateWithComment();
}

/**
 * @deprecated 使用 getApiOnlyTemplateWithComment 或 getApiOnlyTemplateWithoutComment
 * @description 获取 API Only 模式的接口模板（向后兼容，默认带注释）
 * @returns 模板字符串
 */
export function getApiOnlyTemplate(): string {
  return getApiOnlyTemplateWithComment();
}

/**
 * @deprecated 使用 getTypeTemplateWithComment 或 getTypeTemplateWithoutComment
 * @description 获取类型模板（向后兼容，默认带注释）
 * @returns 模板字符串
 */
export function getTypeTemplate(): string {
  return getTypeTemplateWithComment();
}

// ==================== 新的获取模板方法 ====================

/**
 * @description 根据配置获取接口模板
 * @param comment 是否包含注释
 * @returns 模板字符串
 */
export function getInterfaceTemplateByConfig(comment: boolean): string {
  return comment ? getInterfaceTemplateWithComment() : getInterfaceTemplateWithoutComment();
}

/**
 * @description 根据配置获取 API Only 模板
 * @param comment 是否包含注释
 * @returns 模板字符串
 */
export function getApiOnlyTemplateByConfig(comment: boolean): string {
  return comment ? getApiOnlyTemplateWithComment() : getApiOnlyTemplateWithoutComment();
}

/**
 * @description 根据配置获取类型模板
 * @param comment 是否包含注释
 * @returns 模板字符串
 */
export function getTypeTemplateByConfig(comment: boolean): string {
  return comment ? getTypeTemplateWithComment() : getTypeTemplateWithoutComment();
}

/**
 * @description 编译 Handlebars 模板
 * 带缓存支持，提高重复编译相同模板的性能
 * @param template 模板字符串
 * @returns 编译后的模板函数
 *
 * @example
 * ```typescript
 * const template = 'Hello {{name}}!';
 * const compiled = compileTemplate(template);
 * console.log(compiled({ name: 'World' })); // 输出: Hello World!
 * ```
 */
export function compileTemplate(template: string): (data: any) => string {
  if (isTemplateCached(template)) {
    if (process.env.DEBUG) {
      consola.debug('模板缓存命中');
    }
    return getTemplateFromCache(template)!;
  }

  registerTemplateHelpers();
  registerTemplatePartials();

  const compiledTemplate = Handlebars.compile(template);
  setTemplateCache(template, compiledTemplate);

  if (process.env.DEBUG) {
    consola.debug(`模板已编译并缓存，当前缓存数量：${templateCache.size}`);
  }

  return compiledTemplate;
}

/**
 * @description 生成请求文件内容
 * @param config 配置对象
 * @returns 生成的请求文件代码字符串
 */
export function generateRequestFile(config: any): string {
  registerTemplateHelpers();
  registerTemplatePartials();

  const requestFunctionName = config.requestFunctionName || 'request';
  const requestMethodsObjectName = config.requestMethodsObjectName || 'requestMethods';

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
  template += `export async function ${requestFunctionName}<T = any>(config: RequestConfig): Promise<T> {\n`;
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
 * @description 生成接口函数内容
 * 根据 generateApi、generateTypes、typesFormat 和 comment 配置选择合适的模板
 * @param interfaceInfo 接口信息对象
 * @param config 配置对象
 * @returns 生成的接口代码字符串
 */
export function generateInterfaceFunction(interfaceInfo: any, config: any): string {
  let template: string;
  const comment = config.comment !== false;

  const shouldGenerateTypes = config.generateTypes && config.typesFormat === 'typescript';
  const shouldGenerateApi = config.generateApi;
  const isZodMode = config.typesFormat === 'zod';
  const isZodGenerateTypes = config.generateTypes && isZodMode;

  if (isZodMode && shouldGenerateApi && isZodGenerateTypes) {
    template = getZodInterfaceTemplateByConfig(comment);
  } else if (isZodMode && isZodGenerateTypes && !shouldGenerateApi) {
    template = getZodTypesOnlyTemplateByConfig(comment);
  } else if (isZodMode && shouldGenerateApi && !isZodGenerateTypes) {
    template = getZodApiOnlyTemplateByConfig(comment);
  } else if (shouldGenerateTypes && !shouldGenerateApi) {
    template = getTypesOnlyTemplateByConfig(comment);
  } else if (shouldGenerateApi && !isZodMode && !shouldGenerateTypes) {
    template = getApiOnlyTemplateByConfig(comment);
  } else if (shouldGenerateApi && shouldGenerateTypes && !isZodMode) {
    template = getInterfaceTemplateByConfig(comment);
  } else {
    template = getApiOnlyTemplateByConfig(comment);
  }

  const compiledTemplate = compileTemplate(template);

  const result = compiledTemplate({
    ...interfaceInfo,
    requestFunctionName: config.requestFunctionName || 'request',
    requestMethodsObjectName: config.requestMethodsObjectName || 'requestMethods',
    requestMethodStyle: config.requestMethodStyle,
  });

  return result;
}

/**
 * @description 根据配置获取 Zod ApiOnly 模板
 * @param comment 是否包含注释
 * @returns 模板字符串
 */
export function getZodApiOnlyTemplateByConfig(comment: boolean): string {
  return comment ? getZodApiOnlyTemplateWithComment() : getZodApiOnlyTemplateWithoutComment();
}

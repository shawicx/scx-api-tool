/**
 * @description 模板字符串定义
 * 提供所有 Handlebars 模板的纯字符串定义
 */

/**
 * @description 预编译方法映射 - 性能优化
 * 生成 METHOD_MAP 常量，避免运行时字符串操作
 * @param requestMethodsObjectName 请求方法对象名称（默认: 'requestMethods'）
 * @returns METHOD_MAP 常量代码字符串
 */
export function generatePrecompiledMethodMap(requestMethodsObjectName = 'requestMethods'): string {
  return `
// 预编译的方法映射，避免运行时字符串操作
const METHOD_MAP = {
  GET: ${requestMethodsObjectName}.get,
  POST: ${requestMethodsObjectName}.post,
  PUT: ${requestMethodsObjectName}.put,
  DELETE: ${requestMethodsObjectName}.delete,
  PATCH: ${requestMethodsObjectName}.patch,
  HEAD: ${requestMethodsObjectName}.head,
  OPTIONS: ${requestMethodsObjectName}.options,
} as const;
`;
}

// ==================== 接口模版 ====================

/** 完整的接口模板 - 带注释 */
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

/** 完整的接口模板 - 不带注释 */
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

/** API Only 模式的接口模板 - 带注释 */
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

/** API Only 模式的接口模板 - 不带注释 */
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

/** Zod 接口模板 - 带注释 */
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

/** Zod 接口模板 - 不带注释 */
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

/** Zod ApiOnly 模式的接口模板 - 带注释 */
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

/** Zod ApiOnly 模式的接口模板 - 不带注释 */
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

/** 根据配置获取 Zod 接口模板 */
export function getZodInterfaceTemplateByConfig(comment: boolean): string {
  return comment ? getZodInterfaceTemplateWithComment() : getZodInterfaceTemplateWithoutComment();
}

/** Zod TypesOnly 模式的接口模板 - 带注释 */
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

/** Zod TypesOnly 模式的接口模板 - 不带注释 */
export function getZodTypesOnlyTemplateWithoutComment(): string {
  return `import { z } from 'zod';

export const {{requestTypeName}}Schema = {{{requestSchema}}};

export const {{responseTypeName}}Schema = {{{responseSchema}}};

export type {{requestTypeName}} = z.infer<typeof {{requestTypeName}}Schema>;
export type {{responseTypeName}} = z.infer<typeof {{responseTypeName}}Schema>;
`;
}

/** 根据配置获取 Zod TypesOnly 模板 */
export function getZodTypesOnlyTemplateByConfig(comment: boolean): string {
  return comment ? getZodTypesOnlyTemplateWithComment() : getZodTypesOnlyTemplateWithoutComment();
}

// ==================== 类型模版 ====================

/** 类型模板 - 带注释 */
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

/** 类型模板 - 不带注释 */
export function getTypeTemplateWithoutComment(): string {
  return `export interface {{typeName}} {
 {{#each properties}}
   {{{name}}}{{#unless required}}?{{/unless}}: {{{type}}};
 {{/each}}
}
`;
}

// ==================== TypesOnly 模版 ====================

/** TypesOnly 模式的接口模板 - 带注释 */
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

/** TypesOnly 模式的接口模板 - 不带注释 */
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

/** 根据配置获取 TypesOnly 模板 */
export function getTypesOnlyTemplateByConfig(comment: boolean): string {
  return comment ? getTypesOnlyTemplateWithComment() : getTypesOnlyTemplateWithoutComment();
}

// ==================== ByConfig 便捷方法 ====================

/** 根据配置获取接口模板 */
export function getInterfaceTemplateByConfig(comment: boolean): string {
  return comment ? getInterfaceTemplateWithComment() : getInterfaceTemplateWithoutComment();
}

/** 根据配置获取 API Only 模板 */
export function getApiOnlyTemplateByConfig(comment: boolean): string {
  return comment ? getApiOnlyTemplateWithComment() : getApiOnlyTemplateWithoutComment();
}

/** 根据配置获取类型模板 */
export function getTypeTemplateByConfig(comment: boolean): string {
  return comment ? getTypeTemplateWithComment() : getTypeTemplateWithoutComment();
}

/** 根据配置获取 Zod ApiOnly 模板 */
export function getZodApiOnlyTemplateByConfig(comment: boolean): string {
  return comment ? getZodApiOnlyTemplateWithComment() : getZodApiOnlyTemplateWithoutComment();
}

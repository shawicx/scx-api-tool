import Handlebars from 'handlebars';

/**
 * @description 注册 Handlebars partials
 * Partials 是可重用的模板片段
 *
 * @example
 * ```typescript
 * registerTemplatePartials();
 * // 现在可以在模板中使用 {{> functionBody}}、{{> importStatement}} 等 partials
 * ```
 */
export function registerTemplatePartials(): void {
  /**
   * @description 函数体 partial
   * 根据 HTTP 方法和参数生成函数体代码
   */
  Handlebars.registerPartial(
    'functionBody',
    `
{{#if (eq requestMethodStyle 'method-specific')}}
  {{#if (eq method 'GET')}}
    {{#if hasParameters}}
  // GET 请求 - 只有查询参数
  return {{requestMethodsObjectName}}.get<{{responseTypeName}}>('{{path}}', {{requestParamName}});
    {{else}}
  // GET 请求 - 没有参数
  return {{requestMethodsObjectName}}.get<{{responseTypeName}}>('{{path}}');
    {{/if}}
  {{/if}}
  {{#if (eq method 'DELETE')}}
    {{#if hasParameters}}
  // DELETE 请求 - 只有查询参数
  return {{requestMethodsObjectName}}.delete<{{responseTypeName}}>('{{path}}', {{requestParamName}});
    {{else}}
  // DELETE 请求 - 没有参数
  return {{requestMethodsObjectName}}.delete<{{responseTypeName}}>('{{path}}');
    {{/if}}
  {{/if}}
  {{#if (eq method 'HEAD')}}
  // HEAD 请求 - 没有请求体
  return {{requestMethodsObjectName}}.head<{{responseTypeName}}>('{{path}}'{{#if hasParameters}}, {{requestParamName}}{{/if}});
  {{/if}}
  {{#if (eq method 'OPTIONS')}}
  // OPTIONS 请求 - 没有请求体
  return {{requestMethodsObjectName}}.options<{{responseTypeName}}>('{{path}}'{{#if hasParameters}}, {{requestParamName}}{{/if}});
  {{/if}}
  {{#if (eq method 'POST')}}
    {{#if hasParameters}}
  // POST 请求 - 有请求体参数
  return {{requestMethodsObjectName}}.post<{{responseTypeName}}>('{{path}}', {{requestParamName}});
    {{else}}
  // POST 请求 - 没有参数
  return {{requestMethodsObjectName}}.post<{{responseTypeName}}>('{{path}}');
    {{/if}}
  {{/if}}
  {{#if (eq method 'PUT')}}
    {{#if hasParameters}}
  // PUT 请求 - 有请求体参数
  return {{requestMethodsObjectName}}.put<{{responseTypeName}}>('{{path}}', {{requestParamName}});
    {{else}}
  // PUT 请求 - 没有参数
  return {{requestMethodsObjectName}}.put<{{responseTypeName}}>('{{path}}');
    {{/if}}
  {{/if}}
  {{#if (eq method 'PATCH')}}
    {{#if hasParameters}}
  // PATCH 请求 - 有请求体参数
  return {{requestMethodsObjectName}}.patch<{{responseTypeName}}>('{{path}}', {{requestParamName}});
    {{else}}
  // PATCH 请求 - 没有参数
  return {{requestMethodsObjectName}}.patch<{{responseTypeName}}>('{{path}}');
    {{/if}}
  {{/if}}
 {{else}}
   const config: RequestConfig = {
     url: '{{path}}',
     method: '{{method}}',
     {{#if hasBody}}data: {{requestParamName}},{{/if}}{{#unless hasBody}}{{#if hasParameters}}{{requestParamName}},{{/if}}{{/unless}}
   };
   return {{requestFunctionName}}<{{responseTypeName}}>(config);
 {{/if}}
`,
  );

  /**
   * @description 导入语句 partial
   * 生成通用的导入语句
   */
  Handlebars.registerPartial(
    'importStatement',
    `
import type { AxiosRequestConfig } from 'axios';
import axios from 'axios';
import consola from 'consola';
`,
  );
}

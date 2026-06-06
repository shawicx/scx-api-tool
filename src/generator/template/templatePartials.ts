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
  return {{requestMethodsObjectName}}.get<{{responseTypeName}}>('{{path}}', {{requestParamName}});
    {{else}}
  return {{requestMethodsObjectName}}.get<{{responseTypeName}}>('{{path}}');
    {{/if}}
  {{/if}}
  {{#if (eq method 'DELETE')}}
    {{#if hasParameters}}
  return {{requestMethodsObjectName}}.delete<{{responseTypeName}}>('{{path}}', {{requestParamName}});
    {{else}}
  return {{requestMethodsObjectName}}.delete<{{responseTypeName}}>('{{path}}');
    {{/if}}
  {{/if}}
  {{#if (eq method 'HEAD')}}
  return {{requestMethodsObjectName}}.head<{{responseTypeName}}>('{{path}}'{{#if hasParameters}}, {{requestParamName}}{{/if}});
  {{/if}}
  {{#if (eq method 'OPTIONS')}}
  return {{requestMethodsObjectName}}.options<{{responseTypeName}}>('{{path}}'{{#if hasParameters}}, {{requestParamName}}{{/if}});
  {{/if}}
  {{#if (eq method 'POST')}}
    {{#if isFormData}}
  const formData = new FormData();
  Object.entries({{requestParamName}}).forEach(([key, value]) => {
    if (value instanceof File || value instanceof Blob) {
      formData.append(key, value);
    } else {
      formData.append(key, String(value));
    }
  });
  return {{requestMethodsObjectName}}.post<{{responseTypeName}}>('{{path}}', formData);
    {{else if hasParameters}}
  return {{requestMethodsObjectName}}.post<{{responseTypeName}}>('{{path}}', {{requestParamName}});
    {{else}}
  return {{requestMethodsObjectName}}.post<{{responseTypeName}}>('{{path}}');
    {{/if}}
  {{/if}}
  {{#if (eq method 'PUT')}}
    {{#if isFormData}}
  const formData = new FormData();
  Object.entries({{requestParamName}}).forEach(([key, value]) => {
    if (value instanceof File || value instanceof Blob) {
      formData.append(key, value);
    } else {
      formData.append(key, String(value));
    }
  });
  return {{requestMethodsObjectName}}.put<{{responseTypeName}}>('{{path}}', formData);
    {{else if hasParameters}}
  return {{requestMethodsObjectName}}.put<{{responseTypeName}}>('{{path}}', {{requestParamName}});
    {{else}}
  return {{requestMethodsObjectName}}.put<{{responseTypeName}}>('{{path}}');
    {{/if}}
  {{/if}}
  {{#if (eq method 'PATCH')}}
    {{#if isFormData}}
  const formData = new FormData();
  Object.entries({{requestParamName}}).forEach(([key, value]) => {
    if (value instanceof File || value instanceof Blob) {
      formData.append(key, value);
    } else {
      formData.append(key, String(value));
    }
  });
  return {{requestMethodsObjectName}}.patch<{{responseTypeName}}>('{{path}}', formData);
    {{else if hasParameters}}
  return {{requestMethodsObjectName}}.patch<{{responseTypeName}}>('{{path}}', {{requestParamName}});
    {{else}}
  return {{requestMethodsObjectName}}.patch<{{responseTypeName}}>('{{path}}');
    {{/if}}
  {{/if}}
 {{else}}
   const config: RequestConfig = {
     url: '{{path}}',
     method: '{{method}}',
     {{#if isFormData}}
     data: (() => { const fd = new FormData(); Object.entries({{requestParamName}}).forEach(([k, v]) => { fd.append(k, v instanceof File || v instanceof Blob ? v : String(v)); }); return fd; })(),
     {{else}}
     {{#if hasBody}}data: {{requestParamName}},{{/if}}{{#unless hasBody}}{{#if hasParameters}}{{requestParamName}},{{/if}}{{/unless}}
     {{/if}}
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

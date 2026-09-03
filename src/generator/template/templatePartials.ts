import Handlebars from 'handlebars';
import { getFormDataInlineExpression, getFormDataStatements } from './formDataBody';

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
  return {{requestMethodsObjectName}}.get<{{responseTypeName}}>({{{path}}}, {{requestParamName}});
    {{else}}
  return {{requestMethodsObjectName}}.get<{{responseTypeName}}>({{{path}}});
    {{/if}}
  {{/if}}
  {{#if (eq method 'DELETE')}}
    {{#if hasParameters}}
  return {{requestMethodsObjectName}}.delete<{{responseTypeName}}>({{{path}}}, {{requestParamName}});
    {{else}}
  return {{requestMethodsObjectName}}.delete<{{responseTypeName}}>({{{path}}});
    {{/if}}
  {{/if}}
  {{#if (eq method 'HEAD')}}
  return {{requestMethodsObjectName}}.head<{{responseTypeName}}>({{{path}}}{{#if hasParameters}}, {{requestParamName}}{{/if}});
  {{/if}}
  {{#if (eq method 'OPTIONS')}}
  return {{requestMethodsObjectName}}.options<{{responseTypeName}}>({{{path}}}{{#if hasParameters}}, {{requestParamName}}{{/if}});
  {{/if}}
  {{#if (eq method 'POST')}}
    {{#if isFormData}}
    {{#if hasQueryParams}}
  const { {{{queryParamsList}}}, ...{{requestBodyVarName}} } = {{requestParamName}};
    {{/if}}
${getFormDataStatements('{{requestBodyVarName}}')}
  return {{requestMethodsObjectName}}.post<{{responseTypeName}}>({{{path}}}, formData{{#if hasQueryParams}}, { {{{queryParamsList}}} }{{/if}});
    {{else if hasParameters}}
      {{#if hasQueryParams}}
  const { {{{queryParamsList}}}, ...{{requestBodyVarName}} } = {{requestParamName}};
  return {{requestMethodsObjectName}}.post<{{responseTypeName}}>({{{path}}}, {{requestBodyVarName}}, { {{{queryParamsList}}} });
      {{else}}
  return {{requestMethodsObjectName}}.post<{{responseTypeName}}>({{{path}}}, {{requestParamName}});
      {{/if}}
    {{else}}
  return {{requestMethodsObjectName}}.post<{{responseTypeName}}>({{{path}}});
    {{/if}}
  {{/if}}
  {{#if (eq method 'PUT')}}
    {{#if isFormData}}
    {{#if hasQueryParams}}
  const { {{{queryParamsList}}}, ...{{requestBodyVarName}} } = {{requestParamName}};
    {{/if}}
${getFormDataStatements('{{requestBodyVarName}}')}
  return {{requestMethodsObjectName}}.put<{{responseTypeName}}>({{{path}}}, formData{{#if hasQueryParams}}, { {{{queryParamsList}}} }{{/if}});
    {{else if hasParameters}}
      {{#if hasQueryParams}}
  const { {{{queryParamsList}}}, ...{{requestBodyVarName}} } = {{requestParamName}};
  return {{requestMethodsObjectName}}.put<{{responseTypeName}}>({{{path}}}, {{requestBodyVarName}}, { {{{queryParamsList}}} });
      {{else}}
  return {{requestMethodsObjectName}}.put<{{responseTypeName}}>({{{path}}}, {{requestParamName}});
      {{/if}}
    {{else}}
  return {{requestMethodsObjectName}}.put<{{responseTypeName}}>({{{path}}});
    {{/if}}
  {{/if}}
  {{#if (eq method 'PATCH')}}
    {{#if isFormData}}
    {{#if hasQueryParams}}
  const { {{{queryParamsList}}}, ...{{requestBodyVarName}} } = {{requestParamName}};
    {{/if}}
${getFormDataStatements('{{requestBodyVarName}}')}
  return {{requestMethodsObjectName}}.patch<{{responseTypeName}}>({{{path}}}, formData{{#if hasQueryParams}}, { {{{queryParamsList}}} }{{/if}});
    {{else if hasParameters}}
      {{#if hasQueryParams}}
  const { {{{queryParamsList}}}, ...{{requestBodyVarName}} } = {{requestParamName}};
  return {{requestMethodsObjectName}}.patch<{{responseTypeName}}>({{{path}}}, {{requestBodyVarName}}, { {{{queryParamsList}}} });
      {{else}}
  return {{requestMethodsObjectName}}.patch<{{responseTypeName}}>({{{path}}}, {{requestParamName}});
      {{/if}}
    {{else}}
  return {{requestMethodsObjectName}}.patch<{{responseTypeName}}>({{{path}}});
    {{/if}}
  {{/if}}
 {{else}}
   {{#if hasQueryParams}}
 const { {{{queryParamsList}}}, ...{{requestBodyVarName}} } = {{requestParamName}};
   {{/if}}
   const config: RequestConfig = {
     url: {{{path}}},
     method: '{{method}}',
     {{#if isFormData}}
     data: ${getFormDataInlineExpression('{{requestBodyVarName}}')},{{#if hasQueryParams}} params: { {{{queryParamsList}}} },{{/if}}
     {{else}}
     {{#if hasBody}}data: {{requestBodyVarName}},{{#if hasQueryParams}} params: { {{{queryParamsList}}} },{{/if}}{{/if}}{{#unless hasBody}}{{#if hasParameters}}{{requestParamName}},{{/if}}{{/unless}}
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

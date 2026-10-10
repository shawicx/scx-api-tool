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
{{#if destructureStatement}}
 {{{destructureStatement}}}
{{/if}}
{{#if (eq requestMethodStyle 'method-specific')}}
{{#if methodOptionsStatement}}
 {{{methodOptionsStatement}}}
{{/if}}
  return {{{methodCallExpression}}};
{{else}}
  {{{configDeclaration}}}
    ...options,
    url: {{{path}}},
    method: {{{methodExpression}}},
{{#if requestConfigFields}}
{{{requestConfigFields}}}
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

import Handlebars from 'handlebars';
import { HTTP_METHODS } from '../../utils/config';

/**
 * @description 注册 Handlebars 辅助函数
 * 为模板提供额外的功能函数
 *
 * @example
 * ```typescript
 * registerTemplateHelpers();
 * // 现在可以在模板中使用 {{toLowerCase str}}、{{eq a b}} 等辅助函数
 * ```
 */
export function registerTemplateHelpers(): void {
  /**
   * @description 将字符串转换为小写
   * @example {{toLowerCase "Hello World"}} → "hello world"
   */
  Handlebars.registerHelper('toLowerCase', (str: string) => str.toLowerCase());

  /**
   * @description 比较两个值是否相等
   * @example {{eq a b}} → a === b
   */
  Handlebars.registerHelper('eq', (a: any, b: any) => a === b);

  /**
   * @description 将 HTTP 方法转换为中文或统一格式
   * @example {{httpMethod "GET"}} → "获取" 或 "GET"
   */
  Handlebars.registerHelper('httpMethod', (method: string) => {
    return HTTP_METHODS[method as keyof typeof HTTP_METHODS] || method.toLowerCase();
  });

  // 移除了 requestFunctionName 和 requestMethodsObjectName helpers，直接使用数据字段
}

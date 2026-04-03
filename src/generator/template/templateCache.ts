/**
 * @description 模板编译缓存
 * 使用 Map 缓存已编译的 Handlebars 模板以提高性能
 */
const templateCache = new Map<string, HandlebarsTemplateDelegate>();

/**
 * @description 从缓存中获取已编译的模板
 * @param template 模板字符串
 * @returns 缓存的模板函数，如果不存在则返回 undefined
 *
 * @example
 * ```typescript
 * const cached = getTemplateFromCache('{{name}}');
 * if (cached) {
 *   console.log(cached({ name: 'test' }));
 * }
 * ```
 */
export function getTemplateFromCache(template: string): HandlebarsTemplateDelegate | undefined {
  return templateCache.get(template);
}

/**
 * @description 将编译后的模板存入缓存
 * @param template 模板字符串
 * @param compiledTemplate 编译后的模板函数
 *
 * @example
 * ```typescript
 * const compiled = Handlebars.compile('{{name}}');
 * setTemplateCache('{{name}}', compiled);
 * ```
 */
export function setTemplateCache(
  template: string,
  compiledTemplate: HandlebarsTemplateDelegate,
): void {
  templateCache.set(template, compiledTemplate);
}

/**
 * @description 检查模板是否已缓存
 * @param template 模板字符串
 * @returns 是否已缓存
 *
 * @example
 * ```typescript
 * if (isTemplateCached('{{name}}')) {
 *   console.log('模板已缓存');
 * }
 * ```
 */
export function isTemplateCached(template: string): boolean {
  return templateCache.has(template);
}

export { templateCache };

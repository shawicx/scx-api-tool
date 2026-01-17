import consola from 'consola';

/**
 * @description 模板编译缓存
 * 使用 Map 缓存已编译的 Handlebars 模板以提高性能
 */
const templateCache = new Map<string, HandlebarsTemplateDelegate>();

/**
 * @description 获取模板缓存统计信息
 * @returns 包含缓存大小和所有缓存键的对象
 *
 * @example
 * ```typescript
 * const stats = getTemplateCacheStats();
 * console.log(`缓存了 ${stats.size} 个模板`);
 * console.log('缓存键:', stats.keys);
 * ```
 */
export function getTemplateCacheStats(): { size: number; keys: string[] } {
  return {
    size: templateCache.size,
    keys: Array.from(templateCache.keys()),
  };
}

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

/**
 * @description 清空模板缓存
 * 删除所有已缓存的模板
 *
 * @example
 * ```typescript
 * clearTemplateCache();
 * console.log('缓存已清空');
 * ```
 */
export function clearTemplateCache(): void {
  const { size } = getTemplateCacheStats();
  templateCache.clear();
  if (process.env.DEBUG && size > 0) {
    consola.debug(`模板缓存已清空：清理了 ${size} 个模板`);
  }
}

export { templateCache };

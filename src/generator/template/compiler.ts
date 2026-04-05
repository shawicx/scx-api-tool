/**
 * @description 模板编译器
 * 提供 Handlebars 模板编译和缓存功能
 */

import Handlebars from 'handlebars';
import consola from 'consola';
import {
  getTemplateFromCache,
  isTemplateCached,
  setTemplateCache,
  templateCache,
} from './templateCache';
import { registerTemplateHelpers } from './templateHelpers';
import { registerTemplatePartials } from './templatePartials';

/** 标记 helpers 和 partials 是否已注册，避免重复注册 */
let registered = false;

/** 确保 helpers 和 partials 只注册一次 */
export function ensureRegistered(): void {
  if (registered) return;
  registerTemplateHelpers();
  registerTemplatePartials();
  registered = true;
}

/**
 * @description 编译 Handlebars 模板
 * 带缓存支持，提高重复编译相同模板的性能
 * @param template 模板字符串
 * @returns 编译后的模板函数
 */
export function compileTemplate(template: string): HandlebarsTemplateDelegate {
  if (isTemplateCached(template)) {
    if (process.env.DEBUG) {
      consola.debug('模板缓存命中');
    }
    return getTemplateFromCache(template)!;
  }

  ensureRegistered();

  const compiledTemplate = Handlebars.compile(template);
  setTemplateCache(template, compiledTemplate);

  if (process.env.DEBUG) {
    consola.debug(`模板已编译并缓存，当前缓存数量：${templateCache.size}`);
  }

  return compiledTemplate;
}

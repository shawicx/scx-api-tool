/**
 * @description templateCache.ts 单元测试
 */

import { describe, it, expect, afterEach } from 'vitest';
import Handlebars from 'handlebars';
import {
  getTemplateFromCache,
  setTemplateCache,
  isTemplateCached,
  templateCache,
} from '../templateCache';

describe('templateCache', () => {
  afterEach(() => {
    templateCache.clear();
  });

  it('should start with an empty cache', () => {
    expect(templateCache.size).toBe(0);
  });

  it('should store and retrieve a compiled template via setTemplateCache + getTemplateFromCache', () => {
    const templateStr = '{{name}}';
    const compiled = Handlebars.compile(templateStr);

    setTemplateCache(templateStr, compiled);

    const cached = getTemplateFromCache(templateStr);
    expect(cached).toBeDefined();
    expect(typeof cached).toBe('function');
    expect(cached!({ name: 'hello' })).toBe('hello');
  });

  it('should return true from isTemplateCached for a stored template', () => {
    const templateStr = '{{value}}';
    const compiled = Handlebars.compile(templateStr);

    expect(isTemplateCached(templateStr)).toBe(false);

    setTemplateCache(templateStr, compiled);

    expect(isTemplateCached(templateStr)).toBe(true);
  });

  it('should return false from isTemplateCached for a non-existent template', () => {
    expect(isTemplateCached('non-existent-template')).toBe(false);
  });

  it('should return undefined from getTemplateFromCache for a non-existent template', () => {
    const result = getTemplateFromCache('non-existent-template');
    expect(result).toBeUndefined();
  });

  it('should support multiple templates in the cache', () => {
    const t1 = Handlebars.compile('{{a}}');
    const t2 = Handlebars.compile('{{b}}');

    setTemplateCache('template-a', t1);
    setTemplateCache('template-b', t2);

    expect(templateCache.size).toBe(2);
    expect(isTemplateCached('template-a')).toBe(true);
    expect(isTemplateCached('template-b')).toBe(true);
    expect(getTemplateFromCache('template-a')).toBe(t1);
    expect(getTemplateFromCache('template-b')).toBe(t2);
  });

  it('should overwrite an existing cache entry when set is called again', () => {
    const templateStr = '{{x}}';
    const first = Handlebars.compile(templateStr);
    const second = Handlebars.compile(templateStr);

    setTemplateCache(templateStr, first);
    setTemplateCache(templateStr, second);

    expect(templateCache.size).toBe(1);
    expect(getTemplateFromCache(templateStr)).toBe(second);
  });

  it('should allow clearing the cache via templateCache.clear()', () => {
    setTemplateCache('t1', Handlebars.compile('a'));
    setTemplateCache('t2', Handlebars.compile('b'));

    expect(templateCache.size).toBe(2);

    templateCache.clear();

    expect(templateCache.size).toBe(0);
    expect(isTemplateCached('t1')).toBe(false);
    expect(isTemplateCached('t2')).toBe(false);
  });
});

/**
 * @description templatePartials.ts 单元测试
 * 覆盖 functionBody partial 中 FormData 序列化片段的关键行为
 * （数组逐个 append、对象 JSON.stringify、空值跳过），
 * 防止 File[] 被序列化成 "[object File]" 字符串的回归。
 */

import { describe, it, expect } from 'vitest';
import Handlebars from 'handlebars';
import { registerTemplatePartials } from '../templatePartials';

describe('registerTemplatePartials functionBody', () => {
  it('注册后应可通过 Handlebars.partials 获取 functionBody 字符串', () => {
    registerTemplatePartials();
    const partial = Handlebars.partials.functionBody;
    expect(typeof partial).toBe('string');
  });

  it('FormData 分支应处理数组（Array.isArray，File[] 逐个 append）', () => {
    registerTemplatePartials();
    const partial = Handlebars.partials.functionBody as string;
    expect(partial).toContain('Array.isArray');
    expect(partial).toContain('instanceof Blob');
  });

  it('FormData 分支应 JSON.stringify 普通对象并跳过 null/undefined', () => {
    registerTemplatePartials();
    const partial = Handlebars.partials.functionBody as string;
    expect(partial).toContain('JSON.stringify');
    expect(partial).toContain('=== null');
    expect(partial).toContain('=== undefined');
  });

  it('FormData 分支不应再含旧的三元强转写法（"[object File]" 根因）', () => {
    registerTemplatePartials();
    const partial = Handlebars.partials.functionBody as string;
    expect(partial).not.toContain('? v : String(v)');
    expect(partial).not.toContain('? value : String(value)');
  });
});

/**
 * @description compiler.ts 单元测试
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { compileTemplate, ensureRegistered } from '../compiler';
import { templateCache } from '../templateCache';

// Mock logger
vi.mock('@/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    success: vi.fn(),
  },
  setDebugEnabled: vi.fn(),
  isDebugEnabled: vi.fn(() => false),
}));

describe('compileTemplate', () => {
  afterEach(() => {
    templateCache.clear();
  });

  it('should return a callable function', () => {
    const template = 'Hello {{name}}!';
    const compiled = compileTemplate(template);

    expect(typeof compiled).toBe('function');
    expect(compiled({ name: 'World' })).toBe('Hello World!');
  });

  it('should cache the compiled template', () => {
    const template = 'Value: {{value}}';

    const first = compileTemplate(template);
    const second = compileTemplate(template);

    // Both calls should return the same cached function reference
    expect(first).toBe(second);
    expect(templateCache.has(template)).toBe(true);
  });

  it('should compile different templates to different functions', () => {
    const templateA = 'A: {{x}}';
    const templateB = 'B: {{y}}';

    const compiledA = compileTemplate(templateA);
    const compiledB = compileTemplate(templateB);

    expect(compiledA).not.toBe(compiledB);
    expect(compiledA({ x: 'hello' })).toBe('A: hello');
    expect(compiledB({ y: 'world' })).toBe('B: world');
  });

  it('should produce correct output for a template with each helper', () => {
    const template = '{{#each items}}{{this}}{{/each}}';
    const compiled = compileTemplate(template);

    expect(compiled({ items: ['a', 'b', 'c'] })).toBe('abc');
  });

  it('should produce correct output for a template with if/unless', () => {
    const template = '{{#if active}}yes{{else}}no{{/if}}';
    const compiled = compileTemplate(template);

    expect(compiled({ active: true })).toBe('yes');
    expect(compiled({ active: false })).toBe('no');
  });
});

describe('ensureRegistered', () => {
  it('should not throw when called', () => {
    expect(() => ensureRegistered()).not.toThrow();
  });

  it('should be idempotent when called multiple times', () => {
    expect(() => {
      ensureRegistered();
      ensureRegistered();
      ensureRegistered();
    }).not.toThrow();
  });

  it('should register custom helpers that work with compiled templates', () => {
    ensureRegistered();

    // Test the 'eq' helper registered by registerTemplateHelpers
    const template = '{{#if (eq a "test")}}matched{{else}}no-match{{/if}}';
    const compiled = compileTemplate(template);

    expect(compiled({ a: 'test' })).toBe('matched');
    expect(compiled({ a: 'other' })).toBe('no-match');
  });

  it('should register the toLowerCase helper', () => {
    ensureRegistered();

    const template = '{{toLowerCase value}}';
    const compiled = compileTemplate(template);

    expect(compiled({ value: 'HELLO' })).toBe('hello');
  });
});

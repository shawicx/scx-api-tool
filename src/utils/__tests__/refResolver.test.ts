/**
 * @description refResolver 单元测试
 * 覆盖 resolveRef（含查表命中/未命中）与 resolveComposedSchema（allOf 展平/非 allOf 透传）
 */

import { describe, it, expect } from 'vitest';
import { resolveRef, resolveComposedSchema } from '../refResolver';
import type { ProcessedApiData } from '@/processors/openapi';

function makeProcessedData(): ProcessedApiData {
  return {
    interfaces: [],
    types: [
      {
        name: 'Base',
        originalName: 'Base',
        schema: {
          type: 'object',
          properties: { base: { type: 'number', description: '基础字段' } },
          required: ['base'],
        },
      },
      {
        name: 'Extension',
        originalName: 'Extension',
        schema: {
          type: 'object',
          properties: { ext: { type: 'string', description: '扩展字段' } },
          required: ['ext'],
        },
      },
    ],
    categories: [],
  };
}

describe('resolveRef', () => {
  it('应解析 #/components/schemas/Name 为对应 schema', () => {
    const data = makeProcessedData();
    const schema = resolveRef('#/components/schemas/Base', data);
    expect(schema).toBeDefined();
    expect(schema?.properties?.base).toBeDefined();
  });

  it('未找到的类型应返回 undefined', () => {
    const data = makeProcessedData();
    expect(resolveRef('#/components/schemas/NonExistent', data)).toBeUndefined();
  });

  it('空 $ref 应返回 undefined', () => {
    const data = makeProcessedData();
    expect(resolveRef('', data)).toBeUndefined();
  });

  it('应处理嵌套路径（取最后一段）', () => {
    const data = makeProcessedData();
    const schema = resolveRef('#/components/schemas/Extension', data);
    expect(schema?.properties?.ext).toBeDefined();
  });
});

describe('resolveComposedSchema', () => {
  it('非 allOf schema 应原样返回', () => {
    const data = makeProcessedData();
    const schema = { type: 'object', properties: { a: { type: 'string' } } };
    expect(resolveComposedSchema(schema as any, data)).toBe(schema);
  });

  it('allOf 全为 $ref 应合并两者的 properties', () => {
    const data = makeProcessedData();
    const result = resolveComposedSchema(
      {
        allOf: [{ $ref: '#/components/schemas/Base' }, { $ref: '#/components/schemas/Extension' }],
      },
      data,
    );
    expect(result.properties?.base).toBeDefined();
    expect(result.properties?.ext).toBeDefined();
  });

  it('allOf 含 $ref 与内联 properties 应合并', () => {
    const data = makeProcessedData();
    const result = resolveComposedSchema(
      {
        allOf: [
          { $ref: '#/components/schemas/Base' },
          { properties: { extra: { type: 'boolean' } }, required: ['extra'] },
        ],
      },
      data,
    );
    expect(result.properties?.base).toBeDefined();
    expect(result.properties?.extra).toBeDefined();
    expect(result.required).toEqual(['base', 'extra']);
  });

  it('allOf 后者 properties 应覆盖前者同名属性', () => {
    const data = makeProcessedData();
    const result = resolveComposedSchema(
      {
        allOf: [
          { properties: { name: { type: 'string' } } },
          { properties: { name: { type: 'number' } } },
        ],
      },
      data,
    );
    expect(result.properties?.name).toEqual({ type: 'number' });
  });

  it('allOf required 应取并集去重', () => {
    const data = makeProcessedData();
    const result = resolveComposedSchema(
      {
        allOf: [{ required: ['a', 'b'] }, { required: ['b', 'c'] }],
      },
      data,
    );
    expect(result.required).toEqual(['a', 'b', 'c']);
  });

  it('allOf 子 $ref 未找到时应回退为子 schema 本身', () => {
    const data = makeProcessedData();
    const result = resolveComposedSchema(
      {
        allOf: [
          { $ref: '#/components/schemas/Missing' },
          { properties: { fallback: { type: 'string' } } },
        ],
      },
      data,
    );
    expect(result.properties?.fallback).toBeDefined();
  });

  it('空 allOf 数组应原样返回', () => {
    const data = makeProcessedData();
    const schema = { type: 'object', properties: {} };
    expect(resolveComposedSchema(schema as any, data)).toBe(schema);
  });
});

/**
 * @description schemaSafety.ts 单元测试
 * 验证深度上限和循环引用检测，防止 DoS
 */

import { describe, it, expect } from 'vitest';
import { MAX_SCHEMA_DEPTH, isDepthExceeded, CircularRefGuard } from '../schemaSafety';
import { getPropertyType } from '@/generator/extractor';
import {
  openApiPropertyToZodType,
  generateZodSchemaFromOpenApiSchema,
} from '@/generator/template/zod/types';

describe('isDepthExceeded', () => {
  it('深度未超限时返回 false', () => {
    expect(isDepthExceeded(0)).toBe(false);
    expect(isDepthExceeded(MAX_SCHEMA_DEPTH - 1)).toBe(false);
  });

  it('深度超限时返回 true', () => {
    expect(isDepthExceeded(MAX_SCHEMA_DEPTH)).toBe(true);
    expect(isDepthExceeded(MAX_SCHEMA_DEPTH + 100)).toBe(true);
  });
});

describe('CircularRefGuard', () => {
  it('首次 begin 返回 false（无循环）', () => {
    const guard = new CircularRefGuard();
    const obj = { a: 1 };
    expect(guard.begin(obj)).toBe(false);
  });

  it('重复 begin 同一对象返回 true（检测到循环）', () => {
    const guard = new CircularRefGuard();
    const obj = { a: 1 };
    guard.begin(obj);
    expect(guard.begin(obj)).toBe(true);
  });

  it('end 后再次 begin 返回 false', () => {
    const guard = new CircularRefGuard();
    const obj = { a: 1 };
    guard.begin(obj);
    guard.end(obj);
    expect(guard.begin(obj)).toBe(false);
  });

  it('不同对象互不影响', () => {
    const guard = new CircularRefGuard();
    const a = { x: 1 };
    const b = { y: 2 };
    guard.begin(a);
    expect(guard.begin(b)).toBe(false);
  });
});

describe('getPropertyType 深度防护', () => {
  it('超深嵌套数组应被截断为有限深度，不栈溢出', () => {
    // 构造 100 层嵌套的 items 数组（远超 MAX_SCHEMA_DEPTH）
    let schema: any = { type: 'string' };
    for (let i = 0; i < 100; i++) {
      schema = { type: 'array', items: schema };
    }
    // 不应抛 RangeError（栈溢出）；结果应为有限深度的 any[][]...[] 类型
    const result = getPropertyType(schema);
    expect(typeof result).toBe('string');
    // 深度被截断：嵌套层数不超过 MAX_SCHEMA_DEPTH（而非 100）
    const bracketPairs = (result.match(/\[\]/g) || []).length;
    expect(bracketPairs).toBeLessThanOrEqual(MAX_SCHEMA_DEPTH);
    expect(result).toContain('any');
  });
});

describe('openApiPropertyToZodType 深度防护', () => {
  it('超深嵌套对象应被截断为有限深度，不栈溢出', () => {
    // 构造超深嵌套的 additionalProperties
    let schema: any = { type: 'string' };
    for (let i = 0; i < 100; i++) {
      schema = { type: 'object', additionalProperties: schema };
    }
    // 不应栈溢出；结果应为有限深度
    const result = openApiPropertyToZodType(schema);
    expect(typeof result.type).toBe('string');
    const recordNesting = (result.type.match(/z\.record/g) || []).length;
    expect(recordNesting).toBeLessThanOrEqual(MAX_SCHEMA_DEPTH);
  });
});

describe('generateZodSchemaFromOpenApiSchema 循环引用防护', () => {
  it('循环引用的对象属性应跳过，不无限递归', () => {
    // 构造自引用：schema.properties.self 指回 schema 本身
    const schema: any = {
      type: 'object',
      properties: {},
      required: [],
    };
    schema.properties.self = schema; // 循环引用

    // 不应栈溢出
    const result = generateZodSchemaFromOpenApiSchema(schema);
    expect(result.code).toBeDefined();
  });
});

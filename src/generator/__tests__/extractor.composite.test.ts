/**
 * @description extractor.ts 组合 schema 分支测试
 * 覆盖 getPropertyType 的 allOf/oneOf/anyOf/nullable 分支与 extract 入口的 allOf 展平
 */

import { describe, it, expect } from 'vitest';
import {
  getPropertyType,
  extractTypeProperties,
  extractRequestProperties,
  extractResponseProperties,
} from '../extractor';
import type { OpenApiSchema, OpenApiOperation } from '@/types';
import type { ProcessedApiData } from '@/processors/openapi';
import {
  oneOfFixture,
  anyOfFixture,
  nullableFixture3_0,
  nullableFixture3_1,
  createCompositeProcessedData,
} from '../../../tests/fixtures/compositeSchemas';

describe('fixtures - 组合 schema 夹具回归', () => {
  it('oneOfFixture 应输出 string | number', () => {
    expect(getPropertyType(oneOfFixture)).toBe('string | number');
  });

  it('anyOfFixture 应输出 string | boolean', () => {
    expect(getPropertyType(anyOfFixture)).toBe('string | boolean');
  });

  it('nullableFixture3_0 应输出 string | null', () => {
    expect(getPropertyType(nullableFixture3_0)).toBe('string | null');
  });

  it('nullableFixture3_1 应输出 string | null', () => {
    expect(getPropertyType(nullableFixture3_1)).toBe('string | null');
  });

  it('createCompositeProcessedData 应返回含 Base/Animal/Dog 类型的数据', () => {
    const data = createCompositeProcessedData();
    expect(data.types.map((t) => t.name)).toEqual(['Base', 'Animal', 'Dog']);
  });
});

// 复用 extractor.test.ts 的工厂模式，但补充组合 schema 所需的类型定义
function createCompositeData(overrides?: Partial<ProcessedApiData>): ProcessedApiData {
  return {
    interfaces: [],
    types: [
      {
        name: 'Base',
        originalName: 'Base',
        schema: {
          type: 'object',
          properties: { baseId: { type: 'number', description: '基础ID' } },
          required: ['baseId'],
        },
      },
      {
        name: 'Animal',
        originalName: 'Animal',
        schema: {
          type: 'object',
          properties: { kind: { type: 'string', description: '种类' } },
          required: ['kind'],
        },
      },
      {
        name: 'Dog',
        originalName: 'Dog',
        schema: {
          type: 'object',
          properties: { breed: { type: 'string', description: '品种' } },
          required: ['breed'],
        },
      },
    ],
    categories: [],
    ...overrides,
  };
}

describe('getPropertyType - nullable', () => {
  it('nullable:true 的 string 应输出 string | null', () => {
    expect(getPropertyType({ type: 'string', nullable: true } as OpenApiSchema)).toBe(
      'string | null',
    );
  });

  it('nullable:true 的 number 应输出 number | null', () => {
    expect(getPropertyType({ type: 'number', nullable: true } as OpenApiSchema)).toBe(
      'number | null',
    );
  });

  it('3.1 风格 type:[string,null] 应输出 string | null', () => {
    expect(getPropertyType({ type: ['string', 'null'] } as unknown as OpenApiSchema)).toBe(
      'string | null',
    );
  });

  it('3.1 风格 type:[number,null] 应输出 number | null', () => {
    expect(getPropertyType({ type: ['number', 'null'] } as unknown as OpenApiSchema)).toBe(
      'number | null',
    );
  });

  it('非 nullable 不应追加 | null', () => {
    expect(getPropertyType({ type: 'string' })).toBe('string');
  });
});

describe('getPropertyType - oneOf / anyOf', () => {
  it('oneOf 两个基本类型应输出 A | B', () => {
    expect(
      getPropertyType({
        oneOf: [{ type: 'string' }, { type: 'number' }],
      } as OpenApiSchema),
    ).toBe('string | number');
  });

  it('anyOf 应与 oneOf 同语义（输出 A | B）', () => {
    expect(
      getPropertyType({
        anyOf: [{ type: 'string' }, { type: 'boolean' }],
      } as OpenApiSchema),
    ).toBe('string | boolean');
  });

  it('oneOf 含 $ref 应输出 RefName | type', () => {
    expect(
      getPropertyType({
        oneOf: [{ $ref: '#/components/schemas/User' }, { type: 'string' }],
      } as OpenApiSchema),
    ).toBe('User | string');
  });

  it('oneOf 数组项应递归（含 array）', () => {
    expect(
      getPropertyType({
        oneOf: [{ type: 'array', items: { type: 'string' } }, { type: 'number' }],
      } as OpenApiSchema),
    ).toBe('string[] | number');
  });

  it('oneOf 空数组应输出 any', () => {
    expect(getPropertyType({ oneOf: [] } as OpenApiSchema)).toBe('any');
  });

  it('oneOf + nullable 应追加 | null', () => {
    expect(
      getPropertyType({
        oneOf: [{ type: 'string' }, { type: 'number' }],
        nullable: true,
      } as OpenApiSchema),
    ).toBe('string | number | null');
  });

  it('oneOf 子项全过滤为 any 时应输出 any', () => {
    expect(
      getPropertyType({
        oneOf: [{} as OpenApiSchema, {} as OpenApiSchema],
      } as OpenApiSchema),
    ).toBe('any');
  });
});

describe('getPropertyType - allOf（属性级简单 intersection）', () => {
  it('allOf 两个 $ref 应输出 A & B', () => {
    expect(
      getPropertyType({
        allOf: [{ $ref: '#/components/schemas/Base' }, { $ref: '#/components/schemas/Animal' }],
      } as OpenApiSchema),
    ).toBe('Base & Animal');
  });

  it('allOf + nullable 应追加 | null', () => {
    expect(
      getPropertyType({
        allOf: [{ $ref: '#/components/schemas/Base' }, { $ref: '#/components/schemas/Animal' }],
        nullable: true,
      } as OpenApiSchema),
    ).toBe('Base & Animal | null');
  });
});

describe('extractTypeProperties - allOf 顶层展平', () => {
  it('allOf 含 $ref 与内联应展平后提取合并字段', () => {
    const data = createCompositeData();
    const schema = {
      allOf: [
        { $ref: '#/components/schemas/Base' },
        {
          properties: { extra: { type: 'string', description: '额外' } },
          required: ['extra'],
        },
      ],
    } as OpenApiSchema;

    const result = extractTypeProperties(schema, data);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      name: 'baseId',
      type: 'number',
      description: '基础ID',
      required: true,
    });
    expect(result[1]).toEqual({
      name: 'extra',
      type: 'string',
      description: '额外',
      required: true,
    });
  });

  it('不传 processedData 时含 allOf 应走原逻辑（属性为空）', () => {
    const schema = {
      allOf: [{ properties: { a: { type: 'string' } } }],
    } as OpenApiSchema;
    // 不传 processedData → 不展平 → resolved = schema（无 properties）→ 返回 []
    expect(extractTypeProperties(schema)).toEqual([]);
  });
});

describe('extractRequestProperties - allOf 顶层展平', () => {
  it('requestBody 含 allOf 应展平合并字段', () => {
    const data = createCompositeData();
    const operation: OpenApiOperation = {
      requestBody: {
        content: {
          'application/json': {
            schema: {
              allOf: [
                { $ref: '#/components/schemas/Base' },
                {
                  properties: { name: { type: 'string', description: '名字' } },
                  required: ['name'],
                },
              ],
            },
          },
        },
      },
    };

    const result = extractRequestProperties(operation, data);

    expect(result).toHaveLength(2);
    const names = result.map((r) => r.name);
    expect(names).toEqual(['baseId', 'name']);
  });
});

describe('extractResponseProperties - allOf 顶层展平', () => {
  it('response 含 allOf 应展平合并字段', () => {
    const data = createCompositeData();
    const responses: OpenApiOperation['responses'] = {
      '200': {
        description: 'ok',
        content: {
          'application/json': {
            schema: {
              allOf: [
                { $ref: '#/components/schemas/Base' },
                {
                  properties: { score: { type: 'number', description: '分数' } },
                  required: ['score'],
                },
              ],
            },
          },
        },
      },
    };

    const result = extractResponseProperties(responses, data);

    expect(result).toHaveLength(2);
    const names = result.map((r) => r.name);
    expect(names).toEqual(['baseId', 'score']);
  });
});

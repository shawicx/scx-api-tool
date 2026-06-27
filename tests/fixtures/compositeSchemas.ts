/**
 * @description 组合 schema 测试夹具
 * 提供 allOf/oneOf/anyOf/nullable/deepNested/enum/additionalProperties 场景的样本，
 * 供回归测试与 PoC 验证使用。
 */

import type { OpenApiSchema } from '@/types';
import type { ProcessedApiData } from '@/processors/openapi';

/** 继承场景：Base + Extension，含 $ref 子 schema */
export const allOfFixture: OpenApiSchema = {
  allOf: [
    { $ref: '#/components/schemas/Base' },
    { properties: { extra: { type: 'string', description: '扩展' } }, required: ['extra'] },
  ],
};

/** union 场景：两种互斥类型 */
export const oneOfFixture: OpenApiSchema = {
  oneOf: [{ type: 'string' }, { type: 'number' }],
};

/** union 场景：非互斥 */
export const anyOfFixture: OpenApiSchema = {
  anyOf: [{ type: 'string' }, { type: 'boolean' }],
};

/** nullable 双版本：3.0 nullable:true */
export const nullableFixture3_0: OpenApiSchema = {
  type: 'string',
  nullable: true,
};

/** nullable 双版本：3.1 type 数组 */
export const nullableFixture3_1: OpenApiSchema = {
  type: ['string', 'null'],
} as unknown as OpenApiSchema;

/** 3 层 properties 嵌套（回归 depth 防护） */
export const deepNestedFixture: OpenApiSchema = {
  type: 'object',
  properties: {
    level1: {
      type: 'object',
      properties: {
        level2: {
          type: 'object',
          properties: {
            level3: { type: 'string' },
          },
        },
      },
    },
  },
};

/** 含 enum 的 property */
export const enumFixture: OpenApiSchema = {
  type: 'string',
  enum: ['active', 'inactive', 'pending'],
};

/** object + additionalProperties（$ref 分支） */
export const additionalPropertiesRefFixture: OpenApiSchema = {
  type: 'object',
  additionalProperties: { $ref: '#/components/schemas/Base' },
};

/** object + additionalProperties（内联分支） */
export const additionalPropertiesInlineFixture: OpenApiSchema = {
  type: 'object',
  additionalProperties: { type: 'string' },
};

/**
 * @description 配套的 ProcessedApiData（含 Base/Animal/Dog 类型）
 * @returns 含组合 schema 子引用类型的 ProcessedApiData
 */
export function createCompositeProcessedData(): ProcessedApiData {
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
  };
}

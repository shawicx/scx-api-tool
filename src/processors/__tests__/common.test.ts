/**
 * @description processors/common.ts 测试
 * 测试公共处理模块中的分组、类型提取和收集功能
 */

import { describe, it, expect } from 'vitest';
import {
  groupInterfacesByTag,
  extractUsedTypeNames,
  collectUsedTypesFromProperties,
} from '../common';
import type { ApiInterface, ApiProperty } from '@/types';
import type { ProcessedApiData } from '../openapi';

// ==================== 测试数据工厂 ====================

function createProcessedApiData(overrides?: Partial<ProcessedApiData>): ProcessedApiData {
  return {
    interfaces: [],
    types: [
      { name: 'User', schema: { type: 'object' } },
      { name: 'Product', schema: { type: 'object' } },
      { name: 'Order', schema: { type: 'object' } },
      { name: 'CreateUserRequest', schema: { type: 'object' } },
    ],
    categories: [],
    ...overrides,
  };
}

// ==================== groupInterfacesByTag ====================

describe('groupInterfacesByTag', () => {
  it('should group interfaces by first tag', () => {
    const interfaces: ApiInterface[] = [
      {
        path: '/users',
        method: 'get',
        operation: { tags: ['user'], summary: 'Get users' },
      },
      {
        path: '/users',
        method: 'post',
        operation: { tags: ['user'], summary: 'Create user' },
      },
      {
        path: '/products',
        method: 'get',
        operation: { tags: ['product'], summary: 'Get products' },
      },
    ];

    const result = groupInterfacesByTag(interfaces);

    expect(result).toHaveProperty('user');
    expect(result).toHaveProperty('product');
    expect(result.user).toHaveLength(2);
    expect(result.product).toHaveLength(1);
    expect(result.user[0].path).toBe('/users');
    expect(result.user[0].method).toBe('get');
    expect(result.user[1].method).toBe('post');
    expect(result.product[0].path).toBe('/products');
  });

  it('should use "default" for interfaces without tags', () => {
    const interfaces: ApiInterface[] = [
      {
        path: '/health',
        method: 'get',
        operation: { summary: 'Health check' },
      },
      {
        path: '/info',
        method: 'get',
        operation: { tags: [], summary: 'API info' },
      },
    ];

    const result = groupInterfacesByTag(interfaces);

    expect(result).toHaveProperty('default');
    expect(result.default).toHaveLength(2);
    expect(result.default[0].path).toBe('/health');
    expect(result.default[1].path).toBe('/info');
  });

  it('should mix tagged and untagged interfaces correctly', () => {
    const interfaces: ApiInterface[] = [
      {
        path: '/users',
        method: 'get',
        operation: { tags: ['user'] },
      },
      {
        path: '/health',
        method: 'get',
        operation: { summary: 'No tags' },
      },
    ];

    const result = groupInterfacesByTag(interfaces);

    expect(Object.keys(result)).toEqual(['user', 'default']);
    expect(result.user).toHaveLength(1);
    expect(result.default).toHaveLength(1);
  });

  it('should return empty object for empty array', () => {
    const result = groupInterfacesByTag([]);
    expect(result).toEqual({});
  });
});

// ==================== extractUsedTypeNames ====================

describe('extractUsedTypeNames', () => {
  it('should extract custom types from parameters', () => {
    const processedData = createProcessedApiData();
    const interfaces: ApiInterface[] = [
      {
        path: '/users',
        method: 'get',
        operation: {
          parameters: [
            { name: 'filter', in: 'query', type: 'User', required: false },
            { name: 'page', in: 'query', type: 'number', required: false },
          ],
        },
      },
    ];

    const result = extractUsedTypeNames(interfaces, processedData);

    expect(result.has('User')).toBe(true);
    // 'number' is a basic type and should be ignored
    expect(result.has('number')).toBe(false);
  });

  it('should ignore basic types from parameters', () => {
    const processedData = createProcessedApiData();
    const interfaces: ApiInterface[] = [
      {
        path: '/users',
        method: 'get',
        operation: {
          parameters: [
            { name: 'id', in: 'query', type: 'string', required: true },
            { name: 'page', in: 'query', type: 'number', required: false },
            { name: 'active', in: 'query', type: 'boolean', required: false },
            { name: 'data', in: 'query', type: 'object', required: false },
          ],
        },
      },
    ];

    const result = extractUsedTypeNames(interfaces, processedData);

    // All basic types should be excluded
    expect(result.size).toBe(0);
  });

  it('should extract types from requestBody $ref', () => {
    const processedData = createProcessedApiData();
    const interfaces: ApiInterface[] = [
      {
        path: '/users',
        method: 'post',
        operation: {
          requestBody: {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateUserRequest' },
              },
            },
          },
        },
      },
    ];

    const result = extractUsedTypeNames(interfaces, processedData);

    expect(result.has('CreateUserRequest')).toBe(true);
  });

  it('should extract types from response $ref', () => {
    const processedData = createProcessedApiData();
    const interfaces: ApiInterface[] = [
      {
        path: '/users/{id}',
        method: 'get',
        operation: {
          responses: {
            '200': {
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' },
                },
              },
            },
          },
        },
      },
    ];

    const result = extractUsedTypeNames(interfaces, processedData);

    expect(result.has('User')).toBe(true);
  });

  it('should extract types from 201 response', () => {
    const processedData = createProcessedApiData();
    const interfaces: ApiInterface[] = [
      {
        path: '/users',
        method: 'post',
        operation: {
          responses: {
            '201': {
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' },
                },
              },
            },
          },
        },
      },
    ];

    const result = extractUsedTypeNames(interfaces, processedData);

    expect(result.has('User')).toBe(true);
  });

  it('should handle array suffix types like "User[]"', () => {
    const processedData = createProcessedApiData();
    const interfaces: ApiInterface[] = [
      {
        path: '/users',
        method: 'get',
        operation: {
          parameters: [{ name: 'exclude', in: 'query', type: 'User[]', required: false }],
        },
      },
    ];

    const result = extractUsedTypeNames(interfaces, processedData);

    expect(result.has('User')).toBe(true);
  });

  it('should extract types from nested schema properties', () => {
    const processedData = createProcessedApiData();
    const interfaces: ApiInterface[] = [
      {
        path: '/orders',
        method: 'get',
        operation: {
          responses: {
            '200': {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      user: { $ref: '#/components/schemas/User' },
                      product: { $ref: '#/components/schemas/Product' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    ];

    const result = extractUsedTypeNames(interfaces, processedData);

    expect(result.has('User')).toBe(true);
    expect(result.has('Product')).toBe(true);
  });

  it('should extract types from array items', () => {
    const processedData = createProcessedApiData();
    const interfaces: ApiInterface[] = [
      {
        path: '/users',
        method: 'get',
        operation: {
          responses: {
            '200': {
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
        },
      },
    ];

    const result = extractUsedTypeNames(interfaces, processedData);

    expect(result.has('User')).toBe(true);
  });

  it('should extract types from additionalProperties', () => {
    const processedData = createProcessedApiData();
    const interfaces: ApiInterface[] = [
      {
        path: '/map',
        method: 'get',
        operation: {
          responses: {
            '200': {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: { $ref: '#/components/schemas/Product' },
                  },
                },
              },
            },
          },
        },
      },
    ];

    const result = extractUsedTypeNames(interfaces, processedData);

    expect(result.has('Product')).toBe(true);
  });

  it('should return empty set for empty interfaces', () => {
    const processedData = createProcessedApiData();
    const result = extractUsedTypeNames([], processedData);

    expect(result.size).toBe(0);
  });

  it('should not extract types that are not in processedData.types', () => {
    const processedData = createProcessedApiData();
    const interfaces: ApiInterface[] = [
      {
        path: '/unknown',
        method: 'get',
        operation: {
          responses: {
            '200': {
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/NonExistentType' },
                },
              },
            },
          },
        },
      },
    ];

    const result = extractUsedTypeNames(interfaces, processedData);

    expect(result.has('NonExistentType')).toBe(false);
    expect(result.size).toBe(0);
  });

  it('should handle interfaces with no parameters, requestBody, or responses', () => {
    const processedData = createProcessedApiData();
    const interfaces: ApiInterface[] = [
      {
        path: '/ping',
        method: 'get',
        operation: {},
      },
    ];

    const result = extractUsedTypeNames(interfaces, processedData);

    expect(result.size).toBe(0);
  });

  it('应收集 response 中 oneOf 组合 schema 内嵌的 $ref 类型', () => {
    const processedData = createProcessedApiData({
      types: [
        { name: 'User', schema: { type: 'object' } },
        { name: 'Product', schema: { type: 'object' } },
        { name: 'Order', schema: { type: 'object' } },
      ],
    });
    const interfaces: ApiInterface[] = [
      {
        path: '/api',
        method: 'get',
        operation: {
          responses: {
            '200': {
              content: {
                'application/json': {
                  schema: {
                    oneOf: [
                      { $ref: '#/components/schemas/User' },
                      { $ref: '#/components/schemas/Product' },
                    ],
                  },
                },
              },
            },
          },
        },
      },
    ];

    const result = extractUsedTypeNames(interfaces, processedData);

    expect(result.has('User')).toBe(true);
    expect(result.has('Product')).toBe(true);
  });

  it('应收集 response 中 anyOf 组合 schema 内嵌的 $ref 类型', () => {
    const processedData = createProcessedApiData({
      types: [
        { name: 'User', schema: { type: 'object' } },
        { name: 'Order', schema: { type: 'object' } },
      ],
    });
    const interfaces: ApiInterface[] = [
      {
        path: '/api',
        method: 'get',
        operation: {
          responses: {
            '200': {
              content: {
                'application/json': {
                  schema: {
                    anyOf: [{ $ref: '#/components/schemas/Order' }],
                  },
                },
              },
            },
          },
        },
      },
    ];

    const result = extractUsedTypeNames(interfaces, processedData);

    expect(result.has('Order')).toBe(true);
  });

  it('应收集 response 中 allOf 组合 schema 内嵌的 $ref 类型', () => {
    const processedData = createProcessedApiData({
      types: [
        { name: 'User', schema: { type: 'object' } },
        { name: 'Product', schema: { type: 'object' } },
        { name: 'Order', schema: { type: 'object' } },
      ],
    });
    const interfaces: ApiInterface[] = [
      {
        path: '/api',
        method: 'get',
        operation: {
          responses: {
            '200': {
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/User' },
                      { $ref: '#/components/schemas/Order' },
                    ],
                  },
                },
              },
            },
          },
        },
      },
    ];

    const result = extractUsedTypeNames(interfaces, processedData);

    expect(result.has('User')).toBe(true);
    expect(result.has('Order')).toBe(true);
  });

  // ===== content-type fallback 用例（修复 springdoc 默认输出通配符的 bug）=====

  it('should extract types from response with wildcard content-type', () => {
    const processedData = createProcessedApiData();
    const interfaces: ApiInterface[] = [
      {
        path: '/users/{id}',
        method: 'get',
        operation: {
          responses: {
            '200': {
              content: {
                '*/*': {
                  schema: { $ref: '#/components/schemas/User' },
                },
              },
            },
          },
        },
      },
    ];

    const result = extractUsedTypeNames(interfaces, processedData);

    expect(result.has('User')).toBe(true);
  });

  it('should extract types from requestBody with wildcard content-type', () => {
    const processedData = createProcessedApiData();
    const interfaces: ApiInterface[] = [
      {
        path: '/users',
        method: 'post',
        operation: {
          requestBody: {
            content: {
              '*/*': {
                schema: { $ref: '#/components/schemas/CreateUserRequest' },
              },
            },
          },
        },
      },
    ];

    const result = extractUsedTypeNames(interfaces, processedData);

    expect(result.has('CreateUserRequest')).toBe(true);
  });
});

// ==================== collectUsedTypesFromProperties ====================

describe('collectUsedTypesFromProperties', () => {
  it('should collect custom types from properties', () => {
    const processedData = createProcessedApiData();
    const properties: ApiProperty[] = [
      { name: 'user', type: 'User', description: 'User object', required: true },
      { name: 'product', type: 'Product', description: 'Product object', required: false },
      { name: 'count', type: 'number', description: 'Count', required: true },
    ];

    const result = collectUsedTypesFromProperties(properties, processedData);

    expect(result.has('User')).toBe(true);
    expect(result.has('Product')).toBe(true);
    // 'number' is not a custom type
    expect(result.has('number')).toBe(false);
    expect(result.size).toBe(2);
  });

  it('should handle array suffix types', () => {
    const processedData = createProcessedApiData();
    const properties: ApiProperty[] = [
      { name: 'users', type: 'User[]', description: 'List of users', required: true },
      { name: 'orders', type: 'Order[]', description: 'List of orders', required: false },
    ];

    const result = collectUsedTypesFromProperties(properties, processedData);

    expect(result.has('User')).toBe(true);
    expect(result.has('Order')).toBe(true);
    expect(result.size).toBe(2);
  });

  it('should ignore types not present in processedData.types', () => {
    const processedData = createProcessedApiData();
    const properties: ApiProperty[] = [
      { name: 'unknown', type: 'UnknownType', description: 'Unknown type', required: true },
    ];

    const result = collectUsedTypesFromProperties(properties, processedData);

    expect(result.size).toBe(0);
  });

  it('should return empty set for empty properties', () => {
    const processedData = createProcessedApiData();
    const result = collectUsedTypesFromProperties([], processedData);

    expect(result.size).toBe(0);
  });

  it('should deduplicate type names', () => {
    const processedData = createProcessedApiData();
    const properties: ApiProperty[] = [
      { name: 'user1', type: 'User', description: 'First user', required: true },
      { name: 'user2', type: 'User', description: 'Second user', required: false },
      { name: 'userList', type: 'User[]', description: 'User list', required: true },
    ];

    const result = collectUsedTypesFromProperties(properties, processedData);

    expect(result.size).toBe(1);
    expect(result.has('User')).toBe(true);
  });
});

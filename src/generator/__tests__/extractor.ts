/**
 * @description extractor.ts 单元测试
 * 测试数据提取模块中的请求/响应属性提取和类型推断功能
 */

import { describe, it, expect, vi } from 'vitest';
import {
  extractRequestProperties,
  extractResponseProperties,
  getPropertyType,
  hasRequestBody,
} from '../extractor';
import type { OpenApiOperation, OpenApiSchema } from '@/types';
import type { ProcessedApiData } from '@/processors/openapi';

vi.mock('consola');

// ==================== 测试数据工厂 ====================

function createProcessedApiData(overrides?: Partial<ProcessedApiData>): ProcessedApiData {
  return {
    interfaces: [],
    types: [
      {
        name: 'CreateUserRequest',
        originalName: 'CreateUserRequest',
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: '用户名' },
            email: { type: 'string', description: '邮箱' },
            age: { type: 'integer', description: '年龄' },
          },
          required: ['name'],
        },
      },
      {
        name: 'User',
        originalName: 'User',
        schema: {
          type: 'object',
          properties: {
            id: { type: 'number', description: '用户ID' },
            name: { type: 'string', description: '用户名' },
            email: { type: 'string', description: '邮箱' },
          },
          required: ['id', 'name'],
        },
      },
      {
        name: 'UserListResponse',
        originalName: 'UserListResponse',
        schema: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/User' },
              description: '用户列表',
            },
            total: { type: 'number', description: '总数' },
          },
          required: ['data', 'total'],
        },
      },
    ],
    categories: [],
    ...overrides,
  };
}

// ==================== extractRequestProperties ====================

describe('extractRequestProperties', () => {
  it('should extract from $ref in requestBody - resolve type name and expand properties', () => {
    const processedData = createProcessedApiData();
    const operation: OpenApiOperation = {
      requestBody: {
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateUserRequest' },
          },
        },
      },
    };

    const result = extractRequestProperties(operation, processedData);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      name: 'name',
      type: 'string',
      description: '用户名',
      required: true,
    });
    expect(result[1]).toEqual({
      name: 'email',
      type: 'string',
      description: '邮箱',
      required: false,
    });
    expect(result[2]).toEqual({
      name: 'age',
      type: 'number',
      description: '年龄',
      required: false,
    });
  });

  it('should extract from inline properties in requestBody', () => {
    const processedData = createProcessedApiData();
    const operation: OpenApiOperation = {
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                username: { type: 'string', description: '用户名' },
                password: { type: 'string', description: '密码' },
              },
              required: ['username', 'password'],
            },
          },
        },
      },
    };

    const result = extractRequestProperties(operation, processedData);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      name: 'username',
      type: 'string',
      description: '用户名',
      required: true,
    });
    expect(result[1]).toEqual({
      name: 'password',
      type: 'string',
      description: '密码',
      required: true,
    });
  });

  it('should handle empty operation', () => {
    const processedData = createProcessedApiData();
    const operation: OpenApiOperation = {};

    const result = extractRequestProperties(operation, processedData);

    expect(result).toEqual([]);
  });

  it('should extract from query/path parameters types', () => {
    const processedData = createProcessedApiData();
    const operation: OpenApiOperation = {
      parameters: [
        { name: 'page', in: 'query', type: 'number', required: false, description: '页码' },
        { name: 'size', in: 'query', type: 'integer', required: true, description: '每页数量' },
        { name: 'id', in: 'path', type: 'string', required: true, description: 'ID' },
      ],
    };

    const result = extractRequestProperties(operation, processedData);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      name: 'page',
      type: 'number',
      description: '页码',
      required: false,
    });
    expect(result[1]).toEqual({
      name: 'size',
      type: 'number',
      description: '每页数量',
      required: true,
    });
    expect(result[2]).toEqual({
      name: 'id',
      type: 'string',
      description: 'ID',
      required: true,
    });
  });

  it('should handle undefined parameters (return empty array)', () => {
    const processedData = createProcessedApiData();
    const operation: OpenApiOperation = {
      parameters: undefined,
    };

    const result = extractRequestProperties(operation, processedData);

    expect(result).toEqual([]);
  });

  it('should handle null/undefined schema (return empty array)', () => {
    const processedData = createProcessedApiData();
    const operation: OpenApiOperation = {
      requestBody: {
        content: {
          'application/json': {
            schema: undefined as unknown as OpenApiSchema,
          },
        },
      },
    };

    const result = extractRequestProperties(operation, processedData);

    expect(result).toEqual([]);
  });

  it('should handle parameter without type defaulting to string', () => {
    const processedData = createProcessedApiData();
    const operation: OpenApiOperation = {
      parameters: [{ name: 'filter', in: 'query', required: false, description: '过滤' }],
    };

    const result = extractRequestProperties(operation, processedData);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('string');
  });
});

// ==================== extractResponseProperties ====================

describe('extractResponseProperties', () => {
  it('should extract from $ref in response - resolve type name and expand properties', () => {
    const processedData = createProcessedApiData();
    const responses: OpenApiOperation['responses'] = {
      '200': {
        description: '成功',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/User' },
          },
        },
      },
    };

    const result = extractResponseProperties(responses, processedData);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      name: 'id',
      type: 'number',
      description: '用户ID',
      required: true,
    });
    expect(result[1]).toEqual({
      name: 'name',
      type: 'string',
      description: '用户名',
      required: true,
    });
    expect(result[2]).toEqual({
      name: 'email',
      type: 'string',
      description: '邮箱',
      required: false,
    });
  });

  it('should extract from array response - resolve items type and resolve $ref', () => {
    const processedData = createProcessedApiData();
    const responses: OpenApiOperation['responses'] = {
      '200': {
        description: '成功',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: { $ref: '#/components/schemas/User' },
            },
          },
        },
      },
    };

    const result = extractResponseProperties(responses, processedData);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: 'data',
      type: 'User[]',
      description: '响应数据数组',
      required: true,
    });
  });

  it('should handle null response (return empty array)', () => {
    const processedData = createProcessedApiData();

    const result = extractResponseProperties(undefined, processedData);

    expect(result).toEqual([]);
  });

  it('should handle undefined response (return empty array)', () => {
    const processedData = createProcessedApiData();

    const result = extractResponseProperties(undefined, processedData);

    expect(result).toEqual([]);
  });

  it('should extract from inline properties', () => {
    const processedData = createProcessedApiData();
    const responses: OpenApiOperation['responses'] = {
      '200': {
        description: '成功',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: { type: 'string', description: '消息' },
                code: { type: 'number', description: '状态码' },
              },
              required: ['message'],
            },
          },
        },
      },
    };

    const result = extractResponseProperties(responses, processedData);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      name: 'message',
      type: 'string',
      description: '消息',
      required: true,
    });
    expect(result[1]).toEqual({
      name: 'code',
      type: 'number',
      description: '状态码',
      required: false,
    });
  });

  it('should handle null/undefined schema in response content (return empty array)', () => {
    const processedData = createProcessedApiData();
    const responses: OpenApiOperation['responses'] = {
      '200': {
        description: '成功',
        content: {
          'application/json': {
            schema: undefined as unknown as OpenApiSchema,
          },
        },
      },
    };

    const result = extractResponseProperties(responses, processedData);

    expect(result).toEqual([]);
  });

  it('should handle schema with type "object" and no properties - return "Record<string, any>"', () => {
    const processedData = createProcessedApiData();
    const responses: OpenApiOperation['responses'] = {
      '200': {
        description: '成功',
        content: {
          'application/json': {
            schema: { type: 'object' },
          },
        },
      },
    };

    const result = extractResponseProperties(responses, processedData);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: 'data',
      type: 'Record<string, any>',
      description: '响应数据',
      required: true,
    });
  });

  it('should handle null/undefined schema in json content (return "any")', () => {
    const processedData = createProcessedApiData();
    const responses: OpenApiOperation['responses'] = {
      '200': {
        description: '成功',
        content: {
          'application/json': {
            schema: {},
          },
        },
      },
    };

    const result = extractResponseProperties(responses, processedData);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: 'data',
      type: 'any',
      description: '响应数据',
      required: true,
    });
  });

  it('should handle $ref response where schema has no properties - add generic response', () => {
    const processedData = createProcessedApiData();
    const responses: OpenApiOperation['responses'] = {
      '200': {
        description: '成功',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UnknownType' },
          },
        },
      },
    };

    const result = extractResponseProperties(responses, processedData);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: 'data',
      type: 'UnknownType',
      description: '响应数据',
      required: true,
    });
  });

  it('should check 201 response when 200 is absent', () => {
    const processedData = createProcessedApiData();
    const responses: OpenApiOperation['responses'] = {
      '201': {
        description: '创建成功',
        content: {
          'application/json': {
            schema: { type: 'boolean' },
          },
        },
      },
    };

    const result = extractResponseProperties(responses, processedData);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('boolean');
  });

  it('should return empty array for responses without success code', () => {
    const processedData = createProcessedApiData();
    const responses: OpenApiOperation['responses'] = {
      '400': {
        description: 'Bad Request',
      },
    };

    const result = extractResponseProperties(responses, processedData);

    expect(result).toEqual([]);
  });
});

// ==================== hasRequestBody ====================

describe('hasRequestBody', () => {
  it('should return true when requestBody is present', () => {
    const operation: OpenApiOperation = {
      requestBody: {
        content: {
          'application/json': {
            schema: { type: 'object' },
          },
        },
      },
    };

    expect(hasRequestBody(operation)).toBe(true);
  });

  it('should return false when requestBody is absent', () => {
    const operation: OpenApiOperation = {};

    expect(hasRequestBody(operation)).toBe(false);
  });

  it('should throw when operation is null', () => {
    expect(() => hasRequestBody(null as unknown as OpenApiOperation)).toThrow();
  });

  it('should throw when operation is undefined', () => {
    expect(() => hasRequestBody(undefined as unknown as OpenApiOperation)).toThrow();
  });

  it('should return true for operation with nested requestBody', () => {
    const operation: OpenApiOperation = {
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                age: { type: 'number' },
              },
              required: ['name'],
            },
          },
        },
      },
    };

    expect(hasRequestBody(operation)).toBe(true);
  });
});

// ==================== getPropertyType ====================

describe('getPropertyType', () => {
  it('should resolve $ref reference to type name', () => {
    expect(getPropertyType({ $ref: '#/components/schemas/User' })).toBe('User');
  });

  it('should handle array type with items', () => {
    expect(getPropertyType({ type: 'array', items: { type: 'string' } })).toBe('string[]');
  });

  it('should handle inline object type without additionalProperties', () => {
    expect(getPropertyType({ type: 'object' })).toBe('Record<string, any>');
  });

  it('should handle inline object with additionalProperties $ref', () => {
    expect(
      getPropertyType({
        type: 'object',
        additionalProperties: { $ref: '#/components/schemas/Item' },
      }),
    ).toBe('Record<string, Item>');
  });

  it('should handle basic type mapping - string', () => {
    expect(getPropertyType({ type: 'string' })).toBe('string');
  });

  it('should handle basic type mapping - number', () => {
    expect(getPropertyType({ type: 'number' })).toBe('number');
  });

  it('should handle basic type mapping - integer to number', () => {
    expect(getPropertyType({ type: 'integer' })).toBe('number');
  });

  it('should handle basic type mapping - boolean', () => {
    expect(getPropertyType({ type: 'boolean' })).toBe('boolean');
  });

  it('should handle basic type mapping - null', () => {
    expect(getPropertyType({ type: 'null' })).toBe('null');
  });

  it('should handle unknown type - return "any"', () => {
    expect(getPropertyType({ type: 'array' } as OpenApiSchema)).toBe('any');
  });

  it('should handle undefined input - return "any"', () => {
    expect(getPropertyType(undefined as unknown as OpenApiSchema)).toBe('any');
  });

  it('should handle null input - return "any"', () => {
    expect(getPropertyType(null as unknown as OpenApiSchema)).toBe('any');
  });

  it('should handle empty object - return "any"', () => {
    expect(getPropertyType({})).toBe('any');
  });

  it('should handle array type with $ref items', () => {
    expect(getPropertyType({ type: 'array', items: { $ref: '#/components/schemas/User' } })).toBe(
      'User[]',
    );
  });

  it('should handle nested array type', () => {
    expect(
      getPropertyType({
        type: 'array',
        items: { type: 'array', items: { type: 'number' } },
      }),
    ).toBe('number[][]');
  });
});

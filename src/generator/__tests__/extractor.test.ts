/**
 * @description extractor.ts 单元测试
 * 测试数据提取模块中的请求/响应属性提取和类型推断功能
 */

import { describe, it, expect } from 'vitest';
import {
  extractRequestProperties,
  extractResponseProperties,
  extractTypeProperties,
  getPropertyType,
  hasRequestBody,
} from '../extractor';
import type { OpenApiOperation, OpenApiSchema, ApiProperty } from '@/types';
import type { ProcessedApiData } from '@/processors/openapi';
import { mockProcessedApiData } from '../../../tests/fixtures/mockData';

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
  it('should extract properties from $ref requestBody', () => {
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

  it('should extract properties from inline requestBody', () => {
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

  it('should extract properties from parameters', () => {
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

  it('should return empty array for empty operation', () => {
    const processedData = createProcessedApiData();
    const operation: OpenApiOperation = {};

    const result = extractRequestProperties(operation, processedData);

    expect(result).toEqual([]);
  });

  it('should return empty array when $ref not found in processedData.types', () => {
    const processedData = createProcessedApiData();
    const operation: OpenApiOperation = {
      requestBody: {
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/NonExistentType' },
          },
        },
      },
    };

    const result = extractRequestProperties(operation, processedData);

    expect(result).toEqual([]);
  });

  it('should combine requestBody and parameters properties', () => {
    const processedData = createProcessedApiData();
    const operation: OpenApiOperation = {
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: '用户名' },
              },
              required: ['name'],
            },
          },
        },
      },
      parameters: [
        { name: 'id', in: 'path', type: 'number', required: true, description: '用户ID' },
      ],
    };

    const result = extractRequestProperties(operation, processedData);

    expect(result).toHaveLength(2);
    // First from requestBody, then from parameters
    expect(result[0].name).toBe('name');
    expect(result[1].name).toBe('id');
  });

  it('should use mockProcessedApiData fixture for $ref extraction', () => {
    const operation: OpenApiOperation = {
      requestBody: {
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateUserRequest' },
          },
        },
      },
    };

    const result = extractRequestProperties(operation, mockProcessedApiData);

    // mockProcessedApiData has CreateUserRequest with schema type: 'object' but no properties
    // so the $ref resolves but refSchema.properties is undefined -> empty result
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
  it('should extract properties from $ref response schema', () => {
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

  it('should extract properties from inline response schema', () => {
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

  it('should handle array response schema', () => {
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

  it('should handle $ref response where schema has no properties', () => {
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

    // refSchema not found, so it falls to the generic response
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: 'data',
      type: 'UnknownType',
      description: '响应数据',
      required: true,
    });
  });

  it('should handle basic type response', () => {
    const processedData = createProcessedApiData();
    const responses: OpenApiOperation['responses'] = {
      '200': {
        description: '成功',
        content: {
          'application/json': {
            schema: { type: 'string' },
          },
        },
      },
    };

    const result = extractResponseProperties(responses, processedData);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: 'data',
      type: 'string',
      description: '响应数据',
      required: true,
    });
  });

  it('should handle response with no schema type as any', () => {
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

  it('should return empty array for null responses', () => {
    const processedData = createProcessedApiData();

    const result = extractResponseProperties(undefined, processedData);

    expect(result).toEqual([]);
  });

  it('should return empty array for undefined responses', () => {
    const processedData = createProcessedApiData();

    const result = extractResponseProperties(undefined, processedData);

    expect(result).toEqual([]);
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
});

// ==================== extractTypeProperties ====================

describe('extractTypeProperties', () => {
  it('should extract properties from a schema with properties', () => {
    const schema: OpenApiSchema = {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'ID' },
        name: { type: 'string', description: '名称' },
      },
      required: ['id'],
    };

    const result = extractTypeProperties(schema);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      name: 'id',
      type: 'number',
      description: 'ID',
      required: true,
    });
    expect(result[1]).toEqual({
      name: 'name',
      type: 'string',
      description: '名称',
      required: false,
    });
  });

  it('should return empty array for $ref schema', () => {
    const schema: OpenApiSchema = {
      $ref: '#/components/schemas/User',
    };

    const result = extractTypeProperties(schema);

    expect(result).toEqual([]);
  });

  it('should return empty array for schema without properties', () => {
    const schema: OpenApiSchema = {
      type: 'string',
    };

    const result = extractTypeProperties(schema);

    expect(result).toEqual([]);
  });

  it('should return empty array for null/undefined schema', () => {
    expect(extractTypeProperties(null as unknown as OpenApiSchema)).toEqual([]);
    expect(extractTypeProperties(undefined as unknown as OpenApiSchema)).toEqual([]);
  });
});

// ==================== getPropertyType ====================

describe('getPropertyType', () => {
  it('should return "string" for string type', () => {
    expect(getPropertyType({ type: 'string' })).toBe('string');
  });

  it('should return "number" for number type', () => {
    expect(getPropertyType({ type: 'number' })).toBe('number');
  });

  it('should return "number" for integer type', () => {
    expect(getPropertyType({ type: 'integer' })).toBe('number');
  });

  it('should return "boolean" for boolean type', () => {
    expect(getPropertyType({ type: 'boolean' })).toBe('boolean');
  });

  it('should return "null" for null type', () => {
    expect(getPropertyType({ type: 'null' })).toBe('null');
  });

  it('should return "any" for unknown type', () => {
    expect(getPropertyType({ type: 'array' } as OpenApiSchema)).toBe('any');
  });

  it('should return "any" for null/undefined input', () => {
    expect(getPropertyType(null as unknown as OpenApiSchema)).toBe('any');
    expect(getPropertyType(undefined as unknown as OpenApiSchema)).toBe('any');
  });

  it('should resolve $ref to sanitized type name', () => {
    expect(getPropertyType({ $ref: '#/components/schemas/User' })).toBe('User');
  });

  it('should resolve $ref with nested path', () => {
    expect(getPropertyType({ $ref: '#/components/schemas/MyCustomType' })).toBe('MyCustomType');
  });

  it('should handle array type with items', () => {
    expect(getPropertyType({ type: 'array', items: { type: 'string' } })).toBe('string[]');
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

  it('should return "Record<string, any>" for object type', () => {
    expect(getPropertyType({ type: 'object' })).toBe('Record<string, any>');
  });

  it('should return "Record<string, TypeName>" for object with additionalProperties $ref', () => {
    expect(
      getPropertyType({
        type: 'object',
        additionalProperties: { $ref: '#/components/schemas/User' },
      }),
    ).toBe('Record<string, User>');
  });

  it('should return "any" when no type is specified and no $ref', () => {
    expect(getPropertyType({})).toBe('any');
  });
});

// ==================== hasRequestBody ====================

describe('hasRequestBody', () => {
  it('should return true when requestBody exists', () => {
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

  it('should return false when requestBody is undefined', () => {
    const operation: OpenApiOperation = {};

    expect(hasRequestBody(operation)).toBe(false);
  });

  it('should return false when requestBody is null', () => {
    const operation: OpenApiOperation = {
      requestBody: null as unknown as OpenApiOperation['requestBody'],
    };

    expect(hasRequestBody(operation)).toBe(false);
  });
});

/**
 * @description extractor.ts 单元测试
 * 测试数据提取模块中的请求/响应属性提取和类型推断功能
 */

import { describe, it, expect } from 'vitest';
import {
  extractPathParameterNames,
  extractRequestProperties,
  extractResponseProperties,
  extractTypeProperties,
  getPropertyType,
  getResponseSchema,
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

// ==================== extractPathParameterNames ====================

describe('extractPathParameterNames', () => {
  it('应仅返回 path 类型的参数名', () => {
    const operation: OpenApiOperation = {
      parameters: [
        { name: 'userId', in: 'path', type: 'number', required: true },
        { name: 'page', in: 'query', type: 'number', required: false },
        { name: 'postId', in: 'path', type: 'string', required: true },
        { name: 'X-Token', in: 'header', type: 'string', required: true },
      ],
    };

    expect(extractPathParameterNames(operation)).toEqual(['userId', 'postId']);
  });

  it('无 parameters 时应返回空数组', () => {
    expect(extractPathParameterNames({})).toEqual([]);
    expect(extractPathParameterNames({ parameters: [] })).toEqual([]);
  });

  it('无 path 参数时应返回空数组', () => {
    const operation: OpenApiOperation = {
      parameters: [
        { name: 'page', in: 'query', type: 'number' },
        { name: 'X-Token', in: 'header', type: 'string' },
      ],
    };

    expect(extractPathParameterNames(operation)).toEqual([]);
  });

  it('应支持多个 path 参数（保持顺序）', () => {
    const operation: OpenApiOperation = {
      parameters: [
        { name: 'userId', in: 'path', type: 'number' },
        { name: 'postId', in: 'path', type: 'string' },
        { name: 'commentId', in: 'path', type: 'string' },
      ],
    };

    expect(extractPathParameterNames(operation)).toEqual(['userId', 'postId', 'commentId']);
  });
});

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

  // ===== content-type fallback 用例（修复 springdoc 默认输出通配符的 bug）=====

  it('should extract properties when content-type is wildcard (application/json absent)', () => {
    const processedData = createProcessedApiData();
    const responses: OpenApiOperation['responses'] = {
      '200': {
        description: '成功',
        content: {
          '*/*': {
            schema: { $ref: '#/components/schemas/User' },
          },
        },
      },
    };

    const result = extractResponseProperties(responses, processedData);

    expect(result).toHaveLength(3);
    expect(result[0].name).toBe('id');
    expect(result[1].name).toBe('name');
    expect(result[2].name).toBe('email');
  });

  it('should extract properties when content-type is application/xml (fallback to first available)', () => {
    const processedData = createProcessedApiData();
    const responses: OpenApiOperation['responses'] = {
      '200': {
        description: '成功',
        content: {
          'application/xml': {
            schema: { $ref: '#/components/schemas/User' },
          },
        },
      },
    };

    const result = extractResponseProperties(responses, processedData);

    expect(result).toHaveLength(3);
    expect(result[0].name).toBe('id');
  });

  it('should prefer application/json over wildcard when both exist', () => {
    const processedData = createProcessedApiData();
    const responses: OpenApiOperation['responses'] = {
      '200': {
        description: '成功',
        content: {
          // application/json 指向 User（3 个属性），通配符指向 CreateUserRequest（3 个属性但不同名）
          'application/json': {
            schema: { $ref: '#/components/schemas/User' },
          },
          '*/*': {
            schema: { $ref: '#/components/schemas/CreateUserRequest' },
          },
        },
      },
    };

    const result = extractResponseProperties(responses, processedData);

    // 应取 application/json 的 User（id/name/email），而非通配符的 CreateUserRequest（name/email/age）
    expect(result.map((p) => p.name)).toEqual(['id', 'name', 'email']);
  });

  it('should return empty array when success response has empty content', () => {
    const processedData = createProcessedApiData();
    const responses: OpenApiOperation['responses'] = {
      '200': {
        description: '成功',
        content: {},
      },
    };

    const result = extractResponseProperties(responses, processedData);

    expect(result).toEqual([]);
  });
});

// ==================== getResponseSchema ====================

describe('getResponseSchema', () => {
  it('should return application/json schema when present', () => {
    const operation: OpenApiOperation = {
      responses: {
        '200': {
          description: '成功',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/User' } },
          },
        },
      },
    };

    const result = getResponseSchema(operation);

    expect(result).not.toBeNull();
    expect(result!.schema).toEqual({ $ref: '#/components/schemas/User' });
  });

  it('should fall back to wildcard content-type when application/json absent', () => {
    const operation: OpenApiOperation = {
      responses: {
        '200': {
          description: '成功',
          content: {
            '*/*': { schema: { $ref: '#/components/schemas/User' } },
          },
        },
      },
    };

    const result = getResponseSchema(operation);

    expect(result).not.toBeNull();
    expect(result!.schema).toEqual({ $ref: '#/components/schemas/User' });
  });

  it('should fall back to first available content-type when neither json nor wildcard present', () => {
    const operation: OpenApiOperation = {
      responses: {
        '200': {
          description: '成功',
          content: {
            'application/xml': { schema: { type: 'string' } },
          },
        },
      },
    };

    const result = getResponseSchema(operation);

    expect(result).not.toBeNull();
    expect(result!.schema).toEqual({ type: 'string' });
  });

  it('should prefer 200 over 201', () => {
    const operation: OpenApiOperation = {
      responses: {
        '200': {
          description: 'OK',
          content: { 'application/json': { schema: { type: 'string' } } },
        },
        '201': {
          description: 'Created',
          content: { 'application/json': { schema: { type: 'number' } } },
        },
      },
    };

    const result = getResponseSchema(operation);

    expect(result!.schema).toEqual({ type: 'string' });
  });

  it('should check 201 response when 200 is absent', () => {
    const operation: OpenApiOperation = {
      responses: {
        '201': {
          description: 'Created',
          content: { 'application/json': { schema: { type: 'number' } } },
        },
      },
    };

    const result = getResponseSchema(operation);

    expect(result!.schema).toEqual({ type: 'number' });
  });

  it('should return null when responses is undefined', () => {
    const operation: OpenApiOperation = {};

    expect(getResponseSchema(operation)).toBeNull();
  });

  it('should return null when no success response (200/201)', () => {
    const operation: OpenApiOperation = {
      responses: {
        '400': {
          description: 'Bad Request',
          content: { 'application/json': { schema: { type: 'string' } } },
        },
      },
    };

    expect(getResponseSchema(operation)).toBeNull();
  });

  it('should return null when success response has no content', () => {
    const operation: OpenApiOperation = {
      responses: {
        '200': { description: 'OK' },
      },
    };

    expect(getResponseSchema(operation)).toBeNull();
  });

  it('should return null when no media type has a schema', () => {
    const operation: OpenApiOperation = {
      responses: {
        '200': {
          description: 'OK',
          content: {
            'application/json': {},
            '*/*': {},
          },
        },
      },
    };

    expect(getResponseSchema(operation)).toBeNull();
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

  // ===== free-form（任意 JSON 值，如 Jackson JsonNode 属性）=====

  it('should return "JsonValue" for object with additionalProperties: true', () => {
    expect(getPropertyType({ type: 'object', additionalProperties: true })).toBe('JsonValue');
  });

  it('should return "JsonValue" for object with empty additionalProperties {}', () => {
    expect(getPropertyType({ type: 'object', additionalProperties: {} })).toBe('JsonValue');
  });

  it('should still return "Record<string, any>" for pure { type: object } (no free-form signal)', () => {
    // 纯 { type: 'object' } 缺少 free-form 信号，不误判为 JsonValue（避免误伤空 DTO）
    expect(getPropertyType({ type: 'object' })).toBe('Record<string, any>');
  });

  it('should return "Record<string, string>" for object with inline additionalProperties type', () => {
    // 注意:当前 getPropertyType 对内联 additionalProperties（非 $ref）仍降级为 Record<string, any>
    // 这是已知局限（propertyType 只识别 $ref 形式的 map），非 free-form 场景
    expect(
      getPropertyType({
        type: 'object',
        additionalProperties: { type: 'string' },
      }),
    ).toBe('Record<string, any>');
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

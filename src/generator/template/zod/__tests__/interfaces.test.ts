/**
 * @description zod/interfaces.ts 单元测试
 * 覆盖 generateZodSchemaFromOperation（request/response 各分支）与 generateZodInterfaceSchemaFile
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

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

import {
  generateZodSchemaFromOperation,
  generateZodInterfaceSchemaFile,
  getZodInterfaceSchemaTemplateByConfig,
} from '../interfaces';
import type { OpenApiOperation } from '@/types';
import { minimalApiConfig } from '../../../../../tests/fixtures/mockData';

describe('zod/interfaces', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.DEBUG;
  });

  describe('generateZodSchemaFromOperation - request body $ref', () => {
    it('request body 为 $ref 应返回 {Name}Schema 与 import', () => {
      const operation: OpenApiOperation = {
        requestBody: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CreateUserRequest' } },
          },
        },
      };
      const result = generateZodSchemaFromOperation(operation, 'request');
      expect(result.code).toBe('CreateUserRequestSchema');
      expect(result.imports).toEqual(['CreateUserRequestSchema']);
    });
  });

  describe('generateZodSchemaFromOperation - request parameters', () => {
    it('query/path 参数应生成 z.object（header 被过滤）', () => {
      const operation: OpenApiOperation = {
        parameters: [
          { name: 'page', in: 'query', type: 'number', required: true },
          { name: 'id', in: 'path', type: 'string', required: true },
          { name: 'X-Token', in: 'header', type: 'string', required: true },
        ],
      } as any;
      const result = generateZodSchemaFromOperation(operation, 'request');
      expect(result.code).toContain('z.object({');
      expect(result.code).toContain('page: z.number(),');
      expect(result.code).toContain('id: z.string(),');
      // header 参数不应出现
      expect(result.code).not.toContain('X-Token');
    });

    it('非 required 参数应加 .optional()', () => {
      const operation: OpenApiOperation = {
        parameters: [{ name: 'q', in: 'query', type: 'string', required: false }],
      } as any;
      const result = generateZodSchemaFromOperation(operation, 'request');
      expect(result.code).toContain('q: z.string().optional()');
    });

    it('无 body 无非 header 参数应返回 z.object({})', () => {
      const operation: OpenApiOperation = {
        parameters: [{ name: 'X-Token', in: 'header', type: 'string', required: true }],
      } as any;
      const result = generateZodSchemaFromOperation(operation, 'request');
      expect(result.code).toBe('z.object({})');
      expect(result.imports).toEqual([]);
    });
  });

  describe('generateZodSchemaFromOperation - response', () => {
    it('response 200 为 $ref 应返回 {Name}Schema', () => {
      const operation: OpenApiOperation = {
        responses: {
          '200': {
            description: 'ok',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
          },
        },
      } as any;
      const result = generateZodSchemaFromOperation(operation, 'response');
      expect(result.code).toBe('UserSchema');
      expect(result.imports).toEqual(['UserSchema']);
    });

    it('response 201 为 $ref 也应返回 {Name}Schema', () => {
      const operation: OpenApiOperation = {
        responses: {
          '201': {
            description: 'created',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
          },
        },
      } as any;
      const result = generateZodSchemaFromOperation(operation, 'response');
      expect(result.code).toBe('UserSchema');
    });

    it('无 200/201 应返回 z.object({})', () => {
      const operation: OpenApiOperation = {
        responses: { '404': { description: 'not found' } },
      } as any;
      const result = generateZodSchemaFromOperation(operation, 'response');
      expect(result.code).toBe('z.object({})');
    });
  });

  describe('generateZodInterfaceSchemaFile', () => {
    it('应生成含 request/response schema 与推导类型的完整文件', () => {
      const result = generateZodInterfaceSchemaFile(
        {
          operation: {
            requestBody: {
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/CreateUserRequest' },
                },
              },
            },
            responses: {
              '200': {
                content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
              },
            },
          },
          requestTypeName: 'CreateUserRequest',
          responseTypeName: 'CreateUserResponse',
        },
        { ...minimalApiConfig } as any,
      );
      expect(result.code).toContain('export const CreateUserRequestSchema =');
      expect(result.code).toContain('export const CreateUserResponseSchema =');
      expect(result.code).toContain('CreateUserRequestSchema');
      expect(result.code).toContain('UserSchema');
      // imports 应含 request 与 response 的 schema
      expect(result.imports).toContain('CreateUserRequestSchema');
      expect(result.imports).toContain('UserSchema');
    });
  });

  describe('getZodInterfaceSchemaTemplateByConfig', () => {
    it('comment=true 应含 @description 占位', () => {
      expect(getZodInterfaceSchemaTemplateByConfig(true)).toContain('{{#if requestDescription}}');
    });
    it('comment=false 应不含 @description 占位', () => {
      expect(getZodInterfaceSchemaTemplateByConfig(false)).not.toContain(
        '{{#if requestDescription}}',
      );
    });
  });
});

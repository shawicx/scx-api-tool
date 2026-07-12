/**
 * @description zod/merged.ts 单元测试
 * 覆盖 generateMergedSchemaFile（多接口循环 + typeImports 去重 + 命名回调注入）
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

import { generateMergedSchemaFile, getMergedSchemaTemplateByConfig } from '../merged';
import type { ApiInterface, OpenApiOperation } from '@/types';
import { minimalApiConfig } from '../../../../../tests/fixtures/mockData';

function makeInterface(path: string, method: string, operation: OpenApiOperation): ApiInterface {
  return { path, method, operation };
}

describe('zod/merged', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.DEBUG;
  });

  describe('generateMergedSchemaFile', () => {
    it('应为每个接口生成 request/response schema 并收集 schemaNames', () => {
      const interfaces = [
        makeInterface('/api/users', 'get', {
          responses: {
            '200': {
              content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
            },
          },
        } as any),
        makeInterface('/api/users', 'post', {
          requestBody: {
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/CreateUserRequest' } },
            },
          },
          responses: {
            '201': {
              content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
            },
          },
        } as any),
      ];

      const result = generateMergedSchemaFile(
        interfaces,
        { ...minimalApiConfig } as any,
        () => 'GetUsersRequest',
        () => 'GetUsersResponse',
      );

      expect(result.code).toContain('GetUsersRequestSchema');
      expect(result.code).toContain('GetUsersResponseSchema');
      // 每个接口贡献 request+response 两个 schemaName，2 个接口 → 4 项
      expect(result.schemaNames).toEqual([
        'GetUsersRequestSchema',
        'GetUsersResponseSchema',
        'GetUsersRequestSchema',
        'GetUsersResponseSchema',
      ]);
    });

    it('多个接口引用同一 schema 时 typeImports 应去重', () => {
      const interfaces = [
        makeInterface('/a', 'get', {
          responses: {
            '200': {
              content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
            },
          },
        } as any),
        makeInterface('/b', 'get', {
          responses: {
            '200': {
              content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
            },
          },
        } as any),
      ];

      const result = generateMergedSchemaFile(
        interfaces,
        { ...minimalApiConfig } as any,
        () => 'Req',
        () => 'Resp',
      );

      // import 块中 UserSchema 的 import 语句只应出现一次（typeImports 去重）
      // 注意：单行 import 同时含 `import { UserSchema }` 和路径 `from '../schemas/UserSchema'`
      // 故以 import 语句（路径）计数，而非名称出现次数
      const importBlock = result.code.split('export const')[0];
      const importStatements = importBlock.match(/from '\.\.\/schemas\/UserSchema'/g) || [];
      expect(importStatements.length).toBe(1);
    });

    it('operation.summary 应注入到 description（comment=true）', () => {
      const interfaces = [
        makeInterface('/api/users', 'get', {
          summary: '获取用户列表',
          responses: {
            '200': {
              content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
            },
          },
        } as any),
      ];

      const result = generateMergedSchemaFile(
        interfaces,
        { ...minimalApiConfig, comment: true } as any,
        () => 'ListUsersRequest',
        () => 'ListUsersResponse',
      );

      expect(result.code).toContain('获取用户列表');
      expect(result.code).toContain('ListUsersRequestSchema');
    });
  });

  describe('getMergedSchemaTemplateByConfig', () => {
    it('comment=true 应含 @description 占位', () => {
      expect(getMergedSchemaTemplateByConfig(true)).toContain('{{#if this.requestDescription}}');
    });
    it('comment=false 应不含 @description 占位', () => {
      expect(getMergedSchemaTemplateByConfig(false)).not.toContain(
        '{{#if this.requestDescription}}',
      );
    });
  });
});

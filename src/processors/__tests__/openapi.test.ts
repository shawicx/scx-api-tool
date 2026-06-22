/**
 * @description processors/openapi.ts 测试
 * 测试 OpenAPI 数据处理模块的核心功能
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ServerType } from '@/types';
import type { OpenApiDocument } from '@/types';
import { processOpenApiData, ProcessedApiData } from '../openapi';
import {
  mockOpenApiDocument,
  emptyOpenApiDocument,
  minimalApiConfig,
  apifoxApiConfig,
} from '../../../tests/fixtures/mockData';

// 抑制 consola 日志噪音
vi.mock('consola', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    log: vi.fn(),
    ready: vi.fn(),
    start: vi.fn(),
    box: vi.fn(),
  },
}));

// Mock sanitizeTypeName to return predictable names for testing
vi.mock('@/naming', () => ({
  sanitizeTypeName: vi.fn((name: string) => name),
}));

// ==================== processOpenApiData ====================

describe('processOpenApiData', () => {
  describe('with standard OpenAPI document', () => {
    it('should extract interfaces from paths', () => {
      const result = processOpenApiData(mockOpenApiDocument, minimalApiConfig);

      expect(result.interfaces).toHaveLength(3);
      expect(result.interfaces[0].path).toBe('/api/users');
      expect(result.interfaces[0].method).toBe('get');
      expect(result.interfaces[1].path).toBe('/api/users');
      expect(result.interfaces[1].method).toBe('post');
      expect(result.interfaces[2].path).toBe('/api/users/{id}');
      expect(result.interfaces[2].method).toBe('get');
    });

    it('should preserve operation data in interfaces', () => {
      const result = processOpenApiData(mockOpenApiDocument, minimalApiConfig);

      const getUsersOp = result.interfaces.find(
        (i) => i.path === '/api/users' && i.method === 'get',
      );
      expect(getUsersOp).toBeDefined();
      expect(getUsersOp!.operation.summary).toBe('获取用户列表');
      expect(getUsersOp!.operation.tags).toEqual(['用户管理']);
      expect(getUsersOp!.operation.parameters).toHaveLength(1);
    });

    it('should extract types from components/schemas', () => {
      const result = processOpenApiData(mockOpenApiDocument, minimalApiConfig);

      expect(result.types.length).toBeGreaterThanOrEqual(3);
      const typeNames = result.types.map((t) => t.name);
      expect(typeNames).toContain('User');
      expect(typeNames).toContain('CreateUserRequest');
      expect(typeNames).toContain('UserListResponse');
    });

    it('should preserve originalName on type definitions', () => {
      const result = processOpenApiData(mockOpenApiDocument, minimalApiConfig);

      const userType = result.types.find((t) => t.name === 'User');
      expect(userType).toBeDefined();
      expect(userType!.originalName).toBe('User');
    });

    it('should preserve schema on type definitions', () => {
      const result = processOpenApiData(mockOpenApiDocument, minimalApiConfig);

      const userType = result.types.find((t) => t.name === 'User');
      expect(userType).toBeDefined();
      expect(userType!.schema).toHaveProperty('type', 'object');
      expect(userType!.schema).toHaveProperty('properties');
    });

    it('should extract categories from tags', () => {
      const result = processOpenApiData(mockOpenApiDocument, minimalApiConfig);

      expect(result.categories).toHaveLength(2);
      expect(result.categories[0].name).toBe('用户管理');
      expect(result.categories[0].description).toBe('用户相关接口');
      expect(result.categories[1].name).toBe('system');
      expect(result.categories[1].description).toBe('系统接口');
    });
  });

  describe('with empty document', () => {
    it('should return empty arrays when document has no paths, schemas, or tags', () => {
      const result = processOpenApiData(emptyOpenApiDocument, minimalApiConfig);

      expect(result.interfaces).toEqual([]);
      expect(result.types).toEqual([]);
      expect(result.categories).toEqual([]);
    });

    it('should return ProcessedApiData structure', () => {
      const result = processOpenApiData(emptyOpenApiDocument, minimalApiConfig);

      expect(result).toHaveProperty('interfaces');
      expect(result).toHaveProperty('types');
      expect(result).toHaveProperty('categories');
      expect(Array.isArray(result.interfaces)).toBe(true);
      expect(Array.isArray(result.types)).toBe(true);
      expect(Array.isArray(result.categories)).toBe(true);
    });
  });

  describe('with pathPrefix', () => {
    it('should strip prefix from paths when pathPrefix is set', () => {
      const configWithPathPrefix = {
        ...minimalApiConfig,
        pathPrefix: '/api',
      };

      const result = processOpenApiData(mockOpenApiDocument, configWithPathPrefix);

      // /api/users -> /users, /api/users/{id} -> /users/{id}
      const paths = result.interfaces.map((i) => i.path);
      expect(paths).toContain('/users');
      expect(paths).toContain('/users/{id}');
      // Should NOT contain /api prefix
      expect(paths.some((p) => p.startsWith('/api'))).toBe(false);
    });

    it('should not modify paths when pathPrefix is empty string', () => {
      const result = processOpenApiData(mockOpenApiDocument, minimalApiConfig);

      const paths = result.interfaces.map((i) => i.path);
      expect(paths).toContain('/api/users');
      expect(paths).toContain('/api/users/{id}');
    });

    it('should not modify paths when pathPrefix does not match', () => {
      const configWithPathPrefix = {
        ...minimalApiConfig,
        pathPrefix: '/v2',
      };

      const result = processOpenApiData(mockOpenApiDocument, configWithPathPrefix);

      const paths = result.interfaces.map((i) => i.path);
      expect(paths).toContain('/api/users');
      expect(paths).toContain('/api/users/{id}');
    });
  });

  describe('for Swagger server type (non-Apifox)', () => {
    it('should pass through operations without modification', () => {
      const result = processOpenApiData(mockOpenApiDocument, minimalApiConfig);

      // For Swagger, operation data should be preserved as-is
      const getUsersOp = result.interfaces.find(
        (i) => i.path === '/api/users' && i.method === 'get',
      );
      expect(getUsersOp!.operation.summary).toBe('获取用户列表');
      expect(getUsersOp!.operation.tags).toEqual(['用户管理']);
      // Parameters should be preserved exactly
      expect(getUsersOp!.operation.parameters).toEqual(
        mockOpenApiDocument.paths!['/api/users'].get.parameters,
      );
    });
  });

  describe('debug mode', () => {
    beforeEach(() => {
      vi.stubEnv('DEBUG', '1');
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('should call consola.debug when DEBUG is set', async () => {
      // Import the mocked consola to verify calls
      const consola = await import('consola');

      processOpenApiData(mockOpenApiDocument, minimalApiConfig);

      expect(consola.default.debug).toHaveBeenCalled();
    });

    it('should log data keys, first path entry, tags, and counts in debug mode', async () => {
      const consola = await import('consola');

      processOpenApiData(mockOpenApiDocument, minimalApiConfig);

      const debugCalls = (consola.default.debug as ReturnType<typeof vi.fn>).mock.calls;

      // Should log data keys
      expect(
        debugCalls.some((call: any[]) =>
          call.some((arg: any) => typeof arg === 'string' && arg.includes('数据键')),
        ),
      ).toBe(true);
      // Should log first path entry
      expect(
        debugCalls.some((call: any[]) =>
          call.some((arg: any) => typeof arg === 'string' && arg.includes('第一个路径条目')),
        ),
      ).toBe(true);
      // Should log tags
      expect(
        debugCalls.some((call: any[]) =>
          call.some((arg: any) => typeof arg === 'string' && arg.includes('标签')),
        ),
      ).toBe(true);
      // Should log final counts
      expect(
        debugCalls.some((call: any[]) =>
          call.some((arg: any) => typeof arg === 'string' && arg.includes('Processed')),
        ),
      ).toBe(true);
    });
  });
});

// ==================== Re-exports from common.ts ====================

describe('re-exports from common.ts', () => {
  it('should re-export groupInterfacesByTag', async () => {
    const module = await import('../openapi');
    expect(module.groupInterfacesByTag).toBeDefined();
    expect(typeof module.groupInterfacesByTag).toBe('function');
  });

  it('should re-export extractUsedTypeNames', async () => {
    const module = await import('../openapi');
    expect(module.extractUsedTypeNames).toBeDefined();
    expect(typeof module.extractUsedTypeNames).toBe('function');
  });
});

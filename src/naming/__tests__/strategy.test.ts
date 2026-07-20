/**
 * @description strategy.ts 单元测试
 */

import { describe, it, expect, vi } from 'vitest';
import { defaultNamingStrategy, applyNamingStrategy } from '../strategy';
import type { NamingContext } from '@/types';
import { minimalApiConfig } from '../../../tests/fixtures/mockData';

/**
 * Helper to create a NamingContext with sensible defaults
 */
function createNamingContext(
  overrides: Partial<Omit<NamingContext, 'config'>> & { config?: NamingContext['config'] } = {},
): NamingContext {
  return {
    path: '/api/users',
    method: 'GET',
    config: overrides.config ?? minimalApiConfig,
    ...overrides,
  };
}

describe('defaultNamingStrategy', () => {
  describe('interfaceName', () => {
    it('should generate interface name for simple GET path', () => {
      const ctx = createNamingContext({ path: '/api/users', method: 'GET' });
      const result = defaultNamingStrategy.interfaceName(ctx);

      expect(result).toBe('GetApiUsers');
    });

    it('should generate interface name with path parameter', () => {
      const ctx = createNamingContext({ path: '/api/users/{id}', method: 'GET' });
      const result = defaultNamingStrategy.interfaceName(ctx);

      expect(result).toBe('GetApiUsersById');
    });

    it('should generate interface name for POST method', () => {
      const ctx = createNamingContext({ path: '/api/users', method: 'POST' });
      const result = defaultNamingStrategy.interfaceName(ctx);

      expect(result).toBe('PostApiUsers');
    });

    it('should generate interface name for DELETE method', () => {
      const ctx = createNamingContext({ path: '/api/users/{id}', method: 'DELETE' });
      const result = defaultNamingStrategy.interfaceName(ctx);

      expect(result).toBe('DeleteApiUsersById');
    });

    it('should handle nested paths', () => {
      const ctx = createNamingContext({
        path: '/api/users/{userId}/posts/{postId}',
        method: 'GET',
      });
      const result = defaultNamingStrategy.interfaceName(ctx);

      expect(result).toBe('GetApiUsersPostsByUserIdByPostId');
    });
  });

  describe('functionName', () => {
    it('should generate function name for simple GET path', () => {
      const ctx = createNamingContext({ path: '/api/users', method: 'GET' });
      const result = defaultNamingStrategy.functionName(ctx);

      expect(result).toBe('getApiUsersFunc');
    });

    it('should generate function name with path parameter', () => {
      const ctx = createNamingContext({ path: '/api/users/{id}', method: 'GET' });
      const result = defaultNamingStrategy.functionName(ctx);

      // 正确提取参数名 "id" 并生成 "ById"
      expect(result).toBe('getApiUsersByIdFunc');
    });

    it('should generate function name for POST method', () => {
      const ctx = createNamingContext({ path: '/api/users', method: 'POST' });
      const result = defaultNamingStrategy.functionName(ctx);

      expect(result).toBe('postApiUsersFunc');
    });

    it('should generate function name for DELETE with parameter', () => {
      const ctx = createNamingContext({ path: '/api/users/{id}', method: 'DELETE' });
      const result = defaultNamingStrategy.functionName(ctx);

      // 正确提取参数名 "id" 并生成 "ById"
      expect(result).toBe('deleteApiUsersByIdFunc');
    });
  });

  describe('requestTypeName', () => {
    it('should append RequestType to interface name', () => {
      const ctx = createNamingContext({ path: '/api/users', method: 'GET' });
      const result = defaultNamingStrategy.requestTypeName(ctx);

      expect(result).toBe('GetApiUsersRequestType');
    });

    it('should append RequestType to interface name with parameter', () => {
      const ctx = createNamingContext({ path: '/api/users/{id}', method: 'GET' });
      const result = defaultNamingStrategy.requestTypeName(ctx);

      expect(result).toBe('GetApiUsersByIdRequestType');
    });
  });

  describe('responseTypeName', () => {
    it('should append Result to interface name', () => {
      const ctx = createNamingContext({ path: '/api/users', method: 'GET' });
      const result = defaultNamingStrategy.responseTypeName(ctx);

      expect(result).toBe('GetUsersResult');
    });

    it('should append Result to interface name with parameter', () => {
      const ctx = createNamingContext({ path: '/api/users/{id}', method: 'GET' });
      const result = defaultNamingStrategy.responseTypeName(ctx);

      expect(result).toBe('GetUsersByIdResult');
    });
  });
});

describe('applyNamingStrategy', () => {
  it('should use default strategy when no custom strategy is provided', () => {
    const ctx = createNamingContext({ path: '/api/users', method: 'GET' });
    const result = applyNamingStrategy(ctx);

    expect(result.interfaceName).toBe('GetApiUsers');
    expect(result.functionName).toBe('getApiUsersFunc');
    expect(result.requestTypeName).toBe('GetApiUsersRequestType');
    expect(result.responseTypeName).toBe('GetUsersResult');
  });

  it('should override interfaceName with custom strategy', () => {
    const ctx = createNamingContext({ path: '/api/users', method: 'GET' });
    const customStrategy = {
      interfaceName: () => 'CustomInterface',
    };

    const result = applyNamingStrategy(ctx, customStrategy);

    expect(result.interfaceName).toBe('CustomInterface');
    // Other fields still use defaults
    expect(result.functionName).toBe('getApiUsersFunc');
  });

  it('should override functionName with custom strategy', () => {
    const ctx = createNamingContext({ path: '/api/users', method: 'GET' });
    const customStrategy = {
      functionName: () => 'customApiCall',
    };

    const result = applyNamingStrategy(ctx, customStrategy);

    expect(result.functionName).toBe('customApiCall');
    expect(result.interfaceName).toBe('GetApiUsers');
  });

  it('should override requestTypeName with custom strategy', () => {
    const ctx = createNamingContext({ path: '/api/users', method: 'GET' });
    const customStrategy = {
      requestTypeName: () => 'CustomRequest',
    };

    const result = applyNamingStrategy(ctx, customStrategy);

    expect(result.requestTypeName).toBe('CustomRequest');
    expect(result.responseTypeName).toBe('GetUsersResult');
  });

  it('should override responseTypeName with custom strategy', () => {
    const ctx = createNamingContext({ path: '/api/users', method: 'GET' });
    const customStrategy = {
      responseTypeName: () => 'CustomResponse',
    };

    const result = applyNamingStrategy(ctx, customStrategy);

    expect(result.responseTypeName).toBe('CustomResponse');
    expect(result.interfaceName).toBe('GetApiUsers');
  });

  it('should allow overriding all strategies at once', () => {
    const ctx = createNamingContext({ path: '/api/users', method: 'GET' });
    const customStrategy = {
      interfaceName: () => 'FullCustomInterface',
      functionName: () => 'fullCustomFunc',
      requestTypeName: () => 'FullCustomRequest',
      responseTypeName: () => 'FullCustomResponse',
    };

    const result = applyNamingStrategy(ctx, customStrategy);

    expect(result.interfaceName).toBe('FullCustomInterface');
    expect(result.functionName).toBe('fullCustomFunc');
    expect(result.requestTypeName).toBe('FullCustomRequest');
    expect(result.responseTypeName).toBe('FullCustomResponse');
  });

  it('should pass context to custom strategy functions', () => {
    const mockInterfaceName = vi.fn().mockReturnValue('MockedName');
    const ctx = createNamingContext({ path: '/api/test', method: 'POST' });

    applyNamingStrategy(ctx, { interfaceName: mockInterfaceName });

    expect(mockInterfaceName).toHaveBeenCalledWith(ctx);
  });
});

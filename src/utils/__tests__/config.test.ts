/**
 * @description config.ts 单元测试
 */

import { describe, it, expect, vi } from 'vitest';
import {
  defineConfig,
  parseSourceUrl,
  isGetLikeMethod,
  isPostLikeMethod,
  assertValidMethod,
  getFileExtension,
  HTTP_METHODS,
  PRESETS,
} from '../config';
import { RequestMethod, ServerType } from '@/types';
import type { UserConfig } from '@/types';

// Mock consola
vi.mock('consola', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    success: vi.fn(),
  },
}));

describe('parseSourceUrl', () => {
  it('should parse a Swagger URL correctly', () => {
    const result = parseSourceUrl('https://petstore.swagger.io/v2/swagger.json');

    expect(result.serverUrl).toBe('https://petstore.swagger.io');
    expect(result.serverType).toBe(ServerType.Swagger);
    expect(result.apifoxProjectId).toBeUndefined();
  });

  it('should parse an Apifox URL and extract projectId', () => {
    const result = parseSourceUrl('https://api.apifox.com/v1/projects/6997172/export-openapi');

    expect(result.serverUrl).toBe('https://api.apifox.com');
    expect(result.serverType).toBe(ServerType.Apifox);
    expect(result.apifoxProjectId).toBe('6997172');
  });

  it('should parse an Apifox URL without extracting projectId when path has no project ID', () => {
    const result = parseSourceUrl('https://app.apifox.com/some/other/path');

    expect(result.serverUrl).toBe('https://app.apifox.com');
    expect(result.serverType).toBe(ServerType.Apifox);
    expect(result.apifoxProjectId).toBeUndefined();
  });

  it('should throw for an invalid URL', () => {
    expect(() => parseSourceUrl('not-a-valid-url')).toThrow('Invalid source URL format');
  });

  it('should throw for an empty string URL', () => {
    expect(() => parseSourceUrl('')).toThrow('Invalid source URL format');
  });

  it('should preserve port in serverUrl', () => {
    const result = parseSourceUrl('http://localhost:8080/api/docs');

    expect(result.serverUrl).toBe('http://localhost:8080');
    expect(result.serverType).toBe(ServerType.Swagger);
  });
});

describe('defineConfig', () => {
  it('should create a standard config from a Swagger source', () => {
    const userConfig: UserConfig = {
      source: 'https://petstore.swagger.io/v2/swagger.json',
      token: '',
    };

    const config = defineConfig(userConfig);

    expect(config.serverUrl).toBe('https://petstore.swagger.io');
    expect(config.serverType).toBe(ServerType.Swagger);
    expect(config.source).toBe('https://petstore.swagger.io/v2/swagger.json');
    expect(config.token).toBe('');
    expect(config.generateApi).toBe(true);
    expect(config.generateTypes).toBe(true);
    expect(config.target).toBe('typescript');
    expect(config.outputDir).toBe('src/service');
    expect(config.indentSize).toBe(2);
    expect(config.comment).toBe(true);
    expect(config.concurrency).toBe(50);
  });

  it('should apply a preset when specified', () => {
    const userConfig: UserConfig = {
      source: 'https://petstore.swagger.io/v2/swagger.json',
      token: '',
      preset: 'verbose',
    };

    const config = defineConfig(userConfig);

    // verbose preset overrides indentSize to 4
    expect(config.indentSize).toBe(4);
    // verbose preset uses BOTH requestMethodStyle
    expect(config.requestMethodStyle).toBe('both');
  });

  it('should apply the minimal preset correctly', () => {
    const userConfig: UserConfig = {
      source: 'https://petstore.swagger.io/v2/swagger.json',
      token: '',
      preset: 'minimal',
    };

    const config = defineConfig(userConfig);

    // minimal preset sets generateApi to false and comment to false
    expect(config.generateApi).toBe(false);
    expect(config.comment).toBe(false);
    expect(config.generateTypes).toBe(true);
  });

  it('should adjust requestFunctionFilePath extension for javascript target', () => {
    const userConfig: UserConfig = {
      source: 'https://petstore.swagger.io/v2/swagger.json',
      token: '',
      target: 'javascript',
    };

    const config = defineConfig(userConfig);

    expect(config.target).toBe('javascript');
    expect(config.requestFunctionFilePath).toBe('src/service/request.js');
  });

  it('should NOT adjust requestFunctionFilePath when user provides a custom path', () => {
    const userConfig: UserConfig = {
      source: 'https://petstore.swagger.io/v2/swagger.json',
      token: '',
      target: 'javascript',
      requestFunctionFilePath: 'src/custom/request.ts',
    };

    const config = defineConfig(userConfig);

    // When user explicitly sets requestFunctionFilePath, it should not be overridden
    expect(config.requestFunctionFilePath).toBe('src/custom/request.ts');
  });

  it('should pass namingStrategy through when provided', () => {
    const customStrategy = {
      interfaceName: () => 'CustomInterface',
    };

    const userConfig: UserConfig = {
      source: 'https://petstore.swagger.io/v2/swagger.json',
      token: '',
      namingStrategy: customStrategy,
    };

    const config = defineConfig(userConfig);

    expect(config.namingStrategy).toBe(customStrategy);
  });

  it('should pass hooks through when provided', () => {
    const hooks = {
      beforeGenerate: vi.fn(),
      afterGenerate: vi.fn(),
    };

    const userConfig: UserConfig = {
      source: 'https://petstore.swagger.io/v2/swagger.json',
      token: '',
      hooks,
    };

    const config = defineConfig(userConfig);

    expect(config.hooks).toBe(hooks);
  });

  it('should merge user values over preset values', () => {
    const userConfig: UserConfig = {
      source: 'https://petstore.swagger.io/v2/swagger.json',
      token: '',
      preset: 'verbose',
      indentSize: 8, // override the verbose preset's indentSize of 4
    };

    const config = defineConfig(userConfig);

    expect(config.indentSize).toBe(8);
  });
});

describe('isGetLikeMethod', () => {
  it('should return true for GET', () => {
    expect(isGetLikeMethod(RequestMethod.GET)).toBe(true);
  });

  it('should return true for OPTIONS', () => {
    expect(isGetLikeMethod(RequestMethod.OPTIONS)).toBe(true);
  });

  it('should return true for HEAD', () => {
    expect(isGetLikeMethod(RequestMethod.HEAD)).toBe(true);
  });

  it('should return false for POST', () => {
    expect(isGetLikeMethod(RequestMethod.POST)).toBe(false);
  });

  it('should return false for PUT', () => {
    expect(isGetLikeMethod(RequestMethod.PUT)).toBe(false);
  });

  it('should return false for DELETE', () => {
    expect(isGetLikeMethod(RequestMethod.DELETE)).toBe(false);
  });

  it('should return false for PATCH', () => {
    expect(isGetLikeMethod(RequestMethod.PATCH)).toBe(false);
  });
});

describe('isPostLikeMethod', () => {
  it('should return true for POST', () => {
    expect(isPostLikeMethod(RequestMethod.POST)).toBe(true);
  });

  it('should return true for PUT', () => {
    expect(isPostLikeMethod(RequestMethod.PUT)).toBe(true);
  });

  it('should return true for DELETE', () => {
    expect(isPostLikeMethod(RequestMethod.DELETE)).toBe(true);
  });

  it('should return true for PATCH', () => {
    expect(isPostLikeMethod(RequestMethod.PATCH)).toBe(true);
  });

  it('should return false for GET', () => {
    expect(isPostLikeMethod(RequestMethod.GET)).toBe(false);
  });

  it('should return false for OPTIONS', () => {
    expect(isPostLikeMethod(RequestMethod.OPTIONS)).toBe(false);
  });

  it('should return false for HEAD', () => {
    expect(isPostLikeMethod(RequestMethod.HEAD)).toBe(false);
  });
});

describe('assertValidMethod', () => {
  it('should not throw for valid HTTP methods', () => {
    expect(() => assertValidMethod('GET')).not.toThrow();
    expect(() => assertValidMethod('POST')).not.toThrow();
    expect(() => assertValidMethod('PUT')).not.toThrow();
    expect(() => assertValidMethod('DELETE')).not.toThrow();
    expect(() => assertValidMethod('PATCH')).not.toThrow();
    expect(() => assertValidMethod('HEAD')).not.toThrow();
    expect(() => assertValidMethod('OPTIONS')).not.toThrow();
  });

  it('should not throw for lowercase valid HTTP methods', () => {
    expect(() => assertValidMethod('get')).not.toThrow();
    expect(() => assertValidMethod('post')).not.toThrow();
  });

  it('should throw for invalid HTTP methods', () => {
    expect(() => assertValidMethod('INVALID')).toThrow('Invalid HTTP method: INVALID');
  });

  it('should throw for an empty string', () => {
    expect(() => assertValidMethod('')).toThrow('Invalid HTTP method');
  });
});

describe('getFileExtension', () => {
  it('should return .ts for typescript target', () => {
    expect(getFileExtension('typescript')).toBe('.ts');
  });

  it('should return .js for javascript target', () => {
    expect(getFileExtension('javascript')).toBe('.js');
  });
});

describe('HTTP_METHODS', () => {
  it('should contain all standard HTTP methods', () => {
    expect(HTTP_METHODS.GET).toBe('get');
    expect(HTTP_METHODS.POST).toBe('post');
    expect(HTTP_METHODS.PUT).toBe('put');
    expect(HTTP_METHODS.DELETE).toBe('delete');
    expect(HTTP_METHODS.PATCH).toBe('patch');
    expect(HTTP_METHODS.HEAD).toBe('head');
    expect(HTTP_METHODS.OPTIONS).toBe('options');
  });

  it('should have exactly 7 methods', () => {
    expect(Object.keys(HTTP_METHODS)).toHaveLength(7);
  });
});

describe('PRESETS', () => {
  it('should be re-exported and have minimal, standard, verbose keys', () => {
    expect(PRESETS).toBeDefined();
    expect(PRESETS.minimal).toBeDefined();
    expect(PRESETS.standard).toBeDefined();
    expect(PRESETS.verbose).toBeDefined();
  });

  it('should have correct minimal preset values', () => {
    expect(PRESETS.minimal.generateApi).toBe(false);
    expect(PRESETS.minimal.generateTypes).toBe(true);
    expect(PRESETS.minimal.comment).toBe(false);
  });

  it('should have correct verbose preset values', () => {
    expect(PRESETS.verbose.generateApi).toBe(true);
    expect(PRESETS.verbose.indentSize).toBe(4);
  });
});

/**
 * @description requestFileGenerator.ts 单元测试
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import type { ApiConfig } from '../../../types';
import { RequestMethodStyle } from '../../../types';
import { minimalApiConfig } from '../../../../tests/fixtures/mockData';
import { generateRequestFile } from '../requestFileGenerator';
import { templateCache } from '../templateCache';

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

describe('generateRequestFile', () => {
  afterEach(() => {
    templateCache.clear();
  });

  // ==================== TypeScript + CONFIG ====================

  describe('TypeScript + CONFIG style', () => {
    it('should include AxiosRequestConfig import and RequestConfig interface', () => {
      const config: ApiConfig = {
        ...minimalApiConfig,
        target: 'typescript',
        requestMethodStyle: RequestMethodStyle.CONFIG,
      };

      const result = generateRequestFile(config);

      expect(result).toContain("import type { AxiosRequestConfig } from 'axios'");
      expect(result).toContain('export interface RequestConfig extends AxiosRequestConfig');
      expect(result).toContain('url: string');
      expect(result).toContain('method: RequestMethod');
      // TS 模式应导出 RequestMethod 常量对象（as const，替代 enum）及同名类型
      expect(result).toContain('export const RequestMethod');
      expect(result).toContain('} as const');
      expect(result).toContain('export type RequestMethod');
    });

    it('should NOT include method-specific functions in CONFIG style', () => {
      const config: ApiConfig = {
        ...minimalApiConfig,
        target: 'typescript',
        requestMethodStyle: RequestMethodStyle.CONFIG,
      };

      const result = generateRequestFile(config);

      expect(result).not.toContain('export const requestMethods');
      expect(result).not.toContain('METHOD_MAP');
    });

    it('should include the main request function with type annotations', () => {
      const config: ApiConfig = {
        ...minimalApiConfig,
        target: 'typescript',
        requestMethodStyle: RequestMethodStyle.CONFIG,
      };

      const result = generateRequestFile(config);

      expect(result).toContain('export async function request');
      expect(result).toContain(': Promise<T>');
      expect(result).toContain('config: RequestConfig');
      expect(result).toContain('<T = any>');
    });
  });

  // ==================== TypeScript + METHOD_SPECIFIC ====================

  describe('TypeScript + METHOD_SPECIFIC style', () => {
    it('should include method-specific functions with type annotations', () => {
      const config: ApiConfig = {
        ...minimalApiConfig,
        target: 'typescript',
        requestMethodStyle: RequestMethodStyle.METHOD_SPECIFIC,
      };

      const result = generateRequestFile(config);

      expect(result).toContain('export const requestMethods');
      // Check individual method functions are present with TS types
      expect(result).toMatch(/get.*\(url: string/);
      expect(result).toMatch(/post.*\(url: string/);
      expect(result).toMatch(/put.*\(url: string/);
      expect(result).toMatch(/delete.*\(url: string/);
      expect(result).toMatch(/patch.*\(url: string/);
      expect(result).toMatch(/head.*\(url: string/);
      expect(result).toMatch(/options.*\(url: string/);
    });

    it('should NOT include METHOD_MAP for METHOD_SPECIFIC style', () => {
      const config: ApiConfig = {
        ...minimalApiConfig,
        target: 'typescript',
        requestMethodStyle: RequestMethodStyle.METHOD_SPECIFIC,
      };

      const result = generateRequestFile(config);

      expect(result).not.toContain('METHOD_MAP');
    });

    it('should include RequestConfig in method-specific functions', () => {
      const config: ApiConfig = {
        ...minimalApiConfig,
        target: 'typescript',
        requestMethodStyle: RequestMethodStyle.METHOD_SPECIFIC,
      };

      const result = generateRequestFile(config);

      expect(result).toContain('config: RequestConfig');
    });
  });

  // ==================== TypeScript + BOTH ====================

  describe('TypeScript + BOTH style', () => {
    it('should include both method-specific functions AND METHOD_MAP', () => {
      const config: ApiConfig = {
        ...minimalApiConfig,
        target: 'typescript',
        requestMethodStyle: RequestMethodStyle.BOTH,
      };

      const result = generateRequestFile(config);

      expect(result).toContain('export const requestMethods');
      expect(result).toContain('METHOD_MAP');
      expect(result).toContain('as const');
    });

    it('should reference requestMethods in METHOD_MAP entries', () => {
      const config: ApiConfig = {
        ...minimalApiConfig,
        target: 'typescript',
        requestMethodStyle: RequestMethodStyle.BOTH,
      };

      const result = generateRequestFile(config);

      expect(result).toContain('GET: requestMethods.get');
      expect(result).toContain('POST: requestMethods.post');
      expect(result).toContain('PUT: requestMethods.put');
      expect(result).toContain('DELETE: requestMethods.delete');
      expect(result).toContain('PATCH: requestMethods.patch');
      expect(result).toContain('HEAD: requestMethods.head');
      expect(result).toContain('OPTIONS: requestMethods.options');
    });

    it('should include AxiosRequestConfig import', () => {
      const config: ApiConfig = {
        ...minimalApiConfig,
        target: 'typescript',
        requestMethodStyle: RequestMethodStyle.BOTH,
      };

      const result = generateRequestFile(config);

      expect(result).toContain("import type { AxiosRequestConfig } from 'axios'");
    });
  });

  // ==================== JavaScript + CONFIG ====================

  describe('JavaScript + CONFIG style', () => {
    it('should NOT include AxiosRequestConfig import for JavaScript', () => {
      const config: ApiConfig = {
        ...minimalApiConfig,
        target: 'javascript',
        requestMethodStyle: RequestMethodStyle.CONFIG,
      };

      const result = generateRequestFile(config);

      expect(result).not.toContain('AxiosRequestConfig');
    });

    it('should NOT include RequestConfig interface for JavaScript', () => {
      const config: ApiConfig = {
        ...minimalApiConfig,
        target: 'javascript',
        requestMethodStyle: RequestMethodStyle.CONFIG,
      };

      const result = generateRequestFile(config);

      expect(result).not.toContain('RequestConfig');
    });

    it('should NOT include type annotations for JavaScript', () => {
      const config: ApiConfig = {
        ...minimalApiConfig,
        target: 'javascript',
        requestMethodStyle: RequestMethodStyle.CONFIG,
      };

      const result = generateRequestFile(config);

      expect(result).not.toContain('<T = any>');
      expect(result).not.toContain(': Promise<T>');
      expect(result).not.toContain('config: RequestConfig');
    });

    it('should still include core request function without types', () => {
      const config: ApiConfig = {
        ...minimalApiConfig,
        target: 'javascript',
        requestMethodStyle: RequestMethodStyle.CONFIG,
      };

      const result = generateRequestFile(config);

      expect(result).toContain('export async function request');
      expect(result).toContain('axios');
    });
  });

  // ==================== JavaScript + METHOD_SPECIFIC ====================

  describe('JavaScript + METHOD_SPECIFIC style', () => {
    it('should include method-specific functions without TypeScript types', () => {
      const config: ApiConfig = {
        ...minimalApiConfig,
        target: 'javascript',
        requestMethodStyle: RequestMethodStyle.METHOD_SPECIFIC,
      };

      const result = generateRequestFile(config);

      expect(result).toContain('export const requestMethods');
      // No TypeScript generic annotations
      expect(result).not.toContain('<T = any>');
    });

    it('should have method functions with plain JS signatures', () => {
      const config: ApiConfig = {
        ...minimalApiConfig,
        target: 'javascript',
        requestMethodStyle: RequestMethodStyle.METHOD_SPECIFIC,
      };

      const result = generateRequestFile(config);

      // In JS mode, params use plain identifiers without types
      expect(result).toMatch(/get:\s*\(url,\s*params,\s*options = \{\}\)/);
      expect(result).toMatch(/post:\s*\(url,\s*data,\s*params,\s*options = \{\}\)/);
    });

    it('should NOT include METHOD_MAP for JavaScript', () => {
      const config: ApiConfig = {
        ...minimalApiConfig,
        target: 'javascript',
        requestMethodStyle: RequestMethodStyle.BOTH,
      };

      const result = generateRequestFile(config);

      // METHOD_MAP is only for TypeScript + BOTH
      expect(result).not.toContain('METHOD_MAP');
    });
  });

  // ==================== Common content ====================

  describe('common content across all configurations', () => {
    it('should always include axios import', () => {
      const configs: ApiConfig[] = [
        {
          ...minimalApiConfig,
          target: 'typescript',
          requestMethodStyle: RequestMethodStyle.CONFIG,
        },
        {
          ...minimalApiConfig,
          target: 'javascript',
          requestMethodStyle: RequestMethodStyle.CONFIG,
        },
      ];

      for (const config of configs) {
        const result = generateRequestFile(config);
        expect(result).toContain("import axios from 'axios'");
      }
    });

    it('should always include consola import', () => {
      const config: ApiConfig = {
        ...minimalApiConfig,
        target: 'typescript',
        requestMethodStyle: RequestMethodStyle.CONFIG,
      };

      const result = generateRequestFile(config);
      expect(result).toContain("import consola from 'consola'");
    });

    it('should always include TIMEOUT constants', () => {
      const config: ApiConfig = {
        ...minimalApiConfig,
        target: 'typescript',
        requestMethodStyle: RequestMethodStyle.CONFIG,
      };

      const result = generateRequestFile(config);
      expect(result).toContain('TIMEOUT');
      expect(result).toContain('5 * 1000');
    });

    it('should not hardcode axios baseURL', () => {
      const config: ApiConfig = {
        ...minimalApiConfig,
        target: 'typescript',
        requestMethodStyle: RequestMethodStyle.CONFIG,
      };

      const result = generateRequestFile(config);

      expect(result).not.toContain('BASE_LINE_PROXY_PATH');
      expect(result).not.toContain("baseURL: '/api'");
      expect(result).not.toMatch(/baseURL:\s*BASE_LINE_PROXY_PATH/);
    });

    it('should preserve caller config and disable default timeout for upload bodies', () => {
      const config: ApiConfig = {
        ...minimalApiConfig,
        target: 'typescript',
        requestMethodStyle: RequestMethodStyle.CONFIG,
      };

      const result = generateRequestFile(config);

      expect(result).toContain('const isUploadData =');
      expect(result).toContain('data instanceof FormData || data instanceof Blob');
      expect(result).toContain(
        'timeout: config.timeout ?? (isUploadData(config.data) ? 0 : TIMEOUT)',
      );
      expect(result).toContain('...config');
      expect(result).not.toContain('config.signal =');
    });

    it('method-specific wrappers should accept options and preserve undefined data/params', () => {
      const config: ApiConfig = {
        ...minimalApiConfig,
        target: 'typescript',
        requestMethodStyle: RequestMethodStyle.METHOD_SPECIFIC,
      };

      const result = generateRequestFile(config);

      expect(result).toContain('options: Omit<RequestConfig,');
      expect(result).toContain('if (data !== undefined)');
      expect(result).toContain('if (params !== undefined)');
      expect(result).toContain('...options');
    });

    it('JavaScript request file should not contain TypeScript annotations', () => {
      const config: ApiConfig = {
        ...minimalApiConfig,
        target: 'javascript',
        requestMethodStyle: RequestMethodStyle.METHOD_SPECIFIC,
      };

      const result = generateRequestFile(config);

      expect(result).toContain('const isUploadData = (data) =>');
      expect(result).not.toContain('data: unknown');
      expect(result).toContain('options = {}');
      expect(result).not.toContain('options: Omit');
    });
  });

  // ==================== Custom names ====================

  describe('custom requestFunctionName and requestMethodsObjectName', () => {
    it('should use custom requestFunctionName in the generated code', () => {
      const config: ApiConfig = {
        ...minimalApiConfig,
        target: 'typescript',
        requestMethodStyle: RequestMethodStyle.CONFIG,
        requestFunctionName: 'httpRequest',
      };

      const result = generateRequestFile(config);

      expect(result).toContain('export async function httpRequest');
      expect(result).toContain('return response.data');
    });

    it('should use custom requestMethodsObjectName for method-specific style', () => {
      const config: ApiConfig = {
        ...minimalApiConfig,
        target: 'typescript',
        requestMethodStyle: RequestMethodStyle.METHOD_SPECIFIC,
        requestMethodsObjectName: 'apiClient',
      };

      const result = generateRequestFile(config);

      expect(result).toContain('export const apiClient');
      // The method functions use the requestFunctionName internally, not the object name
      expect(result).toContain('get:');
    });

    it('should use custom names in METHOD_MAP for BOTH style', () => {
      const config: ApiConfig = {
        ...minimalApiConfig,
        target: 'typescript',
        requestMethodStyle: RequestMethodStyle.BOTH,
        requestFunctionName: 'httpRequest',
        requestMethodsObjectName: 'apiClient',
      };

      const result = generateRequestFile(config);

      expect(result).toContain('export async function httpRequest');
      expect(result).toContain('export const apiClient');
      expect(result).toContain('GET: apiClient.get');
      expect(result).toContain('POST: apiClient.post');
    });
  });

  // ==================== 上传支持（requestTimeout / FormData 头保护 / 扩展点） ====================

  describe('upload support', () => {
    it('未配置 requestTimeout 时默认生成 5 * 1000', () => {
      const config: ApiConfig = {
        ...minimalApiConfig,
        target: 'typescript',
        requestMethodStyle: RequestMethodStyle.CONFIG,
      };

      const result = generateRequestFile(config);

      expect(result).toContain('const TIMEOUT = 5 * 1000;');
    });

    it('requestTimeout 配置应反映到 TIMEOUT 常量', () => {
      const config: ApiConfig = {
        ...minimalApiConfig,
        target: 'typescript',
        requestMethodStyle: RequestMethodStyle.CONFIG,
        requestTimeout: 30 * 1000,
      };

      const result = generateRequestFile(config);

      expect(result).toContain('const TIMEOUT = 30 * 1000;');
    });

    it('非整千的 requestTimeout 应输出原始数值', () => {
      const config: ApiConfig = {
        ...minimalApiConfig,
        target: 'typescript',
        requestMethodStyle: RequestMethodStyle.CONFIG,
        requestTimeout: 1500,
      };

      const result = generateRequestFile(config);

      expect(result).toContain('const TIMEOUT = 1500;');
    });

    it('FormData 请求体应剥离固定 Content-Type（TypeScript）', () => {
      const config: ApiConfig = {
        ...minimalApiConfig,
        target: 'typescript',
        requestMethodStyle: RequestMethodStyle.CONFIG,
      };

      const result = generateRequestFile(config);

      expect(result).toContain('config.data instanceof FormData');
      expect(result).toContain("headerKey.toLowerCase() !== 'content-type'");
      expect(result).toContain("as RequestConfig['headers']");
    });

    it('FormData 请求体应剥离固定 Content-Type（JavaScript 无类型注解）', () => {
      const config: ApiConfig = {
        ...minimalApiConfig,
        target: 'javascript',
        requestMethodStyle: RequestMethodStyle.CONFIG,
      };

      const result = generateRequestFile(config);

      expect(result).toContain('config.data instanceof FormData');
      expect(result.includes("as RequestConfig['headers']")).toBe(false);
    });

    it('应生成 customizeAxios 扩展点并在模块加载时调用', () => {
      const config: ApiConfig = {
        ...minimalApiConfig,
        target: 'typescript',
        requestMethodStyle: RequestMethodStyle.CONFIG,
      };

      const result = generateRequestFile(config);

      expect(result).toContain('export function customizeAxios(instance: typeof axios): void');
      expect(result).toContain('customizeAxios(axios);');
    });

    it('JavaScript 目标的 customizeAxios 不应包含类型注解', () => {
      const config: ApiConfig = {
        ...minimalApiConfig,
        target: 'javascript',
        requestMethodStyle: RequestMethodStyle.CONFIG,
      };

      const result = generateRequestFile(config);

      expect(result).toContain('export function customizeAxios(instance)');
      expect(result.includes('instance: typeof axios')).toBe(false);
    });
  });
});

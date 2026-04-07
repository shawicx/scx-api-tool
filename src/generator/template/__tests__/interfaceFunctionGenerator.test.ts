/**
 * @description interfaceFunctionGenerator.ts 单元测试
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import type { InterfaceTemplateData, ApiConfig } from '../../../types';
import { RequestMethodStyle } from '../../../types';
import { minimalApiConfig } from '../../../../../tests/fixtures/mockData';
import { generateInterfaceFunction } from '../interfaceFunctionGenerator';
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

/** Minimal InterfaceTemplateData for testing */
const minimalInterfaceData: InterfaceTemplateData = {
  requestTypeName: 'GetUserRequest',
  responseTypeName: 'GetUserResponse',
  functionName: 'getUser',
  path: '/api/users/{id}',
  method: 'GET',
  description: 'Get user by ID',
  hasParameters: true,
  parameters: [{ name: 'id', type: 'number', description: 'User ID', required: true }],
  hasResponse: true,
  responseProperties: [
    { name: 'id', type: 'number', description: 'User ID', required: true },
    { name: 'name', type: 'string', description: 'User name', required: true },
  ],
  hasBody: false,
  requestFunctionName: 'request',
  requestMethodsObjectName: 'requestMethods',
  requestParamName: 'params',
};

describe('generateInterfaceFunction', () => {
  afterEach(() => {
    templateCache.clear();
  });

  // ==================== JavaScript target ====================

  describe('javascript target', () => {
    it('should use ApiOnly template when target is javascript', () => {
      const config: ApiConfig = {
        ...minimalApiConfig,
        target: 'javascript',
        generateApi: true,
        generateTypes: false,
        typesFormat: 'typescript',
      };

      const result = generateInterfaceFunction(minimalInterfaceData, config);

      // ApiOnly template: generates an async function without type annotations on the function signature
      expect(result).toContain('async function getUser');
      // Should NOT have TypeScript type annotation on the parameter
      expect(result).not.toContain(': GetUserRequest');
      // The @returns JSDoc tag mentions Promise<...> in the comment, but there should be no
      // return type annotation on the function signature itself
      expect(result).not.toMatch(/export async function getUser.*\):\s*Promise</);
    });
  });

  // ==================== TypeScript + full interface ====================

  describe('TypeScript with generateTypes + generateApi + typescript format', () => {
    it('should use full interface template when generateTypes and generateApi are both true', () => {
      const config: ApiConfig = {
        ...minimalApiConfig,
        target: 'typescript',
        generateTypes: true,
        generateApi: true,
        typesFormat: 'typescript',
        comment: true,
        requestMethodStyle: RequestMethodStyle.CONFIG,
      };

      const result = generateInterfaceFunction(minimalInterfaceData, config);

      // Full interface template includes both interface and function
      expect(result).toContain('export interface GetUserRequest');
      expect(result).toContain('export interface GetUserResponse');
      expect(result).toContain('async function getUser');
      expect(result).toContain('Promise<GetUserResponse>');
      // With comment
      expect(result).toContain('@description');
    });

    it('should not contain comments when comment is false', () => {
      const config: ApiConfig = {
        ...minimalApiConfig,
        target: 'typescript',
        generateTypes: true,
        generateApi: true,
        typesFormat: 'typescript',
        comment: false,
        requestMethodStyle: RequestMethodStyle.CONFIG,
      };

      const result = generateInterfaceFunction(minimalInterfaceData, config);

      expect(result).not.toContain('@description');
      expect(result).toContain('export interface GetUserRequest');
    });
  });

  // ==================== TypeScript + ApiOnly ====================

  describe('TypeScript with generateApi but not generateTypes', () => {
    it('should use ApiOnly template when generateApi is true but generateTypes is false', () => {
      const config: ApiConfig = {
        ...minimalApiConfig,
        target: 'typescript',
        generateApi: true,
        generateTypes: false,
        typesFormat: 'typescript',
        comment: true,
      };

      const result = generateInterfaceFunction(minimalInterfaceData, config);

      // ApiOnly: has the function but no interface declarations
      expect(result).toContain('async function getUser');
      // ApiOnly with comment
      expect(result).toContain('@description');
      // Should not have standalone interface blocks
      expect(result).not.toContain('export interface GetUserRequest');
      expect(result).not.toContain('export interface GetUserResponse');
    });
  });

  // ==================== TypeScript + TypesOnly ====================

  describe('TypeScript with generateTypes but not generateApi', () => {
    it('should use TypesOnly template when generateTypes is true but generateApi is false', () => {
      const config: ApiConfig = {
        ...minimalApiConfig,
        target: 'typescript',
        generateApi: false,
        generateTypes: true,
        typesFormat: 'typescript',
        comment: true,
      };

      const result = generateInterfaceFunction(minimalInterfaceData, config);

      // TypesOnly: has interfaces but no function
      expect(result).toContain('export interface GetUserRequest');
      expect(result).toContain('export interface GetUserResponse');
      expect(result).not.toContain('async function getUser');
    });
  });

  // ==================== Zod mode ====================

  describe('Zod mode with generateTypes + generateApi', () => {
    it('should use Zod interface template', () => {
      const config: ApiConfig = {
        ...minimalApiConfig,
        target: 'typescript',
        generateTypes: true,
        generateApi: true,
        typesFormat: 'zod',
        comment: true,
      };

      const data: InterfaceTemplateData = {
        ...minimalInterfaceData,
        requestSchema: 'z.object({ id: z.number() })',
        responseSchema: 'z.object({ id: z.number(), name: z.string() })',
      };

      const result = generateInterfaceFunction(data, config);

      expect(result).toContain('async function getUser');
      expect(result).toContain('@description');
    });
  });

  describe('Zod mode with generateApi but not generateTypes', () => {
    it('should use Zod ApiOnly template', () => {
      const config: ApiConfig = {
        ...minimalApiConfig,
        target: 'typescript',
        generateApi: true,
        generateTypes: false,
        typesFormat: 'zod',
        comment: true,
      };

      const result = generateInterfaceFunction(minimalInterfaceData, config);

      expect(result).toContain('async function getUser');
      expect(result).toContain('@description');
    });
  });

  describe('Zod mode with generateTypes but not generateApi', () => {
    it('should use Zod TypesOnly template', () => {
      const config: ApiConfig = {
        ...minimalApiConfig,
        target: 'typescript',
        generateApi: false,
        generateTypes: true,
        typesFormat: 'zod',
        comment: true,
      };

      const data: InterfaceTemplateData = {
        ...minimalInterfaceData,
        requestSchema: 'z.object({ id: z.number() })',
        responseSchema: 'z.object({ id: z.number(), name: z.string() })',
      };

      const result = generateInterfaceFunction(data, config);

      expect(result).toContain("import { z } from 'zod'");
      expect(result).toContain('GetUserRequestSchema');
      expect(result).toContain('GetUserResponseSchema');
      expect(result).toContain('z.infer');
    });
  });

  // ==================== Custom function/object names ====================

  describe('custom requestFunctionName and requestMethodsObjectName', () => {
    it('should use custom requestFunctionName in the output', () => {
      const config: ApiConfig = {
        ...minimalApiConfig,
        target: 'javascript',
        generateApi: true,
        generateTypes: false,
        typesFormat: 'typescript',
        requestFunctionName: 'customRequest',
      };

      const result = generateInterfaceFunction(minimalInterfaceData, config);

      expect(result).toContain('customRequest');
    });

    it('should use custom requestMethodsObjectName when provided', () => {
      const config: ApiConfig = {
        ...minimalApiConfig,
        target: 'typescript',
        generateApi: true,
        generateTypes: true,
        typesFormat: 'typescript',
        requestMethodStyle: RequestMethodStyle.CONFIG,
        requestMethodsObjectName: 'api',
      };

      const result = generateInterfaceFunction(minimalInterfaceData, config);

      // The output should contain the custom object name in the function body
      expect(result).toContain('api');
    });
  });
});

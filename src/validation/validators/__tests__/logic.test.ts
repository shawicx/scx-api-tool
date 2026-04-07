/**
 * @description 逻辑关系验证器测试
 * 测试 validators/logic.ts 导出的 validateConfigLogic 函数
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('consola', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

import { validateConfigLogic } from '../logic';
import { ValidationSeverity } from '../../errors';
import { validSwaggerUserConfig, validApifoxUserConfig } from '../../../../tests/fixtures/mockData';
import type { UserConfig } from '@/types';

// ---------------------------------------------------------------------------
// validateConfigLogic
// ---------------------------------------------------------------------------
describe('validateConfigLogic', () => {
  // --- No generation mode ---
  describe('no generation mode enabled', () => {
    it('returns ERROR when both generateApi and generateTypes are false', () => {
      const config: UserConfig = {
        ...validSwaggerUserConfig,
        generateApi: false,
        generateTypes: false,
      };
      const errors = validateConfigLogic(config);

      const noGenError = errors.find((e) => e.code === 'NO_GENERATION_MODE');
      expect(noGenError).toBeDefined();
      expect(noGenError!.severity).toBe(ValidationSeverity.ERROR);
      expect(noGenError!.field).toBe('generateApi & generateTypes');
    });

    it('returns ERROR when both generateApi and generateTypes are undefined', () => {
      const config: UserConfig = { ...validSwaggerUserConfig };
      delete (config as any).generateApi;
      delete (config as any).generateTypes;
      const errors = validateConfigLogic(config);

      const noGenError = errors.find((e) => e.code === 'NO_GENERATION_MODE');
      expect(noGenError).toBeDefined();
      expect(noGenError!.severity).toBe(ValidationSeverity.ERROR);
    });

    it('returns no NO_GENERATION_MODE error when generateApi is true', () => {
      const config: UserConfig = {
        ...validSwaggerUserConfig,
        generateApi: true,
        generateTypes: false,
      };
      const errors = validateConfigLogic(config);

      expect(errors.find((e) => e.code === 'NO_GENERATION_MODE')).toBeUndefined();
    });

    it('returns no NO_GENERATION_MODE error when generateTypes is true', () => {
      const config: UserConfig = {
        ...validSwaggerUserConfig,
        generateApi: false,
        generateTypes: true,
      };
      const errors = validateConfigLogic(config);

      expect(errors.find((e) => e.code === 'NO_GENERATION_MODE')).toBeUndefined();
    });
  });

  // --- Types-only mode with non-default requestMethodStyle ---
  describe('types-only mode with requestMethodStyle', () => {
    it('returns WARNING when types-only mode has non-default requestMethodStyle', () => {
      const config: UserConfig = {
        ...validSwaggerUserConfig,
        generateApi: false,
        generateTypes: true,
        requestMethodStyle: 'method-specific' as any,
      };
      const errors = validateConfigLogic(config);

      const unusedError = errors.find((e) => e.code === 'UNUSED_OPTION');
      expect(unusedError).toBeDefined();
      expect(unusedError!.severity).toBe(ValidationSeverity.WARNING);
      expect(unusedError!.field).toBe('requestMethodStyle');
    });

    it('returns no warning when types-only mode uses default requestMethodStyle (config)', () => {
      const config: UserConfig = {
        ...validSwaggerUserConfig,
        generateApi: false,
        generateTypes: true,
        requestMethodStyle: 'config' as any,
      };
      const errors = validateConfigLogic(config);

      expect(errors.find((e) => e.code === 'UNUSED_OPTION')).toBeUndefined();
    });

    it('returns no warning when both api and types are generated', () => {
      const config: UserConfig = {
        ...validSwaggerUserConfig,
        generateApi: true,
        generateTypes: true,
        requestMethodStyle: 'method-specific' as any,
      };
      const errors = validateConfigLogic(config);

      expect(errors.find((e) => e.code === 'UNUSED_OPTION')).toBeUndefined();
    });
  });

  // --- pathPrefix slash checks ---
  describe('pathPrefix slash validation', () => {
    it('returns WARNING when pathPrefix starts with /', () => {
      const config: UserConfig = {
        ...validSwaggerUserConfig,
        pathPrefix: '/api',
      };
      const errors = validateConfigLogic(config);

      const prefixError = errors.find(
        (e) => e.code === 'INVALID_PATH_PREFIX' && e.message.includes('开头'),
      );
      expect(prefixError).toBeDefined();
      expect(prefixError!.severity).toBe(ValidationSeverity.WARNING);
    });

    it('returns WARNING when pathPrefix ends with /', () => {
      const config: UserConfig = {
        ...validSwaggerUserConfig,
        pathPrefix: 'api/',
      };
      const errors = validateConfigLogic(config);

      const prefixError = errors.find(
        (e) => e.code === 'INVALID_PATH_PREFIX' && e.message.includes('结尾'),
      );
      expect(prefixError).toBeDefined();
      expect(prefixError!.severity).toBe(ValidationSeverity.WARNING);
    });

    it('returns two warnings when pathPrefix both starts and ends with /', () => {
      const config: UserConfig = {
        ...validSwaggerUserConfig,
        pathPrefix: '/api/',
      };
      const errors = validateConfigLogic(config);

      const prefixErrors = errors.filter((e) => e.code === 'INVALID_PATH_PREFIX');
      expect(prefixErrors).toHaveLength(2);
    });

    it('returns no warning for pathPrefix without leading or trailing slash', () => {
      const config: UserConfig = {
        ...validSwaggerUserConfig,
        pathPrefix: 'api',
      };
      const errors = validateConfigLogic(config);

      expect(errors.filter((e) => e.code === 'INVALID_PATH_PREFIX')).toHaveLength(0);
    });

    it('returns no warning when pathPrefix is undefined', () => {
      const config: UserConfig = { ...validSwaggerUserConfig };
      const errors = validateConfigLogic(config);

      expect(errors.filter((e) => e.code === 'INVALID_PATH_PREFIX')).toHaveLength(0);
    });

    it('returns no warning when pathPrefix is empty string', () => {
      const config: UserConfig = {
        ...validSwaggerUserConfig,
        pathPrefix: '',
      };
      const errors = validateConfigLogic(config);

      expect(errors.filter((e) => e.code === 'INVALID_PATH_PREFIX')).toHaveLength(0);
    });
  });

  // --- Naming conflict ---
  describe('requestFunctionName and requestMethodsObjectName conflict', () => {
    it('returns ERROR when requestFunctionName equals requestMethodsObjectName', () => {
      const config: UserConfig = {
        ...validSwaggerUserConfig,
        requestFunctionName: 'request',
        requestMethodsObjectName: 'request',
      };
      const errors = validateConfigLogic(config);

      const conflictError = errors.find((e) => e.code === 'NAMING_CONFLICT');
      expect(conflictError).toBeDefined();
      expect(conflictError!.severity).toBe(ValidationSeverity.ERROR);
      expect(conflictError!.field).toBe('requestFunctionName & requestMethodsObjectName');
    });

    it('returns no error when requestFunctionName differs from requestMethodsObjectName', () => {
      const config: UserConfig = {
        ...validSwaggerUserConfig,
        requestFunctionName: 'request',
        requestMethodsObjectName: 'requestMethods',
      };
      const errors = validateConfigLogic(config);

      expect(errors.find((e) => e.code === 'NAMING_CONFLICT')).toBeUndefined();
    });

    it('returns no error when only requestFunctionName is set', () => {
      const config: UserConfig = {
        ...validSwaggerUserConfig,
        requestFunctionName: 'request',
      };
      const errors = validateConfigLogic(config);

      expect(errors.find((e) => e.code === 'NAMING_CONFLICT')).toBeUndefined();
    });

    it('returns no error when only requestMethodsObjectName is set', () => {
      const config: UserConfig = {
        ...validSwaggerUserConfig,
        requestMethodsObjectName: 'requestMethods',
      };
      const errors = validateConfigLogic(config);

      expect(errors.find((e) => e.code === 'NAMING_CONFLICT')).toBeUndefined();
    });

    it('returns no error when neither is set', () => {
      const config: UserConfig = { ...validSwaggerUserConfig };
      const errors = validateConfigLogic(config);

      expect(errors.find((e) => e.code === 'NAMING_CONFLICT')).toBeUndefined();
    });
  });

  // --- JavaScript target warnings ---
  describe('JavaScript target warnings', () => {
    it('returns WARNING when target=javascript and generateTypes=true', () => {
      const config: UserConfig = {
        ...validSwaggerUserConfig,
        target: 'javascript',
        generateTypes: true,
      };
      const errors = validateConfigLogic(config);

      const jsTypeError = errors.find((e) => e.code === 'JS_TARGET_IGNORES_TYPES');
      expect(jsTypeError).toBeDefined();
      expect(jsTypeError!.severity).toBe(ValidationSeverity.WARNING);
    });

    it('returns no JS_TARGET_IGNORES_TYPES warning when target=javascript and generateTypes=false', () => {
      const config: UserConfig = {
        ...validSwaggerUserConfig,
        target: 'javascript',
        generateTypes: false,
      };
      const errors = validateConfigLogic(config);

      expect(errors.find((e) => e.code === 'JS_TARGET_IGNORES_TYPES')).toBeUndefined();
    });

    it('returns no JS_TARGET_IGNORES_TYPES warning when target=typescript and generateTypes=true', () => {
      const config: UserConfig = {
        ...validSwaggerUserConfig,
        target: 'typescript',
        generateTypes: true,
      };
      const errors = validateConfigLogic(config);

      expect(errors.find((e) => e.code === 'JS_TARGET_IGNORES_TYPES')).toBeUndefined();
    });

    it('returns WARNING when target=javascript and typesFormat=zod', () => {
      const config: UserConfig = {
        ...validSwaggerUserConfig,
        target: 'javascript',
        typesFormat: 'zod',
      };
      const errors = validateConfigLogic(config);

      const jsZodError = errors.find((e) => e.code === 'JS_TARGET_IGNORES_ZOD');
      expect(jsZodError).toBeDefined();
      expect(jsZodError!.severity).toBe(ValidationSeverity.WARNING);
    });

    it('returns no JS_TARGET_IGNORES_ZOD warning when target=typescript and typesFormat=zod', () => {
      const config: UserConfig = {
        ...validSwaggerUserConfig,
        target: 'typescript',
        typesFormat: 'zod',
      };
      const errors = validateConfigLogic(config);

      expect(errors.find((e) => e.code === 'JS_TARGET_IGNORES_ZOD')).toBeUndefined();
    });

    it('returns no JS_TARGET_IGNORES_ZOD warning when target=javascript and typesFormat=typescript', () => {
      const config: UserConfig = {
        ...validSwaggerUserConfig,
        target: 'javascript',
        typesFormat: 'typescript',
      };
      const errors = validateConfigLogic(config);

      expect(errors.find((e) => e.code === 'JS_TARGET_IGNORES_ZOD')).toBeUndefined();
    });

    it('returns both JS warnings when target=javascript with generateTypes=true and typesFormat=zod', () => {
      const config: UserConfig = {
        ...validSwaggerUserConfig,
        target: 'javascript',
        generateTypes: true,
        typesFormat: 'zod',
      };
      const errors = validateConfigLogic(config);

      expect(errors.find((e) => e.code === 'JS_TARGET_IGNORES_TYPES')).toBeDefined();
      expect(errors.find((e) => e.code === 'JS_TARGET_IGNORES_ZOD')).toBeDefined();
    });
  });

  // --- Multiple combined scenarios ---
  describe('combined scenarios', () => {
    it('returns no errors for a fully valid Swagger config', () => {
      const config: UserConfig = {
        ...validSwaggerUserConfig,
        generateApi: true,
        generateTypes: true,
      };
      const errors = validateConfigLogic(config);

      expect(errors).toHaveLength(0);
    });

    it('returns no errors for a fully valid Apifox config', () => {
      const config: UserConfig = {
        ...validApifoxUserConfig,
        generateApi: true,
        generateTypes: true,
      };
      const errors = validateConfigLogic(config);

      expect(errors).toHaveLength(0);
    });

    it('accumulates multiple errors from different checks', () => {
      const config: UserConfig = {
        ...validSwaggerUserConfig,
        generateApi: false,
        generateTypes: false,
        pathPrefix: '/api/',
        requestFunctionName: 'same',
        requestMethodsObjectName: 'same',
      } as UserConfig;
      const errors = validateConfigLogic(config);

      expect(errors.length).toBeGreaterThanOrEqual(3);
      expect(errors.some((e) => e.code === 'NO_GENERATION_MODE')).toBe(true);
      expect(errors.filter((e) => e.code === 'INVALID_PATH_PREFIX').length).toBeGreaterThanOrEqual(
        2,
      );
      expect(errors.some((e) => e.code === 'NAMING_CONFLICT')).toBe(true);
    });
  });
});

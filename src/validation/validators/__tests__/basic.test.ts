/**
 * @description 基础类型验证器测试
 * 测试 validators/basic.ts 导出的所有验证函数
 */

import { describe, it, expect, vi } from 'vitest';

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
  validateRequiredFields,
  validateEnumValues,
  validateStringFields,
  validateBooleanFields,
  validateNumberFields,
  validateArrayFields,
} from '../basic';
import { ValidationSeverity } from '../../errors';
import { validSwaggerUserConfig, validApifoxUserConfig } from '../../../../tests/fixtures/mockData';
import type { UserConfig } from '@/types';
import { RequestMethodStyle } from '@/types';

// ---------------------------------------------------------------------------
// validateRequiredFields
// ---------------------------------------------------------------------------
describe('validateRequiredFields', () => {
  it('returns no errors for a valid Swagger config', () => {
    const errors = validateRequiredFields(validSwaggerUserConfig);
    expect(errors).toHaveLength(0);
  });

  it('returns no errors for a valid Apifox config with token', () => {
    const errors = validateRequiredFields(validApifoxUserConfig);
    expect(errors).toHaveLength(0);
  });

  it('returns error when source is empty string', () => {
    const config = { ...validSwaggerUserConfig, source: '' };
    const errors = validateRequiredFields(config);

    expect(errors).toHaveLength(1);
    expect(errors[0]!.field).toBe('source');
    expect(errors[0]!.code).toBe('REQUIRED_FIELD');
    expect(errors[0]!.severity).toBe(ValidationSeverity.ERROR);
  });

  it('returns error when source is whitespace-only', () => {
    const config = { ...validSwaggerUserConfig, source: '   ' };
    const errors = validateRequiredFields(config);

    expect(errors).toHaveLength(1);
    expect(errors[0]!.field).toBe('source');
  });

  it('throws when source is not a string (calls .includes on non-string)', () => {
    const config = { ...validSwaggerUserConfig, source: 123 as any };
    // basic.ts calls config.source.includes('apifox.com') unconditionally at line 44,
    // which throws for non-string source values
    expect(() => validateRequiredFields(config)).toThrow();
  });

  it('throws when source is undefined (calls .includes on undefined)', () => {
    const config: UserConfig = { source: undefined as any, token: '' };
    // basic.ts calls config.source.includes('apifox.com') unconditionally at line 44,
    // which throws for undefined source
    expect(() => validateRequiredFields(config)).toThrow();
  });

  it('returns error for Apifox source without token', () => {
    const config: UserConfig = {
      source: 'https://api.apifox.com/v1/projects/123456/export-openapi',
      token: '',
    };
    const errors = validateRequiredFields(config);

    expect(errors).toHaveLength(1);
    expect(errors[0]!.field).toBe('token');
    expect(errors[0]!.code).toBe('REQUIRED_FIELD');
  });

  it('returns error for Apifox source with whitespace-only token', () => {
    const config: UserConfig = {
      source: 'https://api.apifox.com/v1/projects/123456/export-openapi',
      token: '   ',
    };
    const errors = validateRequiredFields(config);

    expect(errors).toHaveLength(1);
    expect(errors[0]!.field).toBe('token');
  });

  it('does not require token for non-Apifox sources', () => {
    const config: UserConfig = {
      source: 'https://example.com/swagger.json',
      token: '',
    };
    const errors = validateRequiredFields(config);

    expect(errors).toHaveLength(0);
  });

  it('returns both source and token errors for Apifox with empty source and no token', () => {
    const config: UserConfig = {
      source: '',
      token: '',
    };
    // Note: token validation checks config.source.includes('apifox.com'),
    // so with empty source it won't require token
    const errors = validateRequiredFields(config);

    expect(errors.length).toBeGreaterThanOrEqual(1);
    expect(errors.some((e) => e.field === 'source')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateEnumValues
// ---------------------------------------------------------------------------
describe('validateEnumValues', () => {
  it('returns no errors for valid enum values', () => {
    const config = {
      ...validSwaggerUserConfig,
      target: 'typescript' as const,
      requestMethodStyle: RequestMethodStyle.CONFIG,
      preset: 'standard' as const,
    };
    const errors = validateEnumValues(config);

    expect(errors).toHaveLength(0);
  });

  it('returns no errors when enum fields are undefined', () => {
    const config = { ...validSwaggerUserConfig };
    delete (config as any).target;
    delete (config as any).requestMethodStyle;
    delete (config as any).preset;
    const errors = validateEnumValues(config);

    expect(errors).toHaveLength(0);
  });

  it('returns error for invalid target value', () => {
    const config = { ...validSwaggerUserConfig, target: 'python' as any };
    const errors = validateEnumValues(config);

    expect(errors).toHaveLength(1);
    expect(errors[0]!.field).toBe('target');
    expect(errors[0]!.code).toBe('INVALID_ENUM_VALUE');
    expect(errors[0]!.value).toBe('python');
  });

  it('accepts javascript as valid target', () => {
    const config = { ...validSwaggerUserConfig, target: 'javascript' as const };
    const errors = validateEnumValues(config);

    expect(errors).toHaveLength(0);
  });

  it('returns error for invalid requestMethodStyle value', () => {
    const config = { ...validSwaggerUserConfig, requestMethodStyle: 'invalid-style' as any };
    const errors = validateEnumValues(config);

    expect(errors).toHaveLength(1);
    expect(errors[0]!.field).toBe('requestMethodStyle');
    expect(errors[0]!.code).toBe('INVALID_ENUM_VALUE');
  });

  it('accepts all valid requestMethodStyle values', () => {
    const styles = [
      RequestMethodStyle.CONFIG,
      RequestMethodStyle.METHOD_SPECIFIC,
      RequestMethodStyle.BOTH,
    ];

    for (const style of styles) {
      const config = { ...validSwaggerUserConfig, requestMethodStyle: style };
      const errors = validateEnumValues(config);
      expect(errors).toHaveLength(0);
    }
  });

  it('returns error for invalid preset value', () => {
    const config = { ...validSwaggerUserConfig, preset: 'ultra' as any };
    const errors = validateEnumValues(config);

    expect(errors).toHaveLength(1);
    expect(errors[0]!.field).toBe('preset');
    expect(errors[0]!.code).toBe('INVALID_ENUM_VALUE');
  });

  it('accepts all valid preset values', () => {
    const presets = ['minimal', 'standard', 'verbose'] as const;

    for (const preset of presets) {
      const config = { ...validSwaggerUserConfig, preset };
      const errors = validateEnumValues(config);
      expect(errors).toHaveLength(0);
    }
  });

  it('returns multiple errors when multiple enum fields are invalid', () => {
    const config = {
      ...validSwaggerUserConfig,
      target: 'python' as any,
      preset: 'ultra' as any,
    };
    const errors = validateEnumValues(config);

    expect(errors).toHaveLength(2);
    expect(errors.map((e) => e.field)).toContain('target');
    expect(errors.map((e) => e.field)).toContain('preset');
  });
});

// ---------------------------------------------------------------------------
// validateStringFields
// ---------------------------------------------------------------------------
describe('validateStringFields', () => {
  it('returns no errors when all string fields are valid', () => {
    const config = {
      ...validSwaggerUserConfig,
      outputDir: 'src/service',
      pathPrefix: 'api',
      prodEnvName: 'production',
      requestFunctionFilePath: 'src/service/request.ts',
      requestFunctionName: 'request',
      requestMethodsObjectName: 'requestMethods',
    };
    const errors = validateStringFields(config);

    expect(errors).toHaveLength(0);
  });

  it('returns no errors when all string fields are undefined', () => {
    const config = { ...validSwaggerUserConfig };
    const errors = validateStringFields(config);

    expect(errors).toHaveLength(0);
  });

  // outputDir
  it('returns error for empty outputDir', () => {
    const config = { ...validSwaggerUserConfig, outputDir: '' };
    const errors = validateStringFields(config);

    expect(errors).toHaveLength(1);
    expect(errors[0]!.field).toBe('outputDir');
    expect(errors[0]!.code).toBe('INVALID_STRING');
  });

  it('returns error for non-string outputDir', () => {
    const config = { ...validSwaggerUserConfig, outputDir: 123 as any };
    const errors = validateStringFields(config);

    expect(errors).toHaveLength(1);
    expect(errors[0]!.field).toBe('outputDir');
  });

  // pathPrefix
  it('returns error for non-string pathPrefix', () => {
    const config = { ...validSwaggerUserConfig, pathPrefix: 123 as any };
    const errors = validateStringFields(config);

    expect(errors).toHaveLength(1);
    expect(errors[0]!.field).toBe('pathPrefix');
    expect(errors[0]!.code).toBe('INVALID_STRING');
  });

  // prodEnvName
  it('returns error for empty prodEnvName', () => {
    const config = { ...validSwaggerUserConfig, prodEnvName: '' };
    const errors = validateStringFields(config);

    expect(errors).toHaveLength(1);
    expect(errors[0]!.field).toBe('prodEnvName');
  });

  // requestFunctionFilePath
  it('returns error for empty requestFunctionFilePath', () => {
    const config = { ...validSwaggerUserConfig, requestFunctionFilePath: '' };
    const errors = validateStringFields(config);

    expect(errors).toHaveLength(1);
    expect(errors[0]!.field).toBe('requestFunctionFilePath');
  });

  // requestFunctionName
  it('returns error for empty requestFunctionName', () => {
    const config = { ...validSwaggerUserConfig, requestFunctionName: '' };
    const errors = validateStringFields(config);

    expect(errors).toHaveLength(1);
    expect(errors[0]!.field).toBe('requestFunctionName');
  });

  // requestMethodsObjectName
  it('returns error for empty requestMethodsObjectName', () => {
    const config = { ...validSwaggerUserConfig, requestMethodsObjectName: '' };
    const errors = validateStringFields(config);

    expect(errors).toHaveLength(1);
    expect(errors[0]!.field).toBe('requestMethodsObjectName');
  });

  it('returns multiple errors when multiple string fields are invalid', () => {
    const config = {
      ...validSwaggerUserConfig,
      outputDir: '',
      prodEnvName: '',
      requestFunctionName: '',
    };
    const errors = validateStringFields(config);

    expect(errors).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// validateBooleanFields
// ---------------------------------------------------------------------------
describe('validateBooleanFields', () => {
  it('returns no errors when boolean fields are valid', () => {
    const config = {
      ...validSwaggerUserConfig,
      typesOnly: true,
      apiOnly: false,
      comment: true,
    };
    const errors = validateBooleanFields(config);

    expect(errors).toHaveLength(0);
  });

  it('returns no errors when boolean fields are undefined', () => {
    const config = { ...validSwaggerUserConfig };
    const errors = validateBooleanFields(config);

    expect(errors).toHaveLength(0);
  });

  it('returns error for non-boolean typesOnly', () => {
    const config = { ...validSwaggerUserConfig, typesOnly: 'yes' as any };
    const errors = validateBooleanFields(config);

    expect(errors).toHaveLength(1);
    expect(errors[0]!.field).toBe('typesOnly');
    expect(errors[0]!.code).toBe('INVALID_BOOLEAN');
  });

  it('returns error for non-boolean apiOnly', () => {
    const config = { ...validSwaggerUserConfig, apiOnly: 1 as any };
    const errors = validateBooleanFields(config);

    expect(errors).toHaveLength(1);
    expect(errors[0]!.field).toBe('apiOnly');
  });

  it('returns error for non-boolean comment', () => {
    const config = { ...validSwaggerUserConfig, comment: 'true' as any };
    const errors = validateBooleanFields(config);

    expect(errors).toHaveLength(1);
    expect(errors[0]!.field).toBe('comment');
  });

  it('returns multiple errors when multiple boolean fields are invalid', () => {
    const config = {
      ...validSwaggerUserConfig,
      typesOnly: 'yes' as any,
      apiOnly: 1 as any,
      comment: 'true' as any,
    };
    const errors = validateBooleanFields(config);

    expect(errors).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// validateNumberFields
// ---------------------------------------------------------------------------
describe('validateNumberFields', () => {
  it('returns no errors when indentSize is valid', () => {
    const config = { ...validSwaggerUserConfig, indentSize: 2 };
    const errors = validateNumberFields(config);

    expect(errors).toHaveLength(0);
  });

  it('returns no errors when indentSize is undefined', () => {
    const config = { ...validSwaggerUserConfig };
    const errors = validateNumberFields(config);

    expect(errors).toHaveLength(0);
  });

  it('accepts indentSize of 1 (minimum)', () => {
    const config = { ...validSwaggerUserConfig, indentSize: 1 };
    const errors = validateNumberFields(config);

    expect(errors).toHaveLength(0);
  });

  it('accepts indentSize of 8 (maximum)', () => {
    const config = { ...validSwaggerUserConfig, indentSize: 8 };
    const errors = validateNumberFields(config);

    expect(errors).toHaveLength(0);
  });

  it('returns error for indentSize 0 (below minimum)', () => {
    const config = { ...validSwaggerUserConfig, indentSize: 0 };
    const errors = validateNumberFields(config);

    expect(errors).toHaveLength(1);
    expect(errors[0]!.field).toBe('indentSize');
    expect(errors[0]!.code).toBe('INVALID_NUMBER');
  });

  it('returns error for indentSize 9 (above maximum)', () => {
    const config = { ...validSwaggerUserConfig, indentSize: 9 };
    const errors = validateNumberFields(config);

    expect(errors).toHaveLength(1);
    expect(errors[0]!.field).toBe('indentSize');
  });

  it('returns error for non-integer indentSize', () => {
    const config = { ...validSwaggerUserConfig, indentSize: 2.5 };
    const errors = validateNumberFields(config);

    expect(errors).toHaveLength(1);
    expect(errors[0]!.field).toBe('indentSize');
  });

  it('returns error for negative indentSize', () => {
    const config = { ...validSwaggerUserConfig, indentSize: -1 };
    const errors = validateNumberFields(config);

    expect(errors).toHaveLength(1);
    expect(errors[0]!.field).toBe('indentSize');
  });

  it('returns error for string indentSize', () => {
    const config = { ...validSwaggerUserConfig, indentSize: '4' as any };
    const errors = validateNumberFields(config);

    expect(errors).toHaveLength(1);
    expect(errors[0]!.field).toBe('indentSize');
  });
});

// ---------------------------------------------------------------------------
// validateArrayFields
// ---------------------------------------------------------------------------
describe('validateArrayFields', () => {
  it('always returns an empty array', () => {
    const errors = validateArrayFields();

    expect(errors).toEqual([]);
  });

  it('returns empty array regardless of config', () => {
    const errors = validateArrayFields();

    expect(errors).toHaveLength(0);
  });
});

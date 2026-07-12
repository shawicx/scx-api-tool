/**
 * @description URL 验证器测试
 * 测试 validators/url.ts 导出的验证函数
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

import { validateUrlFormat, validateSourceUrl } from '../url';
import { ValidationSeverity } from '../../errors';
import { validSwaggerUserConfig, validApifoxUserConfig } from '../../../../tests/fixtures/mockData';
import type { UserConfig } from '@/types';

// ---------------------------------------------------------------------------
// validateUrlFormat
// ---------------------------------------------------------------------------
describe('validateUrlFormat', () => {
  it('returns null for a valid HTTPS URL', () => {
    const result = validateUrlFormat('https://api.example.com/v1/data', 'source');

    expect(result).toBeNull();
  });

  it('returns null for a valid HTTP URL', () => {
    const result = validateUrlFormat('http://localhost:3000/swagger.json', 'source');

    expect(result).toBeNull();
  });

  it('returns error for empty string URL', () => {
    const result = validateUrlFormat('', 'source');

    expect(result).not.toBeNull();
    expect(result!.field).toBe('source');
    expect(result!.code).toBe('INVALID_URL');
    expect(result!.severity).toBe(ValidationSeverity.ERROR);
  });

  it('returns error for whitespace-only URL', () => {
    const result = validateUrlFormat('   ', 'source');

    expect(result).not.toBeNull();
    expect(result!.code).toBe('INVALID_URL');
  });

  it('returns error for URL without protocol', () => {
    const result = validateUrlFormat('api.example.com/v1/data', 'source');

    expect(result).not.toBeNull();
    expect(result!.code).toBe('INVALID_URL_FORMAT');
  });

  it('returns error for URL with invalid protocol (ftp)', () => {
    const result = validateUrlFormat('ftp://files.example.com/data.json', 'source');

    expect(result).not.toBeNull();
    expect(result!.code).toBe('INVALID_URL_PROTOCOL');
  });

  it('returns error for URL without host', () => {
    // 'https://' throws in URL constructor, so it returns INVALID_URL_FORMAT
    const result = validateUrlFormat('https://', 'source');

    expect(result).not.toBeNull();
    expect(result!.code).toBe('INVALID_URL_FORMAT');
  });

  it('returns error for completely malformed URL', () => {
    const result = validateUrlFormat('not-a-url-at-all', 'source');

    expect(result).not.toBeNull();
    expect(result!.code).toBe('INVALID_URL_FORMAT');
  });

  it('uses the provided field name in the error', () => {
    const result = validateUrlFormat('', 'customField');

    expect(result!.field).toBe('customField');
  });

  it('handles URLs with query parameters', () => {
    const result = validateUrlFormat('https://api.example.com/data?key=value', 'source');

    expect(result).toBeNull();
  });

  it('handles URLs with port numbers', () => {
    const result = validateUrlFormat('http://localhost:8080/swagger.json', 'source');

    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// validateSourceUrl
// ---------------------------------------------------------------------------
describe('validateSourceUrl', () => {
  // --- No source ---
  it('returns empty array when source is empty', () => {
    const config: UserConfig = { source: '', token: '' };
    const errors = validateSourceUrl(config);

    expect(errors).toEqual([]);
  });

  // --- Invalid base URL format ---
  it('returns error for invalid URL format and stops further validation', () => {
    const config: UserConfig = { source: 'not-a-url', token: '' };
    const errors = validateSourceUrl(config);

    expect(errors.length).toBeGreaterThanOrEqual(1);
    expect(errors[0]!.code).toBe('INVALID_URL_FORMAT');
  });

  // --- Apifox URLs ---
  describe('Apifox URL validation', () => {
    it('returns no errors for valid Apifox URL', () => {
      const errors = validateSourceUrl(validApifoxUserConfig);

      expect(errors).toHaveLength(0);
    });

    it('returns error for Apifox URL with invalid path format', () => {
      const config: UserConfig = {
        source: 'https://api.apifox.com/v1/invalid-path',
        token: 'test-token',
      };
      const errors = validateSourceUrl(config);

      expect(errors).toHaveLength(1);
      expect(errors[0]!.code).toBe('INVALID_APIFOX_URL_FORMAT');
      expect(errors[0]!.severity).toBe(ValidationSeverity.ERROR);
    });

    it('returns error for Apifox URL with missing project ID', () => {
      const config: UserConfig = {
        source: 'https://api.apifox.com/v1/projects//export-openapi',
        token: 'test-token',
      };
      const errors = validateSourceUrl(config);

      // The regex requires \d+ so empty project ID won't match
      expect(errors).toHaveLength(1);
      expect(errors[0]!.code).toBe('INVALID_APIFOX_URL_FORMAT');
    });

    it('accepts Apifox URL with trailing slash', () => {
      const config: UserConfig = {
        source: 'https://api.apifox.com/v1/projects/123456/export-openapi/',
        token: 'test-token',
      };
      const errors = validateSourceUrl(config);

      expect(errors).toHaveLength(0);
    });

    it('accepts Apifox URL with numeric project ID', () => {
      const config: UserConfig = {
        source: 'https://api.apifox.com/v1/projects/987654321/export-openapi',
        token: 'test-token',
      };
      const errors = validateSourceUrl(config);

      expect(errors).toHaveLength(0);
    });

    it('returns error for Apifox URL without export-openapi in path', () => {
      const config: UserConfig = {
        source: 'https://api.apifox.com/v1/projects/123456/api',
        token: 'test-token',
      };
      const errors = validateSourceUrl(config);

      expect(errors).toHaveLength(1);
      expect(errors[0]!.code).toBe('INVALID_APIFOX_URL_FORMAT');
    });
  });

  // --- Swagger URLs ---
  describe('Swagger URL validation', () => {
    it('returns no errors for valid Swagger URL with /swagger.json', () => {
      const config: UserConfig = {
        source: 'https://petstore.swagger.io/v2/swagger.json',
        token: '',
      };
      const errors = validateSourceUrl(config);

      expect(errors).toHaveLength(0);
    });

    it('returns no errors for valid Swagger URL with /openapi.json', () => {
      const config: UserConfig = {
        source: 'https://api.example.com/openapi.json',
        token: '',
      };
      const errors = validateSourceUrl(config);

      expect(errors).toHaveLength(0);
    });

    it('returns no errors for valid Swagger URL with /openapi.yaml', () => {
      const config: UserConfig = {
        source: 'https://api.example.com/openapi.yaml',
        token: '',
      };
      const errors = validateSourceUrl(config);

      expect(errors).toHaveLength(0);
    });

    it('returns no errors for /api-docs path', () => {
      const config: UserConfig = {
        source: 'https://api.example.com/api-docs',
        token: '',
      };
      const errors = validateSourceUrl(config);

      expect(errors).toHaveLength(0);
    });

    it('returns warning for unrecognized Swagger path pattern', () => {
      const config: UserConfig = {
        source: 'https://api.example.com/custom-endpoint',
        token: '',
      };
      const errors = validateSourceUrl(config);

      expect(errors).toHaveLength(1);
      expect(errors[0]!.code).toBe('INVALID_SWAGGER_URL_PATH');
      expect(errors[0]!.severity).toBe(ValidationSeverity.WARNING);
    });

    it('returns warning for Swagger URL without known file extension', () => {
      const config: UserConfig = {
        source: 'https://api.example.com/v1/something.xml',
        token: '',
      };
      const errors = validateSourceUrl(config);

      expect(errors).toHaveLength(1);
      expect(errors[0]!.severity).toBe(ValidationSeverity.WARNING);
    });

    it('accepts /v1/swagger.json pattern', () => {
      const config: UserConfig = {
        source: 'https://api.example.com/v1/swagger.json',
        token: '',
      };
      const errors = validateSourceUrl(config);

      expect(errors).toHaveLength(0);
    });

    it('accepts /v3/swagger.json pattern', () => {
      const config: UserConfig = {
        source: 'https://api.example.com/v3/swagger.json',
        token: '',
      };
      const errors = validateSourceUrl(config);

      expect(errors).toHaveLength(0);
    });

    it('accepts /swagger.yaml pattern', () => {
      const config: UserConfig = {
        source: 'https://api.example.com/swagger.yaml',
        token: '',
      };
      const errors = validateSourceUrl(config);

      expect(errors).toHaveLength(0);
    });

    it('accepts /swagger.yml pattern', () => {
      const config: UserConfig = {
        source: 'https://api.example.com/swagger.yml',
        token: '',
      };
      const errors = validateSourceUrl(config);

      expect(errors).toHaveLength(0);
    });

    it('accepts /openapi.yml pattern', () => {
      const config: UserConfig = {
        source: 'https://api.example.com/openapi.yml',
        token: '',
      };
      const errors = validateSourceUrl(config);

      expect(errors).toHaveLength(0);
    });

    it('accepts /v2/swagger.json pattern', () => {
      const config: UserConfig = {
        source: 'https://api.example.com/v2/swagger.json',
        token: '',
      };
      const errors = validateSourceUrl(config);

      expect(errors).toHaveLength(0);
    });
  });
});

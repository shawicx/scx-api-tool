/**
 * @description 配置验证主模块测试
 * 测试 validation/index.ts 导出的所有公共 API
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock consola before any imports that use it
vi.mock('consola', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

import {
  validateConfiguration,
  createValidationError,
  createValidationReport,
  ConfigValidationError,
  displayValidationResults,
  shouldContinue,
  getErrorSummary,
} from '../index';
import { ValidationSeverity } from '../errors';
import type { ValidationReport, ValidationError } from '../errors';
import { validSwaggerUserConfig, validApifoxUserConfig } from '../../../tests/fixtures/mockData';

// ---------------------------------------------------------------------------
// createValidationError
// ---------------------------------------------------------------------------
describe('createValidationError', () => {
  it('creates an error with all fields provided', () => {
    const error = createValidationError(
      'source',
      'REQUIRED_FIELD',
      'source 是必需的',
      ValidationSeverity.ERROR,
      '请提供有效的 URL',
      'invalid-url',
    );

    expect(error).toEqual({
      field: 'source',
      code: 'REQUIRED_FIELD',
      message: 'source 是必需的',
      severity: ValidationSeverity.ERROR,
      suggestion: '请提供有效的 URL',
      value: 'invalid-url',
    });
  });

  it('defaults severity to ERROR when not provided', () => {
    const error = createValidationError('target', 'INVALID_VALUE', '无效值');

    expect(error.severity).toBe(ValidationSeverity.ERROR);
    expect(error.suggestion).toBeUndefined();
    expect(error.value).toBeUndefined();
  });

  it('creates a warning-level error', () => {
    const error = createValidationError(
      'pathPrefix',
      'INVALID_PATH_PREFIX',
      'pathPrefix 不应该以 / 开头',
      ValidationSeverity.WARNING,
    );

    expect(error.severity).toBe(ValidationSeverity.WARNING);
    expect(error.field).toBe('pathPrefix');
    expect(error.code).toBe('INVALID_PATH_PREFIX');
  });

  it('creates an info-level error', () => {
    const error = createValidationError(
      'comment',
      'SUGGESTION',
      '建议开启注释',
      ValidationSeverity.INFO,
    );

    expect(error.severity).toBe(ValidationSeverity.INFO);
  });
});

// ---------------------------------------------------------------------------
// createValidationReport
// ---------------------------------------------------------------------------
describe('createValidationReport', () => {
  it('returns a report with no blocking errors when errors array is empty', () => {
    const report = createValidationReport([]);

    expect(report.errors).toEqual([]);
    expect(report.summary).toEqual({ total: 0, errors: 0, warnings: 0, infos: 0 });
    expect(report.hasBlockingErrors).toBe(false);
    expect(report.hasErrors).toBe(false);
  });

  it('computes correct summary for mixed severities', () => {
    const errors: ValidationError[] = [
      createValidationError('a', 'E1', 'err1', ValidationSeverity.ERROR),
      createValidationError('b', 'E2', 'err2', ValidationSeverity.ERROR),
      createValidationError('c', 'W1', 'warn1', ValidationSeverity.WARNING),
      createValidationError('d', 'I1', 'info1', ValidationSeverity.INFO),
      createValidationError('e', 'W2', 'warn2', ValidationSeverity.WARNING),
    ];

    const report = createValidationReport(errors);

    expect(report.summary).toEqual({ total: 5, errors: 2, warnings: 2, infos: 1 });
    expect(report.hasBlockingErrors).toBe(true);
    expect(report.hasErrors).toBe(true);
  });

  it('sets hasBlockingErrors=false when only warnings and infos exist', () => {
    const errors: ValidationError[] = [
      createValidationError('a', 'W1', 'warn', ValidationSeverity.WARNING),
      createValidationError('b', 'I1', 'info', ValidationSeverity.INFO),
    ];

    const report = createValidationReport(errors);

    expect(report.hasBlockingErrors).toBe(false);
    expect(report.hasErrors).toBe(true);
  });

  it('sets hasErrors=false when only infos exist', () => {
    const errors: ValidationError[] = [
      createValidationError('a', 'I1', 'info', ValidationSeverity.INFO),
    ];

    const report = createValidationReport(errors);

    expect(report.hasBlockingErrors).toBe(false);
    expect(report.hasErrors).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// ConfigValidationError
// ---------------------------------------------------------------------------
describe('ConfigValidationError', () => {
  it('formats message from error-level validation errors', () => {
    const errors: ValidationError[] = [
      createValidationError('source', 'REQ', 'source 是必需的', ValidationSeverity.ERROR),
      createValidationError('token', 'REQ', 'token 是必需的', ValidationSeverity.ERROR),
    ];
    const report = createValidationReport(errors);

    const error = new ConfigValidationError(report);

    expect(error.message).toBe('配置验证失败: source: source 是必需的; token: token 是必需的');
    expect(error.name).toBe('ConfigValidationError');
    expect(error.validationReport).toBe(report);
  });

  it('only includes ERROR severity errors in the message', () => {
    const errors: ValidationError[] = [
      createValidationError('source', 'REQ', 'source 是必需的', ValidationSeverity.ERROR),
      createValidationError('path', 'WARN', '路径警告', ValidationSeverity.WARNING),
    ];
    const report = createValidationReport(errors);

    const error = new ConfigValidationError(report);

    expect(error.message).toBe('配置验证失败: source: source 是必需的');
    expect(error.validationReport.errors).toHaveLength(2);
  });

  it('is an instance of Error', () => {
    const report = createValidationReport([]);
    const error = new ConfigValidationError(report);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ConfigValidationError);
  });
});

// ---------------------------------------------------------------------------
// shouldContinue
// ---------------------------------------------------------------------------
describe('shouldContinue', () => {
  it('returns true when report has no blocking errors', () => {
    const report = createValidationReport([
      createValidationError('a', 'W', 'warn', ValidationSeverity.WARNING),
    ]);

    expect(shouldContinue(report)).toBe(true);
  });

  it('returns true for empty report', () => {
    const report = createValidationReport([]);

    expect(shouldContinue(report)).toBe(true);
  });

  it('returns false when report has blocking errors', () => {
    const report = createValidationReport([
      createValidationError('a', 'E', 'err', ValidationSeverity.ERROR),
    ]);

    expect(shouldContinue(report)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getErrorSummary
// ---------------------------------------------------------------------------
describe('getErrorSummary', () => {
  it('returns empty string for report with no errors', () => {
    const report = createValidationReport([]);

    expect(getErrorSummary(report)).toBe('');
  });

  it('returns empty string when only warnings exist', () => {
    const report = createValidationReport([
      createValidationError('a', 'W', 'warn', ValidationSeverity.WARNING),
    ]);

    expect(getErrorSummary(report)).toBe('');
  });

  it('returns joined messages for up to 5 errors', () => {
    const errors: ValidationError[] = [
      createValidationError('f1', 'E1', 'msg1', ValidationSeverity.ERROR),
      createValidationError('f2', 'E2', 'msg2', ValidationSeverity.ERROR),
      createValidationError('f3', 'E3', 'msg3', ValidationSeverity.ERROR),
    ];
    const report = createValidationReport(errors);

    expect(getErrorSummary(report)).toBe('f1: msg1; f2: msg2; f3: msg3');
  });

  it('truncates at 5 errors with suffix indicating remaining count', () => {
    const errors: ValidationError[] = Array.from({ length: 8 }, (_, i) =>
      createValidationError(`f${i + 1}`, `E${i + 1}`, `msg${i + 1}`, ValidationSeverity.ERROR),
    );
    const report = createValidationReport(errors);

    const summary = getErrorSummary(report);
    expect(summary).toContain('f1: msg1; f2: msg2; f3: msg3; f4: msg4; f5: msg5');
    expect(summary).toContain('还有 3 个错误');
  });

  it('shows exact 5 errors without suffix', () => {
    const errors: ValidationError[] = Array.from({ length: 5 }, (_, i) =>
      createValidationError(`f${i + 1}`, `E${i + 1}`, `msg${i + 1}`, ValidationSeverity.ERROR),
    );
    const report = createValidationReport(errors);

    const summary = getErrorSummary(report);
    expect(summary).toBe('f1: msg1; f2: msg2; f3: msg3; f4: msg4; f5: msg5');
    expect(summary).not.toContain('还有');
  });

  it('filters out non-ERROR severities from summary', () => {
    const errors: ValidationError[] = [
      createValidationError('f1', 'E1', 'msg1', ValidationSeverity.ERROR),
      createValidationError('f2', 'W1', 'warn', ValidationSeverity.WARNING),
      createValidationError('f3', 'I1', 'info', ValidationSeverity.INFO),
    ];
    const report = createValidationReport(errors);

    expect(getErrorSummary(report)).toBe('f1: msg1');
  });
});

// ---------------------------------------------------------------------------
// displayValidationResults
// ---------------------------------------------------------------------------
describe('displayValidationResults', () => {
  let consola: (typeof import('consola'))['default'];

  beforeEach(async () => {
    consola = (await import('consola')).default;
    vi.clearAllMocks();
  });

  it('calls consola.success when there are no errors', () => {
    const report = createValidationReport([]);

    displayValidationResults(report);

    expect(consola.success).toHaveBeenCalledWith('配置验证通过');
    expect(consola.error).not.toHaveBeenCalled();
    expect(consola.warn).not.toHaveBeenCalled();
  });

  it('displays error-level messages using consola.error', () => {
    const report = createValidationReport([
      createValidationError('source', 'REQ', 'source 是必需的', ValidationSeverity.ERROR),
    ]);

    displayValidationResults(report);

    expect(consola.error).toHaveBeenCalled();
    // Summary line + error detail line
    const errorCalls = consola.error as ReturnType<typeof vi.fn>;
    expect(errorCalls.mock.calls.some((c: string[]) => c[0].includes('发现 1 个错误'))).toBe(true);
    expect(errorCalls.mock.calls.some((c: string[]) => c[0].includes('source'))).toBe(true);
  });

  it('displays warning-level messages using consola.warn', () => {
    const report = createValidationReport([
      createValidationError('path', 'W', '路径警告', ValidationSeverity.WARNING),
    ]);

    displayValidationResults(report);

    expect(consola.warn).toHaveBeenCalled();
    const warnCalls = consola.warn as ReturnType<typeof vi.fn>;
    expect(warnCalls.mock.calls.some((c: string[]) => c[0].includes('发现 1 个警告'))).toBe(true);
  });

  it('displays info-level messages using consola.info', () => {
    const report = createValidationReport([
      createValidationError('comment', 'I', '建议信息', ValidationSeverity.INFO),
    ]);

    displayValidationResults(report);

    expect(consola.info).toHaveBeenCalled();
    const infoCalls = consola.info as ReturnType<typeof vi.fn>;
    expect(infoCalls.mock.calls.some((c: string[]) => c[0].includes('1 个建议'))).toBe(true);
  });

  it('displays suggestion for errors when provided', () => {
    const report = createValidationReport([
      createValidationError(
        'source',
        'REQ',
        'source 是必需的',
        ValidationSeverity.ERROR,
        '请提供有效的 URL',
      ),
    ]);

    displayValidationResults(report);

    const infoCalls = consola.info as ReturnType<typeof vi.fn>;
    expect(infoCalls.mock.calls.some((c: string[]) => c[0].includes('修复建议'))).toBe(true);
  });

  it('displays value for errors when provided', () => {
    const report = createValidationReport([
      createValidationError(
        'target',
        'INVAL',
        '无效值',
        ValidationSeverity.ERROR,
        undefined,
        'bad-value',
      ),
    ]);

    displayValidationResults(report);

    const errorCalls = consola.error as ReturnType<typeof vi.fn>;
    expect(errorCalls.mock.calls.some((c: string[]) => c[0].includes('当前值'))).toBe(true);
  });

  it('displays summary with errors, warnings, and infos', () => {
    const report = createValidationReport([
      createValidationError('a', 'E', 'err', ValidationSeverity.ERROR),
      createValidationError('b', 'W', 'warn', ValidationSeverity.WARNING),
      createValidationError('c', 'I', 'info', ValidationSeverity.INFO),
    ]);

    displayValidationResults(report);

    const errorCalls = consola.error as ReturnType<typeof vi.fn>;
    // Summary line should mention all three categories
    expect(
      errorCalls.mock.calls.some(
        (c: string[]) =>
          c[0].includes('1 个错误') && c[0].includes('1 个警告') && c[0].includes('1 个建议'),
      ),
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateConfiguration (integration)
// ---------------------------------------------------------------------------
describe('validateConfiguration', () => {
  let consola: (typeof import('consola'))['default'];

  beforeEach(async () => {
    consola = (await import('consola')).default;
    vi.clearAllMocks();
  });

  it('passes without throwing for a valid Swagger config', () => {
    const config = { ...validSwaggerUserConfig, generateApi: true, generateTypes: true };
    expect(() => validateConfiguration(config)).not.toThrow();
  });

  it('passes without throwing for a valid Apifox config', () => {
    const config = { ...validApifoxUserConfig, generateApi: true, generateTypes: true };
    expect(() => validateConfiguration(config)).not.toThrow();
  });

  it('calls consola.success for a valid config', () => {
    const config = { ...validSwaggerUserConfig, generateApi: true, generateTypes: true };
    validateConfiguration(config);

    expect(consola.success).toHaveBeenCalledWith('配置验证通过');
  });

  it('throws ConfigValidationError for missing source', () => {
    const config = { source: '', token: '' };

    expect(() => validateConfiguration(config as any)).toThrow(ConfigValidationError);
  });

  it('throws ConfigValidationError with validationReport property', () => {
    const config = { source: '', token: '' };

    try {
      validateConfiguration(config as any);
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigValidationError);
      expect((error as ConfigValidationError).validationReport).toBeDefined();
      expect((error as ConfigValidationError).validationReport.hasBlockingErrors).toBe(true);
    }
  });

  it('throws for invalid target enum value', () => {
    const config = { ...validSwaggerUserConfig, generateApi: true, target: 'python' as any };

    expect(() => validateConfiguration(config)).toThrow(ConfigValidationError);
  });

  it('throws for Apifox source without token', () => {
    const config = {
      source: 'https://api.apifox.com/v1/projects/123456/export-openapi',
      token: '',
      generateApi: true,
    };

    expect(() => validateConfiguration(config)).toThrow(ConfigValidationError);
  });

  it('throws when both generateApi and generateTypes are false', () => {
    const config = { ...validSwaggerUserConfig, generateApi: false, generateTypes: false };

    expect(() => validateConfiguration(config)).toThrow(ConfigValidationError);
  });

  it('does not throw for warnings-only config (non-blocking)', () => {
    // pathPrefix with leading / produces a warning but not an error
    const config = { ...validSwaggerUserConfig, generateApi: true, pathPrefix: '/api' };

    expect(() => validateConfiguration(config)).not.toThrow();
  });
});

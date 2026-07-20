/**
 * @description errors 模块单元测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '@/utils/logger';
import { ErrorCode, BaseError, ErrorFactory, handleError, withErrorHandling } from '../index';
import { ConfigError, FetchError, GenerateError } from '../errorClasses';
import type { ErrorSolution } from '../errorClasses';

// Mock logger
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

// Helper to create a basic ErrorSolution
const testSolution: ErrorSolution = {
  title: 'Test Solution',
  steps: ['Step 1', 'Step 2'],
};

// ---------------------------------------------------------------------------
// ErrorCode enum
// ---------------------------------------------------------------------------
describe('ErrorCode', () => {
  it('should have all config error codes', () => {
    expect(ErrorCode.CONFIG_FILE_NOT_FOUND).toBe('E1001');
    expect(ErrorCode.CONFIG_INVALID).toBe('E1002');
    expect(ErrorCode.CONFIG_PARSE_ERROR).toBe('E1003');
    expect(ErrorCode.CONFIG_MISSING_REQUIRED).toBe('E1004');
    expect(ErrorCode.CONFIG_INVALID_URL).toBe('E1005');
  });

  it('should have all fetch error codes', () => {
    expect(ErrorCode.FETCH_REQUEST_FAILED).toBe('E2001');
    expect(ErrorCode.FETCH_UNAUTHORIZED).toBe('E2002');
    expect(ErrorCode.FETCH_TIMEOUT).toBe('E2003');
    expect(ErrorCode.FETCH_INVALID_RESPONSE).toBe('E2004');
    expect(ErrorCode.FETCH_NETWORK_ERROR).toBe('E2005');
  });

  it('should have all generate error codes', () => {
    expect(ErrorCode.GENERATE_TEMPLATE_ERROR).toBe('E3001');
    expect(ErrorCode.GENERATE_WRITE_ERROR).toBe('E3002');
    expect(ErrorCode.GENERATE_TYPE_ERROR).toBe('E3003');
    expect(ErrorCode.GENERATE_SCHEMA_ERROR).toBe('E3004');
  });

  it('should have exactly 15 enum members', () => {
    const keys = Object.keys(ErrorCode).filter((k) => isNaN(Number(k)));
    expect(keys).toHaveLength(15);
  });
});

// ---------------------------------------------------------------------------
// BaseError
// ---------------------------------------------------------------------------
describe('BaseError', () => {
  it('should set properties correctly via constructor', () => {
    const originalError = new Error('inner');
    const error = new BaseError(
      ErrorCode.CONFIG_INVALID,
      'config broken',
      [testSolution],
      originalError,
    );

    expect(error.code).toBe(ErrorCode.CONFIG_INVALID);
    expect(error.message).toBe('config broken');
    expect(error.solutions).toEqual([testSolution]);
    expect(error.originalError).toBe(originalError);
  });

  it('should set name to constructor name', () => {
    const error = new BaseError(ErrorCode.CONFIG_INVALID, 'msg', []);
    expect(error.name).toBe('BaseError');
  });

  it('should be an instance of Error', () => {
    const error = new BaseError(ErrorCode.CONFIG_INVALID, 'msg', []);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(BaseError);
  });

  it('should have optional originalError', () => {
    const error = new BaseError(ErrorCode.CONFIG_INVALID, 'msg', []);
    expect(error.originalError).toBeUndefined();
  });

  describe('format', () => {
    it('should return concise string with message and code when verbose is false', () => {
      const error = new BaseError(ErrorCode.CONFIG_INVALID, 'config broken', []);
      const formatted = error.format(false);

      expect(formatted).toContain('config broken');
      expect(formatted).toContain('E1002');
    });

    it('should include solutions in output', () => {
      const solution: ErrorSolution = {
        title: 'Check config',
        steps: ['Verify format', 'Check syntax'],
        documentation: 'https://example.com/docs',
      };
      const error = new BaseError(ErrorCode.CONFIG_INVALID, 'config broken', [solution]);
      const formatted = error.format(false);

      expect(formatted).toContain('Check config');
      expect(formatted).toContain('Verify format');
      expect(formatted).toContain('Check syntax');
      expect(formatted).toContain('https://example.com/docs');
    });

    it('should include original error when verbose is true and originalError exists', () => {
      const originalError = new Error('inner error');
      const error = new BaseError(ErrorCode.CONFIG_INVALID, 'outer', [], originalError);
      const formatted = error.format(true);

      expect(formatted).toContain('原始错误');
      expect(formatted).toContain(originalError.toString());
    });

    it('should include stack trace when verbose is true', () => {
      const error = new BaseError(ErrorCode.CONFIG_INVALID, 'outer', []);
      const formatted = error.format(true);

      expect(formatted).toContain('堆栈跟踪');
      expect(formatted).toContain(error.stack!);
    });

    it('should NOT include original error or stack when verbose is false', () => {
      const originalError = new Error('inner error');
      const error = new BaseError(ErrorCode.CONFIG_INVALID, 'outer', [], originalError);
      const formatted = error.format(false);

      // The concise output should not contain the verbose sections
      expect(formatted).not.toContain(error.stack!);
    });
  });

  describe('print', () => {
    beforeEach(() => {
      vi.mocked(logger.error).mockClear();
    });

    it('should call logger.error with format result', () => {
      const error = new BaseError(ErrorCode.CONFIG_INVALID, 'msg', []);
      error.print(false);

      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(error.format(false));
    });

    it('should pass verbose flag to format', () => {
      const error = new BaseError(ErrorCode.CONFIG_INVALID, 'msg', []);
      const formatSpy = vi.spyOn(error, 'format');
      error.print(true);

      expect(formatSpy).toHaveBeenCalledWith(true);
    });
  });
});

// ---------------------------------------------------------------------------
// ConfigError / FetchError / GenerateError — inheritance
// ---------------------------------------------------------------------------
describe('ConfigError', () => {
  it('should extend BaseError', () => {
    const error = new ConfigError('msg', []);
    expect(error).toBeInstanceOf(BaseError);
    expect(error).toBeInstanceOf(ConfigError);
    expect(error).toBeInstanceOf(Error);
  });

  it('should set name to ConfigError', () => {
    const error = new ConfigError('msg', []);
    expect(error.name).toBe('ConfigError');
  });

  it('should have default code CONFIG_INVALID', () => {
    const error = new ConfigError('msg', []);
    expect(error.code).toBe(ErrorCode.CONFIG_INVALID);
  });

  it('should accept originalError', () => {
    const inner = new Error('inner');
    const error = new ConfigError('msg', [], inner);
    expect(error.originalError).toBe(inner);
  });
});

describe('FetchError', () => {
  it('should extend BaseError', () => {
    const error = new FetchError('msg', []);
    expect(error).toBeInstanceOf(BaseError);
    expect(error).toBeInstanceOf(FetchError);
    expect(error).toBeInstanceOf(Error);
  });

  it('should set name to FetchError', () => {
    const error = new FetchError('msg', []);
    expect(error.name).toBe('FetchError');
  });

  it('should have default code FETCH_REQUEST_FAILED', () => {
    const error = new FetchError('msg', []);
    expect(error.code).toBe(ErrorCode.FETCH_REQUEST_FAILED);
  });
});

describe('GenerateError', () => {
  it('should extend BaseError', () => {
    const error = new GenerateError('msg', []);
    expect(error).toBeInstanceOf(BaseError);
    expect(error).toBeInstanceOf(GenerateError);
    expect(error).toBeInstanceOf(Error);
  });

  it('should set name to GenerateError', () => {
    const error = new GenerateError('msg', []);
    expect(error.name).toBe('GenerateError');
  });

  it('should have default code GENERATE_TEMPLATE_ERROR', () => {
    const error = new GenerateError('msg', []);
    expect(error.code).toBe(ErrorCode.GENERATE_TEMPLATE_ERROR);
  });
});

// ---------------------------------------------------------------------------
// ErrorFactory
// ---------------------------------------------------------------------------
describe('ErrorFactory', () => {
  // -- Config errors --
  describe('configNotFound', () => {
    it('should return a ConfigError with config path in message', () => {
      const error = ErrorFactory.configNotFound('./api-power.config.ts');
      expect(error).toBeInstanceOf(ConfigError);
      expect(error.message).toContain('./api-power.config.ts');
      expect(error.solutions.length).toBeGreaterThan(0);
    });
  });

  describe('configInvalid', () => {
    it('should return a ConfigError with provided message', () => {
      const error = ErrorFactory.configInvalid('bad value', [testSolution]);
      expect(error).toBeInstanceOf(ConfigError);
      expect(error.message).toBe('bad value');
      expect(error.solutions).toEqual([testSolution]);
    });

    it('should return a ConfigError without solutions when not provided', () => {
      const error = ErrorFactory.configInvalid('bad value', []);
      expect(error).toBeInstanceOf(ConfigError);
      expect(error.solutions).toEqual([]);
    });
  });

  describe('configParseError', () => {
    it('should return a ConfigError with config path in message and originalError', () => {
      const originalError = new Error('syntax error');
      const error = ErrorFactory.configParseError('./config.ts', originalError);
      expect(error).toBeInstanceOf(ConfigError);
      expect(error.message).toContain('./config.ts');
      expect(error.originalError).toBe(originalError);
      expect(error.solutions.length).toBeGreaterThan(0);
    });
  });

  describe('configMissingRequired', () => {
    it('should return a ConfigError with field name in message', () => {
      const error = ErrorFactory.configMissingRequired('source');
      expect(error).toBeInstanceOf(ConfigError);
      expect(error.message).toContain('source');
      expect(error.solutions.length).toBeGreaterThan(0);
    });
  });

  describe('invalidUrl', () => {
    it('should return a ConfigError with URL in message', () => {
      const error = ErrorFactory.invalidUrl('ftp://bad-url');
      expect(error).toBeInstanceOf(ConfigError);
      expect(error.message).toContain('ftp://bad-url');
      expect(error.solutions.length).toBeGreaterThan(0);
    });
  });

  // -- Fetch errors --
  describe('fetchFailed', () => {
    it('should return a FetchError with URL in message', () => {
      const error = ErrorFactory.fetchFailed('https://api.example.com/data');
      expect(error).toBeInstanceOf(FetchError);
      expect(error.message).toContain('https://api.example.com/data');
      expect(error.originalError).toBeUndefined();
    });

    it('should include statusCode in message when provided', () => {
      const error = ErrorFactory.fetchFailed('https://api.example.com/data', 500);
      expect(error.message).toContain('500');
    });

    it('should include originalError when provided', () => {
      const originalError = new Error('network down');
      const error = ErrorFactory.fetchFailed(
        'https://api.example.com/data',
        undefined,
        originalError,
      );
      expect(error.originalError).toBe(originalError);
    });
  });

  describe('unauthorized', () => {
    it('should return a FetchError with URL in message', () => {
      const error = ErrorFactory.unauthorized('https://api.example.com/data');
      expect(error).toBeInstanceOf(FetchError);
      expect(error.message).toContain('https://api.example.com/data');
      expect(error.solutions.length).toBeGreaterThan(0);
    });
  });

  describe('timeout', () => {
    it('should return a FetchError with URL and timeoutMs in message', () => {
      const error = ErrorFactory.timeout('https://api.example.com/data', 30000);
      expect(error).toBeInstanceOf(FetchError);
      expect(error.message).toContain('https://api.example.com/data');
      expect(error.message).toContain('30000');
      expect(error.solutions.length).toBeGreaterThan(0);
    });
  });

  describe('invalidResponse', () => {
    it('should return a FetchError with URL and expected format in message', () => {
      const error = ErrorFactory.invalidResponse('https://api.example.com/data', 'OpenAPI 3.0');
      expect(error).toBeInstanceOf(FetchError);
      expect(error.message).toContain('https://api.example.com/data');
      expect(error.message).toContain('OpenAPI 3.0');
    });
  });

  // -- Generate errors --
  describe('templateError', () => {
    it('should return a GenerateError with template name in message and originalError', () => {
      const originalError = new Error('compile failed');
      const error = ErrorFactory.templateError('api-template.hbs', originalError);
      expect(error).toBeInstanceOf(GenerateError);
      expect(error.message).toContain('api-template.hbs');
      expect(error.originalError).toBe(originalError);
      expect(error.solutions.length).toBeGreaterThan(0);
    });
  });

  describe('writeError', () => {
    it('should return a GenerateError with file path in message and originalError', () => {
      const originalError = new Error('permission denied');
      const error = ErrorFactory.writeError('/output/api.ts', originalError);
      expect(error).toBeInstanceOf(GenerateError);
      expect(error.message).toContain('/output/api.ts');
      expect(error.originalError).toBe(originalError);
      expect(error.solutions.length).toBeGreaterThan(0);
    });
  });

  describe('schemaError', () => {
    it('should return a GenerateError with message in output', () => {
      const error = ErrorFactory.schemaError('/paths/users', 'missing required field');
      expect(error).toBeInstanceOf(GenerateError);
      expect(error.message).toContain('missing required field');
      expect(error.solutions.length).toBeGreaterThan(0);
    });
  });

  // -- 新增工厂方法 --
  describe('networkError', () => {
    it('should return a FetchError with URL in message', () => {
      const error = ErrorFactory.networkError('https://api.example.com/data');
      expect(error).toBeInstanceOf(FetchError);
      expect(error.message).toContain('https://api.example.com/data');
      expect(error.solutions.length).toBeGreaterThan(0);
    });

    it('should include originalError when provided', () => {
      const inner = new Error('ENOTFOUND');
      const error = ErrorFactory.networkError('https://api.example.com', inner);
      expect(error.originalError).toBe(inner);
    });
  });

  describe('typeError', () => {
    it('should return a GenerateError with type name and message', () => {
      const error = ErrorFactory.typeError('UserDTO', '无法解析的属性结构');
      expect(error).toBeInstanceOf(GenerateError);
      expect(error.message).toContain('UserDTO');
      expect(error.message).toContain('无法解析的属性结构');
      expect(error.solutions.length).toBeGreaterThan(0);
    });
  });

  // -- 错误码映射锁定（防止 dead enum 复现）--
  describe('错误码映射', () => {
    it('配置类工厂方法应返回精确错误码', () => {
      expect(ErrorFactory.configNotFound('./c.ts').code).toBe(ErrorCode.CONFIG_FILE_NOT_FOUND);
      expect(ErrorFactory.configInvalid('msg', []).code).toBe(ErrorCode.CONFIG_INVALID);
      expect(ErrorFactory.configParseError('./c.ts', new Error('e')).code).toBe(
        ErrorCode.CONFIG_PARSE_ERROR,
      );
      expect(ErrorFactory.configMissingRequired('source').code).toBe(
        ErrorCode.CONFIG_MISSING_REQUIRED,
      );
      expect(ErrorFactory.invalidUrl('ftp://x').code).toBe(ErrorCode.CONFIG_INVALID_URL);
    });

    it('网络类工厂方法应返回精确错误码', () => {
      expect(ErrorFactory.fetchFailed('https://x').code).toBe(ErrorCode.FETCH_REQUEST_FAILED);
      expect(ErrorFactory.unauthorized('https://x').code).toBe(ErrorCode.FETCH_UNAUTHORIZED);
      expect(ErrorFactory.timeout('https://x', 30000).code).toBe(ErrorCode.FETCH_TIMEOUT);
      expect(ErrorFactory.invalidResponse('https://x', 'json').code).toBe(
        ErrorCode.FETCH_INVALID_RESPONSE,
      );
      expect(ErrorFactory.networkError('https://x').code).toBe(ErrorCode.FETCH_NETWORK_ERROR);
    });

    it('生成类工厂方法应返回精确错误码', () => {
      expect(ErrorFactory.templateError('t.hbs', new Error('e')).code).toBe(
        ErrorCode.GENERATE_TEMPLATE_ERROR,
      );
      expect(ErrorFactory.writeError('/o.ts', new Error('e')).code).toBe(
        ErrorCode.GENERATE_WRITE_ERROR,
      );
      expect(ErrorFactory.typeError('T', 'msg').code).toBe(ErrorCode.GENERATE_TYPE_ERROR);
      expect(ErrorFactory.schemaError('/p', 'msg').code).toBe(ErrorCode.GENERATE_SCHEMA_ERROR);
    });

    it('子类构造函数支持自定义错误码', () => {
      expect(new ConfigError('m', [], undefined, ErrorCode.CONFIG_PARSE_ERROR).code).toBe(
        ErrorCode.CONFIG_PARSE_ERROR,
      );
      expect(new FetchError('m', [], undefined, ErrorCode.FETCH_TIMEOUT).code).toBe(
        ErrorCode.FETCH_TIMEOUT,
      );
      expect(new GenerateError('m', [], undefined, ErrorCode.GENERATE_WRITE_ERROR).code).toBe(
        ErrorCode.GENERATE_WRITE_ERROR,
      );
    });
  });
});

// ---------------------------------------------------------------------------
// handleError
// ---------------------------------------------------------------------------
describe('handleError', () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('exit');
    }) as never);
    vi.mocked(logger.error).mockClear();
  });

  afterEach(() => {
    exitSpy.mockRestore();
  });

  it('should call print() and exit for BaseError', () => {
    const error = new BaseError(ErrorCode.CONFIG_INVALID, 'test error', [testSolution]);
    const printSpy = vi.spyOn(error, 'print');

    expect(() => handleError(error)).toThrow('exit');
    expect(printSpy).toHaveBeenCalledWith(false);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should call print() with verbose flag for BaseError when verbose is true', () => {
    const error = new BaseError(ErrorCode.CONFIG_INVALID, 'test error', [testSolution]);
    const printSpy = vi.spyOn(error, 'print');

    expect(() => handleError(error, true)).toThrow('exit');
    expect(printSpy).toHaveBeenCalledWith(true);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should use logger.error and exit for plain Error', () => {
    const error = new Error('plain error');

    expect(() => handleError(error)).toThrow('exit');
    expect(logger.error).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should include stack trace for plain Error when verbose is true', () => {
    const error = new Error('plain error');

    expect(() => handleError(error, true)).toThrow('exit');
    // logger.error is called multiple times: message + blank + stack header + stack
    expect(logger.error).toHaveBeenCalledTimes(4);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should use logger.error and exit for non-Error value', () => {
    expect(() => handleError('string error')).toThrow('exit');
    expect(logger.error).toHaveBeenCalledWith('✖ string error');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should handle non-Error objects by converting to string', () => {
    expect(() => handleError(42)).toThrow('exit');
    expect(logger.error).toHaveBeenCalledWith('✖ 42');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});

// ---------------------------------------------------------------------------
// withErrorHandling
// ---------------------------------------------------------------------------
describe('withErrorHandling', () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('exit');
    }) as never);
    vi.mocked(logger.error).mockClear();
  });

  afterEach(() => {
    exitSpy.mockRestore();
  });

  it('should return the result of the wrapped function on success', async () => {
    const fn = async (x: number) => x * 2;
    const wrapped = withErrorHandling(fn);

    const result = await wrapped(5);
    expect(result).toBe(10);
  });

  it('should catch BaseError and call handleError', async () => {
    const baseError = new BaseError(ErrorCode.CONFIG_INVALID, 'wrapped error', []);
    const fn = async () => {
      throw baseError;
    };
    const wrapped = withErrorHandling(fn);

    await expect(wrapped()).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should catch plain Error and call handleError', async () => {
    const fn = async () => {
      throw new Error('async failure');
    };
    const wrapped = withErrorHandling(fn);

    await expect(wrapped()).rejects.toThrow('exit');
    expect(logger.error).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should pass verbose flag to handleError', async () => {
    const fn = async () => {
      throw new Error('fail');
    };
    const wrapped = withErrorHandling(fn, true);

    await expect(wrapped()).rejects.toThrow('exit');
    // When verbose is true, handleError calls logger.error multiple times for Error
    expect(logger.error).toHaveBeenCalledTimes(4);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});

// ---------------------------------------------------------------------------
// ErrorFactory.pathTransformError
// ---------------------------------------------------------------------------
describe('ErrorFactory.pathTransformError', () => {
  it('应创建带原始 path 和消息的 GenerateError', () => {
    const error = ErrorFactory.pathTransformError('/users', '处理失败');
    expect(error).toBeInstanceOf(GenerateError);
    expect(error.message).toContain('/users');
    expect(error.message).toContain('处理失败');
    expect(error.code).toBe(ErrorCode.GENERATE_PATH_TRANSFORM_ERROR);
    expect(error.solutions).toHaveLength(1);
    expect(error.solutions[0].title).toBe('检查 pathPrefix 函数实现');
    expect(error.originalError).toBeUndefined();
  });

  it('应保留原始错误对象', () => {
    const original = new Error('boom');
    const error = ErrorFactory.pathTransformError('/users', '函数抛出异常', original);
    expect(error.originalError).toBe(original);
  });
});

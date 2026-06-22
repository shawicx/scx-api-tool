/**
 * @description pathSafety.ts 单元测试
 * 验证路径遍历防护
 */

import { describe, it, expect } from 'vitest';
import { isWithinCwd, assertWithinCwd } from '../pathSafety';
import { ConfigError } from '@/errors/errorClasses';

describe('isWithinCwd', () => {
  it('项目内相对路径应返回 true', () => {
    expect(isWithinCwd('src/service')).toBe(true);
    expect(isWithinCwd('src/generators/interfaceGenerator.ts')).toBe(true);
    expect(isWithinCwd('./src/service')).toBe(true);
  });

  it('向上遍历的相对路径应返回 false', () => {
    expect(isWithinCwd('../../')).toBe(false);
    expect(isWithinCwd('../etc')).toBe(false);
    expect(isWithinCwd('src/../../etc')).toBe(false);
  });

  it('系统绝对路径应返回 false', () => {
    expect(isWithinCwd('/etc')).toBe(false);
    expect(isWithinCwd('/')).toBe(false);
    expect(isWithinCwd('/usr/local/bin')).toBe(false);
  });

  it('cwd 本身应返回 true', () => {
    expect(isWithinCwd('.')).toBe(true);
  });
});

describe('assertWithinCwd', () => {
  it('安全路径不抛错', () => {
    expect(() => assertWithinCwd('src/service', 'outputDir')).not.toThrow();
    expect(() => assertWithinCwd('./dist', 'requestFunctionFilePath')).not.toThrow();
  });

  it('向上遍历路径应抛 ConfigError', () => {
    expect(() => assertWithinCwd('../../', 'outputDir')).toThrow(ConfigError);
    expect(() => assertWithinCwd('../etc', 'outputDir')).toThrow(ConfigError);
  });

  it('系统绝对路径应抛 ConfigError', () => {
    expect(() => assertWithinCwd('/etc', 'outputDir')).toThrow(ConfigError);
    expect(() => assertWithinCwd('/', 'outputDir')).toThrow(ConfigError);
  });

  it('错误信息应包含路径标签和具体路径', () => {
    try {
      assertWithinCwd('../../etc', 'outputDir');
      expect.fail('应抛错');
    } catch (e) {
      expect(e).toBeInstanceOf(ConfigError);
      expect((e as Error).message).toContain('outputDir');
      expect((e as Error).message).toContain('../../etc');
    }
  });
});

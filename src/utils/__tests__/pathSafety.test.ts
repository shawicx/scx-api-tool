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

  it('cwd 本身应返回 false（删除型操作会清空整个项目）', () => {
    expect(isWithinCwd('.')).toBe(false);
    expect(isWithinCwd('./')).toBe(false);
    expect(isWithinCwd('')).toBe(false);
    expect(isWithinCwd(process.cwd())).toBe(false);
  });

  it('路径规范化等价形态应正确归一（./ 前缀、尾斜杠、中间点段、.. 回退）', () => {
    expect(isWithinCwd('src/service/')).toBe(true);
    expect(isWithinCwd('src/./service')).toBe(true);
    expect(isWithinCwd('src/a/../service')).toBe(true);
    expect(isWithinCwd('././src//service')).toBe(true);
    // 规范化后恰为 cwd：'src/..' === '.'
    expect(isWithinCwd('src/..')).toBe(false);
    expect(isWithinCwd('src/service/../..')).toBe(false);
  });

  it('中段 .. 逃逸应返回 false（不等价于前缀字符串比较）', () => {
    // 若仅做字符串前缀判定，'src/../..' 之类的形态可能被漏判；resolve 归一后正确越界
    expect(isWithinCwd('src/../..')).toBe(false);
    expect(isWithinCwd('src/service/../../../etc')).toBe(false);
  });

  it('cwd 内的绝对路径应返回 true（仅路径形式不同，不视为越界）', () => {
    expect(isWithinCwd(`${process.cwd()}/src/service`)).toBe(true);
    expect(isWithinCwd(`${process.cwd()}/./src`)).toBe(true);
  });

  it('UNC 风格路径（//server/share）应返回 false', () => {
    // POSIX 下 '//server/share' 是保留双斜杠的绝对路径，relative 结果含 '..' 或以 '/' 开头
    expect(isWithinCwd('//server/share')).toBe(false);
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

  it('指向 cwd 本身的路径应抛 ConfigError（防误删项目根）', () => {
    expect(() => assertWithinCwd('.', 'outputDir')).toThrow(ConfigError);
    expect(() => assertWithinCwd('', 'requestFunctionFilePath')).toThrow(ConfigError);
    expect(() => assertWithinCwd(process.cwd(), 'outputDir')).toThrow(ConfigError);
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

/**
 * @description 服务输出目录隔离验证器专项测试
 * 覆盖路径规范化等价冲突、嵌套冲突、逃逸项目根/指向项目根本身、
 * 以及 POSIX 下绝对路径 folder 的 join 行为。安全判定基于 resolve + relative
 * 的路径语义（非字符串前缀比较）。
 */

import { describe, it, expect } from 'vitest';
import { join, resolve } from 'path';
import { validateServiceOutputDirs } from '../serviceDirs';
import type { ServiceConfig } from '@/types';

function svc(name: string, folder?: string): ServiceConfig {
  return { name, source: `https://${name}.example.com/swagger.json`, folder };
}

function conflictCodes(errors: ReturnType<typeof validateServiceOutputDirs>): string[] {
  return errors.map((e) => e.code);
}

describe('validateServiceOutputDirs - 隔离与嵌套', () => {
  it('不同的一级目录应通过（无错误）', () => {
    const errors = validateServiceOutputDirs([svc('user'), svc('order')]);
    expect(errors).toEqual([]);
  });

  it('多段 folder 互不为前缀时应通过', () => {
    const errors = validateServiceOutputDirs([svc('a', 'trade/order'), svc('b', 'trade/order2')]);
    expect(errors).toEqual([]);
  });

  it('同名默认 folder（name 相同经规范化后冲突）应报 OUTPUT_DIR_CONFLICT', () => {
    const errors = validateServiceOutputDirs([svc('user'), svc('user')]);
    expect(conflictCodes(errors)).toContain('OUTPUT_DIR_CONFLICT');
  });

  it('父目录与子目录嵌套应报 OUTPUT_DIR_CONFLICT', () => {
    const errors = validateServiceOutputDirs([svc('trade'), svc('order', 'trade/order')]);
    expect(conflictCodes(errors)).toContain('OUTPUT_DIR_CONFLICT');
  });

  it('规范化等价路径（./ 前缀、尾斜杠、中间点段、.. 回退）应识别为冲突', () => {
    const cases: Array<[ServiceConfig, ServiceConfig]> = [
      // 'user' vs './user'
      [svc('a', 'user'), svc('b', './user')],
      // 'user' vs 'user/'
      [svc('a', 'user'), svc('b', 'user/')],
      // 'a/b' vs 'a/./b'
      [svc('a', 'a/b'), svc('b', 'a/./b')],
      // 'a/c' vs 'a/b/../c'
      [svc('a', 'a/c'), svc('b', 'a/b/../c')],
    ];
    for (const [x, y] of cases) {
      const errors = validateServiceOutputDirs([x, y]);
      expect(conflictCodes(errors)).toContain('OUTPUT_DIR_CONFLICT');
    }
  });

  it('双斜杠路径应规范化后判定（src//user 等价于 src/user）', () => {
    const errors = validateServiceOutputDirs([svc('a', 'base/user'), svc('b', 'base//user')]);
    expect(conflictCodes(errors)).toContain('OUTPUT_DIR_CONFLICT');
  });

  it('POSIX 下绝对路径 folder 经 join 落在 baseOutputDir 内，不产生逃逸错误', () => {
    // join('src/service', '/tmp/x') === 'src/service/tmp/x'（join 将其视为路径段）
    const errors = validateServiceOutputDirs([svc('a', '/tmp/x')]);
    expect(conflictCodes(errors)).not.toContain('OUTPUT_DIR_ESCAPE');
  });
});

describe('validateServiceOutputDirs - 项目根边界', () => {
  it('folder 含 ../.. 逃逸项目根应报 OUTPUT_DIR_ESCAPE', () => {
    const errors = validateServiceOutputDirs([svc('a', '../../../outside')]);
    expect(conflictCodes(errors)).toContain('OUTPUT_DIR_ESCAPE');
  });

  it('baseOutputDir 配合 folder 解析后恰为 cwd 应报 OUTPUT_DIR_ESCAPE', () => {
    // join('.', '../..') === '..'，相对项目根的父目录；再配合多一级回退命中边界场景
    const errors = validateServiceOutputDirs([svc('a', '.')], '.');
    // join('.', '.') === '.'，即 cwd 本身，必须拦截
    expect(conflictCodes(errors)).toContain('OUTPUT_DIR_ESCAPE');
  });

  it('folder 上移一级仍位于项目内（src/sibling）不应误报逃逸', () => {
    // join('src/service', '../sibling') === 'src/sibling'，仍在项目根之内，属合法配置
    const errors = validateServiceOutputDirs([svc('a', '../sibling')]);
    expect(conflictCodes(errors)).not.toContain('OUTPUT_DIR_ESCAPE');
  });

  it('cwd 内的绝对路径 outputDir 不应报逃逸（仅路径形式不同）', () => {
    // 构造指向 cwd 内真实子目录的绝对路径 folder（join 后仍位于 cwd 内）
    const absFolder = resolve(process.cwd(), 'src/service/abs-user');
    // join 会把绝对路径拼为段，这里直接验证该形态不误报
    const errors = validateServiceOutputDirs([svc('a', absFolder)]);
    expect(conflictCodes(errors)).not.toContain('OUTPUT_DIR_ESCAPE');
  });

  it('正常配置下不产生任何逃逸错误', () => {
    const errors = validateServiceOutputDirs(
      [svc('user'), svc('order', 'trade/order')],
      join('src', 'api'),
    );
    expect(errors).toEqual([]);
  });
});

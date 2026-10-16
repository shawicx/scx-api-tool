/**
 * @description TypeScript 目标 + generateHooks 的生成结果正确性测试
 *
 * 背景：hooks 的端点类型导入曾错误指向共享 types 目录（实际内联于标签目录 index.ts），
 * 且 hooks 场景此前从未被 E2E 覆盖。本文件锁定修复后的形态：
 * 1. 文件结构：各标签目录生成 hooks.ts，服务根生成 barrel
 * 2. hooks 的端点 Request/Result 类型从同目录 './index' 导入
 * 3. 接口文件 method 为字符串字面量，不导入 RequestMethod（与自定义 request 文件解耦）
 * 4. 生成代码通过 TypeScript 类型检查（编译器 API，noEmit，含 @tanstack/react-query 类型解析）
 * 5. hooks 文件快照，防止无意识的输出漂移
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { join } from 'node:path';
import { petOpenApiDocument } from './fixtures/openApiContract';
import {
  runGeneration,
  startOpenApiServer,
  listGeneratedFiles,
  readGeneratedFile,
  typeCheckGenerated,
  tagDirName,
} from './helpers';

const CASE_NAME = 'ts-hooks';
const TAG_DIR = tagDirName('宠物管理');

describe('生成结果正确性：TypeScript 目标 + Hooks', () => {
  let outDir: string;

  beforeAll(async () => {
    const api = await startOpenApiServer({ '/v3/api-docs': petOpenApiDocument });
    try {
      const result = await runGeneration(CASE_NAME, {
        target: 'typescript',
        typesFormat: 'typescript',
        generateHooks: true,
        hooksLibrary: 'react-query',
        services: [{ name: 'pet', source: `http://127.0.0.1:${api.port}/v3/api-docs` }],
      });
      outDir = result.outDir;
    } finally {
      await api.close();
    }
  }, 120_000);

  it('文件结构：各标签目录生成 hooks.ts，服务根生成 hooks barrel', () => {
    const files = listGeneratedFiles(outDir);
    expect(files).toContain(join('pet', TAG_DIR, 'hooks.ts'));
    expect(files).toContain('pet/hooks.ts');
    // barrel 只出现在服务根，标签目录内不再重复
    expect(files).toContain(join('pet', TAG_DIR, 'index.ts'));
  });

  it('hooks 的端点类型导入自同目录 index（而非共享 types 目录）', () => {
    const hooks = readGeneratedFile(outDir, join('pet', TAG_DIR, 'hooks.ts'));

    // 类型与函数同源于 './index'（端点 Request/Result 类型内联在 index.ts）；
    // 类型较多时 prettier 会将 import 折为多行，正则需兼容
    expect(hooks).toMatch(/import type \{[^}]*RequestType[^}]*\} from '\.\/index';/);
    expect(hooks).toMatch(/import \{[^}]*Func[^}]*\} from '\.\/index';/);

    // 不得指向共享 types 目录（修复前的错误形态）
    expect(hooks).not.toMatch(/from '[^']*\/types';/);
    expect(hooks).not.toMatch(/from '\.\.\/types';/);
  });

  it('接口文件 method 为字符串字面量，不导入 RequestMethod', () => {
    const index = readGeneratedFile(outDir, join('pet', TAG_DIR, 'index.ts'));

    expect(index).not.toContain('RequestMethod');
    // request 值导入 + RequestConfig 类型导入分开声明
    expect(index).toMatch(/import \{ request \} from '\.\.\/\.\.\/request';/);
    expect(index).toMatch(/import type \{ RequestConfig \} from '\.\.\/\.\.\/request';/);
    expect(index).toMatch(/method: 'GET',/);
    expect(index).toMatch(/method: 'POST',/);
    expect(index).toMatch(/method: 'DELETE',/);
  });

  it('生成代码通过 TypeScript 类型检查（含 hooks 的 react-query 类型解析）', () => {
    expect(typeCheckGenerated(outDir)).toEqual([]);
  });

  it('生成代码通过快照验证（hooks 文件 / 接口文件）', () => {
    expect(readGeneratedFile(outDir, join('pet', TAG_DIR, 'hooks.ts'))).toMatchSnapshot('hooks.ts');
    expect(readGeneratedFile(outDir, join('pet', TAG_DIR, 'index.ts'))).toMatchSnapshot(
      'interface-index.ts',
    );
  });
});

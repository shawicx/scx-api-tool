/**
 * @description verify 命令单元测试
 * 覆盖生成产物的 TypeScript 类型检查核心逻辑：
 * 文件收集（忽略 node_modules）、复用消费方 tsconfig 的 paths 别名、错误诊断输出。
 * 集成用例直接运行仓库内可解析的 typescript 编译器。
 */

import { describe, it, expect, afterAll } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { collectTypeScriptFiles, checkGeneratedFiles } from '../verify';

const tempDirs: string[] = [];

/** 创建临时目录并登记（测试结束后统一清理） */
async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'api-power-verify-'));
  tempDirs.push(dir);
  return dir;
}

afterAll(async () => {
  await Promise.all(tempDirs.map((d) => rm(d, { recursive: true, force: true })));
});

// ==================== collectTypeScriptFiles ====================

describe('collectTypeScriptFiles', () => {
  it('应递归收集 .ts 文件并忽略 node_modules 与非 .ts 文件', async () => {
    const root = await makeTempDir();
    await mkdir(join(root, 'service', 'types'), { recursive: true });
    await mkdir(join(root, 'service', 'node_modules', 'lib'), { recursive: true });
    await writeFile(join(root, 'service', 'index.ts'), 'export {};\n');
    await writeFile(join(root, 'service', 'types', 'User.ts'), 'export {};\n');
    await writeFile(join(root, 'service', 'types', 'readme.md'), '# x\n');
    await writeFile(join(root, 'service', 'node_modules', 'lib', 'skip.ts'), 'export {};\n');

    const files = collectTypeScriptFiles([join(root, 'service')]);

    const rels = files.map((f) => f.replace(root, '')).toSorted();
    expect(rels).toEqual(['/service/index.ts', '/service/types/User.ts']);
  });

  it('不存在的目录应跳过而不抛错', () => {
    const files = collectTypeScriptFiles([join(tmpdir(), 'api-power-not-exist-dir')]);
    expect(files).toEqual([]);
  });
});

// ==================== checkGeneratedFiles ====================

describe('checkGeneratedFiles', () => {
  it('类型完整的产物应通过检查（ok: true）', async () => {
    const root = await makeTempDir();
    const serviceDir = join(root, 'src', 'service');
    await mkdir(join(serviceDir, 'types'), { recursive: true });
    await writeFile(join(serviceDir, 'types', 'User.ts'), 'export interface User { id: number }\n');
    await writeFile(
      join(serviceDir, 'index.ts'),
      "import type { User } from './types/User';\nexport const u: User = { id: 1 };\n",
    );

    const result = await checkGeneratedFiles([serviceDir], root);

    expect(result.ok).toBe(true);
    expect(result.fileCount).toBe(2);
    expect(result.diagnostics).toEqual([]);
  });

  it('缺失 import 的产物应报错并包含错误码与相对路径', async () => {
    const root = await makeTempDir();
    const serviceDir = join(root, 'src', 'service');
    await mkdir(serviceDir, { recursive: true });
    await writeFile(join(serviceDir, 'index.ts'), 'export const u: MissingType = { id: 1 };\n');

    const result = await checkGeneratedFiles([serviceDir], root);

    expect(result.ok).toBe(false);
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(result.diagnostics.join('\n')).toContain('TS2304');
    expect(result.diagnostics.join('\n')).toContain('index.ts');
  });

  it('应复用消费方 tsconfig 的 paths 别名（@/ 前缀可解析）', async () => {
    const root = await makeTempDir();
    const serviceDir = join(root, 'src', 'service');
    await mkdir(join(serviceDir, 'types'), { recursive: true });
    await writeFile(
      join(root, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: { baseUrl: '.', paths: { '@/*': ['./src/*'] } },
      }),
    );
    await writeFile(join(serviceDir, 'types', 'User.ts'), 'export interface User { id: number }\n');
    // @/service/types/User 需要 tsconfig paths 才能解析；解析失败会报 TS2307
    await writeFile(
      join(serviceDir, 'index.ts'),
      "import type { User } from '@/service/types/User';\nexport const u: User = { id: 1 };\n",
    );

    const result = await checkGeneratedFiles([serviceDir], root);

    expect(result.ok).toBe(true);
  });
});

/**
 * @description E2E 脚手架自检
 *
 * 原为搭建期的临时探针（验证 .mjs 配置导入 defineConfig、本地 HTTP 拉取、.tmp 输出目录可行），
 * 正式用例已迁入同目录 *.e2e.test.ts，此处保留为无副作用的脚手架自检。
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT, SCRATCH_DIR } from './helpers';

describe('E2E 脚手架自检', () => {
  it('临时输出根目录 .tmp-e2e 已被 .gitignore 忽略（.tmp* 规则）', () => {
    const gitignore = readFileSync(join(REPO_ROOT, '.gitignore'), 'utf-8');
    expect(gitignore).toMatch(/^\.tmp\*/m);
    expect(SCRATCH_DIR.endsWith('.tmp-e2e')).toBe(true);
  });
});

/**
 * @description pathUtils.ts 单元测试
 * 测试路径工具函数中的相对路径计算、alias 转换和路径规范化功能
 */

import { describe, it, expect, vi } from 'vitest';
import {
  getRelativeImportPath,
  getAliasPath,
  getNormalizedPathWithAlias,
  aliasToRealPath,
} from '../pathUtils';

// Mock consola to suppress any console output during tests
vi.mock('consola', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    success: vi.fn(),
    log: vi.fn(),
  },
}));

// ==================== getRelativeImportPath ====================

describe('getRelativeImportPath', () => {
  it('should return "." for the same directory', () => {
    const result = getRelativeImportPath('src/service', 'src/service');
    expect(result).toBe('.');
  });

  it('should compute relative path to a subdirectory', () => {
    const result = getRelativeImportPath('src', 'src/service/request');
    expect(result).toBe('./service/request');
  });

  it('should compute relative path to a parent directory', () => {
    const result = getRelativeImportPath('src/service/api', 'src/types');
    expect(result).toBe('../../types');
  });

  it('should compute relative path across different branches', () => {
    const result = getRelativeImportPath('src/service/api', 'src/utils/helper');
    expect(result).toBe('../../utils/helper');
  });

  it('should compute relative path from deeply nested directory', () => {
    const result = getRelativeImportPath('src/a/b/c', 'src/x/y');
    expect(result).toBe('../../../x/y');
  });

  it('should handle Windows-style backslash paths by normalizing them', () => {
    const result = getRelativeImportPath('src\\service\\api', 'src\\types');
    expect(result).toBe('../../types');
  });

  it('should handle paths with leading slashes', () => {
    const result = getRelativeImportPath('/src/service', '/src/types');
    expect(result).toBe('../types');
  });

  it('should handle completely unrelated paths', () => {
    const result = getRelativeImportPath('a/b/c', 'x/y/z');
    expect(result).toBe('../../../x/y/z');
  });

  it('should handle single-level paths', () => {
    const result = getRelativeImportPath('src', 'dist');
    expect(result).toBe('../dist');
  });

  it('should return dot for same path', () => {
    const result = getRelativeImportPath('a', 'a');
    expect(result).toBe('.');
  });

  it('should handle empty string paths', () => {
    const result = getRelativeImportPath('', 'src/service');
    expect(result).toBe('./src/service');
  });

  it('should return dot for empty paths', () => {
    expect(getRelativeImportPath('', '')).toBe('.');
  });

  it('should handle relative path from child to parent', () => {
    const result = getRelativeImportPath('src/a/b', 'src/a');
    expect(result).toBe('..');
  });
});

// ==================== getAliasPath ====================

describe('getAliasPath', () => {
  // --- Basic src/ prefix conversion ---
  it('should convert src/... and /src/... paths to @/ alias', () => {
    expect(getAliasPath('src/service/request')).toBe('@/service/request');
    expect(getAliasPath('/src/service/request')).toBe('@/service/request');
  });

  // --- Extension stripping ---
  it('should strip .ts extension', () => {
    const result = getAliasPath('src/service/request.ts');
    expect(result).toBe('@/service/request');
  });

  it('should strip .js extension', () => {
    const result = getAliasPath('src/service/request.js');
    expect(result).toBe('@/service/request');
  });

  it('should strip .tsx extension', () => {
    const result = getAliasPath('src/components/App.tsx');
    expect(result).toBe('@/components/App');
  });

  it('should strip .jsx extension', () => {
    const result = getAliasPath('src/components/App.jsx');
    expect(result).toBe('@/components/App');
  });

  it('should not strip non-code extensions like .css', () => {
    const result = getAliasPath('src/styles/main.css');
    expect(result).toBe('@/styles/main.css');
  });

  // --- Already alias paths (return as-is) ---
  it('should return path as-is for alias paths that already start with @/', () => {
    const result = getAliasPath('@/service/request');
    expect(result).toBe('@/service/request');
  });

  it('should return alias paths starting with ~/, #/, $/, @@/ as-is', () => {
    expect(getAliasPath('~/service/request')).toBe('~/service/request');
    expect(getAliasPath('#/service/request')).toBe('#/service/request');
    expect(getAliasPath('$/service/request')).toBe('$/service/request');
    expect(getAliasPath('@@/service/request')).toBe('@@/service/request');
  });

  // --- Paths without src/ (return as-is) ---
  it('should return paths without src/ as-is', () => {
    expect(getAliasPath('dist/output')).toBe('dist/output');
    expect(getAliasPath('./utils/helper')).toBe('./utils/helper');
    expect(getAliasPath('../utils/pathUtils')).toBe('../utils/pathUtils');
  });

  // --- Root src/ files ---
  it('should handle src/index.ts (root file) -> @/index', () => {
    const result = getAliasPath('src/index.ts');
    expect(result).toBe('@/index');
  });

  it('should handle src/types/index.ts -> @/types/index', () => {
    const result = getAliasPath('src/types/index.ts');
    expect(result).toBe('@/types/index');
  });

  // --- ./src/ paths ---
  it('should convert ./src/... paths to @/... alias', () => {
    expect(getAliasPath('./src/utils/pathUtils.ts')).toBe('@/utils/pathUtils');
    expect(getAliasPath('./src/types')).toBe('@/types');
    expect(getAliasPath('./src/types/')).toBe('@/types/');
    expect(getAliasPath('./src/utils/config.ts')).toBe('@/utils/config');
  });

  // --- src/ in the middle of path ---
  it('should handle src/ in the middle of path', () => {
    expect(getAliasPath('project/src/modules/auth/service')).toBe('@/modules/auth/service');
    expect(getAliasPath('dist/src/utils/file.ts')).toBe('@/utils/file');
  });

  // --- Edge cases ---
  it('should handle src/ path at beginning without leading slash', () => {
    const result = getAliasPath('src/types/config.ts');
    expect(result).toBe('@/types/config');
  });

  it('should return "src" as-is (no trailing slash, single segment)', () => {
    const result = getAliasPath('src');
    expect(result).toBe('src');
  });

  it('should handle src/ (just src with trailing slash, nothing after) -> @/', () => {
    const result = getAliasPath('src/');
    expect(result).toBe('@/');
  });

  it('should handle Windows-style backslash paths with src/', () => {
    const result = getAliasPath('src\\service\\request.ts');
    expect(result).toBe('@/service/request');
  });

  it('should handle Windows-style path with ./src/', () => {
    const result = getAliasPath('.\\src\\utils\\helper.ts');
    expect(result).toBe('@/utils/helper');
  });

  it('should handle path with multiple src/ occurrences (uses first)', () => {
    const result = getAliasPath('src/src/nested/file.ts');
    expect(result).toBe('@/src/nested/file');
  });
});

// ==================== getNormalizedPathWithAlias ====================

describe('getNormalizedPathWithAlias', () => {
  it('should prefer alias path when target contains src/', () => {
    const result = getNormalizedPathWithAlias('src/service/api', 'src/types/config.ts');
    expect(result).toBe('@/types/config');
  });

  it('should fall back to relative path when target does not contain src/', () => {
    const result = getNormalizedPathWithAlias('src/service', 'dist/output');
    expect(result).toBe('../../dist/output');
  });

  it('should use alias path for /src/... target', () => {
    const result = getNormalizedPathWithAlias('src/a/b', '/src/types');
    expect(result).toBe('@/types');
  });

  it('should return relative path for completely unrelated paths', () => {
    const result = getNormalizedPathWithAlias('a/b', 'x/y');
    expect(result).toBe('../../x/y');
  });

  it('should prefer @/ alias over relative path for src/ targets', () => {
    const result = getNormalizedPathWithAlias('src/service/request', 'src/utils/config.ts');
    expect(result).toBe('@/utils/config');
  });

  it('should fall back to relative path for ~/ alias targets (not @/)', () => {
    // ~/ is an alias but does not start with @/, so getAliasPath returns it as-is
    // but the target 'dist/output' does not contain src/, so getAliasPath returns 'dist/output'
    const result = getNormalizedPathWithAlias('src/service', 'dist/output');
    expect(result).toBe('../../dist/output');
  });

  it('should use alias path for ./src/... target', () => {
    const result = getNormalizedPathWithAlias('src/service/api', './src/utils/helper');
    expect(result).toBe('@/utils/helper');
  });

  it('should return relative path when both paths have no src/', () => {
    const result = getNormalizedPathWithAlias('a/b/c', 'x/y/z');
    expect(result).toBe('../../../x/y/z');
  });

  it('should use alias when target has deeply nested src/ path', () => {
    const result = getNormalizedPathWithAlias('src/service', 'project/src/types/models.ts');
    expect(result).toBe('@/types/models');
  });

  it('should handle same directory with src/ target', () => {
    const result = getNormalizedPathWithAlias('src/service', 'src/service');
    // getAliasPath('src/service') -> '@/service' which starts with @/
    expect(result).toBe('@/service');
  });
});

// ==================== aliasToRealPath ====================

describe('aliasToRealPath', () => {
  it('should convert alias paths (@/, ~/, #/, $/, @@/) to src/ path', () => {
    expect(aliasToRealPath('@/service/request')).toBe('src/service/request');
    expect(aliasToRealPath('~/service/request')).toBe('src/service/request');
    expect(aliasToRealPath('#/service/request')).toBe('src/service/request');
    expect(aliasToRealPath('$/service/request')).toBe('src/service/request');
    expect(aliasToRealPath('@@/service/request')).toBe('src/service/request');
  });

  it('should return non-alias and relative paths unchanged', () => {
    expect(aliasToRealPath('dist/output')).toBe('dist/output');
    expect(aliasToRealPath('./utils/helper')).toBe('./utils/helper');
    expect(aliasToRealPath('../parent')).toBe('../parent');
    expect(aliasToRealPath('src/service/request')).toBe('src/service/request');
  });

  it('should preserve extensions in alias paths', () => {
    expect(aliasToRealPath('@/service/request.ts')).toBe('src/service/request.ts');
  });

  it('should handle @/ path at root level', () => {
    expect(aliasToRealPath('@/index')).toBe('src/index');
  });
});

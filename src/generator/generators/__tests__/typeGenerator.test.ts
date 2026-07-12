/**
 * @description typeGenerator 单元测试
 * 覆盖 generateTypeFiles（含 apiOnly 跳过、并发输出集合断言）
 *
 * 关键设计：类型文件经 writeGeneratedFile（mock：../../fileWriter），
 * 索引文件经 writeFormattedFile（mock：@/utils/file）。
 * 因 executeWithConcurrency 输出顺序不定，文件名断言用集合相等。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ProcessedApiData } from '@/processors/openapi';
import type { ApiConfig } from '@/types';

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

const writes: Array<{ path: string; content: string }> = [];
vi.mock('../../fileWriter', () => ({
  writeGeneratedFile: vi.fn(async (filePath: string, content: string) => {
    writes.push({ path: filePath, content });
  }),
}));

vi.mock('@/utils/file', () => ({
  ensureDir: vi.fn(async () => undefined),
  writeFormattedFile: vi.fn(async (filePath: string, content: string) => {
    writes.push({ path: filePath, content });
  }),
  fileExists: vi.fn(async () => false),
}));

import { generateTypeFiles } from '../typeGenerator';
import { minimalApiConfig } from '../../../../tests/fixtures/mockData';

function makeProcessedData(): ProcessedApiData {
  return {
    interfaces: [],
    types: [
      {
        name: 'User',
        originalName: 'User',
        schema: {
          type: 'object',
          properties: { id: { type: 'number' }, name: { type: 'string' } },
          required: ['id'],
        },
      },
      {
        name: 'Post',
        originalName: 'Post',
        schema: {
          type: 'object',
          properties: { title: { type: 'string' } },
        },
      },
    ],
    categories: [],
  } as ProcessedApiData;
}

describe('generateTypeFiles', () => {
  beforeEach(() => {
    writes.length = 0;
    vi.clearAllMocks();
    delete process.env.DEBUG;
  });

  it('应为每个类型生成 .ts 文件（集合相等，不依赖顺序）', async () => {
    const config: ApiConfig = { ...minimalApiConfig, generateApi: true, generateTypes: true };
    await generateTypeFiles(makeProcessedData(), config);

    const typeFileNames = writes
      .map((w) => w.path.split('/').pop())
      .filter((n): n is string => !!n && n.endsWith('.ts') && n !== 'index.ts');
    expect(new Set(typeFileNames)).toEqual(new Set(['User.ts', 'Post.ts']));
  });

  it('应生成类型索引文件（含所有类型导出）', async () => {
    const config: ApiConfig = { ...minimalApiConfig, generateApi: true, generateTypes: true };
    await generateTypeFiles(makeProcessedData(), config);

    const indexWrite = writes.find((w) => w.path.endsWith('index.ts'));
    expect(indexWrite).toBeDefined();
    expect(indexWrite!.content).toContain("export type { User } from './User'");
    expect(indexWrite!.content).toContain("export type { Post } from './Post'");
  });

  it('apiOnly 模式（generateApi && !generateTypes）应跳过生成', async () => {
    const config: ApiConfig = {
      ...minimalApiConfig,
      generateApi: true,
      generateTypes: false,
    };
    await generateTypeFiles(makeProcessedData(), config);

    expect(writes.length).toBe(0);
  });
});

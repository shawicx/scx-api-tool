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

  // ===== JsonValue 递归类型 + Jackson 别名 =====

  it('应为 kind=jsonValue 生成递归联合类型 type X = string | number | ... | X[]', async () => {
    const config: ApiConfig = { ...minimalApiConfig, generateApi: true, generateTypes: true };
    const data: ProcessedApiData = {
      interfaces: [],
      types: [
        {
          name: 'JsonValue',
          schema: { type: 'object', description: '任意 JSON 值' },
          kind: 'jsonValue',
        },
      ],
      categories: [],
    } as ProcessedApiData;
    await generateTypeFiles(data, config);

    const jsonValueWrite = writes.find((w) => w.path.endsWith('JsonValue.ts'));
    expect(jsonValueWrite).toBeDefined();
    // 递归联合类型核心特征：自身引用 + 标量 + null + 数组 + record
    expect(jsonValueWrite!.content).toContain('export type JsonValue =');
    expect(jsonValueWrite!.content).toContain('string | number | boolean | null');
    expect(jsonValueWrite!.content).toContain('JsonValue[]');
    expect(jsonValueWrite!.content).toContain('{ [key: string]: JsonValue }');
    // 递归类型不应有 import 语句（自包含）
    expect(jsonValueWrite!.content).not.toContain('import ');
  });

  it('应为 kind=jsonValueAlias 生成别名 type JsonNode = JsonValue，并 import JsonValue', async () => {
    const config: ApiConfig = { ...minimalApiConfig, generateApi: true, generateTypes: true };
    const data: ProcessedApiData = {
      interfaces: [],
      types: [
        {
          name: 'JsonValue',
          schema: { type: 'object' },
          kind: 'jsonValue',
        },
        {
          name: 'JsonNode',
          schema: { type: 'object', description: 'Jackson JsonNode' },
          kind: 'jsonValueAlias',
        },
      ],
      categories: [],
    } as ProcessedApiData;
    await generateTypeFiles(data, config);

    const aliasWrite = writes.find((w) => w.path.endsWith('JsonNode.ts'));
    expect(aliasWrite).toBeDefined();
    expect(aliasWrite!.content).toContain('export type JsonNode = JsonValue');
    // 别名引用 JsonValue，需 import
    expect(aliasWrite!.content).toContain('import type { JsonValue }');
  });

  it('索引文件应包含 JsonValue 与别名的导出', async () => {
    const config: ApiConfig = { ...minimalApiConfig, generateApi: true, generateTypes: true };
    const data: ProcessedApiData = {
      interfaces: [],
      types: [
        { name: 'JsonValue', schema: { type: 'object' }, kind: 'jsonValue' },
        { name: 'JsonNode', schema: { type: 'object' }, kind: 'jsonValueAlias' },
      ],
      categories: [],
    } as ProcessedApiData;
    await generateTypeFiles(data, config);

    const indexWrite = writes.find((w) => w.path.endsWith('index.ts'));
    expect(indexWrite).toBeDefined();
    expect(indexWrite!.content).toContain("export type { JsonValue } from './JsonValue'");
    expect(indexWrite!.content).toContain("export type { JsonNode } from './JsonNode'");
  });

  it('类型属性引用可空类型时应生成 import（Post.author: User | null 场景）', async () => {
    const config: ApiConfig = { ...minimalApiConfig, generateApi: true, generateTypes: true };
    const data: ProcessedApiData = {
      interfaces: [],
      types: [
        {
          name: 'User',
          originalName: 'User',
          schema: {
            type: 'object',
            properties: { id: { type: 'number' } },
          },
        },
        {
          name: 'Post',
          originalName: 'Post',
          schema: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              author: { $ref: '#/components/schemas/User', nullable: true },
            },
          },
        },
      ],
      categories: [],
    } as ProcessedApiData;
    await generateTypeFiles(data, config);

    const postWrite = writes.find((w) => w.path.endsWith('Post.ts'));
    expect(postWrite).toBeDefined();
    // 复现路径成立：可空引用类型串
    expect(postWrite!.content).toContain('User | null');
    // 可空引用必须出现在 import 中（修复前缺失）
    expect(postWrite!.content).toMatch(/import type \{ [^}]*User \} from/);
  });
});

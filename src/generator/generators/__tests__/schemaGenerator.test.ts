/**
 * @description schemaGenerator 单元测试
 * 覆盖 generateSchemaFiles（含 typesFormat≠zod 跳过、类型/接口 schema 生成）
 *
 * 关键设计：
 * - 类型/接口 schema 文件经 writeGeneratedFile（mock：../../fileWriter）
 * - 索引文件经 writeFormattedFile（mock：@/utils/file）
 * - 接口 schema 按 tag 分目录（tag 名经 chineseToPinyinCamelCase），故用 path.includes 模糊匹配
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

import { generateSchemaFiles } from '../schemaGenerator';
import { minimalApiConfig } from '../../../../tests/fixtures/mockData';

function makeProcessedData(): ProcessedApiData {
  return {
    interfaces: [
      {
        path: '/api/users',
        method: 'get',
        operation: {
          tags: ['用户'],
          summary: '获取用户',
          responses: {
            '200': {
              content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
            },
          },
        },
      },
    ],
    types: [
      {
        name: 'User',
        originalName: 'User',
        schema: {
          type: 'object',
          properties: { id: { type: 'number' } },
          required: ['id'],
        },
      },
    ],
    categories: [],
  } as ProcessedApiData;
}

describe('generateSchemaFiles', () => {
  beforeEach(() => {
    writes.length = 0;
    vi.clearAllMocks();
    delete process.env.DEBUG;
  });

  it('typesFormat≠zod 应跳过 Schema 生成', async () => {
    const config: ApiConfig = { ...minimalApiConfig, typesFormat: 'typescript' };
    await generateSchemaFiles(makeProcessedData(), config);

    expect(writes.length).toBe(0);
  });

  it('typesFormat=zod 应生成类型 schema、接口合并 schema 与索引', async () => {
    const config: ApiConfig = { ...minimalApiConfig, typesFormat: 'zod' };
    await generateSchemaFiles(makeProcessedData(), config);

    // 类型 schema 文件（位于 schemas 目录，文件名 UserSchema.ts）
    const typeSchema = writes.find((w) => w.path.endsWith('UserSchema.ts'));
    expect(typeSchema).toBeDefined();
    expect(typeSchema!.content).toContain('export const UserSchema = z.object(');

    // 接口合并 schema（按 tag 目录，文件名 schema.ts）
    const interfaceSchema = writes.find(
      (w) => w.path.includes('/') && w.path.endsWith('schema.ts'),
    );
    expect(interfaceSchema).toBeDefined();

    // 索引文件（位于 schemas 目录，文件名 index.ts）
    const indexFile = writes.find((w) => w.path.endsWith('index.ts'));
    expect(indexFile).toBeDefined();
    expect(indexFile!.content).toContain('UserSchema');
  });
});

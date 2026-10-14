/**
 * @description typeGenerator 顶层 Schema 形态专项测试
 * 验证顶层 $ref、枚举、数组、原始类型、联合、map/free-form 等非对象形态
 * 生成类型别名（type X = Y）而非空接口；对象形态（properties/allOf/空对象）
 * 维持 interface 输出（回归保护）。
 *
 * 关键设计：与 typeGenerator.test.ts 相同的 mock 结构
 * （writeGeneratedFile / writeFormattedFile 捕获写入内容）。
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

/**
 * @description 构造覆盖各顶层形态的 ProcessedApiData
 * User 为被引用的基础对象类型；其余类型逐一对应一种顶层形态
 */
function makeShapesData(): ProcessedApiData {
  return {
    interfaces: [],
    types: [
      // 被引用的基础对象类型
      {
        name: 'User',
        originalName: 'User',
        schema: {
          type: 'object',
          properties: { id: { type: 'number' }, name: { type: 'string' } },
          required: ['id'],
        },
      },
      // 顶层 $ref：组件仅为另一个 Schema 的引用
      { name: 'UserRef', originalName: 'UserRef', schema: { $ref: '#/components/schemas/User' } },
      // 顶层枚举（字符串 / 数字）
      {
        name: 'Status',
        originalName: 'Status',
        schema: { type: 'string', enum: ['active', 'inactive'] },
      },
      {
        name: 'Level',
        originalName: 'Level',
        schema: { type: 'integer', enum: [1, 2, 3] },
      },
      // 顶层数组（引用元素 / 内联原始元素）
      {
        name: 'UserList',
        originalName: 'UserList',
        schema: { type: 'array', items: { $ref: '#/components/schemas/User' } },
      },
      {
        name: 'Ids',
        originalName: 'Ids',
        schema: { type: 'array', items: { type: 'number' } },
      },
      // 顶层原始类型（含 3.0 nullable）
      { name: 'Token', originalName: 'Token', schema: { type: 'string' } },
      {
        name: 'NullableToken',
        originalName: 'NullableToken',
        schema: { type: 'string', nullable: true },
      },
      // 顶层联合（oneOf，含 $ref 分支）
      {
        name: 'Result',
        originalName: 'Result',
        schema: { oneOf: [{ $ref: '#/components/schemas/User' }, { type: 'string' }] },
      },
      // 顶层 map（additionalProperties 为 schema）
      {
        name: 'UserMap',
        originalName: 'UserMap',
        schema: { type: 'object', additionalProperties: { $ref: '#/components/schemas/User' } },
      },
      // free-form 对象 → 内置 JsonValue（注入逻辑见 processors/openapi）
      { name: 'JsonValue', originalName: 'JsonValue', schema: {}, kind: 'jsonValue' },
      {
        name: 'Meta',
        originalName: 'Meta',
        schema: { type: 'object', additionalProperties: true },
      },
      // 对象形态回归保护：显式空对象 / allOf 合并
      { name: 'EmptyDto', originalName: 'EmptyDto', schema: { type: 'object' } },
      {
        name: 'ExtUser',
        originalName: 'ExtUser',
        schema: {
          allOf: [
            { $ref: '#/components/schemas/User' },
            { properties: { ext: { type: 'string' } } },
          ],
        },
      },
      // 递归数组别名：type SelfList = SelfList[]，不应 import 自身
      {
        name: 'SelfList',
        originalName: 'SelfList',
        schema: { type: 'array', items: { $ref: '#/components/schemas/SelfList' } },
      },
    ],
    categories: [],
  } as ProcessedApiData;
}

/** 按 types/ 目录下的文件名取生成内容 */
function getContent(fileName: string): string {
  const write = writes.find((w) => w.path.split('/').pop() === fileName);
  if (!write) throw new Error(`未生成文件: ${fileName}`);
  return write.content;
}

describe('generateTypeFiles - 顶层 Schema 形态专项', () => {
  let config: ApiConfig;

  beforeEach(() => {
    writes.length = 0;
    vi.clearAllMocks();
    config = { ...minimalApiConfig, generateApi: true, generateTypes: true };
  });

  it('顶层 $ref 应生成类型别名并 import 目标类型，而非空接口', async () => {
    await generateTypeFiles(makeShapesData(), config);

    const content = getContent('UserRef.ts');
    expect(content).toContain('export type UserRef = User;');
    expect(content).not.toContain('interface UserRef');
    expect(content).toMatch(/import type \{ User \} from '[^']*types\/User';/);
  });

  it('顶层字符串枚举应生成字面量联合别名', async () => {
    await generateTypeFiles(makeShapesData(), config);

    const content = getContent('Status.ts');
    expect(content).toContain("export type Status = 'active' | 'inactive';");
    expect(content).not.toContain('interface Status');
  });

  it('顶层数字枚举应生成数字字面量联合别名', async () => {
    await generateTypeFiles(makeShapesData(), config);

    const content = getContent('Level.ts');
    expect(content).toContain('export type Level = 1 | 2 | 3;');
  });

  it('顶层数组（引用元素）应生成数组别名并 import 元素类型', async () => {
    await generateTypeFiles(makeShapesData(), config);

    const content = getContent('UserList.ts');
    expect(content).toContain('export type UserList = User[];');
    expect(content).toMatch(/import type \{ User \} from '[^']*types\/User';/);
  });

  it('顶层数组（内联原始元素）应生成数组别名且无 import', async () => {
    await generateTypeFiles(makeShapesData(), config);

    const content = getContent('Ids.ts');
    expect(content).toContain('export type Ids = number[];');
    expect(content).not.toContain('import');
  });

  it('顶层原始类型应生成基础类型别名', async () => {
    await generateTypeFiles(makeShapesData(), config);

    expect(getContent('Token.ts')).toContain('export type Token = string;');
  });

  it('顶层可空原始类型（3.0 nullable）应追加 | null', async () => {
    await generateTypeFiles(makeShapesData(), config);

    expect(getContent('NullableToken.ts')).toContain('export type NullableToken = string | null;');
  });

  it('顶层 oneOf 联合应生成联合别名并 import 引用分支', async () => {
    await generateTypeFiles(makeShapesData(), config);

    const content = getContent('Result.ts');
    expect(content).toContain('export type Result = User | string;');
    expect(content).toMatch(/import type \{ User \} from '[^']*types\/User';/);
  });

  it('顶层 map（additionalProperties）应生成 Record 别名并 import 值类型', async () => {
    await generateTypeFiles(makeShapesData(), config);

    const content = getContent('UserMap.ts');
    expect(content).toContain('export type UserMap = Record<string, User>;');
    expect(content).toMatch(/import type \{ User \} from '[^']*types\/User';/);
  });

  it('顶层 free-form 对象应别名到 JsonValue 并 import', async () => {
    await generateTypeFiles(makeShapesData(), config);

    const content = getContent('Meta.ts');
    expect(content).toContain('export type Meta = JsonValue;');
    expect(content).toMatch(/import type \{ JsonValue \} from '[^']*types\/JsonValue';/);
  });

  it('显式空对象（type: object）仍应生成空 interface（回归保护）', async () => {
    await generateTypeFiles(makeShapesData(), config);

    const content = getContent('EmptyDto.ts');
    expect(content).toContain('export interface EmptyDto {');
    expect(content).not.toContain('export type EmptyDto');
  });

  it('顶层 allOf 仍应合并属性生成 interface（回归保护）', async () => {
    await generateTypeFiles(makeShapesData(), config);

    const content = getContent('ExtUser.ts');
    expect(content).toContain('export interface ExtUser {');
    expect(content).toContain('id: number;');
    expect(content).toContain('ext?: string;');
  });

  it('递归数组别名不应生成指向自身的 import', async () => {
    await generateTypeFiles(makeShapesData(), config);

    const content = getContent('SelfList.ts');
    expect(content).toContain('export type SelfList = SelfList[];');
    expect(content).not.toContain('import type { SelfList }');
  });
});

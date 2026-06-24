/**
 * @description zodTypesOnlyGenerator 单元测试
 * 覆盖 generateZodTypesOnlySchemaFile（Zod typesOnly 模式的合并 schema 生成）
 *
 * 关键设计：mock ../../fileWriter 捕获 schema.ts 写入内容。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ApiInterface, ApiConfig } from '@/types';

vi.mock('consola', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    success: vi.fn(),
  },
}));

const captured: { content: string; path: string } = { content: '', path: '' };
vi.mock('../../fileWriter', () => ({
  writeGeneratedFile: vi.fn(async (filePath: string, content: string) => {
    captured.content = content;
    captured.path = filePath;
  }),
}));

import { generateZodTypesOnlySchemaFile } from '../zodTypesOnlyGenerator';
import { minimalApiConfig } from '../../../../tests/fixtures/mockData';

describe('generateZodTypesOnlySchemaFile', () => {
  beforeEach(() => {
    captured.content = '';
    captured.path = '';
    vi.clearAllMocks();
    delete process.env.DEBUG;
  });

  it('应为每个接口生成 request/response schema（typesOnly 模板）', async () => {
    const interfaces: ApiInterface[] = [
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
      } as any,
    ];
    const config: ApiConfig = {
      ...minimalApiConfig,
      typesFormat: 'zod',
      generateTypes: true,
      generateApi: false,
    };

    await generateZodTypesOnlySchemaFile(interfaces, config, '/out/user');

    expect(captured.path).toContain('schema.ts');
    expect(captured.content).toContain("import { z } from 'zod'");
    expect(captured.content).toContain('Schema =');
    // response $ref 应产生 import 块（UserSchema）
    expect(captured.content).toContain('UserSchema');
  });

  it('comment=false 应不含 @description 注释', async () => {
    const interfaces: ApiInterface[] = [
      {
        path: '/api/users',
        method: 'get',
        operation: {
          summary: '获取用户',
          responses: {
            '200': {
              content: { 'application/json': { schema: { type: 'object', properties: {} } } },
            },
          },
        },
      } as any,
    ];
    const config: ApiConfig = {
      ...minimalApiConfig,
      typesFormat: 'zod',
      comment: false,
    };

    await generateZodTypesOnlySchemaFile(interfaces, config, '/out/user');

    expect(captured.content).not.toContain('@description');
  });
});

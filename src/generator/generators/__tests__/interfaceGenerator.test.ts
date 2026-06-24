/**
 * @description interfaceGenerator 单元测试
 * 覆盖 generateInterfaceFileForTag 的 5 个 import 拼接分支
 *
 * 关键设计：mock fileWriter（捕获写入内容，跳过 Prettier）+ mock @/utils/file。
 * usedTypes 的填充依赖 extractResponseProperties 对 $ref 的解析：
 *   - 当 $ref 指向的类型「无 properties」时，回退为 { name:'data', type: refName }
 *   - refName 在 processedData.types 中存在 → collectUsedTypesFromProperties 命中
 *   故 fixture 的 User 类型故意不带 properties，使 usedTypes.size > 0。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { join } from 'path';
import type { ProcessedApiData } from '@/processors/openapi';
import type { ApiConfig } from '@/types';

vi.mock('consola', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    success: vi.fn(),
  },
}));

// 捕获 writeGeneratedFile 写入内容（跳过 Prettier）
const captured: { content: string; path: string } = { content: '', path: '' };
vi.mock('../../fileWriter', () => ({
  writeGeneratedFile: vi.fn(async (filePath: string, content: string) => {
    captured.content = content;
    captured.path = filePath;
  }),
}));

vi.mock('@/utils/file', () => ({
  ensureDir: vi.fn(async () => undefined),
  writeFormattedFile: vi.fn(async () => undefined),
  fileExists: vi.fn(async () => false),
}));

import { generateInterfaceFileForTag } from '../interfaceGenerator';
import { minimalApiConfig } from '../../../../tests/fixtures/mockData';

// 构造带 $ref 类型的 processedData，使 usedTypes.size > 0：
// User 类型故意无 properties，触发 extractResponseProperties 的 {type:'User'} 回退
function makeProcessedDataWithRefTypes(): ProcessedApiData {
  return {
    interfaces: [
      {
        path: '/api/users',
        method: 'get',
        operation: {
          summary: '获取用户',
          tags: ['用户'],
          responses: {
            '200': {
              description: 'ok',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/User' } },
              },
            },
          },
        },
      },
    ],
    types: [
      {
        name: 'User',
        originalName: 'User',
        // 故意无 properties，使 extractResponseProperties 回退为 {type:'User'}
        schema: { type: 'object' },
      },
    ],
    categories: [],
  } as ProcessedApiData;
}

describe('generateInterfaceFileForTag', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    captured.content = '';
    captured.path = '';
    delete process.env.DEBUG;
  });

  it('apiOnly 模式（generateApi && !generateTypes）应仅含 request import，无 type import', async () => {
    const config: ApiConfig = {
      ...minimalApiConfig,
      generateApi: true,
      generateTypes: false,
      typesFormat: 'typescript',
    };
    const data = makeProcessedDataWithRefTypes();
    await generateInterfaceFileForTag(
      'user',
      data.interfaces,
      data,
      config,
      join(config.outputDir, 'user'),
    );

    // apiOnly 分支：import { request } from '...'
    expect(captured.content).toMatch(/import \{ request \} from/);
    // apiOnly 不应有 type import
    expect(captured.content).not.toMatch(/import type \{/);
  });

  it('JS 模式（target=javascript）应含 request import、无类型 import，文件名为 index.js', async () => {
    const config: ApiConfig = {
      ...minimalApiConfig,
      target: 'javascript',
      generateApi: true,
      generateTypes: true,
      typesFormat: 'typescript',
    };
    const data = makeProcessedDataWithRefTypes();
    await generateInterfaceFileForTag(
      'user',
      data.interfaces,
      data,
      config,
      join(config.outputDir, 'user'),
    );

    expect(captured.content).toMatch(/import \{ request \} from/);
    // JS 模式不收集 usedTypes，无 type import
    expect(captured.content).not.toMatch(/import type \{/);
    // JS 模式文件名为 index.js
    expect(captured.path).toContain('index.js');
  });

  it('TS 全量模式（generateApi+generateTypes）应含 request import 与 User type import', async () => {
    const config: ApiConfig = {
      ...minimalApiConfig,
      generateApi: true,
      generateTypes: true,
      typesFormat: 'typescript',
    };
    const data = makeProcessedDataWithRefTypes();
    await generateInterfaceFileForTag(
      'user',
      data.interfaces,
      data,
      config,
      join(config.outputDir, 'user'),
    );

    // 全量分支：import { RequestConfig, request } from '...'
    expect(captured.content).toMatch(/import \{ RequestConfig, request \} from/);
    // usedTypes 命中 User → 生成 type import（路径经 alias 解析为 @/types）
    expect(captured.content).toMatch(/import type \{ User \} from/);
  });

  it('requestMethodStyle=method-specific 应 import 含 requestMethods', async () => {
    const config: ApiConfig = {
      ...minimalApiConfig,
      generateApi: true,
      generateTypes: true,
      typesFormat: 'typescript',
      requestMethodStyle: 'method-specific' as any,
    };
    const data = makeProcessedDataWithRefTypes();
    await generateInterfaceFileForTag(
      'user',
      data.interfaces,
      data,
      config,
      join(config.outputDir, 'user'),
    );

    expect(captured.content).toMatch(/import \{ RequestConfig, request, requestMethods \} from/);
  });

  it('requestMethodStyle=both 应 import 含 requestMethods', async () => {
    const config: ApiConfig = {
      ...minimalApiConfig,
      generateApi: true,
      generateTypes: true,
      typesFormat: 'typescript',
      requestMethodStyle: 'both' as any,
    };
    const data = makeProcessedDataWithRefTypes();
    await generateInterfaceFileForTag(
      'user',
      data.interfaces,
      data,
      config,
      join(config.outputDir, 'user'),
    );

    expect(captured.content).toMatch(/import \{ RequestConfig, request, requestMethods \} from/);
  });

  it('Zod 模式（typesFormat=zod, generateApi+generateTypes）应含 request import 与 ./schema type import', async () => {
    const config: ApiConfig = {
      ...minimalApiConfig,
      generateApi: true,
      generateTypes: true,
      typesFormat: 'zod',
    };
    const data = makeProcessedDataWithRefTypes();
    await generateInterfaceFileForTag(
      'user',
      data.interfaces,
      data,
      config,
      join(config.outputDir, 'user'),
    );

    expect(captured.content).toMatch(/import \{ RequestConfig, request \} from/);
    // Zod 分支：import type { ... } from './schema'
    expect(captured.content).toMatch(/import type \{ .* \} from '\.\/schema'/);
  });
});

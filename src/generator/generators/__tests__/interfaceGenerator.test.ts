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

// 复现 File[] 序列化 bug：multipart 批量上传接口（files: File[]）
function makeProcessedDataWithMultipartUpload(): ProcessedApiData {
  return {
    interfaces: [
      {
        path: '/api/files/batch-upload',
        method: 'post',
        operation: {
          summary: '批量上传文件',
          tags: ['文件管理'],
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    files: { type: 'array', items: { type: 'string', format: 'binary' } },
                  },
                  required: ['files'],
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'ok',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { url: { type: 'string' } },
                  },
                },
              },
            },
          },
        },
      },
    ],
    types: [],
    categories: [],
  } as ProcessedApiData;
}

// 复现可空类型漏 import bug：响应 $ref 展开后含嵌套 nullable $ref（UserPreferences 场景）
function makeProcessedDataWithNullableNestedRef(): ProcessedApiData {
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
                'application/json': {
                  schema: { $ref: '#/components/schemas/UserResponseDto' },
                },
              },
            },
          },
        },
      },
    ],
    types: [
      {
        name: 'UserResponseDto',
        originalName: 'UserResponseDto',
        schema: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            preferences: {
              $ref: '#/components/schemas/UserPreferences',
              nullable: true,
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'UserPreferences',
        originalName: 'UserPreferences',
        schema: {
          type: 'object',
          properties: { theme: { type: 'string' } },
        },
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

  it('multipart 上传接口的 FormData 序列化应处理数组/对象/空值（File[] 不再变成 "[object File]"）', async () => {
    const config: ApiConfig = {
      ...minimalApiConfig,
      generateApi: true,
      generateTypes: true,
      typesFormat: 'typescript',
    };
    const data = makeProcessedDataWithMultipartUpload();
    await generateInterfaceFileForTag(
      'file',
      data.interfaces,
      data,
      config,
      join(config.outputDir, 'file'),
    );

    expect(captured.content).toContain('new FormData');
    // File[] 数组应逐个 append（Array.isArray 分支）
    expect(captured.content).toContain('Array.isArray');
    // File/Blob 单值应原样 append
    expect(captured.content).toContain('instanceof Blob');
    // 普通对象应 JSON.stringify 序列化
    expect(captured.content).toContain('JSON.stringify');
    // null/undefined 可选字段应跳过，而不是 append 成 "undefined" 字符串
    expect(captured.content).toContain('=== null');
    expect(captured.content).toContain('=== undefined');
  });

  it('requestMethodStyle=method-specific 的 multipart POST 应使用数组感知的 FormData 序列化', async () => {
    const config: ApiConfig = {
      ...minimalApiConfig,
      generateApi: true,
      generateTypes: true,
      typesFormat: 'typescript',
      requestMethodStyle: 'method-specific' as any,
    };
    const data = makeProcessedDataWithMultipartUpload();
    await generateInterfaceFileForTag(
      'file',
      data.interfaces,
      data,
      config,
      join(config.outputDir, 'file'),
    );

    expect(captured.content).toContain('new FormData');
    expect(captured.content).toContain('Array.isArray');
    expect(captured.content).toContain('JSON.stringify');
    expect(captured.content).toContain('=== undefined');
  });

  it('响应 $ref 展开后的嵌套可空类型应生成 type import（UserPreferences 场景）', async () => {
    const config: ApiConfig = {
      ...minimalApiConfig,
      generateApi: true,
      generateTypes: true,
      typesFormat: 'typescript',
    };
    const data = makeProcessedDataWithNullableNestedRef();
    await generateInterfaceFileForTag(
      'user',
      data.interfaces,
      data,
      config,
      join(config.outputDir, 'user'),
    );

    // 复现路径成立：响应属性展开为嵌套可空引用类型串
    expect(captured.content).toContain('UserPreferences | null');
    // 嵌套可空类型必须出现在 type import 中（修复前缺失）
    expect(captured.content).toMatch(/import type \{ [^}]*UserPreferences \} from/);
  });
});

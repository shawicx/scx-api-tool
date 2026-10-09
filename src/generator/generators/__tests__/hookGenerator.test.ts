/**
 * @description hookGenerator 单元测试
 * 覆盖 query/mutation 分类、TS/JS 双目标、注释开关、queryKeyPrefix、zod 类型导入与根 barrel
 *
 * 关键设计：mock fileWriter（捕获写入内容，跳过 Prettier）+ mock @/utils/file + mock logger
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

// 捕获所有 writeGeneratedFile 写入（文件路径 → 内容）
const capturedWrites: { path: string; content: string }[] = [];
vi.mock('../../fileWriter', () => ({
  writeGeneratedFile: vi.fn(async (filePath: string, content: string) => {
    capturedWrites.push({ path: filePath, content });
  }),
}));

vi.mock('@/utils/file', () => ({
  ensureDir: vi.fn(async () => undefined),
  writeFormattedFile: vi.fn(async () => undefined),
  fileExists: vi.fn(async () => false),
}));

import { generateHookFiles } from '../hookGenerator';
import { minimalApiConfig } from '../../../../tests/fixtures/mockData';

function makeProcessedData(): ProcessedApiData {
  return {
    interfaces: [
      {
        path: '/api/users',
        method: 'get',
        operation: {
          summary: '获取用户列表',
          tags: ['user'],
          responses: {
            '200': {
              description: 'ok',
              content: {
                'application/json': {
                  schema: { type: 'object', properties: { total: { type: 'number' } } },
                },
              },
            },
          },
        },
      },
      {
        path: '/api/users',
        method: 'post',
        operation: {
          summary: '创建用户',
          tags: ['user'],
          requestBody: {
            content: {
              'application/json': {
                schema: { type: 'object', properties: { name: { type: 'string' } } },
              },
            },
          },
          responses: {
            '200': { description: 'ok', content: {} },
          },
        },
      },
    ],
    types: [],
    categories: [{ name: 'user', description: '' }],
  } as unknown as ProcessedApiData;
}

function findWrite(name: string): { path: string; content: string } | undefined {
  return capturedWrites.find((w) => w.path.endsWith(name));
}

describe('generateHookFiles', () => {
  beforeEach(() => {
    capturedWrites.length = 0;
  });

  it('TS 目标：GET 生成 useQuery、POST 生成 useMutation，并生成根 barrel', async () => {
    const config: ApiConfig = { ...minimalApiConfig, generateHooks: true };
    await generateHookFiles(makeProcessedData(), config);

    const hooksFile = findWrite(join('USER', 'hooks.ts'));
    expect(hooksFile).toBeDefined();

    // import 段
    expect(hooksFile!.content).toContain(
      "import { useQuery, useMutation } from '@tanstack/react-query';",
    );
    expect(hooksFile!.content).toContain(
      "import type { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';",
    );
    expect(hooksFile!.content).toContain(
      "import { getApiUsersFunc, postApiUsersFunc } from './index';",
    );

    // query hook：函数签名 + queryKey + signal 透传
    expect(hooksFile!.content).toContain(
      'export function useGetApiUsersFunc(\n  params: GetApiUsersRequestType = {} as GetApiUsersRequestType,\n',
    );
    expect(hooksFile!.content).toContain("queryKey: ['getApiUsersFunc', params],");
    expect(hooksFile!.content).toContain(
      'queryFn: ({ signal }) => getApiUsersFunc(params, { signal }),',
    );
    expect(hooksFile!.content).toContain(
      "options: Omit<UseQueryOptions<GetApiUsersResultType, Error>, 'queryKey' | 'queryFn'> = {}",
    );

    // mutation hook：variables 类型 + mutationFn
    expect(hooksFile!.content).toContain(
      'mutationFn: (params: PostApiUsersRequestType) => postApiUsersFunc(params),',
    );
    expect(hooksFile!.content).toContain(
      'options: Omit<UseMutationOptions<PostApiUsersResultType, Error, PostApiUsersRequestType, unknown>> = {}',
    );

    // 根 barrel（排除 tag 目录下的 hooks 文件）
    const barrel = capturedWrites.find(
      (w) => w.path === join(minimalApiConfig.outputDir, 'hooks.ts'),
    );
    expect(barrel).toBeDefined();
    expect(barrel!.content).toContain("export * from './USER/hooks';");
  });

  it('JS 目标：不生成类型注解与 type import', async () => {
    const config: ApiConfig = {
      ...minimalApiConfig,
      generateHooks: true,
      target: 'javascript',
    };
    await generateHookFiles(makeProcessedData(), config);

    const hooksFile = findWrite(join('USER', 'hooks.js'));
    expect(hooksFile).toBeDefined();
    expect(hooksFile!.content).toContain(
      "import { useQuery, useMutation } from '@tanstack/react-query';",
    );
    expect(hooksFile!.content).not.toContain('UseQueryOptions');
    expect(hooksFile!.content).not.toContain('import type');
    expect(hooksFile!.content).toContain(
      'export function useGetApiUsersFunc(\n  params = {},\n  options = {}\n)',
    );
    expect(hooksFile!.content).toContain('mutationFn: (params) => postApiUsersFunc(params),');
  });

  it('无参数 GET：参数默认值为空对象', async () => {
    const data = makeProcessedData();
    // 去掉 GET 接口的参数定义（原本就无 parameters/requestBody，此测试固化该行为）
    const config: ApiConfig = { ...minimalApiConfig, generateHooks: true };
    await generateHookFiles(data, config);

    const hooksFile = findWrite(join('USER', 'hooks.ts'));
    expect(hooksFile!.content).toContain(
      'params: GetApiUsersRequestType = {} as GetApiUsersRequestType',
    );
  });

  it('queryKeyPrefix：前缀出现在 queryKey 首位', async () => {
    const config: ApiConfig = {
      ...minimalApiConfig,
      generateHooks: true,
      queryKeyPrefix: ['user-service'],
    };
    await generateHookFiles(makeProcessedData(), config);

    const hooksFile = findWrite(join('USER', 'hooks.ts'));
    expect(hooksFile!.content).toContain("queryKey: ['user-service', 'getApiUsersFunc', params],");
  });

  it('comment: false：不生成 JSDoc 注释', async () => {
    const config: ApiConfig = {
      ...minimalApiConfig,
      generateHooks: true,
      comment: false,
    };
    await generateHookFiles(makeProcessedData(), config);

    const hooksFile = findWrite(join('USER', 'hooks.ts'));
    expect(hooksFile!.content).not.toContain('@description');
  });

  it('zod 模式：类型从 ./schema 导入', async () => {
    const config: ApiConfig = {
      ...minimalApiConfig,
      generateHooks: true,
      typesFormat: 'zod',
    };
    await generateHookFiles(makeProcessedData(), config);

    const hooksFile = findWrite(join('USER', 'hooks.ts'));
    expect(hooksFile!.content).toContain(
      "import type { GetApiUsersRequestType, GetApiUsersResultType, PostApiUsersRequestType, PostApiUsersResultType } from './schema';",
    );
  });
});

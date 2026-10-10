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

describe('generateHookFiles (react-query)', () => {
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
      "options: Omit<UseMutationOptions<PostApiUsersResultType, Error, PostApiUsersRequestType, unknown>, 'mutationFn' | 'mutationKey'> = {}",
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

describe('generateHookFiles (swr)', () => {
  beforeEach(() => {
    capturedWrites.length = 0;
  });

  it('TS 目标：GET 生成 useSWR（数组 key）、POST 生成 useSWRMutation', async () => {
    const config: ApiConfig = {
      ...minimalApiConfig,
      generateHooks: true,
      hooksLibrary: 'swr',
    };
    await generateHookFiles(makeProcessedData(), config);

    const hooksFile = findWrite(join('USER', 'hooks.ts'));
    expect(hooksFile).toBeDefined();

    // import 段：query 与 mutation 分别来自 swr / swr/mutation
    expect(hooksFile!.content).toContain("import useSWR from 'swr';");
    expect(hooksFile!.content).toContain("import type { SWRConfiguration } from 'swr';");
    expect(hooksFile!.content).toContain("import useSWRMutation from 'swr/mutation';");
    expect(hooksFile!.content).toContain(
      "import type { SWRMutationConfiguration } from 'swr/mutation';",
    );

    // query hook：数组 key + fetcher
    expect(hooksFile!.content).toContain(
      "['getApiUsersFunc', params],\n    () => getApiUsersFunc(params),",
    );
    expect(hooksFile!.content).toContain(
      'options: SWRConfiguration<GetApiUsersResultType, Error> = {}',
    );

    // mutation hook：arg 签名 + trigger
    expect(hooksFile!.content).toContain(
      '(_, { arg }: { arg: PostApiUsersRequestType }) => postApiUsersFunc(arg),',
    );
    expect(hooksFile!.content).toContain(
      'options: SWRMutationConfiguration<PostApiUsersResultType, Error, undefined, PostApiUsersRequestType> = {}',
    );
  });

  it('queryKeyPrefix：前缀进入 query 与 mutation 的 key，mutation key 不含 params', async () => {
    const config: ApiConfig = {
      ...minimalApiConfig,
      generateHooks: true,
      hooksLibrary: 'swr',
      queryKeyPrefix: ['user-service'],
    };
    await generateHookFiles(makeProcessedData(), config);

    const hooksFile = findWrite(join('USER', 'hooks.ts'));
    expect(hooksFile!.content).toContain(
      "['user-service', 'getApiUsersFunc', params],\n    () => getApiUsersFunc(params),",
    );
    expect(hooksFile!.content).toContain(
      "['user-service', 'postApiUsersFunc'],\n    (_, { arg }: { arg: PostApiUsersRequestType }) => postApiUsersFunc(arg),",
    );
  });

  it('JS 目标：无类型注解与 type import', async () => {
    const config: ApiConfig = {
      ...minimalApiConfig,
      generateHooks: true,
      hooksLibrary: 'swr',
      target: 'javascript',
    };
    await generateHookFiles(makeProcessedData(), config);

    const hooksFile = findWrite(join('USER', 'hooks.js'));
    expect(hooksFile).toBeDefined();
    expect(hooksFile!.content).not.toContain('import type');
    expect(hooksFile!.content).toContain('(_, { arg }) => postApiUsersFunc(arg),');
  });
});

describe('generateHookFiles (ahooks)', () => {
  beforeEach(() => {
    capturedWrites.length = 0;
  });

  it('TS 目标：GET 生成自动模式 useRequest、POST 生成 manual 模式', async () => {
    const config: ApiConfig = {
      ...minimalApiConfig,
      generateHooks: true,
      hooksLibrary: 'ahooks',
    };
    await generateHookFiles(makeProcessedData(), config);

    const hooksFile = findWrite(join('USER', 'hooks.ts'));
    expect(hooksFile).toBeDefined();

    // import 段
    expect(hooksFile!.content).toContain("import { useRequest } from 'ahooks';");
    expect(hooksFile!.content).not.toContain("from '@tanstack/react-query'");

    // query hook：自动模式，直接透传 options
    expect(hooksFile!.content).toContain('useRequest(() => getApiUsersFunc(params), options);');
    expect(hooksFile!.content).toContain('options: Parameters<typeof useRequest>[1] = {}');

    // mutation hook：manual 模式 + run 触发
    expect(hooksFile!.content).toContain(
      'useRequest(\n    (params: PostApiUsersRequestType) => postApiUsersFunc(params),\n    { manual: true, ...(options ?? {}) },\n  );',
    );
  });

  it('queryKeyPrefix：非空时生成 cacheKey，为空时不生成', async () => {
    const withPrefix: ApiConfig = {
      ...minimalApiConfig,
      generateHooks: true,
      hooksLibrary: 'ahooks',
      queryKeyPrefix: ['user-service'],
    };
    await generateHookFiles(makeProcessedData(), withPrefix);

    let hooksFile = findWrite(join('USER', 'hooks.ts'));
    expect(hooksFile!.content).toContain(
      "useRequest(() => getApiUsersFunc(params), { cacheKey: 'user-service:getApiUsersFunc', ...(options ?? {}) });",
    );

    capturedWrites.length = 0;

    const noPrefix: ApiConfig = {
      ...minimalApiConfig,
      generateHooks: true,
      hooksLibrary: 'ahooks',
    };
    await generateHookFiles(makeProcessedData(), noPrefix);

    hooksFile = findWrite(join('USER', 'hooks.ts'));
    expect(hooksFile!.content).not.toContain('cacheKey');
  });

  it('JS 目标：无类型注解', async () => {
    const config: ApiConfig = {
      ...minimalApiConfig,
      generateHooks: true,
      hooksLibrary: 'ahooks',
      target: 'javascript',
    };
    await generateHookFiles(makeProcessedData(), config);

    const hooksFile = findWrite(join('USER', 'hooks.js'));
    expect(hooksFile).toBeDefined();
    expect(hooksFile!.content).toContain('(params) => postApiUsersFunc(params),');
    expect(hooksFile!.content).not.toContain('Parameters<');
  });
});

describe('generateHookFiles (vue-query)', () => {
  beforeEach(() => {
    capturedWrites.length = 0;
  });

  it('TS 目标：import 来自 @tanstack/vue-query，主体与 react-query 同构', async () => {
    const config: ApiConfig = {
      ...minimalApiConfig,
      generateHooks: true,
      hooksLibrary: 'vue-query',
    };
    await generateHookFiles(makeProcessedData(), config);

    const hooksFile = findWrite(join('USER', 'hooks.ts'));
    expect(hooksFile).toBeDefined();

    expect(hooksFile!.content).toContain(
      "import { useQuery, useMutation } from '@tanstack/vue-query';",
    );
    expect(hooksFile!.content).toContain(
      "import type { UseQueryOptions, UseMutationOptions } from '@tanstack/vue-query';",
    );
    expect(hooksFile!.content).not.toContain('@tanstack/react-query');
    expect(hooksFile!.content).toContain('UseQueryReturnType<GetApiUsersResultType, Error>');
    expect(hooksFile!.content).toContain(
      'queryFn: ({ signal }) => getApiUsersFunc(params, { signal }),',
    );
    expect(hooksFile!.content).toContain(
      'mutationFn: (params: PostApiUsersRequestType) => postApiUsersFunc(params),',
    );
  });
});

describe('generateHookFiles (hooksValidateResponse)', () => {
  beforeEach(() => {
    capturedWrites.length = 0;
  });

  it('zod 模式开启校验：queryFn/mutationFn 包裹 Schema.parse，Schema 值导入', async () => {
    const config: ApiConfig = {
      ...minimalApiConfig,
      generateHooks: true,
      typesFormat: 'zod',
      hooksValidateResponse: true,
    };
    await generateHookFiles(makeProcessedData(), config);

    const hooksFile = findWrite(join('USER', 'hooks.ts'));
    expect(hooksFile).toBeDefined();

    // 值导入 Schema + 类型仍走 import type
    expect(hooksFile!.content).toContain(
      "import { GetApiUsersResultTypeSchema, PostApiUsersResultTypeSchema } from './schema';",
    );
    expect(hooksFile!.content).toContain(
      "import type { GetApiUsersRequestType, GetApiUsersResultType, PostApiUsersRequestType, PostApiUsersResultType } from './schema';",
    );

    // 校验注入
    expect(hooksFile!.content).toContain(
      'queryFn: ({ signal }) => getApiUsersFunc(params, { signal }).then((res) => GetApiUsersResultTypeSchema.parse(res)),',
    );
    expect(hooksFile!.content).toContain(
      'mutationFn: (params: PostApiUsersRequestType) => postApiUsersFunc(params).then((res) => PostApiUsersResultTypeSchema.parse(res)),',
    );
  });

  it('关闭校验：zod 模式产物无 parse 与值导入（零回归）', async () => {
    const config: ApiConfig = {
      ...minimalApiConfig,
      generateHooks: true,
      typesFormat: 'zod',
    };
    await generateHookFiles(makeProcessedData(), config);

    const hooksFile = findWrite(join('USER', 'hooks.ts'));
    expect(hooksFile!.content).not.toContain('Schema.parse');
    expect(hooksFile!.content).not.toContain("from './schema';\nimport {");
    expect(hooksFile!.content).toContain(
      "import type { GetApiUsersRequestType, GetApiUsersResultType, PostApiUsersRequestType, PostApiUsersResultType } from './schema';",
    );
  });

  it.each([
    [
      'swr',
      "['getApiUsersFunc', params],\n    () => getApiUsersFunc(params).then((res) => GetApiUsersResultTypeSchema.parse(res)),",
    ],
    [
      'ahooks',
      'useRequest(() => getApiUsersFunc(params).then((res) => GetApiUsersResultTypeSchema.parse(res)), options);',
    ],
    [
      'vue-query',
      'queryFn: ({ signal }) => getApiUsersFunc(params, { signal }).then((res) => GetApiUsersResultTypeSchema.parse(res)),',
    ],
  ] as const)('%s 适配器同样注入校验', async (library, expected) => {
    const config: ApiConfig = {
      ...minimalApiConfig,
      generateHooks: true,
      hooksLibrary: library,
      typesFormat: 'zod',
      hooksValidateResponse: true,
    };
    await generateHookFiles(makeProcessedData(), config);

    const hooksFile = findWrite(join('USER', 'hooks.ts'));
    expect(hooksFile!.content).toContain(expected);
  });
});

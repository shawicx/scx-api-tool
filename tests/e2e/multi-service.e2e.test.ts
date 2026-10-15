/**
 * @description 多服务（共享 request + isolated 独立实例）的生成结果正确性测试
 *
 * 验证生成结果本身正确：
 * 1. 目录布局：共享 request 文件位于 baseOutputDir，isolated 服务的 request 文件在其输出目录内
 * 2. isolated 请求文件烘焙 axios.create 私有实例与 requestBaseURL
 * 3. 两服务产物均通过 TypeScript 类型检查
 * 4. 运行时行为：共享服务走全局 axios（无 baseURL），isolated 服务请求带烘焙的 baseURL
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { join } from 'node:path';
import {
  petOpenApiDocument,
  storeOpenApiDocument,
  petSample,
  orderSample,
} from './fixtures/openApiContract';
import {
  runGeneration,
  startOpenApiServer,
  listGeneratedFiles,
  readGeneratedFile,
  typeCheckGenerated,
  importGeneratedModule,
  createRequestCapture,
  generatedNames,
  tagDirName,
} from './helpers';

const CASE_NAME = 'multi-service';
const PET_TAG_DIR = tagDirName('宠物管理');
const STORE_TAG_DIR = tagDirName('store');

describe('生成结果正确性：多服务 + isolated 请求实例', () => {
  let outDir: string;
  let petModule: Record<string, any>;
  let storeModule: Record<string, any>;
  const capture = createRequestCapture();

  const names = {
    getPet: generatedNames('/pets/{petId}', 'get'),
    getOrder: generatedNames('/store/orders/{orderId}', 'get'),
  };

  beforeAll(async () => {
    // 两个服务使用不同的数据源与契约（本地 server 按路径分发）
    const api = await startOpenApiServer({
      '/pet/v3/api-docs': petOpenApiDocument,
      '/store/v3/api-docs': storeOpenApiDocument,
    });
    try {
      const result = await runGeneration(CASE_NAME, {
        target: 'typescript',
        typesFormat: 'typescript',
        services: [
          { name: 'pet', source: `http://127.0.0.1:${api.port}/pet/v3/api-docs` },
          {
            name: 'store',
            requestMode: 'isolated',
            requestBaseURL: '/store-svc',
            source: `http://127.0.0.1:${api.port}/store/v3/api-docs`,
          },
        ],
      });
      outDir = result.outDir;
    } finally {
      await api.close();
    }

    // isolated 实例在模块加载时创建并继承 defaults，必须先装捕获适配器再导入
    capture.install();
    petModule = await importGeneratedModule(join(outDir, 'pet', PET_TAG_DIR, 'index.ts'));
    storeModule = await importGeneratedModule(join(outDir, 'store', STORE_TAG_DIR, 'index.ts'));
  }, 120_000);

  afterAll(() => {
    capture.restore();
  });

  it('目录布局符合契约：共享 request 在 base 层，isolated request 在服务目录内', () => {
    expect(listGeneratedFiles(outDir)).toEqual([
      `pet/${PET_TAG_DIR}/index.ts`,
      'pet/index.ts',
      'pet/types/Category.ts',
      'pet/types/CreatePetRequest.ts',
      'pet/types/Pet.ts',
      'pet/types/PetListResponse.ts',
      'pet/types/PetStatus.ts',
      'pet/types/Tag.ts',
      'pet/types/index.ts',
      'request.ts',
      `store/${STORE_TAG_DIR}/index.ts`,
      'store/index.ts',
      'store/request.ts',
      'store/types/Order.ts',
      'store/types/OrderStatus.ts',
      'store/types/index.ts',
    ]);
  });

  it('isolated 请求文件烘焙 axios.create 私有实例与 requestBaseURL', () => {
    const isolatedRequest = readGeneratedFile(outDir, 'store/request.ts');
    expect(isolatedRequest).toContain('axios.create');
    expect(isolatedRequest).toContain("baseURL: '/store-svc'");
    expect(isolatedRequest).toMatchSnapshot('isolated-request.ts');

    // 共享 request 文件不应包含私有实例
    const sharedRequest = readGeneratedFile(outDir, 'request.ts');
    expect(sharedRequest).not.toContain('axios.create');
  });

  it('两服务的产物均通过 TypeScript 类型检查', () => {
    expect(typeCheckGenerated(outDir)).toEqual([]);
  });

  it('运行时行为：共享服务请求走全局 axios（无烘焙 baseURL）', async () => {
    capture.respondWith(petSample);

    const result = await petModule[names.getPet.functionName]({ petId: 42 });

    expect(result).toEqual(petSample);
    expect(capture.requests.at(-1)).toMatchObject({
      url: '/pets/42',
      method: 'get',
      baseURL: undefined,
    });
  });

  it('运行时行为：isolated 服务请求携带烘焙的 baseURL', async () => {
    capture.respondWith(orderSample);

    const result = await storeModule[names.getOrder.functionName]({ orderId: 1001 });

    expect(result).toEqual(orderSample);
    expect(capture.requests.at(-1)).toMatchObject({
      url: '/store/orders/1001',
      method: 'get',
      baseURL: '/store-svc',
    });
  });
});

/**
 * @description TypeScript 目标（target: typescript + typesFormat: typescript）的生成结果正确性测试
 *
 * 验证的不是工具内部函数被调用过，而是「生成结果」本身正确：
 * 1. 文件结构与契约一致（中文标签目录、类型文件、共享 request 文件）
 * 2. 生成代码通过 TypeScript 类型检查（编译器 API，noEmit）
 * 3. 生成类型符合契约（用法检查文件：合法赋值通过、非法赋值被 @ts-expect-error 拦截）
 * 4. 生成函数的运行时请求行为符合契约（URL 插值、query/body 落位、方法、FormData、响应解包）
 * 5. 关键文件快照，防止无意识的输出漂移
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { petOpenApiDocument, petSample } from './fixtures/openApiContract';
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

const CASE_NAME = 'ts-target';
const TAG_DIR = tagDirName('宠物管理');

/** 用法检查文件：编译期验证生成类型与契约一致（非法用法靠 @ts-expect-error 反向锁定） */
function writeTypeUsageFile(outDir: string): void {
  const petNames = generatedNames('/pets/{petId}', 'get');
  const listNames = generatedNames('/pets', 'get');
  const createNames = generatedNames('/pets', 'post');

  writeFileSync(
    join(outDir, 'type-usage.check.ts'),
    [
      `import type { ${petNames.requestTypeName}, ${petNames.responseTypeName} } from './pet/${TAG_DIR}';`,
      `import type { ${listNames.requestTypeName} } from './pet/${TAG_DIR}';`,
      `import type { ${createNames.requestTypeName} } from './pet/${TAG_DIR}';`,
      `import type { Pet, PetStatus } from './pet/types';`,
      '',
      '// 契约：Pet 必填 id/name/photoUrls，status 为枚举，category/tags 可选',
      `const validPet: Pet = { id: 1, name: 'Rex', photoUrls: [] };`,
      `const fullPet: Pet = {`,
      `  id: 2,`,
      `  name: 'Tom',`,
      `  photoUrls: ['/a.png'],`,
      `  status: 'available',`,
      `  category: { id: 1, name: 'dogs' },`,
      `  tags: [{ id: 7, name: 'cute' }],`,
      `};`,
      '',
      `// @ts-expect-error 缺少必填字段 name`,
      `const missingName: Pet = { id: 1, photoUrls: [] };`,
      '',
      `// @ts-expect-error status 不在枚举内`,
      `const badStatus: Pet = { id: 1, name: 'Rex', photoUrls: [], status: 'unknown' };`,
      '',
      '// 顶层枚举 Schema 应生成为字面量联合类型',
      `const statusValue: PetStatus = 'pending';`,
      `// @ts-expect-error 枚举之外的值不允许`,
      `const badStatusValue: PetStatus = 'gone';`,
      '',
      '// 请求参数类型：路径参数与查询参数被收进对应的 RequestType',
      `const getPetParams: ${petNames.requestTypeName} = { petId: 42 };`,
      `const listParams: ${listNames.requestTypeName} = { page: 1, pageSize: 10, status: 'available' };`,
      `// @ts-expect-error 查询枚举之外的值不允许`,
      `const badListParams: ${listNames.requestTypeName} = { page: 1, status: 'unknown' };`,
      '',
      '// 响应类型：请求函数的返回值类型与契约响应一致（仅做类型位置引用）',
      `type PetResult = ${petNames.responseTypeName};`,
      `const createPayload: ${createNames.requestTypeName} = { name: 'Rex' };`,
      '',
      `export const usageProof = { validPet, fullPet, statusValue, getPetParams, listParams, badListParams, createPayload, petResult: null as unknown as PetResult };`,
      '',
    ].join('\n'),
    'utf-8',
  );
}

describe('生成结果正确性：TypeScript 目标', () => {
  let outDir: string;
  let module: Record<string, any>;
  const capture = createRequestCapture();

  // 默认命名策略按路径（而非 operationId）生成标识符，与生成器同源推算，避免手写偏差
  const names = {
    getPet: generatedNames('/pets/{petId}', 'get'),
    listPets: generatedNames('/pets', 'get'),
    createPet: generatedNames('/pets', 'post'),
    uploadPhoto: generatedNames('/pets/{petId}/photos', 'post'),
    deletePet: generatedNames('/pets/{petId}', 'delete'),
  };

  beforeAll(async () => {
    const api = await startOpenApiServer({ '/v3/api-docs': petOpenApiDocument });
    try {
      const result = await runGeneration(CASE_NAME, {
        target: 'typescript',
        typesFormat: 'typescript',
        services: [{ name: 'pet', source: `http://127.0.0.1:${api.port}/v3/api-docs` }],
      });
      outDir = result.outDir;
    } finally {
      await api.close();
    }

    writeTypeUsageFile(outDir);

    capture.install();
    module = await importGeneratedModule(join(outDir, 'pet', TAG_DIR, 'index.ts'));
  }, 120_000);

  afterAll(() => {
    capture.restore();
  });

  it('文件结构与契约一致（中文标签目录、类型文件、共享 request 文件）', () => {
    expect(listGeneratedFiles(outDir).filter((file) => !file.endsWith('.check.ts'))).toEqual([
      `pet/${TAG_DIR}/index.ts`,
      'pet/index.ts',
      'pet/types/Category.ts',
      'pet/types/CreatePetRequest.ts',
      'pet/types/Pet.ts',
      'pet/types/PetListResponse.ts',
      'pet/types/PetStatus.ts',
      'pet/types/Tag.ts',
      'pet/types/index.ts',
      'request.ts',
    ]);
  });

  it('生成代码通过 TypeScript 类型检查（含用法检查文件）', () => {
    expect(typeCheckGenerated(outDir)).toEqual([]);
  });

  it('生成代码通过快照验证（request 文件 / 接口文件 / 类型索引）', () => {
    expect(readGeneratedFile(outDir, 'request.ts')).toMatchSnapshot('request.ts');
    expect(readGeneratedFile(outDir, join('pet', TAG_DIR, 'index.ts'))).toMatchSnapshot(
      'interface-index.ts',
    );
    expect(readGeneratedFile(outDir, 'pet/types/Pet.ts')).toMatchSnapshot('Pet.ts');
    expect(readGeneratedFile(outDir, 'pet/types/index.ts')).toMatchSnapshot('types-index.ts');
  });

  it('请求行为符合契约：GET 路径参数插值且不带 data/params', async () => {
    capture.respondWith(petSample);

    const result = await module[names.getPet.functionName]({ petId: 42 });

    // 响应解包：返回的是 response.data 本体
    expect(result).toEqual(petSample);
    expect(capture.requests.at(-1)).toMatchObject({
      url: '/pets/42',
      // axios 在适配器层将 method 统一小写，契约断言做大小写归一
      method: 'get',
      params: undefined,
      data: undefined,
    });
  });

  it('请求行为符合契约：GET 查询参数整体作为 params 传递', async () => {
    capture.respondWith({ data: [petSample], total: 1 });

    const result = await module[names.listPets.functionName]({
      page: 2,
      pageSize: 10,
      status: 'available',
    });

    expect(result).toEqual({ data: [petSample], total: 1 });
    expect(capture.requests.at(-1)).toMatchObject({
      url: '/pets',
      method: 'get',
      params: { page: 2, pageSize: 10, status: 'available' },
      data: undefined,
    });
  });

  it('请求行为符合契约：POST JSON 请求体作为 data 传递', async () => {
    capture.respondWith(petSample);
    const payload = { name: 'Rex', photoUrls: [], status: 'available' as const };

    const result = await module[names.createPet.functionName](payload);

    expect(result).toEqual(petSample);
    const request = capture.requests.at(-1)!;
    expect(request.url).toBe('/pets');
    expect(request.method).toBe('post');
    expect(request.params).toBeUndefined();
    // axios 默认 transformRequest 会把普通对象序列化为 JSON 字符串
    expect(typeof request.data).toBe('string');
    expect(JSON.parse(request.data as string)).toEqual(payload);
  });

  it('请求行为符合契约：multipart 构造 FormData 且剥离固定 Content-Type', async () => {
    const file = new File(['fake-image-bytes'], 'photo.png', { type: 'image/png' });
    const expected = { photoId: 'p-1', url: 'https://cdn.example.com/photo.png' };
    capture.respondWith(expected);

    // 调用方误传固定 boundary 的 Content-Type：multipart 的 boundary 必须由运行时生成，
    // 生成代码应剥离该头（axios 1.20 会在 dispatch 阶段补一个临时 x-www-form-urlencoded
    // 默认头，真实 http/xhr 适配器发送时再用 FormData 的 multipart 头覆盖，
    // 因此这里断言「没有固定 boundary 流出」而非「完全没有 content-type」）
    const result = await module[names.uploadPhoto.functionName](
      { petId: 42, file, caption: 'hi' },
      { headers: { 'Content-Type': 'multipart/form-data; boundary=fixed-boundary-123' } },
    );

    expect(result).toEqual(expected);
    const request = capture.requests.at(-1)!;
    expect(request.url).toBe('/pets/42/photos');
    expect(request.method).toBe('post');
    expect(request.data).toBeInstanceOf(FormData);
    expect((request.data as FormData).get('file')).toBe(file);
    expect((request.data as FormData).get('caption')).toBe('hi');
    expect(String(request.headers?.['content-type'] ?? '')).not.toContain('boundary=');
    expect(String(request.headers?.['content-type'] ?? '')).not.toContain('multipart/form-data');
  });

  it('请求行为符合契约：DELETE 无响应体接口按契约生成并可调用', async () => {
    capture.respondWith({});

    await module[names.deletePet.functionName]({ petId: 7 });

    expect(capture.requests.at(-1)).toMatchObject({
      url: '/pets/7',
      method: 'delete',
      data: undefined,
    });
  });
});

/**
 * @description JavaScript 目标（target: javascript）的生成结果正确性测试
 *
 * 验证生成结果本身正确：
 * 1. 文件结构：扩展名为 .js、无 types/schemas 目录（JS 目标不生成类型）
 * 2. 产物为纯 JavaScript：不含 TypeScript 语法（import type / interface 声明 / 类型注解）
 * 3. 请求行为与 TypeScript 目标一致（路径参数插值、query/body 落位、multipart FormData）
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { join } from 'node:path';
import { petOpenApiDocument, petSample } from './fixtures/openApiContract';
import {
  runGeneration,
  startOpenApiServer,
  listGeneratedFiles,
  readGeneratedFile,
  importGeneratedModule,
  createRequestCapture,
  generatedNames,
  tagDirName,
} from './helpers';

const CASE_NAME = 'js-target';
const TAG_DIR = tagDirName('宠物管理');

describe('生成结果正确性：JavaScript 目标', () => {
  let outDir: string;
  let module: Record<string, any>;
  const capture = createRequestCapture();

  const names = {
    getPet: generatedNames('/pets/{petId}', 'get'),
    listPets: generatedNames('/pets', 'get'),
    createPet: generatedNames('/pets', 'post'),
    uploadPhoto: generatedNames('/pets/{petId}/photos', 'post'),
  };

  beforeAll(async () => {
    const api = await startOpenApiServer({ '/v3/api-docs': petOpenApiDocument });
    try {
      const result = await runGeneration(CASE_NAME, {
        target: 'javascript',
        services: [{ name: 'pet', source: `http://127.0.0.1:${api.port}/v3/api-docs` }],
      });
      outDir = result.outDir;
    } finally {
      await api.close();
    }

    capture.install();
    module = await importGeneratedModule(join(outDir, 'pet', TAG_DIR, 'index.js'));
  }, 120_000);

  afterAll(() => {
    capture.restore();
  });

  it('文件结构与契约一致：.js 扩展名且不生成类型文件', () => {
    expect(listGeneratedFiles(outDir)).toEqual([
      `pet/${TAG_DIR}/index.js`,
      'pet/index.js',
      'request.js',
    ]);
  });

  it('产物为纯 JavaScript：不含 TypeScript 语法', () => {
    for (const file of listGeneratedFiles(outDir)) {
      const content = readGeneratedFile(outDir, file);
      expect(content, `${file} 含 import type`).not.toMatch(/import\s+type\s/);
      expect(content, `${file} 含 interface 声明`).not.toMatch(
        /export\s+interface\s|interface\s+[A-Z]\w*\s*\{/,
      );
      expect(content, `${file} 含枚举常量`).not.toMatch(/RequestMethod\s*\.\s*[A-Z]+/);
      // 函数签名处不应出现 TypeScript 类型注解（宽松匹配参数名后的冒号类型）
      expect(content, `${file} 含类型注解`).not.toMatch(
        /function\s+\w+\s*\([^)]*:\s*(string|number|boolean|RequestConfig)/,
      );
    }
  });

  it('请求行为符合契约：GET 路径参数插值', async () => {
    capture.respondWith(petSample);

    const result = await module[names.getPet.functionName]({ petId: 42 });

    expect(result).toEqual(petSample);
    expect(capture.requests.at(-1)).toMatchObject({
      url: '/pets/42',
      method: 'get',
      params: undefined,
      data: undefined,
    });
  });

  it('请求行为符合契约：GET 查询参数整体作为 params 传递', async () => {
    capture.respondWith({ data: [petSample], total: 1 });

    await module[names.listPets.functionName]({ page: 2, pageSize: 10, status: 'available' });

    expect(capture.requests.at(-1)).toMatchObject({
      url: '/pets',
      method: 'get',
      params: { page: 2, pageSize: 10, status: 'available' },
      data: undefined,
    });
  });

  it('请求行为符合契约：POST JSON 请求体作为 data 传递', async () => {
    capture.respondWith(petSample);
    const payload = { name: 'Rex', photoUrls: [] };

    const result = await module[names.createPet.functionName](payload);

    expect(result).toEqual(petSample);
    const request = capture.requests.at(-1)!;
    expect(request.method).toBe('post');
    expect(request.params).toBeUndefined();
    expect(JSON.parse(request.data as string)).toEqual(payload);
  });

  it('请求行为符合契约：multipart 构造 FormData', async () => {
    const file = new File(['fake-image-bytes'], 'photo.png', { type: 'image/png' });
    const expected = { photoId: 'p-1', url: 'https://cdn.example.com/photo.png' };
    capture.respondWith(expected);

    const result = await module[names.uploadPhoto.functionName]({
      petId: 42,
      file,
      caption: 'hi',
    });

    expect(result).toEqual(expected);
    const request = capture.requests.at(-1)!;
    expect(request.url).toBe('/pets/42/photos');
    expect(request.data).toBeInstanceOf(FormData);
    expect((request.data as FormData).get('file')).toBe(file);
    expect((request.data as FormData).get('caption')).toBe('hi');
  });
});

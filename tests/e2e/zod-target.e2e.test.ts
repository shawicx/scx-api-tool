/**
 * @description Zod 目标（target: typescript + typesFormat: zod）的生成结果正确性测试
 *
 * 验证生成结果本身正确：
 * 1. 文件结构（类型 Schema 目录、接口合并 Schema、API 函数文件、共享 request 文件）
 * 2. 生成代码通过 TypeScript 类型检查（依赖真实 zod 3 —— 生成代码的目标 API 版本）
 * 3. 运行时校验契约：合法样本 parse 通过，违反契约（缺必填/枚举外取值/类型错误）的样本被拒绝
 * 4. API 函数请求行为与 TypeScript 目标一致（路径参数插值）
 * 5. 关键 Schema 文件快照
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
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

const CASE_NAME = 'zod-target';
const TAG_DIR = tagDirName('宠物管理');

describe('生成结果正确性：Zod 目标', () => {
  let outDir: string;
  let schemasModule: Record<string, any>;
  let mergedSchemasModule: Record<string, any>;
  let apiModule: Record<string, any>;
  const capture = createRequestCapture();

  const names = {
    getPet: generatedNames('/pets/{petId}', 'get'),
    listPets: generatedNames('/pets', 'get'),
  };

  beforeAll(async () => {
    const api = await startOpenApiServer({ '/v3/api-docs': petOpenApiDocument });
    try {
      const result = await runGeneration(CASE_NAME, {
        target: 'typescript',
        typesFormat: 'zod',
        services: [{ name: 'pet', source: `http://127.0.0.1:${api.port}/v3/api-docs` }],
      });
      outDir = result.outDir;
    } finally {
      await api.close();
    }

    capture.install();
    schemasModule = await importGeneratedModule(join(outDir, 'pet', 'schemas', 'index.ts'));
    mergedSchemasModule = await importGeneratedModule(join(outDir, 'pet', TAG_DIR, 'schema.ts'));
    apiModule = await importGeneratedModule(join(outDir, 'pet', TAG_DIR, 'index.ts'));
  }, 120_000);

  afterAll(() => {
    capture.restore();
  });

  it('文件结构与契约一致（类型 Schema + 接口合并 Schema + API 函数）', () => {
    expect(listGeneratedFiles(outDir)).toEqual([
      `pet/${TAG_DIR}/index.ts`,
      `pet/${TAG_DIR}/schema.ts`,
      'pet/index.ts',
      'pet/schemas/CategorySchema.ts',
      'pet/schemas/CreatePetRequestSchema.ts',
      'pet/schemas/PetListResponseSchema.ts',
      'pet/schemas/PetSchema.ts',
      'pet/schemas/PetStatusSchema.ts',
      'pet/schemas/TagSchema.ts',
      'pet/schemas/index.ts',
      'request.ts',
    ]);
  });

  it('生成代码通过 TypeScript 类型检查（针对真实 zod 3 类型）', () => {
    expect(typeCheckGenerated(outDir)).toEqual([]);
  });

  it('生成代码通过快照验证（类型 Schema / 接口合并 Schema）', () => {
    expect(readGeneratedFile(outDir, 'pet/schemas/PetSchema.ts')).toMatchSnapshot('PetSchema.ts');
    expect(readGeneratedFile(outDir, join('pet', TAG_DIR, 'schema.ts'))).toMatchSnapshot(
      'merged-schema.ts',
    );
  });

  it('运行时校验契约：合法样本通过 parse 且保真返回', () => {
    expect(schemasModule.PetSchema.parse(petSample)).toEqual(petSample);
    expect(schemasModule.PetStatusSchema.parse('pending')).toBe('pending');
    expect(schemasModule.PetListResponseSchema.parse({ data: [petSample], total: 1 })).toEqual({
      data: [petSample],
      total: 1,
    });
  });

  it('运行时校验契约：违反契约的样本被拒绝（缺必填 / 枚举外取值 / 类型错误）', () => {
    const { PetSchema, PetStatusSchema, CreatePetRequestSchema } = schemasModule;

    // 缺少必填字段 name / photoUrls
    expect(() => PetSchema.parse({ id: 1, photoUrls: [] })).toThrow('name');
    // 字段类型错误：id 应为 number
    expect(() => PetSchema.parse({ ...petSample, id: 'not-a-number' })).toThrow('id');
    // 嵌套对象类型错误：category.name 应为 string
    expect(() => PetSchema.parse({ ...petSample, category: { id: 1, name: 9 } })).toThrow('name');
    // 枚举之外的取值
    expect(() => PetStatusSchema.parse('gone')).toThrow('Invalid');
    expect(() => CreatePetRequestSchema.parse({ name: 'Rex', status: 'unknown' })).toThrow(
      'status',
    );
  });

  it('运行时校验契约：接口级 Request/Response Schema 从合并文件导出并生效', () => {
    // 接口级 Schema 名称 = 请求/响应类型名 + Schema 后缀，与 API 文件中的导入一致
    const requestSchemaName = `${names.getPet.requestTypeName}Schema`;
    const responseSchemaName = `${names.getPet.responseTypeName}Schema`;
    expect(mergedSchemasModule[requestSchemaName]).toBeTruthy();
    expect(mergedSchemasModule[responseSchemaName]).toBeTruthy();

    expect(mergedSchemasModule[requestSchemaName].parse({ petId: 42 })).toEqual({ petId: 42 });
    expect(() => mergedSchemasModule[requestSchemaName].parse({})).toThrow('petId');
    expect(mergedSchemasModule[responseSchemaName].parse(petSample)).toEqual(petSample);
  });

  it('运行时校验契约：路径参数类型与查询枚举参数遵循契约（标准 OpenAPI 3.0 参数）', () => {
    const listRequestSchemaName = `${names.listPets.requestTypeName}Schema`;
    const schema = mergedSchemasModule[listRequestSchemaName];
    expect(schema).toBeTruthy();

    // page/pageSize 为 integer，status 为 PetStatus 枚举（$ref 引用）
    expect(schema.parse({ page: 1, pageSize: 10, status: 'available' })).toEqual({
      page: 1,
      pageSize: 10,
      status: 'available',
    });
    // 枚举之外的查询取值必须被拒绝
    expect(() => schema.parse({ page: 1, status: 'unknown' })).toThrow('status');
    // integer 查询参数传字符串必须被拒绝
    expect(() => schema.parse({ page: 'one' })).toThrow('page');
  });

  it('请求行为符合契约：API 函数在 zod 模式下同样完成路径参数插值', async () => {
    capture.respondWith(petSample);

    const result = await apiModule[names.getPet.functionName]({ petId: 42 });

    expect(result).toEqual(petSample);
    expect(capture.requests.at(-1)).toMatchObject({
      url: '/pets/42',
      method: 'get',
      params: undefined,
      data: undefined,
    });
  });
});

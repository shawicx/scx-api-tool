/**
 * @description zod/types.ts 单元测试
 * 覆盖 openApiPropertyToZodType（7+ 分支）与 generateZodSchemaFromOpenApiSchema
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('consola', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    success: vi.fn(),
  },
}));

import {
  openApiPropertyToZodType,
  generateZodSchemaFromOpenApiSchema,
  generateZodTypeSchema,
  getZodTypeTemplateByConfig,
  getZodImportStatement,
} from '../types';
import { generateZodSchemaIndex } from '../index';
import type { ApiConfig, OpenApiSchema } from '@/types';
import { minimalApiConfig } from '../../../../../tests/fixtures/mockData';

describe('zod/types', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.DEBUG;
  });

  describe('openApiPropertyToZodType - $ref', () => {
    it('$ref 应转为 {Name}Schema 并加入 imports', () => {
      const result = openApiPropertyToZodType({ $ref: '#/components/schemas/User' });
      expect(result.type).toBe('UserSchema');
      expect(result.imports).toEqual(['UserSchema']);
    });
  });

  describe('openApiPropertyToZodType - array', () => {
    it('array of $ref 应转为 z.array({Name}Schema) 并传递 imports', () => {
      const result = openApiPropertyToZodType({
        type: 'array',
        items: { $ref: '#/components/schemas/User' },
      });
      expect(result.type).toBe('z.array(UserSchema)');
      expect(result.imports).toEqual(['UserSchema']);
    });

    it('array of 内联 string 应转为 z.array(z.string())', () => {
      const result = openApiPropertyToZodType({
        type: 'array',
        items: { type: 'string' },
      });
      expect(result.type).toBe('z.array(z.string())');
      expect(result.imports).toEqual([]);
    });
  });

  describe('openApiPropertyToZodType - object', () => {
    it('object additionalProperties $ref 应转为 z.record({Name}Schema)', () => {
      const result = openApiPropertyToZodType({
        type: 'object',
        additionalProperties: { $ref: '#/components/schemas/User' },
      });
      expect(result.type).toBe('z.record(UserSchema)');
      expect(result.imports).toEqual(['UserSchema']);
    });

    it('object additionalProperties 内联 string 应转为 z.record(z.string())', () => {
      const result = openApiPropertyToZodType({
        type: 'object',
        additionalProperties: { type: 'string' },
      });
      expect(result.type).toBe('z.record(z.string())');
      expect(result.imports).toEqual([]);
    });

    it('object with properties 应递归 generateZodSchemaFromOpenApiSchema', () => {
      const result = openApiPropertyToZodType({
        type: 'object',
        properties: { name: { type: 'string' } },
      });
      expect(result.type).toContain('z.object({');
      expect(result.type).toContain('name: z.string().optional()');
    });

    it('object 无 additionalProperties 无 properties 应转为 z.record(z.any())', () => {
      const result = openApiPropertyToZodType({ type: 'object' });
      expect(result.type).toBe('z.record(z.any())');
      expect(result.imports).toEqual([]);
    });
  });

  describe('openApiPropertyToZodType - enum', () => {
    it('enum 应转为 z.union([...])', () => {
      const result = openApiPropertyToZodType({ enum: ['a', 'b'] });
      expect(result.type).toBe("z.union(['a', 'b'])");
      expect(result.imports).toEqual([]);
    });

    it('enum 含单引号应转义（注入防护）', () => {
      const result = openApiPropertyToZodType({ enum: ["a'b"] });
      // escapeStringLiteral 转义单引号
      expect(result.type).toBe("z.union(['a\\'b'])");
    });
  });

  describe('openApiPropertyToZodType - typeMap', () => {
    it('string → z.string()', () => {
      expect(openApiPropertyToZodType({ type: 'string' }).type).toBe('z.string()');
    });
    it('number → z.number()', () => {
      expect(openApiPropertyToZodType({ type: 'number' }).type).toBe('z.number()');
    });
    it('integer → z.number()', () => {
      expect(openApiPropertyToZodType({ type: 'integer' }).type).toBe('z.number()');
    });
    it('boolean → z.boolean()', () => {
      expect(openApiPropertyToZodType({ type: 'boolean' }).type).toBe('z.boolean()');
    });
    it('null → z.null()', () => {
      expect(openApiPropertyToZodType({ type: 'null' }).type).toBe('z.null()');
    });
  });

  describe('openApiPropertyToZodType - fallback', () => {
    it('空对象应转为 z.any()', () => {
      const result = openApiPropertyToZodType({} as OpenApiSchema);
      expect(result.type).toBe('z.any()');
      expect(result.imports).toEqual([]);
    });
    it('未知 type 应转为 z.any()', () => {
      const result = openApiPropertyToZodType({ type: 'unknown' } as OpenApiSchema);
      expect(result.type).toBe('z.any()');
    });
    it('null/undefined 输入应转为 z.any()', () => {
      expect(openApiPropertyToZodType(null as any).type).toBe('z.any()');
      expect(openApiPropertyToZodType(undefined as any).type).toBe('z.any()');
    });
    it('depth 超限（>=20）应降级为 z.any()', () => {
      const result = openApiPropertyToZodType({ type: 'string' }, 20);
      expect(result.type).toBe('z.any()');
    });
  });

  describe('generateZodSchemaFromOpenApiSchema', () => {
    it('无 properties 应返回 z.object({})', () => {
      const result = generateZodSchemaFromOpenApiSchema({} as OpenApiSchema);
      expect(result.code).toBe('z.object({})');
      expect(result.imports).toEqual([]);
    });

    it('required 属性不应加 .optional()', () => {
      const result = generateZodSchemaFromOpenApiSchema({
        properties: { id: { type: 'number' } },
        required: ['id'],
      });
      expect(result.code).toBe('z.object({\n  id: z.number(),\n})');
    });

    it('非 required 属性应加 .optional()', () => {
      const result = generateZodSchemaFromOpenApiSchema({
        properties: { name: { type: 'string' } },
      });
      expect(result.code).toContain('name: z.string().optional()');
    });

    it('多属性应正确拼接字段（含 $ref import 收集）', () => {
      const result = generateZodSchemaFromOpenApiSchema({
        properties: {
          id: { type: 'number' },
          owner: { $ref: '#/components/schemas/User' },
        },
        required: ['id'],
      });
      expect(result.code).toContain('id: z.number(),');
      expect(result.code).toContain('owner: UserSchema.optional()');
      expect(result.imports).toEqual(['UserSchema']);
    });

    it('depth 超限（>=20）应返回 z.object({})', () => {
      const result = generateZodSchemaFromOpenApiSchema(
        { properties: { a: { type: 'string' } } } as OpenApiSchema,
        20,
      );
      expect(result.code).toBe('z.object({})');
    });
  });

  describe('generateZodTypeSchema', () => {
    it('应生成带 schemaName 与推导类型的完整文件', () => {
      const code = generateZodTypeSchema(
        {
          name: 'User',
          schema: {
            type: 'object',
            properties: { id: { type: 'number' } },
            required: ['id'],
          },
        },
        { ...minimalApiConfig } as ApiConfig,
      );
      expect(code).toContain('export const UserSchema = z.object({');
      expect(code).toContain('export type User = z.infer<typeof UserSchema>');
    });

    it('description 应注入 JSDoc（comment=true）', () => {
      const code = generateZodTypeSchema(
        {
          name: 'User',
          schema: { type: 'object', description: '用户实体', properties: {} },
        },
        { ...minimalApiConfig, comment: true } as ApiConfig,
      );
      expect(code).toContain('@description');
      expect(code).toContain('用户实体');
    });
  });

  describe('generateZodSchemaIndex', () => {
    it('应为每个 schema 生成 export 行', () => {
      const code = generateZodSchemaIndex(['UserSchema', 'PostSchema']);
      expect(code).toContain("export { UserSchema } from './UserSchema';");
      expect(code).toContain("export { PostSchema } from './PostSchema';");
    });

    it('空数组应只有注释行', () => {
      const code = generateZodSchemaIndex([]);
      expect(code).toContain('// Zod Schema 导出');
      expect(code).not.toContain('export {');
    });
  });

  describe('getZodTypeTemplateByConfig', () => {
    it('comment=true 应含 @description 占位', () => {
      const tpl = getZodTypeTemplateByConfig(true);
      expect(tpl).toContain('{{#if description}}');
      expect(tpl).toContain('{{schemaName}}');
    });
    it('comment=false 应不含 @description 占位', () => {
      const tpl = getZodTypeTemplateByConfig(false);
      expect(tpl).not.toContain('{{#if description}}');
    });
  });

  describe('getZodImportStatement', () => {
    it('应返回 zod import 语句', () => {
      expect(getZodImportStatement()).toBe("import { z } from 'zod';\n");
    });
  });
});

/**
 * @description templateDefinitions.ts 单元测试
 */

import { describe, it, expect } from 'vitest';
import {
  getInterfaceTemplateWithComment,
  getInterfaceTemplateWithoutComment,
  getApiOnlyTemplateWithComment,
  getApiOnlyTemplateWithoutComment,
  getZodInterfaceTemplateWithComment,
  getZodInterfaceTemplateWithoutComment,
  getZodApiOnlyTemplateWithComment,
  getZodApiOnlyTemplateWithoutComment,
  getZodTypesOnlyTemplateWithComment,
  getZodTypesOnlyTemplateWithoutComment,
  getTypeTemplateWithComment,
  getTypeTemplateWithoutComment,
  getTypesOnlyTemplateWithComment,
  getTypesOnlyTemplateWithoutComment,
  getInterfaceTemplateByConfig,
  getApiOnlyTemplateByConfig,
  getTypeTemplateByConfig,
  getZodInterfaceTemplateByConfig,
  getZodApiOnlyTemplateByConfig,
  getZodTypesOnlyTemplateByConfig,
  generatePrecompiledMethodMap,
} from '../templateDefinitions';

// ==================== WithComment templates ====================

describe('WithComment templates', () => {
  it('getInterfaceTemplateWithComment should contain comment-related Handlebars syntax', () => {
    const template = getInterfaceTemplateWithComment();
    expect(template).toContain('@description');
    expect(template).toContain('{{description}}');
    expect(template).toContain('{{requestTypeName}}');
    expect(template).toContain('{{responseTypeName}}');
    expect(template).toContain('{{functionName}}');
  });

  it('getApiOnlyTemplateWithComment should contain comment-related Handlebars syntax', () => {
    const template = getApiOnlyTemplateWithComment();
    expect(template).toContain('@description');
    expect(template).toContain('{{description}}');
    expect(template).toContain('{{functionName}}');
    expect(template).toContain('{{requestFunctionName}}');
  });

  it('getZodInterfaceTemplateWithComment should contain comment-related Handlebars syntax', () => {
    const template = getZodInterfaceTemplateWithComment();
    expect(template).toContain('@description');
    expect(template).toContain('{{description}}');
    expect(template).toContain('{{functionName}}');
  });

  it('getZodApiOnlyTemplateWithComment should contain comment-related Handlebars syntax', () => {
    const template = getZodApiOnlyTemplateWithComment();
    expect(template).toContain('@description');
    expect(template).toContain('{{description}}');
  });

  it('getZodTypesOnlyTemplateWithComment should contain comment-related Handlebars syntax', () => {
    const template = getZodTypesOnlyTemplateWithComment();
    expect(template).toContain('@description');
    expect(template).toContain('{{description}}');
    expect(template).toContain('{{requestSchema}}');
    expect(template).toContain('{{responseSchema}}');
  });

  it('getTypeTemplateWithComment should contain comment-related Handlebars syntax', () => {
    const template = getTypeTemplateWithComment();
    expect(template).toContain('@description');
    expect(template).toContain('{{description}}');
    expect(template).toContain('{{typeName}}');
  });

  it('getTypesOnlyTemplateWithComment should contain comment-related Handlebars syntax', () => {
    const template = getTypesOnlyTemplateWithComment();
    expect(template).toContain('@description');
    expect(template).toContain('{{description}}');
    expect(template).toContain('{{requestTypeName}}');
    expect(template).toContain('{{responseTypeName}}');
  });
});

// ==================== WithoutComment templates ====================

describe('WithoutComment templates', () => {
  it('getInterfaceTemplateWithoutComment should NOT contain @description comment markers', () => {
    const template = getInterfaceTemplateWithoutComment();
    expect(template).not.toContain('@description');
    // Should still have the Handlebars variable for description data
    // but the JSDoc-style comment markers should be absent
    expect(template).toContain('{{requestTypeName}}');
    expect(template).toContain('{{responseTypeName}}');
  });

  it('getApiOnlyTemplateWithoutComment should NOT contain @description comment markers', () => {
    const template = getApiOnlyTemplateWithoutComment();
    expect(template).not.toContain('@description');
    expect(template).toContain('{{functionName}}');
  });

  it('getZodInterfaceTemplateWithoutComment should NOT contain @description comment markers', () => {
    const template = getZodInterfaceTemplateWithoutComment();
    expect(template).not.toContain('@description');
    expect(template).toContain('{{functionName}}');
  });

  it('getZodApiOnlyTemplateWithoutComment should NOT contain @description comment markers', () => {
    const template = getZodApiOnlyTemplateWithoutComment();
    expect(template).not.toContain('@description');
  });

  it('getZodTypesOnlyTemplateWithoutComment should NOT contain @description comment markers', () => {
    const template = getZodTypesOnlyTemplateWithoutComment();
    expect(template).not.toContain('@description');
    expect(template).toContain('{{requestSchema}}');
    expect(template).toContain('{{responseSchema}}');
  });

  it('getTypeTemplateWithoutComment should NOT contain @description comment markers', () => {
    const template = getTypeTemplateWithoutComment();
    expect(template).not.toContain('@description');
    expect(template).toContain('{{typeName}}');
  });

  it('getTypesOnlyTemplateWithoutComment should NOT contain @description comment markers', () => {
    const template = getTypesOnlyTemplateWithoutComment();
    expect(template).not.toContain('@description');
    expect(template).toContain('{{requestTypeName}}');
    expect(template).toContain('{{responseTypeName}}');
  });
});

// ==================== FormData 序列化片段 ====================

describe('FormData 序列化片段（isFormData 分支）', () => {
  // 6 个含内联 FormData 片段的模板（ApiOnly × 2、ZodInterface × 2、ZodApiOnly × 2）
  const templatesWithFormDataBranch: Array<[string, () => string]> = [
    ['getApiOnlyTemplateWithComment', getApiOnlyTemplateWithComment],
    ['getApiOnlyTemplateWithoutComment', getApiOnlyTemplateWithoutComment],
    ['getZodInterfaceTemplateWithComment', getZodInterfaceTemplateWithComment],
    ['getZodInterfaceTemplateWithoutComment', getZodInterfaceTemplateWithoutComment],
    ['getZodApiOnlyTemplateWithComment', getZodApiOnlyTemplateWithComment],
    ['getZodApiOnlyTemplateWithoutComment', getZodApiOnlyTemplateWithoutComment],
  ];

  it('所有 isFormData 分支都应处理数组（File[] 逐个 append）', () => {
    for (const [name, getTemplate] of templatesWithFormDataBranch) {
      expect(getTemplate(), `${name} 缺少数组处理`).toContain('Array.isArray');
    }
  });

  it('所有 isFormData 分支都应跳过 null/undefined 可选字段', () => {
    for (const [name, getTemplate] of templatesWithFormDataBranch) {
      const template = getTemplate();
      expect(template, `${name} 缺少 null 判断`).toContain('=== null');
      expect(template, `${name} 缺少 undefined 判断`).toContain('=== undefined');
    }
  });

  it('所有 isFormData 分支都应 JSON.stringify 普通对象', () => {
    for (const [name, getTemplate] of templatesWithFormDataBranch) {
      expect(getTemplate(), `${name} 缺少对象序列化`).toContain('JSON.stringify');
    }
  });

  it('所有 isFormData 分支都不应再用裸 String() 强转兜底（"[object File]" 根因）', () => {
    for (const [name, getTemplate] of templatesWithFormDataBranch) {
      expect(getTemplate(), `${name} 仍含旧的三元强转`).not.toContain(
        'v instanceof File || v instanceof Blob ? v : String(v)',
      );
    }
  });
});

// ==================== ByConfig functions ====================

describe('ByConfig functions', () => {
  it('getInterfaceTemplateByConfig should return WithComment version for true', () => {
    const result = getInterfaceTemplateByConfig(true);
    expect(result).toBe(getInterfaceTemplateWithComment());
    expect(result).toContain('@description');
  });

  it('getInterfaceTemplateByConfig should return WithoutComment version for false', () => {
    const result = getInterfaceTemplateByConfig(false);
    expect(result).toBe(getInterfaceTemplateWithoutComment());
    expect(result).not.toContain('@description');
  });

  it('getApiOnlyTemplateByConfig should return WithComment version for true', () => {
    const result = getApiOnlyTemplateByConfig(true);
    expect(result).toBe(getApiOnlyTemplateWithComment());
    expect(result).toContain('@description');
  });

  it('getApiOnlyTemplateByConfig should return WithoutComment version for false', () => {
    const result = getApiOnlyTemplateByConfig(false);
    expect(result).toBe(getApiOnlyTemplateWithoutComment());
    expect(result).not.toContain('@description');
  });

  it('getTypeTemplateByConfig should return WithComment version for true', () => {
    const result = getTypeTemplateByConfig(true);
    expect(result).toBe(getTypeTemplateWithComment());
    expect(result).toContain('@description');
  });

  it('getTypeTemplateByConfig should return WithoutComment version for false', () => {
    const result = getTypeTemplateByConfig(false);
    expect(result).toBe(getTypeTemplateWithoutComment());
    expect(result).not.toContain('@description');
  });

  it('getZodInterfaceTemplateByConfig should return WithComment version for true', () => {
    const result = getZodInterfaceTemplateByConfig(true);
    expect(result).toBe(getZodInterfaceTemplateWithComment());
    expect(result).toContain('@description');
  });

  it('getZodInterfaceTemplateByConfig should return WithoutComment version for false', () => {
    const result = getZodInterfaceTemplateByConfig(false);
    expect(result).toBe(getZodInterfaceTemplateWithoutComment());
    expect(result).not.toContain('@description');
  });

  it('getZodApiOnlyTemplateByConfig should return WithComment version for true', () => {
    const result = getZodApiOnlyTemplateByConfig(true);
    expect(result).toBe(getZodApiOnlyTemplateWithComment());
    expect(result).toContain('@description');
  });

  it('getZodApiOnlyTemplateByConfig should return WithoutComment version for false', () => {
    const result = getZodApiOnlyTemplateByConfig(false);
    expect(result).toBe(getZodApiOnlyTemplateWithoutComment());
    expect(result).not.toContain('@description');
  });

  it('getZodTypesOnlyTemplateByConfig should return WithComment version for true', () => {
    const result = getZodTypesOnlyTemplateByConfig(true);
    expect(result).toBe(getZodTypesOnlyTemplateWithComment());
    expect(result).toContain('@description');
  });

  it('getZodTypesOnlyTemplateByConfig should return WithoutComment version for false', () => {
    const result = getZodTypesOnlyTemplateByConfig(false);
    expect(result).toBe(getZodTypesOnlyTemplateWithoutComment());
    expect(result).not.toContain('@description');
  });
});

// ==================== generatePrecompiledMethodMap ====================

describe('generatePrecompiledMethodMap', () => {
  it('should return a string containing METHOD_MAP', () => {
    const result = generatePrecompiledMethodMap();
    expect(result).toContain('METHOD_MAP');
  });

  it('should contain all HTTP method references', () => {
    const result = generatePrecompiledMethodMap('requestMethods');
    expect(result).toContain('requestMethods.get');
    expect(result).toContain('requestMethods.post');
    expect(result).toContain('requestMethods.put');
    expect(result).toContain('requestMethods.delete');
    expect(result).toContain('requestMethods.patch');
    expect(result).toContain('requestMethods.head');
    expect(result).toContain('requestMethods.options');
  });

  it('should use the default object name when no argument is provided', () => {
    const result = generatePrecompiledMethodMap();
    expect(result).toContain('requestMethods.get');
  });

  it('should use the custom object name when provided', () => {
    const result = generatePrecompiledMethodMap('customMethods');
    expect(result).toContain('customMethods.get');
    expect(result).toContain('customMethods.post');
    expect(result).not.toContain('requestMethods.get');
  });

  it('should include "as const" assertion', () => {
    const result = generatePrecompiledMethodMap();
    expect(result).toContain('as const');
  });
});

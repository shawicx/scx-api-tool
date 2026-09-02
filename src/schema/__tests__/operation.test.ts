/**
 * @description schema/operation.ts 单元测试
 * 覆盖请求体 content-type 优先级（multipart 优先）与 isFormDataRequest 判定，
 * 防止 content-type 排序导致 multipart 接口退化为 JSON 序列化。
 */

import { describe, it, expect } from 'vitest';
import { getRequestBodySchema, getRequestContentType, isFormDataRequest } from '../operation';
import type { OpenApiOperation } from '@/types';

// ==================== 测试数据工厂 ====================

/** 构造仅含 requestBody 的操作对象 */
function makeOperation(content?: Record<string, { schema?: unknown }>): OpenApiOperation {
  return {
    requestBody: content ? { content } : undefined,
  } as unknown as OpenApiOperation;
}

/** multipart 在首位 */
const multipartFirst = makeOperation({
  'multipart/form-data': { schema: { type: 'object' } },
});

/** application/json 在首位、multipart 在次位（复现排序不稳定的场景） */
const jsonFirstWithMultipart = makeOperation({
  'application/json': { schema: { type: 'object' } },
  'multipart/form-data': { schema: { type: 'object' } },
});

/** 仅 application/json */
const jsonOnly = makeOperation({
  'application/json': { schema: { type: 'object' } },
});

// ==================== getRequestContentType ====================

describe('getRequestContentType', () => {
  it('multipart 为唯一 content-type 时应返回 multipart/form-data', () => {
    expect(getRequestContentType(multipartFirst)).toBe('multipart/form-data');
  });

  it('multipart 不在首位时应优先返回 multipart（对齐 getRequestBodySchema 优先级）', () => {
    expect(getRequestContentType(jsonFirstWithMultipart)).toBe('multipart/form-data');
  });

  it('仅 application/json 时应返回 application/json', () => {
    expect(getRequestContentType(jsonOnly)).toBe('application/json');
  });

  it('无 requestBody 时应返回 null', () => {
    expect(getRequestContentType(makeOperation())).toBeNull();
  });
});

// ==================== isFormDataRequest ====================

describe('isFormDataRequest', () => {
  it('multipart 在首位时应返回 true', () => {
    expect(isFormDataRequest(multipartFirst)).toBe(true);
  });

  it('application/json 在首位但含 multipart 时仍应返回 true', () => {
    expect(isFormDataRequest(jsonFirstWithMultipart)).toBe(true);
  });

  it('仅 application/json 时应返回 false', () => {
    expect(isFormDataRequest(jsonOnly)).toBe(false);
  });

  it('无 requestBody 时应返回 false', () => {
    expect(isFormDataRequest(makeOperation())).toBe(false);
  });
});

// ==================== getRequestBodySchema（锁定既有优先级行为） ====================

describe('getRequestBodySchema 优先级', () => {
  it('multipart 不在首位时应优先取 multipart 的 schema', () => {
    const result = getRequestBodySchema(jsonFirstWithMultipart);
    expect(result).not.toBeNull();
    expect(result?.schema).toEqual({ type: 'object' });
  });
});

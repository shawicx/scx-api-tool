/**
 * @description utils/httpMethod.ts 测试
 * 覆盖 OpenAPI Path Item HTTP 方法白名单的判定逻辑
 */

import { describe, it, expect } from 'vitest';
import { HTTP_METHODS, isHttpMethod } from '../httpMethod';

describe('isHttpMethod', () => {
  it('OpenAPI 3.x 的 8 种操作方法（小写）均应返回 true', () => {
    for (const method of ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace']) {
      expect(isHttpMethod(method)).toBe(true);
    }
  });

  it('大写/混合大小写应返回 true（兼容非规范文档）', () => {
    expect(isHttpMethod('GET')).toBe(true);
    expect(isHttpMethod('Post')).toBe(true);
    expect(isHttpMethod('PATCH')).toBe(true);
  });

  it('Path Item 的非操作字段应返回 false', () => {
    for (const key of [
      'parameters',
      '$ref',
      'summary',
      'description',
      'servers',
      'operationId',
      'deprecated',
    ]) {
      expect(isHttpMethod(key)).toBe(false);
    }
  });
});

describe('HTTP_METHODS', () => {
  it('应恰好包含 8 种小写 HTTP 方法', () => {
    expect(HTTP_METHODS.size).toBe(8);
    expect([...HTTP_METHODS]).toEqual([
      'get',
      'put',
      'post',
      'delete',
      'options',
      'head',
      'patch',
      'trace',
    ]);
  });
});

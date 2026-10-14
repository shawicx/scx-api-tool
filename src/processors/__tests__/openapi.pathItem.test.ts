/**
 * @description processOpenApiData 的 Path Item 非操作字段过滤测试
 * OpenAPI Path Item 除 get/post 等操作外还允许 $ref、summary、description、
 * servers、parameters（路径级公共参数）等字段，验证这些字段不会被误识别为接口
 */

import { describe, it, expect, vi } from 'vitest';
import { processOpenApiData } from '../openapi';
import { minimalApiConfig } from '../../../tests/fixtures/mockData';

// Mock 统一 logger 模块（抑制日志噪音）
vi.mock('@/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
  setDebugEnabled: vi.fn(),
  isDebugEnabled: vi.fn(() => false),
}));

// Mock sanitizeTypeName to return predictable names for testing
vi.mock('@/naming', () => ({
  sanitizeTypeName: vi.fn((name: string) => name),
}));

describe('processOpenApiData - Path Item 非操作字段过滤', () => {
  it('summary/description/servers/parameters 等 Path Item 级字段不应产生接口', () => {
    const doc = {
      openapi: '3.0.0',
      paths: {
        '/users': {
          summary: '用户相关接口',
          description: '用户模块的公共说明',
          servers: [{ url: 'https://api.example.com' }],
          parameters: [{ name: 'traceId', in: 'header', type: 'string' }],
          get: {
            summary: '获取用户列表',
            responses: { '200': { description: '成功' } },
          },
        },
      },
    } as any;

    const result = processOpenApiData(doc, minimalApiConfig);

    expect(result.interfaces).toHaveLength(1);
    expect(result.interfaces[0].method).toBe('get');
    expect(result.interfaces.map((i) => i.method)).not.toContain('summary');
    expect(result.interfaces.map((i) => i.method)).not.toContain('description');
    expect(result.interfaces.map((i) => i.method)).not.toContain('servers');
    expect(result.interfaces.map((i) => i.method)).not.toContain('parameters');
  });

  it('仅含 $ref 的 Path Item 不应产生任何接口', () => {
    const doc = {
      openapi: '3.0.0',
      paths: {
        '/common': {
          $ref: '#/components/pathItems/CommonPath',
        },
        '/health': {
          get: { summary: '健康检查', responses: { '200': { description: '成功' } } },
        },
      },
    } as any;

    const result = processOpenApiData(doc, minimalApiConfig);

    expect(result.interfaces).toHaveLength(1);
    expect(result.interfaces[0].path).toBe('/health');
    expect(result.interfaces[0].method).toBe('get');
  });

  it('OpenAPI 3.x 的 8 种 HTTP 方法均应被识别为接口', () => {
    const methods = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];
    const pathItem: Record<string, unknown> = {
      summary: '全方法路径',
      parameters: [],
    };
    for (const m of methods) {
      pathItem[m] = {
        summary: `${m} 操作`,
        responses: { '200': { description: '成功' } },
      };
    }
    const doc = { openapi: '3.0.0', paths: { '/all': pathItem } } as any;

    const result = processOpenApiData(doc, minimalApiConfig);

    expect(result.interfaces).toHaveLength(8);
    expect(result.interfaces.map((i) => i.method).toSorted()).toEqual([...methods].toSorted());
  });

  it('路径级公共参数与操作并存时应保留操作数据原样', () => {
    const doc = {
      openapi: '3.0.0',
      paths: {
        '/orders/{orderId}': {
          parameters: [{ name: 'orderId', in: 'path', required: true, type: 'string' }],
          get: {
            summary: '查询订单',
            parameters: [{ name: 'verbose', in: 'query', type: 'boolean' }],
            responses: { '200': { description: '成功' } },
          },
          delete: {
            summary: '删除订单',
            responses: { '204': { description: '已删除' } },
          },
        },
      },
    } as any;

    const result = processOpenApiData(doc, minimalApiConfig);

    expect(result.interfaces).toHaveLength(2);
    const getOp = result.interfaces.find((i) => i.method === 'get');
    expect(getOp!.operation.parameters).toHaveLength(1);
    expect(getOp!.operation.parameters![0].name).toBe('verbose');
    // 路径级公共参数不应被混入操作接口（当前不做合并，仅确保不误识别）
    expect(result.interfaces.some((i) => i.method === 'parameters')).toBe(false);
  });
});

/**
 * @description ClientRegistry 单元测试
 * 覆盖 register/unregister/clear/size/autoSelectClient/getClient
 *
 * 关键设计：使用独立 ClientRegistry 实例（不污染全局 clientRegistry 单例）。
 * TestClient 继承 BaseClient，通过 supportsFlag 控制 supports() 返回值。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClientRegistry } from '../registry';
import type { ApiConfig, OpenApiDocument } from '@/types';
import { BaseClient } from '../BaseClient';
import { minimalApiConfig } from '../../../../tests/fixtures/mockData';

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

/**
 * @description 测试用 BaseClient 子类
 * 通过 supportsFlag 控制是否支持某配置
 */
class TestClient extends BaseClient {
  constructor(private readonly supportsFlag: boolean) {
    super();
  }
  getMetadata() {
    return {
      type: 'test',
      name: 'TestClient',
      version: '1.0.0',
      urlPatterns: [/test/],
    };
  }
  supports(_config: ApiConfig) {
    return this.supportsFlag;
  }
  protected normalize(_rawData: unknown): OpenApiDocument {
    return { openapi: '3.0.0', info: { title: 'test', version: '1.0.0' } };
  }
  protected fetchDataInternal(_config: ApiConfig): Promise<unknown> {
    return Promise.resolve({});
  }
}

describe('ClientRegistry', () => {
  let registry: ClientRegistry;

  beforeEach(() => {
    registry = new ClientRegistry();
    vi.clearAllMocks();
    delete process.env.DEBUG;
  });

  describe('register', () => {
    it('重复注册同一 type 应抛错', () => {
      registry.register('test', () => new TestClient(true) as any);
      expect(() => registry.register('test', () => new TestClient(true) as any)).toThrow(
        '客户端类型 "test" 已注册',
      );
    });

    it('注册后应可通过 getRegisteredTypes 查询', () => {
      registry.register('test', () => new TestClient(true) as any);
      expect(registry.getRegisteredTypes()).toEqual(['test']);
    });
  });

  describe('getClient', () => {
    it('获取未注册的 type 应抛错', () => {
      expect(() => registry.getClient('unknown')).toThrow();
    });

    it('获取已注册的 type 应返回实例', () => {
      registry.register('test', () => new TestClient(true) as any);
      const client = registry.getClient<BaseClient>('test');
      expect(client).toBeInstanceOf(BaseClient);
    });
  });

  describe('unregister', () => {
    it('unregister 后 getClient 应抛错', () => {
      registry.register('test', () => new TestClient(true) as any);
      registry.unregister('test');
      expect(() => registry.getClient('test')).toThrow();
      expect(registry.getRegisteredTypes()).toEqual([]);
    });
  });

  describe('clear / size', () => {
    it('clear 后 size===0 且 getRegisteredTypes 为空', () => {
      registry.register('a', () => new TestClient(true) as any);
      registry.register('b', () => new TestClient(true) as any);
      expect(registry.size).toBe(2);
      registry.clear();
      expect(registry.size).toBe(0);
      expect(registry.getRegisteredTypes()).toEqual([]);
    });

    it('size getter 应返回当前注册数', () => {
      expect(registry.size).toBe(0);
      registry.register('a', () => new TestClient(true) as any);
      expect(registry.size).toBe(1);
    });
  });

  describe('autoSelectClient', () => {
    it('serverType 精确匹配且 supports=true 应返回该客户端', () => {
      registry.register('test', () => new TestClient(true) as any);
      const client = registry.autoSelectClient({
        ...minimalApiConfig,
        serverType: 'test' as any,
      });
      expect(client).toBeInstanceOf(BaseClient);
    });

    it('无精确匹配时按优先级降序遍历，返回第一个 supports=true 的', () => {
      registry.register('low', () => new TestClient(false) as any, 1);
      registry.register('high', () => new TestClient(true) as any, 10);
      registry.register('mid', () => new TestClient(true) as any, 5);
      const client = registry.autoSelectClient({
        ...minimalApiConfig,
        serverType: 'nonexistent' as any,
      });
      expect(client).toBeInstanceOf(BaseClient);
      expect(client.supports(minimalApiConfig)).toBe(true);
    });

    it('所有客户端均不支持应抛错', () => {
      registry.register('a', () => new TestClient(false) as any);
      expect(() =>
        registry.autoSelectClient({ ...minimalApiConfig, serverType: 'nonexistent' as any }),
      ).toThrow();
    });
  });
});

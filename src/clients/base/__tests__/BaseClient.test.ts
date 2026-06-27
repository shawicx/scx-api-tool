/**
 * @description BaseClient 单元测试
 * 重点验证 wrapError 不再调用不存在的 ErrorFactory.fetchError（P0 回归），
 * 以及重试、超时等通用行为
 */

import { describe, it, expect, vi } from 'vitest';
import { BaseClient } from '../BaseClient';
import type { ClientMetadata, ClientOptions } from '../BaseClient';
import type { ApiConfig } from '@/types';
import type { OpenApiDocument } from '@/types';
import { FetchError } from '@/errors/errorClasses';
import { apifoxApiConfig } from '../../../../tests/fixtures/mockData';

/** TestClient 支持的配置（覆盖 serverType 以通过 supports() 检查） */
const testConfig: ApiConfig = { ...apifoxApiConfig, serverType: 'test' as any };

/**
 * @description 用于测试的 BaseClient 子类
 * 将 protected 方法暴露为 public 以便测试
 */
class TestClient extends BaseClient {
  // 可注入的内部获取逻辑，用于模拟成功/失败
  fetchImpl: (config: ApiConfig) => Promise<unknown> = async () => ({ ok: true });

  getMetadata(): ClientMetadata {
    return {
      type: 'test',
      name: 'TestClient',
      version: '1.0.0',
      urlPatterns: [/test\.example\.com/],
    };
  }

  supports(config: ApiConfig): boolean {
    return String(config.serverType) === 'test';
  }

  protected normalize(rawData: unknown): OpenApiDocument {
    return rawData as OpenApiDocument;
  }

  protected async fetchDataInternal(config: ApiConfig): Promise<unknown> {
    return this.fetchImpl(config);
  }

  // 暴露 protected 方法用于测试
  publicWrapError(error: unknown, config: ApiConfig): Error {
    return this.wrapError(error, config);
  }

  async publicExecuteWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    return this.executeWithRetry(fn);
  }
}

describe('BaseClient.wrapError', () => {
  it('非 FetchError 应被包装为 FetchError 而非抛出 TypeError（P0 回归）', () => {
    const client = new TestClient();
    const rawError = new Error('网络连接失败');

    // 修复前：wrapError 调用不存在的 ErrorFactory.fetchError 会抛 TypeError
    const wrapped = client.publicWrapError(rawError, apifoxApiConfig);

    expect(wrapped).toBeInstanceOf(FetchError);
    expect(wrapped.message).not.toContain('fetchError');
    // 应保留原始错误上下文
    expect((wrapped as FetchError).originalError).toBe(rawError);
  });

  it('原始错误非 Error 实例时应包装为 Error 而不崩溃', () => {
    const client = new TestClient();
    const wrapped = client.publicWrapError('字符串错误', apifoxApiConfig);

    expect(wrapped).toBeInstanceOf(FetchError);
  });

  it('已是 FetchError 的错误应原样返回，不重复包装', () => {
    const client = new TestClient();
    // FetchError.name 是 'FetchError'（构造函数中 this.name = constructor.name）
    const fetchError = new FetchError('已包装的错误', [{ title: 't', steps: ['s'] }]);

    const wrapped = client.publicWrapError(fetchError, apifoxApiConfig);

    expect(wrapped).toBe(fetchError);
  });
});

describe('BaseClient.executeWithRetry', () => {
  it('成功时不应重试', async () => {
    const client = new TestClient({ maxRetries: 3, retryDelay: 10 });
    const fn = vi.fn().mockResolvedValue('success');

    const result = await client.publicExecuteWithRetry(fn);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('失败时应按 maxRetries 重试', async () => {
    const client = new TestClient({ maxRetries: 2, retryDelay: 10 });
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('失败1'))
      .mockRejectedValueOnce(new Error('失败2'))
      .mockResolvedValueOnce('success');

    const result = await client.publicExecuteWithRetry(fn);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('所有重试均失败时应抛出最后一个错误', async () => {
    const client = new TestClient({ maxRetries: 2, retryDelay: 10 });
    const fn = vi.fn().mockRejectedValue(new Error('持续失败'));

    await expect(client.publicExecuteWithRetry(fn)).rejects.toThrow('持续失败');
    // 初次 + 2 次重试 = 3 次
    expect(fn).toHaveBeenCalledTimes(3);
  });
});

describe('BaseClient.fetch', () => {
  it('成功时应返回 FetchResult', async () => {
    const client = new TestClient();
    client.fetchImpl = async () => ({ data: 'test-data' });

    const result = await client.fetch(testConfig);

    expect(result.sourceType).toBe('test');
    expect(result.timestamp).toBeGreaterThan(0);
    expect(result.data).toEqual({ data: 'test-data' });
  });

  it('内部获取失败且非 FetchError 时，应包装为 FetchError 而非 TypeError（P0 回归）', async () => {
    const client = new TestClient({ maxRetries: 0 });
    client.fetchImpl = async () => {
      throw new Error('底层网络错误');
    };

    // 修复前：会抛 "ErrorFactory.fetchError is not a function"
    await expect(client.fetch(testConfig)).rejects.toThrow();
    await expect(client.fetch(testConfig)).rejects.toBeInstanceOf(FetchError);
  });
});

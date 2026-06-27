/**
 * @description 客户端注册器
 * 管理所有 API 客户端的注册和查找
 */

import type { ApiConfig } from '@/types';
import { BaseClient, ClientMetadata } from './BaseClient';
import { ErrorFactory } from '@/errors';

/**
 * @description 客户端工厂函数类型
 */
type ClientFactory<T extends BaseClient = BaseClient> = (options?: ClientOptions) => T;

/**
 * @description 客户端配置选项（从 BaseClient 导入）
 */
type ClientOptions = import('./BaseClient').ClientOptions;

/**
 * @description 注册的客户端信息
 */
interface RegisteredClient {
  /** 客户端类型标识 */
  type: string;
  /** 工厂函数 */
  factory: ClientFactory;
  /** 优先级（数字越大优先级越高） */
  priority: number;
}

/**
 * @description 客户端注册器类
 */
export class ClientRegistry {
  private registeredClients = new Map<string, RegisteredClient>();

  /**
   * @description 注册客户端
   * @param type 客户端类型
   * @param factory 客户端工厂函数
   * @param priority 优先级（默认 0）
   */
  register<T extends BaseClient>(type: string, factory: ClientFactory<T>, priority = 0): void {
    if (this.registeredClients.has(type)) {
      throw new Error(`客户端类型 "${type}" 已注册`);
    }

    this.registeredClients.set(type, { type, factory, priority });
  }

  /**
   * @description 注销客户端
   * @param type 客户端类型
   */
  unregister(type: string): void {
    this.registeredClients.delete(type);
  }

  /**
   * @description 获取指定类型的客户端实例
   * @param type 客户端类型
   * @returns 客户端实例
   */
  getClient<T extends BaseClient = BaseClient>(type: string): T {
    const registered = this.registeredClients.get(type);
    if (!registered) {
      throw ErrorFactory.configInvalid(`未注册的客户端类型: ${type}`, [
        {
          title: '可用客户端类型',
          steps: this.getRegisteredTypes(),
        },
      ]);
    }

    return registered.factory() as T;
  }

  /**
   * @description 根据配置自动选择合适的客户端
   * @param config API 配置
   * @returns 匹配的客户端实例
   */
  autoSelectClient(config: ApiConfig): BaseClient {
    // 首先根据 serverType 精确匹配
    if (config.serverType) {
      const client = this.getClientByType(config.serverType);
      if (client && client.supports(config)) {
        return client;
      }
    }

    // 如果没有精确匹配，则根据优先级遍历所有客户端（priority 存于 RegisteredClient，非 BaseClient）
    const registered = Array.from(this.registeredClients.values()).sort(
      (a, b) => b.priority - a.priority,
    ); // 按优先级降序排列

    for (const entry of registered) {
      const client = entry.factory();
      if (client.supports(config)) {
        return client;
      }
    }

    // 没有找到合适的客户端
    throw ErrorFactory.configInvalid(`无法找到适合当前配置的客户端`, [
      {
        title: '已注册的客户端类型',
        steps: this.getRegisteredTypes(),
      },
    ]);
  }

  /**
   * @description 根据类型获取客户端
   * @param type 客户端类型
   * @returns 客户端实例或 null
   */
  private getClientByType(type: string): BaseClient | null {
    try {
      return this.getClient(type);
    } catch {
      return null;
    }
  }

  /**
   * @description 获取所有已注册的客户端实例
   * @returns 客户端实例数组
   */
  private getAllClients(): BaseClient[] {
    return Array.from(this.registeredClients.values()).map((registered) => registered.factory());
  }

  /**
   * @description 获取所有已注册的类型
   * @returns 类型数组
   */
  getRegisteredTypes(): string[] {
    return Array.from(this.registeredClients.keys());
  }

  /**
   * @description 获取所有客户端的元信息
   * @returns 客户端元信息数组
   */
  getAllMetadata(): ClientMetadata[] {
    return this.getAllClients().map((client) => client.getMetadata());
  }

  /**
   * @description 清除所有注册的客户端
   */
  clear(): void {
    this.registeredClients.clear();
  }

  /**
   * @description 获取已注册客户端数量
   */
  get size(): number {
    return this.registeredClients.size;
  }
}

// 全局客户端注册器实例
export const clientRegistry = new ClientRegistry();

/**
 * @description 进度管理器 - 统一的进度显示接口
 */

import { CIAdapter } from './adapters';
import {
  ProgressAdapter,
  ProgressInstance,
  ProgressOptions,
  StepProgressOptions,
  NetworkProgressOptions,
  ProgressConfig,
} from './types';

class ProgressManager {
  private adapter: ProgressAdapter | null = null;
  private config: ProgressConfig;
  private activeInstances: Set<ProgressInstance> = new Set();

  constructor(config: Partial<ProgressConfig> = {}) {
    this.config = {
      enabled: true,
      style: 'detailed',
      updateFrequency: 100, // 100ms throttle
      ...config,
    };

    // 始终使用CIAdapter，提供简单的文本进度显示
    this.adapter = new CIAdapter();
  }

  /**
   * 获取当前使用的适配器
   */
  getAdapter(): ProgressAdapter {
    if (!this.adapter) {
      throw new Error('Progress adapter not initialized');
    }
    return this.adapter;
  }

  /**
   * 检查是否启用进度显示
   */
  isEnabled(): boolean {
    return this.config.enabled && this.adapter !== null;
  }

  /**
   * 创建加载动画
   */
  createSpinner(message: string): ProgressInstance | null {
    if (!this.isEnabled()) return null;

    const instance = this.getAdapter().createSpinner(message);
    this.activeInstances.add(instance);

    return {
      update: (value: string | number) => {
        instance.update(value);
      },
      complete: (finalMessage?: string) => {
        instance.complete(finalMessage);
        this.activeInstances.delete(instance);
      },
      fail: (error: Error | string) => {
        instance.fail(error);
        this.activeInstances.delete(instance);
      },
      stop: () => {
        instance.stop();
        this.activeInstances.delete(instance);
      },
    };
  }

  /**
   * 创建进度条
   */
  createProgressBar(options: ProgressOptions): ProgressInstance | null {
    if (!this.isEnabled()) return null;

    const instance = this.getAdapter().createProgressBar(options);
    this.activeInstances.add(instance);

    return {
      update: (value: string | number) => {
        instance.update(value);
      },
      complete: (message?: string) => {
        instance.complete(message);
        this.activeInstances.delete(instance);
      },
      fail: (error: Error | string) => {
        instance.fail(error);
        this.activeInstances.delete(instance);
      },
      stop: () => {
        instance.stop();
        this.activeInstances.delete(instance);
      },
    };
  }

  /**
   * 创建多步骤进度
   */
  createStepProgress(options: StepProgressOptions): ProgressInstance | null {
    if (!this.isEnabled()) return null;

    const instance = this.getAdapter().createStepProgress(options);
    this.activeInstances.add(instance);

    return {
      update: (value: string | number) => {
        instance.update(value);
      },
      complete: (message?: string) => {
        instance.complete(message);
        this.activeInstances.delete(instance);
      },
      fail: (error: Error | string) => {
        instance.fail(error);
        this.activeInstances.delete(instance);
      },
      stop: () => {
        instance.stop();
        this.activeInstances.delete(instance);
      },
    };
  }

  /**
   * 创建网络请求进度
   */
  createNetworkProgress(options: NetworkProgressOptions): ProgressInstance | null {
    if (!this.isEnabled()) return null;

    const instance = this.getAdapter().createNetworkProgress(options);
    this.activeInstances.add(instance);

    return {
      update: (value: string | number) => {
        instance.update(value);
      },
      complete: (message?: string) => {
        instance.complete(message);
        this.activeInstances.delete(instance);
      },
      fail: (error: Error | string) => {
        instance.fail(error);
        this.activeInstances.delete(instance);
      },
      stop: () => {
        instance.stop();
        this.activeInstances.delete(instance);
      },
    };
  }

  /**
   * 执行带进度显示的分组操作
   */
  async group<T>(title: string, fn: () => Promise<T>): Promise<T> {
    if (!this.isEnabled()) {
      return await fn();
    }

    return await this.getAdapter().group(title, fn);
  }

  /**
   * 显示文本消息
   */
  text(message: string): void {
    if (!this.isEnabled()) return;
    this.getAdapter().text(message);
  }

  /**
   * 显示成功消息
   */
  success(message: string): void {
    if (!this.isEnabled()) return;
    this.getAdapter().success(message);
  }

  /**
   * 显示错误消息
   */
  error(message: string): void {
    if (!this.isEnabled()) return;
    this.getAdapter().error(message);
  }

  /**
   * 显示警告消息
   */
  warning(message: string): void {
    if (!this.isEnabled()) return;
    this.getAdapter().warning(message);
  }

  /**
   * 显示信息消息
   */
  info(message: string): void {
    if (!this.isEnabled()) return;
    this.getAdapter().info(message);
  }

  /**
   * 停止所有活动的进度实例
   */
  stopAll(): void {
    for (const instance of this.activeInstances) {
      try {
        instance.stop();
      } catch {
        // Ignore cleanup errors
      }
    }
    this.activeInstances.clear();
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<ProgressConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Re-initialize adapter if needed
    if (newConfig.forceSimple !== undefined || newConfig.enabled !== undefined) {
      this.stopAll();
      this.initializeAdapter();
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): ProgressConfig {
    return { ...this.config };
  }
}

// 创建全局默认实例
let defaultProgressManager: ProgressManager | null = null;

/**
 * 获取或创建默认进度管理器实例
 */
export function getProgressManager(config?: Partial<ProgressConfig>): ProgressManager {
  if (!defaultProgressManager) {
    defaultProgressManager = new ProgressManager(config);
  } else if (config) {
    defaultProgressManager.updateConfig(config);
  }

  return defaultProgressManager;
}

/**
 * 重置默认进度管理器
 */
export function resetProgressManager(): void {
  if (defaultProgressManager) {
    defaultProgressManager.stopAll();
    defaultProgressManager = null;
  }
}

export { ProgressManager };

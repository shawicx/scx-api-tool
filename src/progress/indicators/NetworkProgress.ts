/**
 * @description 网络请求进度指示器 - 处理 HTTP 请求进度
 */

import { getProgressManager, ProgressInstance } from '../ProgressManager';
import { NetworkProgressOptions } from '../types';

export interface NetworkRequestOptions extends NetworkProgressOptions {
  method?: string;
  headers?: Record<string, string>;
  data?: any;
  timeout?: number;
  retries?: number;
  onConnecting?: () => void;
  onSending?: () => void;
  onReceiving?: (loaded?: number, total?: number) => void;
  onComplete?: (response: any) => void;
  onError?: (error: Error) => void;
}

export class NetworkProgress {
  private progressManager = getProgressManager();
  private spinner: ProgressInstance | null = null;
  private options: NetworkRequestOptions;
  private startTime = 0;
  private stages = {
    connecting: '连接服务器',
    sending: '发送请求',
    receiving: '接收数据',
    processing: '处理响应',
    complete: '请求完成',
    error: '请求失败',
  };
  private currentStage = this.stages.connecting;
  private bytesLoaded = 0;
  private bytesTotal = 0;

  constructor(options: NetworkRequestOptions) {
    this.options = {
      timeout: 30000, // 30秒默认超时
      retries: 0,
      ...options,
    };
  }

  /**
   * 开始网络请求
   */
  start(): void {
    this.startTime = Date.now();

    // 创建 spinner，不使用 createNetworkProgress 避免循环调用
    this.spinner = this.progressManager.createSpinner('网络请求');

    // 开始连接阶段
    this.updateStage(this.stages.connecting);
  }

  /**
   * 更新请求阶段
   */
  updateStage(stage: string, details?: string): void {
    this.currentStage = stage;

    const elapsed = Date.now() - this.startTime;
    let message = this.stages[stage] || stage;

    if (this.options.url) {
      try {
        const urlPath = new URL(this.options.url).pathname;
        message += ` (${this.options.method || 'GET'} ${urlPath})`;
      } catch {
        message += ` (${this.options.method || 'GET'} ${this.options.url})`;
      }
    }

    if (details) {
      message += ` - ${details}`;
    }

    message += ` [耗时: ${this.formatTime(elapsed)}]`;

    // 更新 spinner
    if (this.spinner) {
      this.spinner.update(message);
    }

    // 调用相应的回调
    switch (stage) {
      case this.stages.connecting:
        if (this.options.onConnecting) {
          this.options.onConnecting();
        }
        break;
      case this.stages.sending:
        if (this.options.onSending) {
          this.options.onSending();
        }
        break;
      case this.stages.receiving:
        if (this.options.onReceiving) {
          this.options.onReceiving(this.bytesLoaded, this.bytesTotal);
        }
        break;
      default:
        // No action needed for other stages
        break;
    }
  }

  /**
   * 更新下载进度
   */
  updateProgress(loaded: number, total?: number): void {
    this.bytesLoaded = loaded;
    if (total !== undefined) {
      this.bytesTotal = total;
    }

    // 只在接收阶段更新进度并调用回调
    if (this.currentStage === this.stages.receiving) {
      if (this.options.onReceiving) {
        this.options.onReceiving(loaded, total);
      }
    }
  }

  /**
   * 完成请求
   */
  complete(response?: any): void {
    // 停止 spinner
    if (this.spinner) {
      const duration = Date.now() - this.startTime;
      const stats = this.getRequestStats();
      const completionMessage = `网络请求完成 - ${stats} (耗时: ${Math.round(duration)}ms)`;
      this.spinner.complete(completionMessage);
      this.spinner = null;
    }

    if (this.options.onComplete) {
      this.options.onComplete(response);
    }

    // 网络请求统计信息已包含在步骤进度中，这里不重复输出
  }

  /**
   * 请求失败
   */
  fail(error: Error | string): void {
    this.updateStage(this.stages.error);

    const errorObj = error instanceof Error ? error : new Error(error);

    // 停止 spinner
    if (this.spinner) {
      this.spinner.fail(errorObj);
      this.spinner = null;
    }

    if (this.options.onError) {
      this.options.onError(errorObj);
    }

    // 显示错误详情
    const duration = Date.now() - this.startTime;
    const urlInfo = this.getDisplayUrl();
    getProgressManager().error(
      `网络请求失败: ${this.options.method || 'GET'} ${urlInfo} - ${errorObj.message} (耗时: ${Math.round(duration)}ms)`,
    );
  }

  /**
   * 停止进度显示
   */
  stop(): void {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }

  /**
   * 获取当前请求阶段
   */
  getCurrentStage(): string {
    return this.currentStage;
  }

  /**
   * 获取请求统计信息
   */
  getRequestStats(): string {
    const duration = Date.now() - this.startTime;
    const stats: string[] = [];

    if (this.bytesTotal > 0) {
      const speed = this.bytesTotal / (duration / 1000); // bytes per second
      stats.push(`大小: ${this.formatBytes(this.bytesTotal)}`);
      stats.push(`速度: ${this.formatBytes(speed)}/s`);
    }

    if (this.bytesLoaded > 0 && this.bytesTotal > 0) {
      const percentage = Math.round((this.bytesLoaded / this.bytesTotal) * 100);
      stats.push(`进度: ${percentage}%`);
    }

    return stats.join(', ');
  }

  /**
   * 格式化进度消息
   */
  private formatProgressMessage(loaded: number, total?: number): string {
    if (total) {
      const percentage = Math.round((loaded / total) * 100);
      return `${this.formatBytes(loaded)}/${this.formatBytes(total)} (${percentage}%)`;
    } else {
      return `${this.formatBytes(loaded)}`;
    }
  }

  /**
   * 格式化完成消息
   */
  private formatCompletionMessage(): string {
    const stats = this.getRequestStats();
    const baseMessage = '请求成功';

    if (stats) {
      return `${baseMessage} - ${stats}`;
    }

    return baseMessage;
  }

  /**
   * 格式化字节数
   */
  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * 格式化时间显示
   */
  private formatTime(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    }

    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) {
      return `${seconds}s`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (remainingSeconds === 0) {
      return `${minutes}m`;
    }

    return `${minutes}m ${remainingSeconds}s`;
  }

  /**
   * 重置状态
   */
  reset(): void {
    this.currentStage = this.stages.connecting;
    this.bytesLoaded = 0;
    this.bytesTotal = 0;
    this.startTime = 0;

    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }

  private getDisplayUrl(): string {
    if (!this.options.url) return '';

    try {
      const url = new URL(this.options.url);
      return url.pathname + url.search;
    } catch {
      return this.options.url;
    }
  }
}

/**
 * 便捷函数：创建网络请求进度
 */
export function createNetworkProgress(options: NetworkRequestOptions): NetworkProgress {
  return new NetworkProgress(options);
}

/**
 * 便捷函数：包装 HTTP 请求并显示进度
 */
export async function makeRequestWithProgress<T>(
  requestFn: (onProgress?: (loaded: number, total?: number) => void) => Promise<T>,
  options: NetworkRequestOptions,
): Promise<T> {
  const progress = createNetworkProgress(options);

  try {
    progress.start();

    // 开始发送请求
    progress.updateStage('sending');

    // 执行请求
    const result = await requestFn((loaded, total) => {
      progress.updateStage('receiving');
      progress.updateProgress(loaded, total);
    });

    // 完成请求
    progress.complete(result);

    return result;
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    progress.fail(errorObj);
    throw errorObj;
  }
}

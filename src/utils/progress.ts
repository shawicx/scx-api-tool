/**
 * @description 轻量级进度显示模块
 */

import consola from 'consola';

/**
 * 多步骤进度类
 */
export class SimpleProgress {
  private currentStep = 0;
  private stepStartTimes: number[] = [];
  private startTime: number;

  constructor(private steps: Array<{ title: string; status: string }>) {
    this.startTime = Date.now();
    this.stepStartTimes = new Array(steps.length).fill(0);
  }

  /**
   * 开始执行指定步骤
   */
  startStep(stepIndex: number): void {
    if (stepIndex < 0 || stepIndex >= this.steps.length) {
      return;
    }

    const step = this.steps[stepIndex];
    this.currentStep = stepIndex;
    this.stepStartTimes[stepIndex] = Date.now();
    step.status = 'loading';

    if (process.env.DEBUG) {
      consola.info(`步骤 ${stepIndex + 1}/${this.steps.length}: ${step.title}`);
    }
  }

  /**
   * 完成当前步骤
   */
  completeCurrentStep(description?: string): void {
    if (this.currentStep < 0 || this.currentStep >= this.steps.length) {
      return;
    }

    const step = this.steps[this.currentStep];
    const stepStartTime = this.stepStartTimes[this.currentStep];
    const duration = Date.now() - stepStartTime;

    step.status = 'success';

    if (description || process.env.DEBUG) {
      const msg = description || step.title;
      consola.success(
        `步骤 ${this.currentStep + 1}/${this.steps.length} 完成: ${msg} (${Math.round(duration)}ms)`,
      );
    }

    // 移动到下一步
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
    }
  }

  /**
   * 完成所有步骤
   */
  complete(message?: string): void {
    const totalDuration = Date.now() - this.startTime;
    const finalMessage = message || '所有步骤完成';
    consola.success(`${finalMessage} (总耗时: ${formatTime(totalDuration)})`);
  }

  /**
   * 当前步骤失败
   */
  failCurrentStep(error: Error | string): void {
    if (this.currentStep < 0 || this.currentStep >= this.steps.length) {
      return;
    }

    const step = this.steps[this.currentStep];
    step.status = 'error';

    const errorMsg = error instanceof Error ? error.message : error;
    consola.error(
      `步骤 ${this.currentStep + 1}/${this.steps.length} 失败: ${step.title} - ${errorMsg}`,
    );
  }

  /**
   * 停止进度显示
   */
  stop(): void {
    // Cleanup not needed for simple implementation
  }
}

/**
 * 便捷函数：创建并启动多步骤进度
 */
export function createMultiStepProgress(options: {
  title?: string;
  steps: Array<{ title: string; status: string }>;
}): SimpleProgress {
  const progress = new SimpleProgress(options.steps);

  if (options.title && process.env.DEBUG) {
    consola.info(options.title);
  }

  return progress;
}

/**
 * 格式化时间显示
 */
function formatTime(ms: number): string {
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
 * 带进度的网络请求
 */
export async function makeRequestWithProgress<T>(
  requestFn: (onProgress?: (loaded: number, total?: number) => void) => Promise<T>,
  options: {
    url: string;
    method?: string;
    timeout?: number;
  },
): Promise<T> {
  const { url, method = 'GET' } = options;
  const startTime = Date.now();

  if (process.env.DEBUG) {
    consola.info(`网络请求: ${method} ${url}`);
  }

  try {
    const result = await requestFn((loaded, total) => {
      if (process.env.DEBUG && total) {
        const percentage = Math.round((loaded / total) * 100);
        const elapsed = Date.now() - startTime;
        consola.info(`下载进度: ${percentage}% (${formatTime(elapsed)})`);
      }
    });

    const duration = Date.now() - startTime;
    consola.success(`请求完成: ${method} ${url} (${formatTime(duration)})`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : String(error);
    consola.error(`请求失败: ${method} ${url} (${formatTime(duration)}) - ${errorMsg}`);
    throw error;
  }
}

/**
 * 简单的进度管理器（替代复杂的 ProgressManager）
 */
class SimpleProgressManager {
  info(message: string, ...args: any[]): void {
    consola.info(message, ...args);
  }

  success(message: string, ...args: any[]): void {
    consola.success(message, ...args);
  }

  error(message: string, ...args: any[]): void {
    consola.error(message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    consola.warn(message, ...args);
  }
}

// 全局实例
let defaultManager: SimpleProgressManager | null = null;

/**
 * 获取进度管理器实例
 */
export function getProgressManager(): SimpleProgressManager {
  if (!defaultManager) {
    defaultManager = new SimpleProgressManager();
  }
  return defaultManager;
}

/**
 * 重置进度管理器
 */
export function resetProgressManager(): void {
  defaultManager = null;
}

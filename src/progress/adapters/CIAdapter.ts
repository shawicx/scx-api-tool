/**
 * @description CI/CD 环境进度适配器 - 使用简单文本输出
 */

import consola from 'consola';
import {
  ProgressAdapter,
  ProgressInstance,
  ProgressOptions,
  StepProgressOptions,
  NetworkProgressOptions,
} from '../types';
import { formatTime } from '../utils';

export class CIAdapter implements ProgressAdapter {
  readonly name = 'ci';

  isAvailable(): boolean {
    return true; // CI adapter is always available as fallback
  }

  createSpinner(message: string): ProgressInstance {
    consola.info(`${message}`);

    return {
      update: (value: string | number) => {
        if (typeof value === 'string') {
          consola.info(`${value}`);
        }
      },
      complete: (finalMessage?: string) => {
        consola.success(`${finalMessage || '完成'}`);
      },
      fail: (error: Error | string) => {
        const errorMsg = error instanceof Error ? error.message : error;
        consola.error(`${errorMsg}`);
      },
      stop: () => {
        // CI environments don't need explicit cleanup for spinners
      },
    };
  }

  createProgressBar(options: ProgressOptions): ProgressInstance {
    const { title = '处理中', max = 100, initial = 0, showPercentage = true } = options;

    const startTime = Date.now();

    // 创建进度更新函数
    const updateProgress = (current: number) => {
      const percentage = Math.round((current / max) * 100);
      const elapsed = Date.now() - startTime;

      let message = `${title}: ${current}/${max}`;

      if (showPercentage) {
        message += ` (${percentage}%)`;
      }

      if (current === max) {
        message += ` (${Math.round(elapsed)}ms)`;
        consola.success(`${message}`);
      } else {
        consola.info(`${message}`);
      }
    };

    // 初始显示
    updateProgress(initial);

    return {
      update: (value: number | string) => {
        if (typeof value === 'number') {
          updateProgress(value);
        }
      },
      complete: (message?: string) => {
        updateProgress(max);
        if (message) {
          consola.success(`${message}`);
        }
      },
      fail: (error: Error | string) => {
        const errorMsg = error instanceof Error ? error.message : error;
        consola.error(`${title} 失败: ${errorMsg}`);
      },
      stop: () => {
        // Cleanup not needed for CI
      },
    };
  }

  createStepProgress(options: StepProgressOptions): ProgressInstance {
    const { steps } = options;
    let currentStep = 0;
    const startTime = Date.now();

    // 开始执行，不显示详细步骤列表

    // 极简的step更新，只显示关键信息
    const updateStep = (stepIndex: number, status: 'loading' | 'success' | 'error') => {
      const step = steps[stepIndex];
      if (!step) return;

      // 只在error时输出，loading和success都由其他地方处理
      if (status === 'error') {
        consola.error(`步骤 ${stepIndex + 1}/${steps.length} 失败: ${step.title}`);
      }
      // loading和success都静默，避免重复
    };

    return {
      update: (value: number | string) => {
        if (typeof value === 'number') {
          if (value > currentStep && value < steps.length) {
            // Mark previous step as success
            if (currentStep >= 0) {
              updateStep(currentStep, 'success');
            }

            currentStep = value;
            updateStep(currentStep, 'loading');
          }
        }
      },
      complete: (message?: string) => {
        // Mark current step as success
        if (currentStep < steps.length) {
          updateStep(currentStep, 'success');
        }

        const totalElapsed = Date.now() - startTime;
        consola.success(`所有步骤完成! 总耗时: ${formatTime(totalElapsed)}`);

        if (message) {
          consola.success(`${message}`);
        }
      },
      fail: (error: Error | string) => {
        const errorMsg = error instanceof Error ? error.message : error;

        // Mark current step as failed
        if (currentStep < steps.length) {
          updateStep(currentStep, 'error', errorMsg);
        }

        consola.error(`步骤执行失败: ${errorMsg}`);
      },
      stop: () => {
        // Cleanup not needed for CI
      },
    };
  }

  createNetworkProgress(options: NetworkProgressOptions): ProgressInstance {
    const { url, method = 'GET' } = options;
    const startTime = Date.now();

    const stages = {
      connecting: '连接服务器',
      sending: '发送请求',
      receiving: '接收数据',
      processing: '处理响应',
      complete: '请求完成',
    };

    const updateStage = (stage: string, details?: string) => {
      currentStage = stage;
      const elapsed = Date.now() - startTime;

      let message = stages[stage] || stage;

      if (url) {
        message += ` (${method} ${url})`;
      }

      if (details) {
        message += ` - ${details}`;
      }

      if (stage !== 'complete') {
        message += ` [耗时: ${formatTime(elapsed)}]`;
        consola.info(message);
      }
    };

    // 开始连接
    updateStage('connecting');

    return {
      update: (value: number | string) => {
        if (typeof value === 'string') {
          updateStage(value);
        }
      },
      complete: (message?: string) => {
        updateStage('complete');
        if (message) {
          consola.success(message);
        }
      },
      fail: (error: Error | string) => {
        const errorMsg = error instanceof Error ? error.message : error;
        consola.error(`网络请求失败: ${errorMsg} (${method} ${url})`);
      },
      stop: () => {
        // Cleanup not needed for CI
      },
    };
  }

  async group<T>(title: string, fn: () => Promise<T>): Promise<T> {
    consola.info(`${title}`);

    try {
      const result = await fn();
      consola.success(`${title} - 完成`);
      return result;
    } catch (error) {
      consola.error(`${title} - 失败: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }

  text(message: string): void {
    consola.info(`${message}`);
  }

  success(message: string): void {
    consola.success(`${message}`);
  }

  error(message: string): void {
    consola.error(`${message}`);
  }

  warning(message: string): void {
    consola.warn(`${message}`);
  }

  info(message: string): void {
    consola.info(`${message}`);
  }
}

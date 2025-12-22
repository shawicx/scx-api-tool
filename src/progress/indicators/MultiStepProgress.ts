/**
 * @description 多步骤进度指示器 - 处理复杂的多步骤操作
 */

import { getProgressManager, ProgressInstance } from '../ProgressManager';
import { StepProgressOptions } from '../types';

export interface MultiStepProgressOptions extends StepProgressOptions {
  title?: string;
  showStepNumbers?: boolean;
  showStepDescriptions?: boolean;
  onStepStart?: (stepIndex: number, step: any) => void;
  onStepComplete?: (stepIndex: number, step: any) => void;
  onStepError?: (stepIndex: number, step: any, error: Error) => void;
}

export class MultiStepProgress {
  private progress: ProgressInstance | null = null;
  private currentStep = 0;
  private options: MultiStepProgressOptions;
  private stepStartTimes: number[] = [];

  constructor(options: MultiStepProgressOptions) {
    this.options = {
      showStepNumbers: true,
      showStepDescriptions: true,
      ...options,
    };

    // Initialize step start times
    this.stepStartTimes = new Array(this.options.steps.length).fill(0);
  }

  /**
   * 开始执行步骤
   */
  start(): void {
    this.progress = getProgressManager().createStepProgress(this.options);

    if (this.options.title) {
      getProgressManager().info(this.options.title);
    }

    // 开始第一步
    if (this.options.steps.length > 0) {
      this.startStep(0);
    }
  }

  /**
   * 开始执行指定步骤
   */
  startStep(stepIndex: number): void {
    if (stepIndex < 0 || stepIndex >= this.options.steps.length) {
      return;
    }

    const step = this.options.steps[stepIndex];
    this.currentStep = stepIndex;
    this.stepStartTimes[stepIndex] = Date.now();

    // 更新步骤状态
    step.status = 'loading';

    // 调用回调
    if (this.options.onStepStart) {
      this.options.onStepStart(stepIndex, step);
    }

    // 更新进度显示
    this.updateProgress(stepIndex);
  }

  /**
   * 完成当前步骤
   */
  completeCurrentStep(description?: string): void {
    if (this.currentStep < 0 || this.currentStep >= this.options.steps.length) {
      return;
    }

    const step = this.options.steps[this.currentStep];
    const stepStartTime = this.stepStartTimes[this.currentStep];
    const duration = Date.now() - stepStartTime;

    // 更新步骤状态
    step.status = 'success';
    if (description) {
      step.description = description;
    }

    // 调用回调
    if (this.options.onStepComplete) {
      this.options.onStepComplete(this.currentStep, step);
    }

    // 记录步骤完成信息，使用简洁格式
    getProgressManager().success(
      `步骤 ${this.currentStep + 1}/${this.options.steps.length} 完成: ${step.title} (${Math.round(duration)}ms)`,
    );

    // 移动到下一步
    if (this.currentStep < this.options.steps.length - 1) {
      this.startStep(this.currentStep + 1);
    }
  }

  /**
   * 当前步骤失败
   */
  failCurrentStep(error: Error | string, description?: string): void {
    if (this.currentStep < 0 || this.currentStep >= this.options.steps.length) {
      return;
    }

    const step = this.options.steps[this.currentStep];

    // 更新步骤状态
    step.status = 'error';
    if (description) {
      step.description = description;
    }

    // 调用回调
    if (this.options.onStepError) {
      const errorObj = error instanceof Error ? error : new Error(error);
      this.options.onStepError(this.currentStep, step, errorObj);
    }

    // 更新进度显示
    if (this.progress) {
      this.progress.fail(error);
    }

    getProgressManager().error(
      `步骤 ${this.currentStep + 1}/${this.options.steps.length} 失败: ${step.title} - ${error instanceof Error ? error.message : error}`,
    );
  }

  /**
   * 完成所有步骤
   */
  complete(message?: string): void {
    if (this.progress) {
      this.progress.complete(message);
    }
  }

  /**
   * 失败所有步骤
   */
  fail(error: Error | string): void {
    if (this.progress) {
      this.progress.fail(error);
    }
  }

  /**
   * 停止进度显示
   */
  stop(): void {
    if (this.progress) {
      this.progress.stop();
    }
  }

  /**
   * 更新进度显示
   */
  private updateProgress(stepIndex: number): void {
    if (this.progress) {
      this.progress.update(stepIndex);
    }
  }

  /**
   * 获取当前步骤索引
   */
  getCurrentStep(): number {
    return this.currentStep;
  }

  /**
   * 获取步骤总数
   */
  getTotalSteps(): number {
    return this.options.steps.length;
  }

  /**
   * 获取当前步骤信息
   */
  getCurrentStepInfo() {
    if (this.currentStep < 0 || this.currentStep >= this.options.steps.length) {
      return null;
    }

    return this.options.steps[this.currentStep];
  }

  /**
   * 获取所有步骤信息
   */
  getAllSteps() {
    return [...this.options.steps];
  }

  /**
   * 获取指定步骤的执行时间
   */
  getStepDuration(stepIndex: number): number {
    if (stepIndex < 0 || stepIndex >= this.stepStartTimes.length) {
      return 0;
    }

    const startTime = this.stepStartTimes[stepIndex];
    if (startTime === 0) {
      return 0;
    }

    const step = this.options.steps[stepIndex];
    if (step.status === 'loading') {
      return Date.now() - startTime;
    } else {
      return this.stepStartTimes[stepIndex + 1]
        ? this.stepStartTimes[stepIndex + 1] - startTime
        : Date.now() - startTime;
    }
  }

  /**
   * 获取总执行时间
   */
  getTotalDuration(): number {
    if (this.stepStartTimes.length === 0 || this.stepStartTimes[0] === 0) {
      return 0;
    }

    const lastStepIndex = this.options.steps.findIndex((step) => step.status === 'loading');
    if (lastStepIndex === -1) {
      // 所有步骤都已完成
      const lastCompletedStep = this.stepStartTimes
        .map((time, index) => ({ time, index }))
        .filter((item) => item.time > 0)
        .pop();

      if (!lastCompletedStep) return 0;

      const nextStepTime = this.stepStartTimes[lastCompletedStep.index + 1] || Date.now();
      return nextStepTime - this.stepStartTimes[0];
    } else {
      // 仍有步骤在进行中
      return Date.now() - this.stepStartTimes[0];
    }
  }
}

/**
 * 便捷函数：创建并启动多步骤进度
 */
export function createMultiStepProgress(options: MultiStepProgressOptions): MultiStepProgress {
  const progress = new MultiStepProgress(options);
  progress.start();
  return progress;
}

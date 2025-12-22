/**
 * @description 进度显示相关类型定义
 */

export interface ProgressOptions {
  title?: string;
  message?: string;
  max?: number;
  initial?: number;
  showPercentage?: boolean;
  showEta?: boolean;
}

export interface StepProgressOptions {
  steps: Array<{
    title: string;
    status?: 'pending' | 'loading' | 'success' | 'error';
    description?: string;
  }>;
}

export interface NetworkProgressOptions {
  url?: string;
  method?: string;
  timeout?: number;
}

export interface ProgressInstance {
  update: (value: number | string) => void;
  complete: (message?: string) => void;
  fail: (error: Error | string) => void;
  stop: () => void;
}

export interface ProgressAdapter {
  name: string;
  isAvailable: () => boolean;
  createSpinner: (message: string) => ProgressInstance;
  createProgressBar: (options: ProgressOptions) => ProgressInstance;
  createStepProgress: (options: StepProgressOptions) => ProgressInstance;
  createNetworkProgress: (options: NetworkProgressOptions) => ProgressInstance;
  group: <T>(title: string, fn: () => Promise<T>) => Promise<T>;
  text: (message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

export interface ProgressConfig {
  enabled: boolean;
  style: 'minimal' | 'standard' | 'detailed';
  updateFrequency: number;
  forceSimple: boolean;
}

/**
 * @description 环境检测和工具函数
 */

/**
 * 检测是否为 CI/CD 环境
 */
export function isCIEnvironment(): boolean {
  return !!(
    process.env.CI ||
    process.env.GITHUB_ACTIONS ||
    process.env.GITLAB_CI ||
    process.env.JENKINS_URL ||
    process.env.TRAVIS ||
    process.env.CIRCLECI ||
    process.env.BITBUCKET_BUILD_NUMBER ||
    process.env.APPVEYOR
  );
}

/**
 * 检测是否为交互式终端
 */
export function isInteractiveTerminal(): boolean {
  return !!(process.stdout.isTTY && process.stdin.isTTY);
}

/**
 * 检测当前环境类型
 */
export function detectEnvironmentType(): EnvironmentType {
  if (isCIEnvironment()) {
    return EnvironmentType.CI;
  }

  if (isInteractiveTerminal()) {
    return EnvironmentType.INTERACTIVE;
  }

  return EnvironmentType.NON_INTERACTIVE;
}

/**
 * 获取终端宽度
 */
export function getTerminalWidth(): number {
  return process.stdout.columns || 80;
}

/**
 * 检测是否支持颜色输出
 */
export function supportsColor(): boolean {
  return !!(process.stdout.isTTY && !isCIEnvironment());
}

/**
 * 节流函数 - 限制函数调用频率
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * 格式化时间显示
 */
export function formatTime(ms: number): string {
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
 * 计算 ETA (预计完成时间)
 */
export function calculateETA(current: number, total: number, startTime: number): number | null {
  if (current === 0 || current >= total) {
    return null;
  }

  const elapsed = Date.now() - startTime;
  const rate = current / elapsed;

  if (rate <= 0) {
    return null;
  }

  const remaining = total - current;
  return Math.round(remaining / rate);
}

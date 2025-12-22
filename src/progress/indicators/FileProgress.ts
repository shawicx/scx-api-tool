/**
 * @description 文件生成进度指示器 - 处理文件操作进度
 */

import { getProgressManager, ProgressInstance } from '../ProgressManager';
import { ProgressOptions } from '../types';

export interface FileProgressOptions extends ProgressOptions {
  fileType?: string; // 文件类型，如 'interface', 'type', 'request'
  showFileNames?: boolean; // 是否显示正在处理的文件名
  onFileStart?: (fileName: string) => void;
  onFileComplete?: (fileName: string) => void;
  onFileError?: (fileName: string, error: Error) => void;
}

export class FileProgress {
  private progress: ProgressInstance | null = null;
  private options: FileProgressOptions;
  private currentFile = 0;
  private fileStartTimes: Map<string, number> = new Map();
  private completedFiles: string[] = [];
  private failedFiles: Array<{ name: string; error: Error }> = [];

  constructor(options: FileProgressOptions) {
    this.options = {
      fileType: '文件',
      showFileNames: true,
      ...options,
    };
  }

  /**
   * 开始文件生成
   */
  start(totalFiles: number): void {
    const title = this.options.title || `生成${this.options.fileType} (${totalFiles}个文件)`;

    this.progress = getProgressManager().createProgressBar({
      title,
      max: totalFiles,
      initial: 0,
      showPercentage: true,
      showEta: true,
      ...this.options,
    });

    getProgressManager().info(`开始生成 ${totalFiles} 个${this.options.fileType}文件`);
  }

  /**
   * 开始处理单个文件
   */
  startFile(fileName: string): void {
    this.currentFile++;
    this.fileStartTimes.set(fileName, Date.now());

    if (this.options.showFileNames) {
      const progressMsg = `正在生成: ${fileName}`;
      if (this.progress) {
        this.progress.update(this.currentFile - 1); // 更新到上一个文件完成
      }
      getProgressManager().info(progressMsg);
    }

    // 调用回调
    if (this.options.onFileStart) {
      this.options.onFileStart(fileName);
    }
  }

  /**
   * 完成单个文件
   */
  completeFile(fileName: string): void {
    const startTime = this.fileStartTimes.get(fileName) || 0;
    const duration = Date.now() - startTime;

    this.completedFiles.push(fileName);
    this.fileStartTimes.delete(fileName);

    // 更新进度条
    if (this.progress) {
      this.progress.update(this.currentFile);
    }

    // 调用回调
    if (this.options.onFileComplete) {
      this.options.onFileComplete(fileName);
    }

    // 记录完成信息
    if (this.options.showFileNames) {
      getProgressManager().success(`完成: ${fileName} (${Math.round(duration)}ms)`);
    }
  }

  /**
   * 文件处理失败
   */
  failFile(fileName: string, error: Error | string): void {
    const errorObj = error instanceof Error ? error : new Error(error);

    this.failedFiles.push({ name: fileName, error: errorObj });
    this.fileStartTimes.delete(fileName);

    // 调用回调
    if (this.options.onFileError) {
      this.options.onFileError(fileName, errorObj);
    }

    // 记录错误信息
    getProgressManager().error(`失败: ${fileName} - ${errorObj.message}`);
  }

  /**
   * 完成所有文件生成
   */
  complete(message?: string): void {
    const totalDuration = this.getTotalDuration();
    const summary = this.getSummary();

    if (this.progress) {
      this.progress.complete(message);
    }

    // 显示生成总结
    getProgressManager().success(`${summary} 总耗时: ${Math.round(totalDuration)}ms`);
  }

  /**
   * 生成过程失败
   */
  fail(error: Error | string): void {
    if (this.progress) {
      this.progress.fail(error);
    }

    const summary = this.getSummary();
    getProgressManager().error(
      `文件生成失败: ${summary} - ${error instanceof Error ? error.message : error}`,
    );
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
   * 获取当前处理的文件数
   */
  getCurrentFileCount(): number {
    return this.currentFile;
  }

  /**
   * 获取成功完成的文件数
   */
  getCompletedFileCount(): number {
    return this.completedFiles.length;
  }

  /**
   * 获取失败的文件数
   */
  getFailedFileCount(): number {
    return this.failedFiles.length;
  }

  /**
   * 获取已完成的文件列表
   */
  getCompletedFiles(): string[] {
    return [...this.completedFiles];
  }

  /**
   * 获取失败的文件列表
   */
  getFailedFiles(): Array<{ name: string; error: Error }> {
    return [...this.failedFiles];
  }

  /**
   * 获取正在处理的文件列表
   */
  getInProgressFiles(): string[] {
    return Array.from(this.fileStartTimes.keys());
  }

  /**
   * 获取指定文件的处理时间
   */
  getFileDuration(fileName: string): number {
    const startTime = this.fileStartTimes.get(fileName);
    if (startTime) {
      return Date.now() - startTime;
    }
    return 0;
  }

  /**
   * 获取总处理时间
   */
  getTotalDuration(): number {
    // 这里简化处理，实际应该记录开始时间
    return 0;
  }

  /**
   * 重置状态
   */
  reset(): void {
    this.currentFile = 0;
    this.fileStartTimes.clear();
    this.completedFiles = [];
    this.failedFiles = [];

    if (this.progress) {
      this.progress.stop();
      this.progress = null;
    }
  }

  private getSummary(): string {
    const completed = this.completedFiles.length;
    const failed = this.failedFiles.length;
    const total = completed + failed;

    if (failed === 0) {
      return `成功生成 ${completed} 个${this.options.fileType}文件`;
    } else {
      return `文件生成完成: ${completed} 成功, ${failed} 失败 (共 ${total} 个)`;
    }
  }
}

/**
 * 便捷函数：创建文件生成进度
 */
export function createFileProgress(options: FileProgressOptions): FileProgress {
  return new FileProgress(options);
}

/**
 * 便捷函数：批量处理文件并显示进度
 */
export async function processFilesWithProgress<T>(
  files: Array<{ name: string; processor: () => Promise<T> }>,
  options: FileProgressOptions,
): Promise<Array<{ name: string; result: T; success: boolean }>> {
  const progress = createFileProgress(options);
  const results: Array<{ name: string; result: T; success: boolean }> = [];

  try {
    progress.start(files.length);

    for (const file of files) {
      try {
        progress.startFile(file.name);
        // eslint-disable-next-line no-await-in-loop
        const result = await file.processor();
        progress.completeFile(file.name);
        results.push({ name: file.name, result, success: true });
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        progress.failFile(file.name, errorObj);
        results.push({ name: file.name, result: null as any, success: false });
      }
    }

    progress.complete();
    return results;
  } catch (error) {
    progress.fail(error instanceof Error ? error : new Error(String(error)));
    return results;
  }
}

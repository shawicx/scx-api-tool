/*
 * @Author: shawicx d35f3153@proton.me
 * @Description: 文件处理相关工具函数
 */
import type { AppendOptions } from 'form-data';

/**
 * 文件数据辅助类，统一网页、小程序等平台的文件上传。
 */
export class FileData<T = any> {
  /**
   * 原始文件数据。
   */
  private originalFileData: T;

  /**
   * 选项。
   */
  private options: AppendOptions | undefined;

  /**
   * 文件数据辅助类，统一网页、小程序等平台的文件上传。
   *
   * @param originalFileData 原始文件数据
   * @param options 若使用内部的 getFormData，则选项会被其使用
   */
  constructor(originalFileData: T, options?: AppendOptions) {
    this.originalFileData = originalFileData;
    this.options = options;
  }

  /**
   * 获取原始文件数据。
   *
   * @returns 原始文件数据
   */
  getOriginalFileData(): T {
    return this.originalFileData;
  }

  /**
   * 获取选项。
   */
  getOptions(): AppendOptions | undefined {
    return this.options;
  }
}

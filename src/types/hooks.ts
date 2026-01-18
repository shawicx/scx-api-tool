/**
 * @description 钩子函数类型定义
 */

/**
 * CLI 钩子函数
 */
export interface CliHooks {
  /** 开始生成前的钩子 */
  beforeGenerate?: () => void;
  /** 生成完成后的钩子 */
  afterGenerate?: () => void;
  /** 生成单个文件前的钩子 */
  beforeWriteFile?: (filePath: string, content: string) => string;
  /** 生成单个文件后的钩子 */
  afterWriteFile?: (filePath: string) => void;
}

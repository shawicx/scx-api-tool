/**
 * @description 输出相关类型定义
 */

/**
 * 输出文件列表
 */
export interface OutputFileList {
  /** 类型定义文件 */
  types: string[];
  /** 接口定义文件 */
  interfaces: string[];
  /** 请求函数文件 */
  request: string[];
}

/**
 * 请求函数配置
 */
export interface RequestFunctionConfig {
  /** 请求函数文件路径 */
  filePath: string;
  /** 请求函数名称 */
  functionName: string;
}

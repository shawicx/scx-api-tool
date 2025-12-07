/**
 * @description 文件操作工具函数
 */

import {
  ensureDir as fseEnsureDir,
  outputFile as fseOutputFile,
  pathExists as fsePathExists,
} from 'fs-extra';
import { dirname } from 'path';

export async function ensureDir(dirPath: string): Promise<void> {
  await fseEnsureDir(dirPath);
}

export async function writeFormattedFile(filePath: string, content: string): Promise<void> {
  // 确保目录存在
  await ensureDir(dirname(filePath));

  // 写入文件
  await fseOutputFile(filePath, content);
}

export async function fileExists(filePath: string): Promise<boolean> {
  return await fsePathExists(filePath);
}

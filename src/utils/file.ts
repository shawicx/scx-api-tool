/**
 * @description 文件操作工具函数
 */

import { promises as fs } from 'fs';
import { dirname, relative, join } from 'path';
import consola from 'consola';

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function writeFormattedFile(filePath: string, content: string): Promise<void> {
  // 确保目录存在
  await ensureDir(dirname(filePath));

  // 写入文件
  await fs.writeFile(filePath, content, 'utf-8');
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * 清理输出目录，排除指定的文件
 * @param dirPath 要清理的目录路径
 * @param excludeFiles 要排除的文件路径数组（绝对路径）
 */
export async function cleanOutputDir(dirPath: string, excludeFiles: string[] = []): Promise<void> {
  // 检查目录是否存在
  const exists = await fileExists(dirPath);
  if (!exists) {
    if (process.env.DEBUG) {
      consola.debug(`输出目录不存在，跳过清理: ${dirPath}`);
    }
    return;
  }

  if (process.env.DEBUG) {
    consola.debug(`开始清理输出目录: ${dirPath}`);
    consola.debug(`排除文件: ${excludeFiles.join(', ') || '无'}`);
  }

  try {
    // 读取目录内容
    const entries = await fs.readdir(dirPath);

    // 顺序删除文件以避免并发问题

    for (const entry of entries) {
      const fullPath = join(dirPath, entry);

      // 检查是否在排除列表中
      const isExcluded = excludeFiles.some((excludePath) => {
        // 计算相对路径进行比较
        const relativePath = relative(dirPath, excludePath);
        return entry === relativePath || entry === relativePath.replace(/\.ts$/, '');
      });

      if (isExcluded) {
        if (process.env.DEBUG) {
          consola.debug(`跳过排除的文件: ${entry}`);
        }
        continue;
      }

      // 删除文件或目录
      try {
        await fs.rm(fullPath, { recursive: true, force: true });

        if (process.env.DEBUG) {
          consola.debug(`已删除: ${entry}`);
        }
      } catch (removeError: any) {
        // 如果删除失败，记录警告但继续
        consola.warn(`删除失败: ${entry} - ${removeError.message}`);
      }
    }

    consola.info(`清理输出目录完成: ${dirPath}`);
  } catch (error: any) {
    consola.error('清理输出目录失败:', error.message);
    throw error;
  }
}

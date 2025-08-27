/*
 * @Author: shawicx d35f3153@proton.me
 * @Date: 2025-08-09 23:30:00
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2025-08-27 21:17:55
 * @Description: 文件生成相关的工具函数 - 类型已移至 types/server.ts
 */
import fs from 'fs-extra';
import path from 'path';
import { DEFAULT_CONFIG } from './constants';
import { formatFile } from './index';

// 接口定义已移至 types/server.ts

/**
 * 生成index.ts文件，将目录中的所有方法和interface类型导出
 * @param directoryPaths 目录路径
 * @param outputDir 输出目录
 * @param cwd 当前工作目录
 */
export async function generateIndexFile(
  directoryPaths: string[],
  outputDir: string = DEFAULT_CONFIG.OUTPUT_DIR,
  cwd: string = process.cwd(),
): Promise<void> {
  // 确保目录存在
  const serviceDir = path.resolve(cwd, outputDir);
  await fs.ensureDir(serviceDir);

  // 递归获取所有包含 index.ts 的目录
  const allDirectories = await getAllDirectoriesWithIndex(serviceDir);

  // 检查目录是否存在
  if (!(await fs.pathExists(path.resolve(cwd, `${outputDir}/index.ts`)))) {
    // 创建index.ts文件
    await fs.writeFile(path.resolve(cwd, `${outputDir}/index.ts`), '');
  }

  const indexContent = transformDirectoryPaths(allDirectories, outputDir).join('\n');

  // 格式化 index.ts 内容
  const formattedIndexContent = await formatFile(
    path.resolve(cwd, `${outputDir}/index.ts`),
    indexContent,
  );

  await fs.writeFile(path.resolve(cwd, `${outputDir}/index.ts`), formattedIndexContent);
}

/**
 * 递归获取所有包含 index.ts 的目录
 * @param rootDir 根目录
 * @returns 所有包含 index.ts 的目录路径数组
 */
export async function getAllDirectoriesWithIndex(rootDir: string): Promise<string[]> {
  const directories: string[] = [];

  async function scanDirectory(dir: string) {
    try {
      const items = await fs.readdir(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        // eslint-disable-next-line no-await-in-loop
        const stat = await fs.stat(fullPath);

        if (stat.isDirectory()) {
          // 检查目录下是否有 index.ts 文件
          const indexPath = path.join(fullPath, 'index.ts');
          // eslint-disable-next-line no-await-in-loop
          if (await fs.pathExists(indexPath)) {
            directories.push(fullPath);
          }
          // 递归扫描子目录
          // eslint-disable-next-line no-await-in-loop
          await scanDirectory(fullPath);
        }
      }
    } catch {
      // 忽略读取目录失败的情况
      // console.warn(`Warning: Failed to scan directory ${dir}:`, error);
    }
  }

  await scanDirectory(rootDir);
  return directories;
}

/**
 * 转换目录路径为导入语句
 * @param directories 目录路径数组
 * @param outputDir 输出目录
 * @returns 转换后的导入语句数组
 */
export function transformDirectoryPaths(directories: string[], outputDir: string): string[] {
  return directories.map((dir) => {
    const relativePath = path.relative(outputDir, dir);
    const normalizedPath = relativePath.replace(/\\/g, '/');
    return `export * from './${normalizedPath}';`;
  });
}

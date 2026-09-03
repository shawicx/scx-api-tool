/**
 * @description 根索引文件生成器
 * 从 interfaceGenerator.ts 拆分而来，负责生成 outputDir/index.ts
 */

import { join } from 'path';
import type { ApiConfig, CliHooks } from '@/types';
import type { ProcessedApiData } from '@/processors/openapi';
import { writeFormattedFile } from '@/utils/file';
import { chineseToPinyinCamelCase } from '@/utils/path';
import { getFileExtension } from '@/utils/config';
import { logger } from '@/utils/logger';

/**
 * @description 生成根目录 index.ts 文件
 * 导出所有标签目录与类型索引。共享的 request 模块位于 baseOutputDir 层、
 * 不属于任何单个服务的 API 面，因此不做 re-export（消费方直接从其模块导入），
 * 避免多个服务桶重复导出同名 `request` 造成歧义。
 * @param processedData 处理后的 API 数据
 * @param config API 配置
 * @param hooks 钩子函数
 */
export async function generateRootIndexFile(
  processedData: ProcessedApiData,
  config: ApiConfig,
  hooks?: CliHooks,
): Promise<void> {
  const { outputDir } = config;

  let rootIndexContent = '';

  const isJS = config.target === 'javascript';
  const effectiveGenerateTypes = isJS ? false : config.generateTypes;
  const isZodMode = !isJS && config.typesFormat === 'zod';

  const tagDirs: string[] = [];

  for (const category of processedData.categories) {
    const tagDir = chineseToPinyinCamelCase(category.name);
    tagDirs.push(tagDir);
  }

  // Zod + types 模式：先导出各 tag 的 schema 文件 + schemas 索引
  if (isZodMode && effectiveGenerateTypes) {
    for (const tagDir of tagDirs) {
      rootIndexContent += `export * from './${tagDir}/schema';\n`;
    }
    rootIndexContent += `export * from './schemas';\n`;
  }

  // 公共：导出各 tag 目录（zod+types 模式仅在 generateApi 时导出；其余模式总是导出）
  const needsTagExports = !(isZodMode && effectiveGenerateTypes) || config.generateApi;
  if (needsTagExports) {
    if (isZodMode && effectiveGenerateTypes && config.generateApi) {
      rootIndexContent += '\n';
    }
    for (const tagDir of tagDirs) {
      rootIndexContent += `export * from './${tagDir}';\n`;
    }
  }

  // 非 Zod 的 types 模式：额外导出 types 索引
  if (effectiveGenerateTypes && !isZodMode) {
    rootIndexContent += `export * from './types';\n`;
  }

  const ext = getFileExtension(config.target);
  const rootIndexPath = join(outputDir, `index${ext}`);
  await writeFormattedFile(rootIndexPath, rootIndexContent, hooks);

  logger.debug(`创建根索引文件: ${rootIndexPath}`);
}

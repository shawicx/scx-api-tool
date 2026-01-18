/**
 * @description 代码生成协调器
 */

import consola from 'consola';
import { ProcessedApiData } from '../processors/openapi';
import { ApiConfig } from '../types';
import {
  generateInterfaceFiles,
  generateRequestFile,
  generateTypeFiles,
  generateSchemaFiles,
} from './fileGenerator';
import { cleanOutputDir } from '../utils/file';

/**
 * @description 生成所有代码文件
 * 协调接口文件、API 请求方法、类型定义和 Schema 文件的生成
 * @param processedData 处理后的 API 数据
 * @param config API 配置
 *
 * @example
 * ```typescript
 * await generateFiles(processedData, config);
 * // 根据配置生成：
 * // - 接口文件（按标签分组）
 * // - 请求函数文件
 * // - 类型定义文件
 * // - Schema 文件（如果 typesFormat: 'zod'）
 * ```
 */
export async function generateFiles(
  processedData: ProcessedApiData,
  config: ApiConfig,
): Promise<void> {
  try {
    // 清理输出目录，排除 requestFunctionFilePath
    const excludeFiles: string[] = [];
    // 只在 requestFunctionFilePath 在输出目录下时才排除
    if (
      config.requestFunctionFilePath &&
      config.requestFunctionFilePath.startsWith(config.outputDir)
    ) {
      excludeFiles.push(config.requestFunctionFilePath);
    }

    await cleanOutputDir(config.outputDir, excludeFiles);

    // 生成接口文件
    if (config.generateApi || config.generateTypes) {
      consola.info('生成接口文件');
      await generateInterfaceFiles(processedData, config);
    }

    // 生成 API 请求方法（如果需要）
    if (config.generateApi) {
      consola.info('生成 API 请求方法');
      await generateRequestFile(config);
    }

    // 生成类型定义（如果需要）
    if (config.generateTypes) {
      if (config.typesFormat === 'typescript') {
        consola.info('生成 TypeScript 类型定义');
        await generateTypeFiles(processedData, config);
      } else if (config.typesFormat === 'zod') {
        consola.info('生成 Zod Schema');
        await generateSchemaFiles(processedData, config);
      }
    }

    // 文件生成成功后，由上层 generateCode 输出成功消息
  } catch (error: any) {
    consola.error('生成文件失败:', error.message);
    throw error;
  }
}

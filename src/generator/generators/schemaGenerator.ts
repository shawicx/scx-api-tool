/**
 * @description Schema 文件生成器
 * 负责生成 Zod Schema 验证文件
 */

import { join } from 'path';
import { ProcessedApiData, groupInterfacesByTag } from '../../processors/openapi';
import { ApiConfig, CliHooks } from '../../types';
import type { OpenApiOperation } from '../../types';
import { ensureDir, writeFormattedFile } from '../../utils/file';
import { chineseToPinyinCamelCase } from '../../utils/path';
import { sanitizeTypeName, applyNamingStrategy, type NamingContext } from '@/naming';
import {
  generateZodTypeSchema,
  generateZodSchemaIndex,
  generateMergedSchemaFile,
} from '../template/zod';
import { executeWithConcurrency } from '../../utils/concurrency';
import { writeGeneratedFile } from '../fileWriter';
import { logger } from '@/utils/logger';

/**
 * @description 生成所有 Zod Schema 文件
 * 包括类型 Schema 和接口 Request/Response Schema
 * @param processedData 处理后的 API 数据
 * @param config API 配置
 * @param hooks 钩子函数
 *
 * @example
 * ```typescript
 * await generateSchemaFiles(processedData, config);
 * // 生成结构：
 * // output/schemas/
 * //   index.ts
 * //   UserSchema.ts
 * //   ProductSchema.ts
 * //   tag1/schema.ts
 * //   tag2/schema.ts
 * ```
 */
export async function generateSchemaFiles(
  processedData: ProcessedApiData,
  config: ApiConfig,
  hooks?: CliHooks,
): Promise<void> {
  if (config.typesFormat !== 'zod') {
    logger.debug('typesFormat 不是 zod，跳过 Schema 生成');
    return;
  }

  const generatedSchemas: string[] = [];

  const typesSchemasDir = join(config.outputDir, 'schemas');
  await ensureDir(typesSchemasDir);
  await generateTypeSchemasFiles(processedData, config, typesSchemasDir, generatedSchemas, hooks);

  await generateInterfaceSchemasFiles(
    processedData,
    config,
    config.outputDir,
    generatedSchemas,
    hooks,
  );

  await generateSchemaIndexFile(typesSchemasDir, generatedSchemas, hooks);

  logger.success(`成功生成 ${generatedSchemas.length} 个 Zod Schema 文件`);
}

/**
 * @description 生成类型 Schema 文件
 * 为每个 OpenAPI 类型定义生成对应的 Zod Schema
 * @param processedData 处理后的 API 数据
 * @param config API 配置
 * @param schemasDir Schema 目录路径
 * @param generatedSchemas 已生成的 Schema 名称数组（会追加）
 * @param hooks 钩子函数
 */
async function generateTypeSchemasFiles(
  processedData: ProcessedApiData,
  config: ApiConfig,
  schemasDir: string,
  generatedSchemas: string[],
  hooks?: CliHooks,
): Promise<void> {
  logger.debug(`正在生成 ${processedData.types.length} 个类型 Schema...`);

  const concurrency = config.concurrency || 50;
  await executeWithConcurrency(
    processedData.types,
    async (type) => {
      const schemaName = `${sanitizeTypeName(type.name)}Schema`;
      const fileName = `${sanitizeTypeName(type.name)}Schema`.replace(/[^a-zA-Z0-9$_]/g, '_');

      const schemaCode = generateZodTypeSchema(
        {
          name: sanitizeTypeName(type.name),
          schema: type.schema,
        },
        config,
      );

      const filePath = join(schemasDir, `${fileName}.ts`);
      await writeGeneratedFile(filePath, schemaCode, config, hooks, '创建类型 Schema 文件');

      generatedSchemas.push(schemaName);
    },
    concurrency,
    `生成类型 Schema`,
  );
}

/**
 * @description 生成接口 Request/Response Schema 文件
 * 为每个接口生成请求和响应的 Zod Schema
 * @param processedData 处理后的 API 数据
 * @param config API 配置
 * @param schemasDir Schema 目录路径
 * @param generatedSchemas 已生成的 Schema 名称数组
 * @param hooks 钩子函数
 */
async function generateInterfaceSchemasFiles(
  processedData: ProcessedApiData,
  config: ApiConfig,
  schemasDir: string,
  generatedSchemas: string[],
  hooks?: CliHooks,
): Promise<void> {
  logger.debug(`正在生成 ${processedData.interfaces.length} 个接口 Schema...`);

  const interfacesByTag = groupInterfacesByTag(processedData.interfaces);

  const concurrency = config.concurrency || 50;
  const tagEntries = Object.entries(interfacesByTag);

  await executeWithConcurrency(
    tagEntries,
    async ([tag, interfaces]) => {
      const tagDir = chineseToPinyinCamelCase(tag);
      const dirPath = join(schemasDir, tagDir);
      await ensureDir(dirPath);

      const result = generateMergedSchemaFile(
        interfaces,
        config,
        getRequestTypeName,
        getResponseTypeName,
      );

      const filePath = join(dirPath, 'schema.ts');
      await writeGeneratedFile(filePath, result.code, config, hooks, '创建合并 Schema 文件');
    },
    concurrency,
    `生成接口 Schema`,
  );
}

/**
 * @description 生成 Schema 索引文件
 * 导出所有 Schema 定义
 * @param schemasDir Schema 目录路径
 * @param generatedSchemas 已生成的 Schema 名称数组
 * @param hooks 钩子函数
 */
async function generateSchemaIndexFile(
  schemasDir: string,
  generatedSchemas: string[],
  hooks?: CliHooks,
): Promise<void> {
  const indexContent = generateZodSchemaIndex(generatedSchemas);

  const indexPath = join(schemasDir, 'index.ts');
  await writeFormattedFile(indexPath, indexContent, hooks);

  logger.debug(`创建 Schema 索引文件: ${indexPath}`);
}

/**
 * @description 获取命名结果中的指定类型名称
 * @param path API 路径
 * @param method HTTP 方法
 * @param operation 操作对象
 * @param config API 配置
 * @param field 要获取的字段：'requestTypeName' 或 'responseTypeName'
 * @returns 类型名称
 */
function getTypeName(
  path: string,
  method: string,
  operation: OpenApiOperation,
  config: ApiConfig,
  field: 'requestTypeName' | 'responseTypeName',
): string {
  const ctx: NamingContext = {
    path,
    method,
    summary: operation.summary,
    description: operation.description,
    operationId: operation.operationId,
    tags: operation.tags,
    config,
  };
  return applyNamingStrategy(ctx, config.namingStrategy)[field];
}

/** 获取请求类型名称 */
function getRequestTypeName(
  path: string,
  method: string,
  operation: OpenApiOperation,
  config: ApiConfig,
): string {
  return getTypeName(path, method, operation, config, 'requestTypeName');
}

/** 获取响应类型名称 */
function getResponseTypeName(
  path: string,
  method: string,
  operation: OpenApiOperation,
  config: ApiConfig,
): string {
  return getTypeName(path, method, operation, config, 'responseTypeName');
}

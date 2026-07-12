/**
 * @description 类型文件生成器
 * 负责生成 TypeScript 类型定义文件
 */

import { join } from 'path';
import { ProcessedApiData } from '../../processors/openapi';
import { collectUsedTypesFromProperties } from '../../processors/common';
import { ApiConfig, CliHooks } from '../../types';
import type { ApiTypeDefinition } from '../../types';
import { ensureDir, writeFormattedFile } from '../../utils/file';
import { getNormalizedPathWithAlias } from '@/utils/pathUtils';
import { sanitizeTypeName } from '@/naming';
import { compileTemplate, getTypeTemplateByConfig } from '../template';
import { extractTypeProperties } from '../extractor';
import { executeWithConcurrency } from '../../utils/concurrency';
import { writeGeneratedFile } from '../fileWriter';
import { escapeJsDocComment } from '@/utils/escape';
import { logger } from '@/utils/logger';

/**
 * @description 生成所有类型文件
 * 为每个 OpenAPI 类型定义生成独立的 TypeScript 类型文件
 * @param processedData 处理后的 API 数据
 * @param config API 配置
 * @param hooks 钩子函数
 *
 * @example
 * ```typescript
 * await generateTypeFiles(processedData, config);
 * // 生成结构：
 * // output/types/
 * //   index.ts
 * //   User.ts
 * //   Product.ts
 * ```
 */
export async function generateTypeFiles(
  processedData: ProcessedApiData,
  config: ApiConfig,
  hooks?: CliHooks,
): Promise<void> {
  if (config.generateApi && !config.generateTypes) {
    logger.debug('API Only 模式：跳过类型文件生成');
    return;
  }

  logger.debug(`正在生成 ${processedData.types.length} 个类型文件...`);

  const typesDir = join(config.outputDir, 'types');
  await ensureDir(typesDir);

  const concurrency = config.concurrency || 50;

  await executeWithConcurrency(
    processedData.types,
    async (type: ApiTypeDefinition) => {
      await generateTypeFile(type, processedData, config, typesDir, hooks);
    },
    concurrency,
    `生成类型文件`,
  );

  // 生成类型索引文件
  await generateTypesIndexFile(processedData, config, hooks);
}

/**
 * @description 生成单个类型文件
 * 为指定的类型生成 TypeScript 类型定义
 * @param type 类型对象
 * @param processedData 处理后的 API 数据
 * @param config API 配置
 * @param typesDir 类型目录路径
 * @param hooks 钩子函数
 */
async function generateTypeFile(
  type: ApiTypeDefinition,
  processedData: ProcessedApiData,
  config: ApiConfig,
  typesDir: string,
  hooks?: CliHooks,
): Promise<void> {
  const cleanTypeName = sanitizeTypeName(type.name);
  const cleanFileName = cleanTypeName.replace(/[^a-zA-Z0-9$_]/g, '_');

  const template = compileTemplate(getTypeTemplateByConfig(config.comment !== false));

  const templateData = {
    typeName: cleanTypeName,
    description: escapeJsDocComment(type.schema.description || type.name),
    properties: extractTypeProperties(type.schema, processedData),
  };

  let code = template(templateData);

  const dependencies = collectUsedTypesFromProperties(templateData.properties, processedData);

  if (dependencies.size > 0) {
    const importPath = getNormalizedPathWithAlias(
      typesDir,
      join(config.outputDir, 'types/index.ts'),
    );
    const cleanImportPath = importPath.replace(/\.ts$/, '').replace(/\/$/, '');
    const importStatement = `import type { ${Array.from(dependencies).join(', ')} } from '${cleanImportPath}';\n\n`;
    code = importStatement + code;
  }

  await writeGeneratedFile(
    join(typesDir, `${cleanFileName}.ts`),
    code,
    config,
    hooks,
    '创建类型文件',
  );
}

/**
 * @description 生成类型索引文件
 * 导出所有类型定义
 * @param processedData 处理后的 API 数据
 * @param config API 配置
 * @param hooks 钩子函数
 */
async function generateTypesIndexFile(
  processedData: ProcessedApiData,
  config: ApiConfig,
  hooks?: CliHooks,
): Promise<void> {
  const typesDir = join(config.outputDir, 'types');

  let indexContent = '';

  for (const type of processedData.types) {
    const cleanTypeName = sanitizeTypeName(type.name);
    const cleanFileName = cleanTypeName.replace(/[^a-zA-Z0-9$_]/g, '_');
    indexContent += `export type { ${cleanTypeName} } from './${cleanFileName}';\n`;
  }

  const indexPath = join(typesDir, 'index.ts');
  await writeFormattedFile(indexPath, indexContent, hooks);

  logger.debug(`创建类型索引文件: ${indexPath}`);
}

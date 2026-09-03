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
import {
  compileTemplate,
  getTypeTemplateByConfig,
  getJsonValueTemplateByConfig,
  getTypeAliasTemplateByConfig,
} from '../template';
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
 * @description 计算类型名对应的文件名（非法字符替换为下划线）
 * 类型文件命名与桶索引引用必须使用同一规则，抽为公共函数防止漂移
 * @param typeName 已 sanitize 的类型名
 * @returns 文件名（不含扩展名）
 */
function getTypeFileName(typeName: string): string {
  return typeName.replace(/[^a-zA-Z0-9$_]/g, '_');
}

/**
 * @description 生成单个类型文件
 * 为指定的类型生成 TypeScript 类型定义文件
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
  const cleanFileName = getTypeFileName(cleanTypeName);

  // 根据 kind 选择模板：jsonValue（递归）/ jsonValueAlias（别名）/ 普通 interface
  let code: string;
  let dependencies: Set<string>;

  if (type.kind === 'jsonValue') {
    // 内置递归 JsonValue 类型：type JsonValue = string | number | ... | JsonValue[]
    const template = compileTemplate(getJsonValueTemplateByConfig(config.comment !== false));
    code = template({
      typeName: cleanTypeName,
      description: escapeJsDocComment(type.schema.description || '任意 JSON 值'),
    });
    dependencies = new Set<string>();
  } else if (type.kind === 'jsonValueAlias') {
    // Jackson 动态类型别名：type JsonNode = JsonValue
    const template = compileTemplate(getTypeAliasTemplateByConfig(config.comment !== false));
    code = template({
      typeName: cleanTypeName,
      description: escapeJsDocComment(type.schema.description || type.name),
      aliasType: 'JsonValue',
    });
    // 别名引用 JsonValue，需要 import（除非自身就是 JsonValue）
    dependencies = cleanTypeName === 'JsonValue' ? new Set<string>() : new Set(['JsonValue']);
  } else {
    // 普通 interface 类型（原有逻辑）
    const template = compileTemplate(getTypeTemplateByConfig(config.comment !== false));
    const properties = extractTypeProperties(type.schema, processedData);
    code = template({
      typeName: cleanTypeName,
      description: escapeJsDocComment(type.schema.description || type.name),
      properties,
    });
    dependencies = collectUsedTypesFromProperties(properties, processedData);
    // 递归自引用（如树形结构 children: Self[]）不得生成指向自身的 import，
    // 否则与自身声明冲突（TS2300 duplicate identifier）
    dependencies.delete(cleanTypeName);
    dependencies.delete(type.name);
  }

  if (dependencies.size > 0) {
    // 每个依赖一条独立 import，指向具体类型文件（而非自身所属的桶文件），
    // 消除「类型文件 A ← 桶 index ← 类型文件 A」的 type-only 循环引用
    const importStatements = Array.from(dependencies)
      .sort()
      .map((dep) => {
        const depFileName = getTypeFileName(sanitizeTypeName(dep));
        const importPath = getNormalizedPathWithAlias(typesDir, join(typesDir, `${depFileName}.ts`))
          .replace(/\.ts$/, '')
          .replace(/\/$/, '');
        return `import type { ${dep} } from '${importPath}';`;
      });
    code = `${importStatements.join('\n')}\n\n${code}`;
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
    const cleanFileName = getTypeFileName(cleanTypeName);
    indexContent += `export type { ${cleanTypeName} } from './${cleanFileName}';\n`;
  }

  const indexPath = join(typesDir, 'index.ts');
  await writeFormattedFile(indexPath, indexContent, hooks);

  logger.debug(`创建类型索引文件: ${indexPath}`);
}

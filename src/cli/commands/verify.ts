/**
 * @description 产物类型检查命令
 * 对生成的代码运行 TypeScript 类型检查（tsc --noEmit 语义），
 * 作为生成后的质量关卡：缺失 import、类型冲突等问题在此暴露，
 * 弥补消费方 tsconfig 通常将生成目录排除在类型检查之外的盲区。
 *
 * typescript 编译器优先复用消费方项目的依赖（process.cwd 向上解析），
 * 其次回退到本工具自身的 node_modules。
 */

import { Command } from 'commander';
import { readdirSync, statSync, existsSync } from 'fs';
import { join, resolve, relative } from 'path';
import { createRequire } from 'module';
import { pathToFileURL } from 'url';
import type { CompilerOptions } from 'typescript';
import { loadConfig } from '@/config/loader';
import { logger } from '@/utils/logger';
import { handleError } from '@/errors';

/** TypeScript 编译器模块实例类型（运行时动态解析） */
type TSModule = typeof import('typescript');

/**
 * @description 类型检查结果
 */
export interface TypeCheckResult {
  /** 是否通过（0 个诊断错误） */
  ok: boolean;
  /** 参与检查的生成文件数 */
  fileCount: number;
  /** 格式化后的诊断信息（`相对路径:行:列 - TSxxxx 消息`） */
  diagnostics: string[];
}

/**
 * @description 递归收集目录下所有 .ts 文件（忽略 node_modules）
 * @param dirs 目录绝对路径数组
 * @returns .ts 文件绝对路径数组
 *
 * @example
 * ```typescript
 * collectTypeScriptFiles(['/proj/src/service']);
 * // => ['/proj/src/service/index.ts', '/proj/src/service/types/User.ts', ...]
 * ```
 */
export function collectTypeScriptFiles(dirs: string[]): string[] {
  const files: string[] = [];
  /** 单目录递归遍历（目录不存在时静默跳过） */
  const walk = (dir: string): void => {
    let entries;
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry === 'node_modules') continue;
      const fullPath = join(dir, entry);
      let stat;
      try {
        stat = statSync(fullPath);
      } catch {
        continue;
      }
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (entry.endsWith('.ts')) {
        files.push(fullPath);
      }
    }
  };
  for (const dir of dirs) walk(dir);
  return files;
}

/**
 * @description 解析 typescript 模块路径（优先消费方项目，回退到本工具自身）
 * @param projectRoot 消费方项目根目录
 * @returns typescript 模块的绝对路径
 */
function resolveTypescriptPath(projectRoot: string): string {
  const anchors = [join(projectRoot, 'package.json'), import.meta.url];
  for (const anchor of anchors) {
    try {
      return createRequire(anchor).resolve('typescript');
    } catch {
      // 尝试下一个解析锚点
    }
  }
  throw new Error(
    '未找到 typescript 依赖：请先在项目中安装 typescript（pnpm add -D typescript），或检查 node_modules 是否完整',
  );
}

/**
 * @description 构建编译选项
 * 复用消费方 tsconfig.json 的 paths 别名等配置（强制 noEmit）；
 * 无 tsconfig 时使用默认选项，并按生成代码的别名约定推导 `@/*`
 * （`@` ≡ 生成目录路径中第一个 src/ 段，见 pathUtils.getAliasPath）。
 * @param ts TypeScript 编译器模块
 * @param projectRoot 消费方项目根目录
 * @param outputDirs 生成产物目录（用于推导别名回退）
 * @returns 编译器选项
 */
function buildCompilerOptions(
  ts: TSModule,
  projectRoot: string,
  outputDirs: string[],
): CompilerOptions {
  const tsconfigPath = join(projectRoot, 'tsconfig.json');
  if (existsSync(tsconfigPath)) {
    const { config } = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
    const existingOptions: CompilerOptions = { noEmit: true };
    const parsed = ts.parseJsonConfigFileContent(
      config,
      ts.sys,
      projectRoot,
      existingOptions,
      tsconfigPath,
    );
    // include/exclude 不生效：文件列表由调用方显式传入（生成目录通常被 tsconfig exclude）
    return { ...parsed.options, noEmit: true };
  }

  const defaults: CompilerOptions = {
    noEmit: true,
    strict: false,
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    skipLibCheck: true,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    lib: ['lib.es2020.d.ts', 'lib.dom.d.ts'],
    baseUrl: projectRoot,
  };

  const rel = relative(projectRoot, outputDirs[0] ?? projectRoot);
  const srcIdx = rel.split(/[/\\]/).indexOf('src');
  if (srcIdx !== -1) {
    const aliasBase = rel
      .split(/[/\\]/)
      .slice(0, srcIdx + 1)
      .join('/');
    defaults.paths = { '@/*': [`${aliasBase}/*`] };
  }
  return defaults;
}

/**
 * @description 对生成的文件集合运行类型检查
 * @param outputDirs 生成产物目录绝对路径数组
 * @param projectRoot 消费方项目根目录（用于 tsconfig 复用与诊断路径相对化）
 * @returns 类型检查结果
 *
 * @example
 * ```typescript
 * const result = await checkGeneratedFiles(['/proj/src/service'], '/proj');
 * if (!result.ok) console.error(result.diagnostics.join('\n'));
 * ```
 */
export async function checkGeneratedFiles(
  outputDirs: string[],
  projectRoot: string,
): Promise<TypeCheckResult> {
  const files = collectTypeScriptFiles(outputDirs);
  if (files.length === 0) {
    return { ok: true, fileCount: 0, diagnostics: [] };
  }

  const tsPath = resolveTypescriptPath(projectRoot);
  const ts = (await import(pathToFileURL(tsPath).href)) as TSModule;
  const options = buildCompilerOptions(ts, projectRoot, outputDirs);
  const program = ts.createProgram(files, options);
  const diagnostics = ts
    .getPreEmitDiagnostics(program)
    .filter((d) => d.file)
    .map((d) => {
      const pos = d.file!.getLineAndCharacterOfPosition(d.start ?? 0);
      const rel = relative(projectRoot, d.file!.fileName);
      return `${rel}:${pos.line + 1}:${pos.character + 1} - TS${d.code} ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`;
    })
    .sort();

  return { ok: diagnostics.length === 0, fileCount: files.length, diagnostics };
}

/**
 * @description 加载配置并对配置中所有服务的产物运行类型检查
 * @param configPath 配置文件绝对路径
 * @returns 类型检查结果
 */
export async function runTypeCheck(configPath: string): Promise<TypeCheckResult> {
  const configs = await loadConfig(configPath);
  const projectRoot = process.cwd();
  const outputDirs = [...new Set(configs.map((c) => resolve(projectRoot, c.outputDir)))];
  return checkGeneratedFiles(outputDirs, projectRoot);
}

export const verifyCommand = new Command('verify')
  .description('对生成的产物运行 TypeScript 类型检查（验证 import 与类型完整性）')
  .option('-c, --config <path>', '配置文件路径', 'api-power.config.ts')
  .option('-v, --verbose', '显示详细的错误信息和堆栈跟踪', false)
  .action(async (options) => {
    const { verbose = false } = options;
    try {
      const configPath = resolve(process.cwd(), options.config);
      const result = await runTypeCheck(configPath);

      if (result.ok) {
        logger.success(`类型检查通过：${result.fileCount} 个生成文件，0 个错误`);
        return;
      }

      logger.error(
        `类型检查发现 ${result.diagnostics.length} 个错误（共 ${result.fileCount} 个生成文件）：`,
      );
      for (const line of result.diagnostics) {
        logger.error(`  ${line}`);
      }
      process.exitCode = 1;
    } catch (error: any) {
      handleError(error, verbose);
    }
  });

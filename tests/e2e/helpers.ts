/**
 * @description 生成结果正确性 E2E 测试的共享脚手架
 *
 * 与单元测试的分工：单元测试验证工具内部函数的行为；本脚手架支撑第二类验证——
 * 走完整真实链路（真实配置文件 + 本地 HTTP 数据源 + generateCode）生成代码后，验证
 * 「生成结果」本身的正确性：
 * 1. 结构断言与快照（tests/e2e/__snapshots__）
 * 2. 生成代码的类型检查（typescript 编译器 API，noEmit）
 * 3. 生成代码的运行时请求行为（导入生成模块 + 捕获 axios 适配器收到的请求）
 */

import { createServer, type Server } from 'node:http';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import axios, { AxiosHeaders, type AxiosAdapter, type AxiosResponse } from 'axios';
import typescript from 'typescript';
import { generateCode } from '@/generator';
import { applyNamingStrategy } from '@/naming';
import { chineseToPinyinCamelCase } from '@/utils/path';
import type { ApiConfig } from '@/types';

/** 仓库根目录（测试始终从仓库根运行） */
export const REPO_ROOT = resolve(import.meta.dirname, '../..');

/** E2E 临时输出根目录（.gitignore 已有 .tmp* 规则，不会进入版本库） */
export const SCRATCH_DIR = join(REPO_ROOT, '.tmp-e2e');

/** 生成模块动态导入的缓存穿透计数器 */
let importBustCounter = 0;

/**
 * @description 启动本地 OpenAPI 数据源服务器，替代远端 Swagger 端点。
 * 走真实的 axios 拉取链路（SwaggerClient），仅数据固定为夹具。
 * @param routes 路径 → OpenAPI 文档映射（如 { '/pet/v3/api-docs': doc }）
 * @returns 端口与关闭函数
 *
 * @example
 * ```typescript
 * const api = await startOpenApiServer({ '/v3/api-docs': petOpenApiDocument });
 * // source 配置为 `http://127.0.0.1:${api.port}/v3/api-docs`
 * ```
 */
export async function startOpenApiServer(routes: Record<string, unknown>): Promise<{
  port: number;
  close: () => Promise<void>;
}> {
  const server: Server = createServer((req, res) => {
    const body = routes[req.url ?? ''];
    if (body === undefined) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: `unknown route: ${req.url}` }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  });

  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
  const address = server.address();
  if (!address || typeof address !== 'object') {
    throw new Error('本地 OpenAPI 服务器启动失败：未获得监听地址');
  }

  return {
    port: address.port,
    close: () =>
      new Promise<void>((done, reject) =>
        server.close((error) => (error ? reject(error) : done())),
      ),
  };
}

/**
 * @description 以真实配置文件驱动完整生成链路。
 * 写入 `.tmp-e2e/<caseName>/config.mjs`（内部 import 仓库源码的 defineConfig），
 * 调用 generateCode 走 loadConfig → fetchData → processOpenApiData → generateFiles 全流程。
 * @param caseName 用例名（同时是临时目录名，需全局唯一）
 * @param config defineConfig 的多服务配置（baseOutputDir 由本函数固定指向临时目录）
 * @returns 用例目录与输出根目录（绝对路径）
 */
export async function runGeneration(
  caseName: string,
  config: Record<string, unknown>,
): Promise<{ caseDir: string; outDir: string }> {
  const caseDir = join(SCRATCH_DIR, caseName);
  const outputRelative = `.tmp-e2e/${caseName}/out`;

  rmSync(caseDir, { recursive: true, force: true });
  mkdirSync(caseDir, { recursive: true });

  const entryFileUrl = pathToFileURL(join(REPO_ROOT, 'src/index.ts')).href;
  const configPath = join(caseDir, 'config.mjs');
  writeFileSync(
    configPath,
    [
      `import { defineConfig } from ${JSON.stringify(entryFileUrl)};`,
      `export default defineConfig(${JSON.stringify({
        baseOutputDir: outputRelative,
        ...config,
      })});`,
      '',
    ].join('\n'),
    'utf-8',
  );

  await generateCode(configPath);

  return { caseDir, outDir: join(REPO_ROOT, outputRelative) };
}

/**
 * @description 递归列出目录下全部生成文件（相对路径，按字典序）
 * @param dir 根目录
 * @returns 相对路径列表
 */
export function listGeneratedFiles(dir: string): string[] {
  const walk = (current: string): string[] =>
    readdirSync(current, { withFileTypes: true }).flatMap((entry) => {
      const fullPath = join(current, entry.name);
      return entry.isDirectory() ? walk(fullPath) : [fullPath];
    });
  return walk(dir)
    .map((fullPath) => relative(dir, fullPath))
    .toSorted();
}

/**
 * @description 读取生成的文件内容
 * @param dir 输出根目录
 * @param relativePath 相对路径
 * @returns 文件内容
 */
export function readGeneratedFile(dir: string, relativePath: string): string {
  return readFileSync(join(dir, relativePath), 'utf-8');
}

/**
 * @description 用 TypeScript 编译器 API 对生成目录做类型检查（noEmit）。
 * 诊断过滤为仅生成目录内的文件（配合 skipLibCheck，排除依赖包噪音）。
 * @param rootDir 生成输出根目录
 * @returns 诊断错误列表（空数组表示类型检查通过）
 *
 * @example
 * ```typescript
 * const errors = typeCheckGenerated(outDir);
 * expect(errors).toEqual([]);
 * ```
 */
export function typeCheckGenerated(rootDir: string): string[] {
  const rootNames = listGeneratedFiles(rootDir)
    .filter((file) => file.endsWith('.ts'))
    .map((file) => join(rootDir, file));
  if (rootNames.length === 0) {
    return [`${rootDir} 下没有可检查的 .ts 文件`];
  }

  const program = typescript.createProgram(rootNames, {
    strict: true,
    noEmit: true,
    target: typescript.ScriptTarget.ESNext,
    module: typescript.ModuleKind.ESNext,
    moduleResolution: typescript.ModuleResolutionKind.Bundler,
    esModuleInterop: true,
    skipLibCheck: true,
    lib: ['lib.esnext.d.ts', 'lib.dom.d.ts'],
    types: [],
  });

  return typescript
    .getPreEmitDiagnostics(program)
    .filter((diagnostic) => {
      const fileName = diagnostic.file?.fileName;
      return !!fileName && !relative(rootDir, fileName).startsWith('..');
    })
    .map((diagnostic) => {
      const file = diagnostic.file!;
      const position = file.getLineAndCharacterOfPosition(diagnostic.start ?? 0);
      const message = typescript.flattenDiagnosticMessageText(diagnostic.messageText, ' ');
      return `${relative(rootDir, file.fileName)}:${position.line + 1}:${
        position.character + 1
      } - TS${diagnostic.code}: ${message}`;
    });
}

/**
 * @description 动态导入生成模块（带缓存穿透，保证重新生成后拿到新内容）
 * @param absolutePath 生成文件绝对路径
 * @returns 模块导出对象
 */
export async function importGeneratedModule<T = Record<string, unknown>>(
  absolutePath: string,
): Promise<T> {
  const fileUrl = `${pathToFileURL(absolutePath).href}?e2e=${++importBustCounter}`;
  return import(fileUrl);
}

/** 适配器捕获到的请求事实（断言请求行为符合契约的依据） */
export interface CapturedRequest {
  url?: string;
  method?: string;
  baseURL?: string;
  params?: unknown;
  data?: unknown;
  headers?: Record<string, unknown>;
}

/**
 * @description 创建捕获 axios 请求的适配器。
 * 生成的 request 函数最终调用全局 axios（或 isolated 实例），替换 defaults.adapter
 * 即可在不发真实网络请求的前提下拿到「即将发出的请求」，并返回预设响应。
 * 注意：isolated 实例在生成模块加载时创建，须先 install 再导入生成模块。
 * @returns 捕获器（requests 历史与响应队列）
 *
 * @example
 * ```typescript
 * const capture = createRequestCapture();
 * capture.install();
 * capture.respondWith({ id: 1 });
 * await getPetByIdFunc({ petId: 1 });
 * expect(capture.requests[0]).toMatchObject({ url: '/pets/1', method: 'GET' });
 * capture.restore();
 * ```
 */
export function createRequestCapture(): {
  requests: CapturedRequest[];
  respondWith: (value: unknown) => void;
  install: () => void;
  restore: () => void;
} {
  const requests: CapturedRequest[] = [];
  const responseQueue: unknown[] = [];

  const normalizeHeaders = (headers: unknown): Record<string, unknown> => {
    const raw =
      headers instanceof AxiosHeaders
        ? headers.toJSON()
        : ((headers as { toJSON?: () => unknown })?.toJSON?.() ?? headers);
    if (!raw || typeof raw !== 'object') return {};
    return Object.fromEntries(
      Object.entries(raw as Record<string, unknown>).map(([key, value]) => [
        key.toLowerCase(),
        value,
      ]),
    );
  };

  const adapter: AxiosAdapter = async (config) => {
    requests.push({
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
      params: config.params,
      data: config.data,
      headers: normalizeHeaders(config.headers),
    });
    return {
      data: responseQueue.length > 0 ? responseQueue.shift() : {},
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    } as AxiosResponse;
  };

  let originalAdapter: AxiosAdapter | undefined;

  return {
    requests,
    respondWith: (value: unknown) => responseQueue.push(value),
    install: () => {
      originalAdapter = axios.defaults.adapter as AxiosAdapter | undefined;
      axios.defaults.adapter = adapter;
    },
    restore: () => {
      axios.defaults.adapter = originalAdapter;
    },
  };
}

/**
 * @description 按默认命名策略推算生成物标识符（与生成器内部使用同一实现，避免手写偏差）
 * @param path API 路径
 * @param method HTTP 方法（小写）
 * @returns 接口名 / 函数名 / 请求类型名 / 响应类型名
 */
export function generatedNames(path: string, method: string) {
  return applyNamingStrategy({
    path,
    method,
    tags: [],
    config: {} as ApiConfig,
  });
}

/**
 * @description 中文标签 → 输出目录名（与生成器同一实现）
 * @param tag 标签名
 * @returns 目录名
 */
export function tagDirName(tag: string): string {
  return chineseToPinyinCamelCase(tag);
}

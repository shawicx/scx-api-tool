/**
 * @description config/loader.ts 真实链路集成测试
 *
 * 不 mock validation/config/errors 模块，验证 loadConfig 完整流程能正确处理
 * 配置文件的两种导出形态：已处理（defineConfig 返回的 ApiConfig[]）与未处理（原始 MultiServiceConfig）。
 *
 * 回归场景：配置文件 `export default defineConfig({...})` 导出的是 ApiConfig[]，
 * loadConfigImpl 必须识别并跳过 validateConfiguration（其入参为 MultiServiceConfig），
 * 否则会因 config.services 校验失败而误报错误。
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolve, join } from 'path';
import { writeFileSync, mkdirSync, existsSync as realExistsSync, rmSync } from 'fs';

const tempDir = resolve(import.meta.dirname, '__integration_fixtures__');

if (!realExistsSync(tempDir)) {
  mkdirSync(tempDir, { recursive: true });
}

// 仅 mock logger（避免污染测试输出），保留 validation/config/errors 真实实现
vi.mock('@/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    success: vi.fn(),
  },
  setDebugEnabled: vi.fn(),
  isDebugEnabled: vi.fn(() => false),
}));

import { loadConfig, clearConfigCache } from '../loader';

/**
 * 写入临时配置文件（.mjs，ESM 直接可导入）。
 */
function writeFixture(filename: string, fileContent: string): string {
  const filePath = join(tempDir, filename);
  writeFileSync(filePath, fileContent, 'utf-8');
  return filePath;
}

describe('loadConfig 真实链路', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    try {
      if (realExistsSync(tempDir)) {
        rmSync(tempDir, { recursive: true, force: true });
      }
      mkdirSync(tempDir, { recursive: true });
    } catch {
      // 忽略清理错误
    }
  });

  it('已处理配置（导出 ApiConfig[]）：能正确加载，不触发 validateConfiguration 对 services 的误判', async () => {
    // 模拟 `export default defineConfig({...})` 的输出：一个完整的 ApiConfig[]。
    // isProcessedConfig 应识别它并跳过 validateConfiguration（其入参为 MultiServiceConfig），
    // 否则会因 config.services 校验失败而误报错误。
    const processedConfigArray = [
      {
        serverUrl: 'https://user-svc',
        serverType: 'swagger',
        source: 'https://user-svc/v3/api-docs',
        token: undefined,
        generateApi: true,
        generateTypes: true,
        typesFormat: 'typescript',
        target: 'typescript',
        transformPath: '((p) => p)',
        outputDir: 'src/api/user',
        indentSize: 2,
        comment: true,
        prodEnvName: 'production',
        requestFunctionFilePath: 'src/service/request.ts',
        requestMethodStyle: 'config',
        requestFunctionName: 'request',
        requestMethodsObjectName: 'requestMethods',
        requestParamName: 'params',
        responseTypeName: 'Response',
        concurrency: 50,
      },
    ];
    const filePath = writeFixture(
      'processed.mjs',
      `export default ${JSON.stringify(processedConfigArray, null, 2)};\n`,
    );

    const configs = await loadConfig(filePath, false);

    expect(Array.isArray(configs)).toBe(true);
    expect(configs).toHaveLength(1);
    expect(configs[0]!.source).toBe('https://user-svc/v3/api-docs');
    expect(configs[0]!.serverType).toBe('swagger');
    expect(configs[0]!.outputDir).toBe('src/api/user');
  });

  it('未用 defineConfig 包裹的原始对象会被 loader 拒绝', async () => {
    // 配置文件直接导出原始对象（未经 defineConfig 包裹）→ loader 视为格式无效并抛错
    const filePath = writeFixture(
      'raw.mjs',
      [
        'export default {',
        "  baseOutputDir: 'src/api',",
        '  services: [',
        "    { name: 'order', source: 'https://order-svc/swagger.json' },",
        '  ],',
        '};',
      ].join('\n'),
    );

    // loader 抛 configParseError（消息为"配置文件解析失败: <path>"，内层 originalError 含 defineConfig 提示）
    await expect(loadConfig(filePath, false)).rejects.toThrow(/配置文件解析失败/);
  });

  it('已处理的多服务配置：各服务 outputDir 已由 defineConfig 计算好', async () => {
    const processedMulti = [
      {
        serverUrl: 'https://user-svc',
        serverType: 'swagger',
        source: 'https://user-svc/v3/api-docs',
        generateApi: true,
        generateTypes: true,
        typesFormat: 'typescript',
        target: 'typescript',
        transformPath: '((p)=>p)',
        outputDir: 'src/api/user',
        indentSize: 2,
        comment: true,
        prodEnvName: 'production',
        requestFunctionFilePath: 'src/service/request.ts',
        requestMethodStyle: 'config',
        requestFunctionName: 'request',
        requestMethodsObjectName: 'requestMethods',
        requestParamName: 'params',
        responseTypeName: 'Response',
        concurrency: 50,
      },
      {
        serverUrl: 'https://order-svc',
        serverType: 'swagger',
        source: 'https://order-svc/swagger.json',
        generateApi: true,
        generateTypes: true,
        typesFormat: 'typescript',
        target: 'typescript',
        transformPath: '((p)=>p)',
        outputDir: 'src/api/trade/order',
        indentSize: 2,
        comment: true,
        prodEnvName: 'production',
        requestFunctionFilePath: 'src/service/request.ts',
        requestMethodStyle: 'config',
        requestFunctionName: 'request',
        requestMethodsObjectName: 'requestMethods',
        requestParamName: 'params',
        responseTypeName: 'Response',
        concurrency: 50,
      },
    ];
    const filePath = writeFixture(
      'multi.mjs',
      `export default ${JSON.stringify(processedMulti, null, 2)};\n`,
    );

    const configs = await loadConfig(filePath, false);

    expect(configs).toHaveLength(2);
    expect(configs[0]!.outputDir).toBe('src/api/user');
    expect(configs[1]!.outputDir).toBe('src/api/trade/order');
  });

  it('配置文件变更后重新加载能拿到新内容（穿透 ESM 模块缓存）', async () => {
    // 同一 URL 的动态 import 永远返回首次求值结果；loader 必须穿透模块缓存，
    // 否则 watch 模式下配置变更永远不生效
    const base = {
      serverUrl: 'https://user-svc',
      serverType: 'swagger',
      source: 'https://user-svc/v3/api-docs',
      generateApi: true,
      generateTypes: true,
      typesFormat: 'typescript',
      target: 'typescript',
      transformPath: '((p) => p)',
      indentSize: 2,
      comment: true,
      prodEnvName: 'production',
      requestFunctionFilePath: 'src/service/request.ts',
      requestMethodStyle: 'config',
      requestFunctionName: 'request',
      requestMethodsObjectName: 'requestMethods',
      requestParamName: 'params',
      responseTypeName: 'Response',
      concurrency: 50,
    };
    const filePath = writeFixture(
      'mutable.mjs',
      `export default [${JSON.stringify({ ...base, outputDir: 'src/api/old' })}];\n`,
    );
    const first = await loadConfig(filePath, false);
    expect(first[0]!.outputDir).toBe('src/api/old');

    // 覆写配置文件后重新加载（useCache=false），应拿到新值
    writeFileSync(
      filePath,
      `export default [${JSON.stringify({ ...base, outputDir: 'src/api/new' })}];\n`,
      'utf-8',
    );
    const second = await loadConfig(filePath, false);
    expect(second[0]!.outputDir).toBe('src/api/new');
  });

  it('TTL 缓存命中时返回同一引用，clearConfigCache 后重新求值', async () => {
    const config = {
      serverUrl: 'https://user-svc',
      serverType: 'swagger',
      source: 'https://user-svc/v3/api-docs',
      outputDir: 'src/api/cached',
      generateApi: true,
      generateTypes: true,
      typesFormat: 'typescript',
      target: 'typescript',
      transformPath: '((p) => p)',
      indentSize: 2,
      comment: true,
      prodEnvName: 'production',
      requestFunctionFilePath: 'src/service/request.ts',
      requestMethodStyle: 'config',
      requestFunctionName: 'request',
      requestMethodsObjectName: 'requestMethods',
      requestParamName: 'params',
      responseTypeName: 'Response',
      concurrency: 50,
    };
    const filePath = writeFixture('cached.mjs', `export default [${JSON.stringify(config)}];\n`);

    // 5s TTL 内命中缓存：返回同一数组引用，不重新 import
    const first = await loadConfig(filePath);
    const second = await loadConfig(filePath);
    expect(second).toBe(first);

    // 清除缓存后：重新 import（且穿透模块缓存），返回新引用
    clearConfigCache(filePath);
    const third = await loadConfig(filePath);
    expect(third).not.toBe(first);
  });
});

/**
 * @description generateRootIndexFile 单元测试
 * 覆盖 4 个 if/else 分支（zod+types / zod / ts-types / api-only）的输出等价性
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateRootIndexFile } from '../rootIndexGenerator';
import type { ApiConfig } from '@/types';
import type { ProcessedApiData } from '@/processors/openapi';
import { minimalApiConfig } from '../../../../tests/fixtures/mockData';

// 捕获最后一次写入的内容，供断言使用
const captured: { content: string; path: string } = { content: '', path: '' };

// Mock writeFormattedFile 以捕获输出内容（不实际写文件）
vi.mock('@/utils/file', () => ({
  writeFormattedFile: vi.fn(async (filePath: string, content: string) => {
    captured.content = content;
    captured.path = filePath;
  }),
  ensureDir: vi.fn(),
  fileExists: vi.fn(async () => false),
}));

import { writeFormattedFile } from '@/utils/file';

const mockWrite = vi.mocked(writeFormattedFile);

const baseProcessedData: ProcessedApiData = {
  interfaces: [],
  types: [],
  categories: [{ name: '用户管理' }, { name: '订单管理' }],
};

describe('generateRootIndexFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.DEBUG;
  });

  it('Zod + types 模式（generateApi）应导出 schema + tag 目录', async () => {
    const config: ApiConfig = {
      ...minimalApiConfig,
      typesFormat: 'zod',
      generateApi: true,
      generateTypes: true,
    };

    await generateRootIndexFile(baseProcessedData, config);

    const { content } = captured;
    // 根 index 不再 re-export 共享 request（服务桶只暴露本服务 API 面）
    expect(content).not.toMatch(/export \* from '.*request';/);
    // 每个 tag 的 schema
    expect(content).toContain("export * from './YongHuGuanLi/schema';");
    expect(content).toContain("export * from './DingDanGuanLi/schema';");
    // schemas 索引
    expect(content).toContain("export * from './schemas';");
    // generateApi 时也导出 tag 目录
    expect(content).toContain("export * from './YongHuGuanLi';");
  });

  it('Zod + types 模式（仅 types）应只导出 schema，不导出 tag 目录', async () => {
    const config: ApiConfig = {
      ...minimalApiConfig,
      typesFormat: 'zod',
      generateApi: false,
      generateTypes: true,
    };

    await generateRootIndexFile(baseProcessedData, config);

    const { content } = captured;
    expect(content).toContain("export * from './YongHuGuanLi/schema';");
    expect(content).toContain("export * from './schemas';");
    // generateApi=false 时不导出 tag 目录
    expect(content).not.toContain("export * from './YongHuGuanLi';\n");
  });

  it('Zod 非 types 模式应导出 tag 目录', async () => {
    const config: ApiConfig = {
      ...minimalApiConfig,
      typesFormat: 'zod',
      generateApi: true,
      generateTypes: false,
    };

    await generateRootIndexFile(baseProcessedData, config);

    const { content } = captured;
    expect(content).toContain("export * from './YongHuGuanLi';");
    expect(content).toContain("export * from './DingDanGuanLi';");
    // 非 types 模式不导出 schema
    expect(content).not.toContain('/schema');
    expect(content).not.toContain("'./schemas'");
  });

  it('TS types 模式应导出 tag 目录 + types 索引', async () => {
    const config: ApiConfig = {
      ...minimalApiConfig,
      typesFormat: 'typescript',
      generateApi: true,
      generateTypes: true,
    };

    await generateRootIndexFile(baseProcessedData, config);

    const { content } = captured;
    expect(content).toContain("export * from './YongHuGuanLi';");
    expect(content).toContain("export * from './types';");
  });

  it('api-only 模式应只导出 tag 目录', async () => {
    const config: ApiConfig = {
      ...minimalApiConfig,
      typesFormat: 'typescript',
      generateApi: true,
      generateTypes: false,
    };

    await generateRootIndexFile(baseProcessedData, config);

    const { content } = captured;
    expect(content).toContain("export * from './YongHuGuanLi';");
    expect(content).not.toContain("export * from './types';");
    expect(content).not.toContain('/schema');
  });

  it('所有模式均不应 re-export 共享的 request 模块', async () => {
    const modes: ApiConfig[] = [
      { ...minimalApiConfig, typesFormat: 'typescript', generateApi: true, generateTypes: true },
      { ...minimalApiConfig, typesFormat: 'typescript', generateApi: true, generateTypes: false },
      { ...minimalApiConfig, typesFormat: 'zod', generateApi: true, generateTypes: true },
      { ...minimalApiConfig, typesFormat: 'zod', generateApi: false, generateTypes: true },
    ];

    for (const config of modes) {
      await generateRootIndexFile(baseProcessedData, config);
      // request 是 baseOutputDir 层的共享基础设施，由消费方直接从其模块导入
      expect(captured.content, `模式 ${config.typesFormat}/${config.generateApi}`).not.toMatch(
        /export \* from '.*request';/,
      );
    }
  });

  it('应写入到 outputDir/index.ts', async () => {
    const config: ApiConfig = { ...minimalApiConfig, outputDir: 'src/service' };

    await generateRootIndexFile(baseProcessedData, config);

    expect(captured.path).toContain('index.ts');
  });
});

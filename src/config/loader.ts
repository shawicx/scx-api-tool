import { existsSync } from 'fs';
import { resolve } from 'path';
import { pathToFileURL } from 'url';
import { ApiConfig } from '../types';

/**
 * 默认配置值
 */
const DEFAULT_CONFIG_VALUES: Partial<ApiConfig> = {
  typesOnly: false,
  target: 'typescript',
  pathPrefix: '',
  outputDir: 'src/service',
  indentSize: 2,
  comment: true, // 默认生成注释
  reactHooks: {
    enabled: false,
  },
  prodEnvName: 'production',
  requestFunctionFilePath: 'src/service/request.ts',
  project: {
    categories: [],
  },
};

/**
 * 合并默认配置和用户配置
 */
function mergeWithDefaults(userConfig: Partial<ApiConfig>): ApiConfig {
  return {
    ...DEFAULT_CONFIG_VALUES,
    ...userConfig,
    // 深度合并嵌套对象
    reactHooks: {
      ...DEFAULT_CONFIG_VALUES.reactHooks,
      ...userConfig.reactHooks,
    },
    project: {
      ...DEFAULT_CONFIG_VALUES.project,
      ...userConfig.project,
      categories: userConfig.project?.categories || DEFAULT_CONFIG_VALUES.project!.categories!,
    },
  };
}

export async function loadConfig(configPath: string): Promise<ApiConfig> {
  const absolutePath = resolve(configPath);

  if (!existsSync(absolutePath)) {
    throw new Error(`Configuration file not found: ${absolutePath}`);
  }

  try {
    // 为 ESM 兼容性将文件路径转换为文件 URL
    const fileUrl = pathToFileURL(absolutePath).href;

    // 动态导入配置
    const configModule = await import(fileUrl);

    // 处理默认导出和命名导出
    const userConfig = configModule.default || configModule;

    // 合并默认配置和用户配置
    const finalConfig = mergeWithDefaults(userConfig);

    return finalConfig;
  } catch (error: any) {
    throw new Error(`从 ${absolutePath} 加载配置失败: ${error.message}`);
  }
}

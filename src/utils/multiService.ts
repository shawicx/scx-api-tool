/**
 * @description 多服务配置解析模块
 * 将多服务用户配置（MultiServiceConfig）解析为单服务运行时配置数组（ApiConfig[]）
 *
 * 流程：先校验原始配置（validateConfiguration），再合并处理（应用 preset、计算 outputDir、规范化 transformPath）。
 */

import { ApiConfig, MultiServiceConfig } from '@/types';
import { join } from 'path';
import { validateConfiguration } from '@/validation';
import { applyPreset, parseSourceUrl, normalizeTransformPath } from './config';

/** 公共根输出目录默认值 */
const DEFAULT_BASE_OUTPUT_DIR = 'src/service';

/**
 * @description 将多服务用户配置解析为运行时 ApiConfig 数组。
 *
 * 先调用 validateConfiguration 对原始 MultiServiceConfig 做完整校验（必填、类型、枚举、URL、
 * 逻辑、服务名唯一性、outputDir 隔离等），校验通过后再合并处理：对每个 service 以公共配置
 * （已应用 preset）为基础浅合并覆盖，计算 source 解析信息、outputDir（join(baseOutputDir, folder ?? name)）、
 * 规范化 transformPath，产出单个 ApiConfig。
 *
 * @param config 多服务用户配置
 * @returns ApiConfig[] 每个元素为单服务运行时配置
 *
 * @example
 * ```typescript
 * const configs = resolveServiceConfigs({
 *   baseOutputDir: 'src/api',
 *   services: [
 *     { name: 'user', source: 'https://user-svc/v3/api-docs' },
 *     { name: 'order', source: 'https://order-svc/swagger.json', folder: 'trade/order' },
 *   ],
 * });
 * // configs[0].outputDir === 'src/api/user'
 * // configs[1].outputDir === 'src/api/trade/order'
 * ```
 */
export function resolveServiceConfigs(config: MultiServiceConfig): ApiConfig[] {
  // 先校验原始 MultiServiceConfig（在合并处理之前），确保无效配置尽早失败
  validateConfiguration(config);

  // 公共配置应用 preset（剔除 services/baseOutputDir）
  const { services: _services, baseOutputDir: _baseOutputDir, ...commonRaw } = config;
  const common = applyPreset(commonRaw);
  const baseOutputDir = config.baseOutputDir ?? DEFAULT_BASE_OUTPUT_DIR;

  // 当 target 为 javascript 时，自动调整默认的 requestFunctionFilePath 扩展名
  // （applyPreset 已合并 DEFAULT_CONFIG_VALUES，requestFunctionFilePath 必然存在）
  if (common.target === 'javascript' && !config.requestFunctionFilePath) {
    common.requestFunctionFilePath = common.requestFunctionFilePath!.replace(/\.ts$/, '.js');
  }

  // 公共配置经 applyPreset 后已填充所有默认值，具备 ApiConfig 必填字段
  const commonApi = common as ApiConfig;

  return config.services.map((svc) => {
    // service 配置覆盖公共配置（浅合并）；preset 仅在公共配置层生效，service 不可覆盖
    const merged: ApiConfig = { ...commonApi, ...svc };

    // 解析 source 服务器信息
    const { serverUrl, serverType, apifoxProjectId } = parseSourceUrl(svc.source);

    // 计算 outputDir：join(baseOutputDir, folder ?? name)
    const folder = svc.folder ?? svc.name;
    const outputDir = join(baseOutputDir, folder);

    const finalConfig: ApiConfig = {
      ...merged,
      serverUrl,
      serverType,
      apifoxProjectId,
      source: svc.source,
      token: svc.token,
      outputDir,
    };

    // 规范化 transformPath：统一为函数形式（0.6.0 起 string 已硬废弃）
    finalConfig.transformPath = normalizeTransformPath(finalConfig.transformPath);

    return finalConfig;
  });
}

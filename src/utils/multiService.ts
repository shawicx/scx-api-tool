/**
 * @description 多服务配置解析模块
 * 将多服务用户配置（MultiServiceConfig）解析为单服务运行时配置数组（ApiConfig[]）
 *
 * 流程：先校验原始配置（validateConfiguration），再合并处理（应用 preset、计算 outputDir、规范化 transformPath）。
 */

import { ApiConfig, MultiServiceConfig } from '@/types';
import { join } from 'path';
import { validateConfiguration } from '@/validation';
import { applyPreset, parseSourceUrl, normalizeTransformPath, getFileExtension } from './config';

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

  // 用户是否显式配置了顶层 requestFunctionFilePath（applyPreset 之前检测，
  // 用于决定默认路径是否跟随 baseOutputDir）
  const hasExplicitRequestFilePath =
    typeof config.requestFunctionFilePath === 'string' &&
    config.requestFunctionFilePath.trim() !== '';

  // 公共配置应用 preset（剔除 services/baseOutputDir）
  const { services: _services, baseOutputDir: _baseOutputDir, ...commonRaw } = config;
  const common = applyPreset(commonRaw);
  const baseOutputDir = config.baseOutputDir ?? DEFAULT_BASE_OUTPUT_DIR;

  // 未显式配置 requestFunctionFilePath 时，共享默认路径跟随 baseOutputDir
  // （默认 baseOutputDir 为 'src/service'，与历史硬编码默认值一致，向后兼容）；
  // 扩展名按 target 自动调整；显式配置的路径不做任何改写
  if (!hasExplicitRequestFilePath) {
    common.requestFunctionFilePath = join(
      baseOutputDir,
      `request${getFileExtension(common.target ?? 'typescript')}`,
    );
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

    // isolated 服务未显式配置 requestFunctionFilePath 时，
    // 默认在本服务输出目录内生成独立 request 文件（扩展名按 target 调整）
    const svcHasExplicitRequestFilePath =
      typeof svc.requestFunctionFilePath === 'string' && svc.requestFunctionFilePath.trim() !== '';
    if (merged.requestMode === 'isolated' && !svcHasExplicitRequestFilePath) {
      merged.requestFunctionFilePath = join(
        outputDir,
        `request${getFileExtension(merged.target ?? 'typescript')}`,
      );
    }

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

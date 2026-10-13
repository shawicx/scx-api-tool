/**
 * @description 服务输出目录隔离验证器
 * 校验各服务计算后的 outputDir 不相同、不嵌套，避免生成时 cleanOutputDir 相互清理覆盖
 */

import { join, resolve, relative } from 'path';
import { ValidationError, ValidationSeverity, createValidationError } from '../errors';
import type { CommonServiceConfig, MultiServiceConfig, ServiceConfig } from '@/types';

/** 公共根输出目录默认值（与 src/utils/multiService.ts 保持一致） */
const DEFAULT_BASE_OUTPUT_DIR = 'src/service';

/**
 * @description 计算两个路径是否存在祖先-后代关系（相同或嵌套）。
 * 通过 path.relative 判断：若任一方向的相对路径不含 '..'，则一方是另一方的祖先。
 */
function isNestedOrSame(a: string, b: string): boolean {
  if (a === b) return true;
  const relAB = relative(a, b);
  const relBA = relative(b, a);
  return (relAB !== '' && !relAB.startsWith('..')) || (relBA !== '' && !relBA.startsWith('..'));
}

/**
 * @description 计算单个服务的 outputDir（join(baseOutputDir, folder ?? name)）
 */
function computeOutputDir(svc: ServiceConfig, baseOutputDir: string): string {
  return join(baseOutputDir, svc.folder ?? svc.name);
}

/**
 * @description 校验各服务 outputDir 不相同、不嵌套。
 *
 * outputDir 由 baseOutputDir 与各服务的 folder（默认取 name）计算得出。
 * 若两个服务的 outputDir 完全相同或相互嵌套，生成阶段 cleanOutputDir 会相互清理覆盖，
 * 因此在配置阶段（处理前）即拦截。
 *
 * @param services 服务配置数组
 * @param baseOutputDir 公共根输出目录（默认 'src/service'）
 * @returns 验证错误数组
 */
export function validateServiceOutputDirs(
  services: ServiceConfig[],
  baseOutputDir: string = DEFAULT_BASE_OUTPUT_DIR,
): ValidationError[] {
  const errors: ValidationError[] = [];

  // 预计算每个服务的 (name, outputDir 绝对路径)
  const computed = services.map((svc) => ({
    name: svc.name,
    outputDir: computeOutputDir(svc, baseOutputDir),
    absDir: resolve(process.cwd(), computeOutputDir(svc, baseOutputDir)),
  }));

  for (let i = 0; i < computed.length; i++) {
    for (let j = i + 1; j < computed.length; j++) {
      const a = computed[i]!;
      const b = computed[j]!;
      if (isNestedOrSame(a.absDir, b.absDir)) {
        errors.push(
          createValidationError(
            `services[${a.name}] & services[${b.name}]`,
            'OUTPUT_DIR_CONFLICT',
            `服务 "${a.name}" 与 "${b.name}" 的输出目录相同或嵌套: ${a.outputDir} ↔ ${b.outputDir}，会导致生成时相互清理覆盖`,
            ValidationSeverity.ERROR,
            '为每个服务指定独立的 folder（省略时默认取 name，天然隔离）：\n' +
              '  services: [\n' +
              '    { name: "user", folder: "user" },\n' +
              '    { name: "order", folder: "order" },\n' +
              '  ]',
            {
              serviceA: a.name,
              outputDirA: a.outputDir,
              serviceB: b.name,
              outputDirB: b.outputDir,
            },
          ),
        );
      }
    }
  }

  return errors;
}

/**
 * @description 计算服务的有效 requestFunctionFilePath（与 resolveServiceConfigs 的默认逻辑一致）。
 * 显式配置优先；否则 shared 模式取 join(baseOutputDir, 'request')，isolated 模式取服务输出目录内路径。
 * 此处仅用于冲突检测的路径归一化，不做扩展名区分（.ts/.js 视为同一路径）。
 */
function computeEffectiveRequestFilePath(
  svc: ServiceConfig,
  common: CommonServiceConfig,
  baseOutputDir: string,
): string {
  const explicit =
    typeof svc.requestFunctionFilePath === 'string' && svc.requestFunctionFilePath.trim() !== ''
      ? svc.requestFunctionFilePath
      : typeof common.requestFunctionFilePath === 'string' &&
          common.requestFunctionFilePath.trim() !== ''
        ? common.requestFunctionFilePath
        : undefined;
  if (explicit) return explicit.replace(/\.(ts|js)$/, '');
  const mode = svc.requestMode ?? common.requestMode ?? 'shared';
  if (mode === 'isolated') {
    return join(baseOutputDir, svc.folder ?? svc.name, 'request');
  }
  return join(baseOutputDir, 'request');
}

/**
 * @description 校验共享同一 request 文件的服务是否存在配置冲突。
 *
 * 共享 request 文件仅首次生成（已存在即跳过），后生成的服务无法把自身的
 * requestTimeout/requestBaseURL 烘焙进文件；若多个共享服务的这些配置不一致，
 * 实际生效的将是首个生成服务的值，容易造成隐蔽 bug，因此提前给出警告。
 *
 * @param config 多服务用户配置
 * @returns 验证错误数组（仅 WARNING，不阻断执行）
 */
export function validateSharedRequestConfigs(config: MultiServiceConfig): ValidationError[] {
  const errors: ValidationError[] = [];
  const baseOutputDir = config.baseOutputDir ?? DEFAULT_BASE_OUTPUT_DIR;
  const { services: _s, baseOutputDir: _b, ...common } = config;

  // 仅 shared 模式的服务参与共享文件分组
  const sharedServices = config.services.filter(
    (svc) => (svc.requestMode ?? common.requestMode ?? 'shared') !== 'isolated',
  );

  const groups = new Map<string, ServiceConfig[]>();
  for (const svc of sharedServices) {
    const key = resolve(
      process.cwd(),
      computeEffectiveRequestFilePath(svc, common as CommonServiceConfig, baseOutputDir),
    );
    const list = groups.get(key) ?? [];
    list.push(svc);
    groups.set(key, list);
  }

  for (const [key, members] of groups) {
    if (members.length < 2) continue;
    const timeouts = new Set(
      members.map((m) => String(m.requestTimeout ?? common.requestTimeout ?? 5 * 1000)),
    );
    if (timeouts.size > 1) {
      errors.push(
        createValidationError(
          `services[${members.map((m) => m.name).join(' & ')}]`,
          'SHARED_REQUEST_CONFLICT',
          `共享同一 request 文件的服务 requestTimeout 不一致: ${key}`,
          ValidationSeverity.WARNING,
          '共享 request 文件仅首次生成，后生成的服务无法覆盖其中的超时常量。' +
            '请统一公共 requestTimeout，或为超时不同的服务设置 requestMode: "isolated"',
          members.map((m) => ({ name: m.name, requestTimeout: m.requestTimeout })),
        ),
      );
    }
  }

  return errors;
}

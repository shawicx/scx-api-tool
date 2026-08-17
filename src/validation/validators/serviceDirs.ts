/**
 * @description 服务输出目录隔离验证器
 * 校验各服务计算后的 outputDir 不相同、不嵌套，避免生成时 cleanOutputDir 相互清理覆盖
 */

import { join, resolve, relative } from 'path';
import { ValidationError, ValidationSeverity, createValidationError } from '../errors';
import type { ServiceConfig } from '@/types';

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

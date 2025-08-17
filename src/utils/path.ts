/*
 * @Author: shawicx d35f3153@proton.me
 * @Date: 2025-08-08 23:50:48
 * @LastEditors: shawicx d35f3153@proton.me
 * @LastEditTime: 2025-08-17 09:07:43
 * @Description:
 */
import path from 'path';
import TinyPinyin from 'tiny-pinyin';
import { ChangeCase, Interface } from './apiTypes';

/**
 * @description 将路径统一为 unix 风格的路径。
 * @param pathParam 路径
 * @returns unix 风格的路径
 */
export function toUnixPath(pathParam: string) {
  return pathParam.replace(/[/\\]+/g, '/');
}

/**
 * @description 获得规范化的相对路径。
 * @param from 来源路径
 * @param to 去向路径
 * @returns 相对路径
 */
export function getNormalizedRelativePath(from: string, to: string) {
  return toUnixPath(path.relative(path.dirname(from), to))
    .replace(/^(?=[^.])/, './')
    .replace(/\.(ts|js)x?$/i, '');
}

/**
 * @description 获取输出文件路径
 * @param interfaceInfo 接口信息
 * @param changeCase 大小写转换函数
 * @param outputDir 输出目录
 * @returns 输出文件路径
 */
export function getOutputFilePath(
  interfaceInfo: Interface,
  changeCase: ChangeCase,
  outputDir = 'src/service',
): string {
  const dirName = interfaceInfo._category.name;
  // dirName 为 客户管理/业务套餐
  // 返回 {outputDir}/kehuguanli/yewutaocan/index.ts
  // 将中文转换为拼音
  const dirNameCn = dirName
    .split('/')
    .map((segment) => {
      // 客户管理
      return segment
        .split('')
        .filter(Boolean)
        .map((item) => {
          return changeCase.upperCaseFirst(
            changeCase.lowerCase(TinyPinyin.convertToPinyin(item)).trim(),
          );
        })
        .join('');
    })
    .join('/');
  return `${outputDir}/${dirNameCn}/index.ts`;
}

/**
 * @description 转换路径数组
 * @param pathsArray 路径数组
 * @param outputDir 输出目录
 * @returns 转换后的路径数组
 */
export function transformPaths(pathsArray: string[], outputDir = 'src/service'): string[] {
  // 目标路径片段，用于定位需要截取的位置
  const targetSegments = outputDir.split('/');

  return pathsArray.map((originalPath) => {
    // 规范化路径，处理不同系统的分隔符
    const normalizedPath = path.normalize(originalPath);
    // 拆分路径为片段数组
    const pathSegments = normalizedPath.split(path.sep);

    // 查找目标目录连续出现的位置
    let targetIndex = -1;
    for (let i = 0; i <= pathSegments.length - targetSegments.length; i++) {
      let found = true;
      for (let j = 0; j < targetSegments.length; j++) {
        if (pathSegments[i + j] !== targetSegments[j]) {
          found = false;
          break;
        }
      }
      if (found) {
        targetIndex = i;
        break;
      }
    }

    if (targetIndex === -1) {
      // 如果未找到目标片段，返回原始路径（可根据需求调整错误处理）
      return `// 无法处理路径: ${originalPath}`;
    }

    // 提取目标目录之后的路径片段
    const relativeSegments = pathSegments.slice(targetIndex + targetSegments.length);
    // 组合为相对路径，使用 POSIX 风格的 '/' 作为分隔符（符合导入语句规范）
    const relativePath = `./${relativeSegments.join('/')}/index`;

    // 生成导出语句
    return `export * from '${relativePath}'`;
  });
}

/**
 * @description 路径转换工具
 * 提供中文到拼音转换、路径生成等功能
 */

import { pinyin } from 'pinyin-pro';

/**
 * @description 将中文转换为拼音-大驼峰格式
 * @example 例如: "角色管理" -> "JiaoSeGuanli", "AI 服务" -> "AIFuwu"
 * @param chinese 中文字符串
 * @returns 拼音-大驼峰格式字符串
 */
export function chineseToPinyinCamelCase(chinese: string): string {
  // 先去除特殊字符（空格、括号等），只保留字母、数字、中文
  const cleaned = chinese.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '');

  // 使用pinyin-pro库将中文转换为拼音
  const pinyinArray = pinyin(cleaned, { toneType: 'none', type: 'array' });

  // 将拼音数组转换为大驼峰格式
  return pinyinArray
    .filter((p: string) => p.length > 0) // 过滤空字符串
    .map((p: string) => {
      // 首字母大写，其余字母小写
      return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
    })
    .join('');
}

/**
 * @description 根据API标签生成目录路径
 * @param tags API标签数组
 * @returns 目录路径数组
 */
export function generateDirectoryPath(tags: string[]): string[] {
  return tags.map((tag) => chineseToPinyinCamelCase(tag));
}

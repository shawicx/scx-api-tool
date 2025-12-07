/*
 * @description shawicx d35f3153@proton.me
 */
import { pinyin } from 'pinyin-pro';

/**
 * @description 将中文转换为拼音-大驼峰格式
 * @example 例如: "角色管理" -> "JiaoSeGuanli"
 * @param chinese 中文字符串
 * @returns 拼音-大驼峰格式字符串
 */
export function chineseToPinyinCamelCase(chinese: string): string {
  // 使用pinyin-pro库将中文转换为拼音
  const pinyinArray = pinyin(chinese, { toneType: 'none', type: 'array' });

  // 将拼音数组转换为大驼峰格式
  return pinyinArray
    .map((p: string) => {
      // 首字母大写，其余字母小写
      return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
    })
    .join('');
}

/**
 * 根据API标签生成目录路径
 * @param tags API标签数组
 * @returns 目录路径数组
 */
export function generateDirectoryPath(tags: string[]): string[] {
  return tags.map((tag) => chineseToPinyinCamelCase(tag));
}

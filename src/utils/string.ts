/*
 * @Author: shawicx d35f3153@proton.me
 * @Date: 2025-08-08 23:27:42
 * @LastEditors: shawicx d35f3153@proton.me
 * @LastEditTime: 2025-08-13 23:03:44
 * @Description: 字符串处理工具函数
 */
import { QueryStringArrayFormat } from './enums';

/**
 * @description 移除每一行的公共前导空白。
 * @public
 * @param text 文本
 * @returns 返回处理后的结果
 * @example
 * ```typescript
 * dedent(' a\n b') // => 'a\nb'
 * ```
 */
export function dedent(text: string): string;

/**
 * @description 首先，每一行紧跟前导空白的插入值为多行时，保持缩进。
 * @description 然后，移除每一行的公共前导空白。
 * @public
 * @param literals 字面值
 * @param interpolations 插入值
 * @returns 返回处理后的结果
 * @example
 * ```typescript
 * dedent` a\n b` // => 'a\nb'
 * ```
 */
export function dedent(
  literals: TemplateStringsArray,
  ...interpolations: Array<string | number>
): string;

/**
 * @description 首先，每一行紧跟前导空白的插入值为多行时，保持缩进。
 * @description 然后，移除每一行的公共前导空白。
 * @public
 * @param literals 字面值
 * @param interpolations 插入值
 * @returns 返回处理后的结果
 * @example
 * ```typescript
 * dedent` a\n b` // => 'a\nb'
 * ```
 */
export function dedent(
  literals: TemplateStringsArray | string,
  ...interpolations: Array<string | number>
): string {
  const text = Array.isArray(literals)
    ? (() => {
        let result = '';
        for (let i = 0; i < interpolations.length; i++) {
          const literal = literals[i];
          let interpolation = interpolations[i];
          const match = literal.match(/(?:^|[\r\n]+)([^\S\r\n]*)$/);
          if (match && match[1]) {
            interpolation = String(interpolation).replace(/([\r\n]+)(?=[^\r\n])/g, `$1${match[1]}`);
          }
          result += literal;
          result += interpolation;
        }
        result += literals[literals.length - 1];
        return result;
      })()
    : (literals as string);

  // 公共的前导空白
  let commonLeadingWhitespace!: string;
  // 第一个非空行
  let firstLineIndex!: number;
  // 最后一个非空行
  let lastLineIndex!: number;

  const lines = text.split(/[\r\n]/g);

  for (let index = 0; index < lines.length; index++) {
    // 当前行的前导空白
    const leadingWhitespace = lines[index].match(/^\s*/)![0];
    // 如果当前行的前导空白等于当前行的长度，则认为这是一个空行，跳过
    if (leadingWhitespace.length !== lines[index].length) {
      lastLineIndex = index;
      if (firstLineIndex == null) {
        firstLineIndex = index;
      }
      if (
        commonLeadingWhitespace == null ||
        leadingWhitespace.length < commonLeadingWhitespace.length
      ) {
        commonLeadingWhitespace = leadingWhitespace;
      }
    }
  }

  return commonLeadingWhitespace == null
    ? text
    : lines
        .slice(firstLineIndex, lastLineIndex + 1)
        .map((line) => line.substr(commonLeadingWhitespace.length))
        .join('\n');
}

/**
 * @description 将键值对转换为查询字符串格式。
 * @param key 键名
 * @param value 值
 * @param arrayFormat 数组格式
 * @returns 查询字符串
 */
export function queryStringify(
  key: string,
  value: any,
  arrayFormat: QueryStringArrayFormat,
): string {
  let str = '';
  if (value != null) {
    if (!Array.isArray(value)) {
      str = `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    } else if (arrayFormat === QueryStringArrayFormat.indices) {
      str = value
        .map((v, i) => `${encodeURIComponent(`${key}[${i}]`)}=${encodeURIComponent(v)}`)
        .join('&');
    } else if (arrayFormat === QueryStringArrayFormat.repeat) {
      str = value.map((v) => `${encodeURIComponent(key)}=${encodeURIComponent(v)}`).join('&');
    } else if (arrayFormat === QueryStringArrayFormat.comma) {
      str = `${encodeURIComponent(key)}=${encodeURIComponent(value.join(','))}`;
    } else if (arrayFormat === QueryStringArrayFormat.json) {
      str = `${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(value))}`;
    } else {
      str = value
        .map((v) => `${encodeURIComponent(`${key}[]`)}=${encodeURIComponent(v)}`)
        .join('&');
    }
  }
  return str;
}

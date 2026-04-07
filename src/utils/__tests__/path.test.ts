/**
 * @description path.ts 单元测试
 */

import { describe, it, expect, vi } from 'vitest';

// Mock pinyin-pro for deterministic tests
vi.mock('pinyin-pro', () => ({
  pinyin: vi.fn((input: string) => {
    // Simple deterministic mock: map known Chinese characters to pinyin
    // and pass through English characters/numbers as individual characters
    const charMap: Record<string, string> = {
      角: 'jiao',
      色: 'se',
      管: 'guan',
      理: 'li',
      用: 'yong',
      户: 'hu',
      服: 'fu',
      务: 'wu',
      系: 'xi',
      统: 'tong',
      订: 'ding',
      单: 'dan',
    };

    const results: string[] = [];
    for (const char of input) {
      if (charMap[char]) {
        results.push(charMap[char]);
      } else if (/[a-zA-Z]/.test(char)) {
        results.push(char);
      } else if (/\d/.test(char)) {
        results.push(char);
      }
      // Other chars (special chars, spaces) are ignored
    }
    return results;
  }),
}));

import { chineseToPinyinCamelCase, generateDirectoryPath } from '../path';

describe('chineseToPinyinCamelCase', () => {
  it('should convert Chinese characters to pinyin camel case', () => {
    // '角色管理' → mock returns ['jiao','se','guan','li'] → 'JiaoSeGuanLi'
    const result = chineseToPinyinCamelCase('角色管理');
    expect(result).toBe('JiaoSeGuanLi');
  });

  it('should handle mixed Chinese and English characters', () => {
    // 'AI 服务' → cleaned to 'AI服务' → mock returns ['A','I','fu','wu']
    // → each item uppercased first char → ['A','I','Fu','Wu'] → 'AIFuWu'
    const result = chineseToPinyinCamelCase('AI 服务');
    expect(result).toBe('AIFuWu');
  });

  it('should remove special characters before pinyin conversion', () => {
    // '用户(管理)' → cleaned to '用户管理' → mock returns ['yong','hu','guan','li']
    // → ['Yong','Hu','Guan','Li'] → 'YongHuGuanLi'
    const result = chineseToPinyinCamelCase('用户(管理)');
    expect(result).toBe('YongHuGuanLi');
  });

  it('should handle pure English text with each character capitalized', () => {
    // 'UserAPI' → mock returns ['U','s','e','r','A','P','I']
    // → each uppercased → ['U','S','E','R','A','P','I'] → 'USERAPI'
    const result = chineseToPinyinCamelCase('UserAPI');
    expect(result).toBe('USERAPI');
  });

  it('should handle pure numbers', () => {
    const result = chineseToPinyinCamelCase('123');
    expect(result).toBe('123');
  });

  it('should return empty string for empty input', () => {
    const result = chineseToPinyinCamelCase('');
    expect(result).toBe('');
  });

  it('should handle text with only special characters', () => {
    // All special chars are removed, no pinyin array entries remain
    const result = chineseToPinyinCamelCase('---');
    expect(result).toBe('');
  });
});

describe('generateDirectoryPath', () => {
  it('should map each tag through chineseToPinyinCamelCase', () => {
    const tags = ['角色管理', '用户'];
    const result = generateDirectoryPath(tags);

    expect(result).toEqual(['JiaoSeGuanLi', 'YongHu']);
  });

  it('should handle mixed tags (Chinese and English)', () => {
    const tags = ['角色管理', 'system'];
    const result = generateDirectoryPath(tags);

    // 'system' → each char uppercase → 'SYSTEM'
    expect(result).toEqual(['JiaoSeGuanLi', 'SYSTEM']);
  });

  it('should return empty array for empty input', () => {
    const result = generateDirectoryPath([]);
    expect(result).toEqual([]);
  });

  it('should handle tags with special characters', () => {
    const tags = ['用户(管理)'];
    const result = generateDirectoryPath(tags);

    // '用户(管理)' → cleaned to '用户管理' → 'YongHuGuanLi'
    expect(result).toEqual(['YongHuGuanLi']);
  });
});

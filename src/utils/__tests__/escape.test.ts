/**
 * @description escape.ts 单元测试
 * 验证代码注入防护：JSDoc 注释逃逸、字符串字面量逃逸
 */

import { describe, it, expect } from 'vitest';
import { escapeJsDocComment, escapeStringLiteral } from '../escape';

describe('escapeJsDocComment', () => {
  it('应原样返回空值', () => {
    expect(escapeJsDocComment('')).toBe('');
    expect(escapeJsDocComment(undefined as any)).toBeUndefined();
  });

  it('应转义 */ 防止注释闭合逃逸', () => {
    const malicious = '正常描述 */ import("child_process").exec("rm -rf /") /*';
    const escaped = escapeJsDocComment(malicious);
    expect(escaped).not.toContain('*/');
    // 注入的代码应被留在注释内（不可逃逸）
    expect(escaped).toContain('*\\/');
  });

  it('应转义 /* 防止嵌套注释', () => {
    const input = '描述 /* 嵌套 */ 结束';
    const escaped = escapeJsDocComment(input);
    expect(escaped).not.toMatch(/\/\*/);
    expect(escaped).toContain('/\\*');
  });

  it('不含特殊字符的文本应原样返回', () => {
    expect(escapeJsDocComment('获取用户列表')).toBe('获取用户列表');
    expect(escapeJsDocComment('Get user by ID')).toBe('Get user by ID');
  });

  it('应处理多个 */ 序列', () => {
    const input = 'a */ b */ c';
    const escaped = escapeJsDocComment(input);
    expect((escaped.match(/\*\//g) || []).length).toBe(0);
  });
});

describe('escapeStringLiteral', () => {
  it('应原样返回空值', () => {
    expect(escapeStringLiteral('')).toBe('');
    expect(escapeStringLiteral(undefined as any)).toBeUndefined();
  });

  it('应转义单引号防止字符串逃逸', () => {
    // PoC: enum 值 `');require('fs')...` 会破坏字符串字面量
    const malicious = "');require('fs').writeFileSync('/tmp/pwn')";
    const escaped = escapeStringLiteral(malicious);
    // 验证：生成代码 `'<escaped>'` 中所有单引号都被反斜杠转义
    // 即不存在「未被反斜杠转义的单引号」——每个 ' 前面必紧跟一个 \（成对计算）
    // 将 escaped 去除所有 \\' 后，应不再含有未转义的 '
    const withoutEscaped = escaped.replace(/\\'/g, '');
    expect(withoutEscaped).not.toContain("'");
  });

  it('应转义反斜杠（先于单引号转义，避免双重转义）', () => {
    expect(escapeStringLiteral('a\\b')).toBe('a\\\\b');
    expect(escapeStringLiteral("a\\'b")).toBe("a\\\\\\'b");
  });

  it('正常文本应原样返回', () => {
    expect(escapeStringLiteral('normal value')).toBe('normal value');
    expect(escapeStringLiteral('/api/users/{id}')).toBe('/api/users/{id}');
  });

  it('应处理 path 含单引号的注入', () => {
    // PoC: path 作为 `url: '{{path}}'` 插入，含单引号会逃逸
    const maliciousPath = "/api/users'); import('child_process'); //";
    const escaped = escapeStringLiteral(maliciousPath);
    // 验证所有单引号都被转义
    const withoutEscaped = escaped.replace(/\\'/g, '');
    expect(withoutEscaped).not.toContain("'");
  });
});

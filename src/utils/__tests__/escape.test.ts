/**
 * @description escape.ts 单元测试
 * 验证代码注入防护：JSDoc 注释逃逸、字符串字面量逃逸
 */

import { describe, it, expect } from 'vitest';
import { escapeJsDocComment, escapeStringLiteral, interpolatePathParams } from '../escape';

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

describe('interpolatePathParams', () => {
  it('无 path 参数时应返回单引号字面量', () => {
    const result = interpolatePathParams('/api/users', 'params', []);
    expect(result.literal).toBe(true);
    expect(result.value).toBe("'/api/users'");
  });

  it('应原样处理空路径', () => {
    const result = interpolatePathParams('', 'params', []);
    expect(result.literal).toBe(true);
    expect(result.value).toBe("''");
  });

  it('应将单个 path 参数插值为模板字符串', () => {
    const result = interpolatePathParams('/api/v1/stock/{code}', 'params', ['code']);
    expect(result.literal).toBe(false);
    expect(result.value).toBe('`/api/v1/stock/${params.code}`');
  });

  it('应将多个 path 参数插值为模板字符串', () => {
    const result = interpolatePathParams('/users/{userId}/posts/{postId}', 'params', [
      'userId',
      'postId',
    ]);
    expect(result.literal).toBe(false);
    expect(result.value).toBe('`/users/${params.userId}/posts/${params.postId}`');
  });

  it('应支持自定义 requestParamName', () => {
    const result = interpolatePathParams('/api/stock/{code}', 'data', ['code']);
    expect(result.literal).toBe(false);
    expect(result.value).toBe('`/api/stock/${data.code}`');
  });

  it('应对非法标识符的参数名使用方括号访问', () => {
    const result = interpolatePathParams('/users/{user-id}', 'params', ['user-id']);
    expect(result.literal).toBe(false);
    expect(result.value).toBe("`/users/${params['user-id']}`");
  });

  it('应转义静态部分的反引号防止模板字符串逃逸', () => {
    // PoC: 静态部分含反引号会终止模板字符串
    const maliciousPath = '/api/`+require("fs")+`/{id}';
    const result = interpolatePathParams(maliciousPath, 'params', ['id']);
    expect(result.literal).toBe(false);
    // 反引号应被转义，不能存在未转义的反引号
    const inner = result.value.slice(1, -1); // 去除外层反引号
    expect(inner).not.toMatch(/(?<!\\)`/);
  });

  it('应转义静态部分的 ${ 序列防止插值逃逸', () => {
    // PoC: 静态部分含 ${...}（非 {...} 形式）会触发非预期插值
    // 用不含 } 的形式，确保不被当作 path 参数占位符
    const maliciousPath = '/api/users?page=$%7Bevil%7D'; // URL 编码的 ${evil}
    const result = interpolatePathParams(maliciousPath, 'params', []);
    expect(result.literal).toBe(true);
  });

  it('应转义模板字符串中的静态反引号和 ${ 序列', () => {
    // 构造一个在 path 参数前有恶意静态文本的路径
    // 静态部分 /api/`end`/ 中的反引号应被转义
    const path = '/api/`end`/{id}';
    const result = interpolatePathParams(path, 'params', ['id']);
    expect(result.literal).toBe(false);
    const inner = result.value.slice(1, -1);
    // 反引号应被转义为 \`
    expect(inner).not.toMatch(/(?<!\\)`/);
    expect(inner).toContain('\\`end\\`');
  });

  it('无占位符时应转义静态部分的单引号', () => {
    const result = interpolatePathParams("/api/users', injected", 'params', []);
    expect(result.literal).toBe(true);
    // 单引号应被转义
    expect(result.value).toContain("\\'");
  });
});

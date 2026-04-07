/**
 * @description formatter.ts 单元测试
 * 使用真实 prettier 进行集成式测试
 */

import { describe, it, expect, vi } from 'vitest';

// Mock consola to suppress warnings in test output
vi.mock('consola', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    success: vi.fn(),
  },
}));

import { formatCode } from '../formatter';

describe('formatCode', () => {
  it('should format TypeScript code', async () => {
    const input = 'const x:number=1;const   y:string="hello";';
    const result = await formatCode(input, 'test.ts');

    // Should be properly formatted
    expect(result).toContain('const x: number = 1;');
    expect(result).toContain("const y: string = 'hello';");
    // Should have a semicolon at the end (semi: true)
    expect(result).toMatch(/;\s*$/);
  });

  it('should format JavaScript code', async () => {
    const input = 'const x=1;const   y="hello"';
    const result = await formatCode(input, 'test.js');

    expect(result).toContain('const x = 1;');
    expect(result).toContain("const y = 'hello'");
  });

  it('should return original code on invalid input', async () => {
    const invalidCode = 'function {{{{ broken syntax';
    const result = await formatCode(invalidCode, 'broken.ts');

    // Should return original code when formatting fails
    expect(result).toBe(invalidCode);
  });

  it('should apply custom indent size', async () => {
    const input = 'function test() {\nconst x = 1;\n}';
    const result = await formatCode(input, 'test.ts', 4);

    // With indent size 4, the indentation should use 4 spaces
    expect(result).toContain('    const x = 1;');
  });

  it('should use single quotes', async () => {
    const input = 'const str = "hello world";';
    const result = await formatCode(input, 'test.ts');

    // prettier config has singleQuote: true
    expect(result).toContain("'hello world'");
    expect(result).not.toContain('"hello world"');
  });
});

/**
 * @description sanitizer.ts 单元测试
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizeTypeName,
  sanitizeInterfaceName,
  sanitizeParamName,
  sanitizePropertyName,
} from '../sanitizer';

describe('sanitizeTypeName', () => {
  it('should return AnonymousType for empty string', () => {
    expect(sanitizeTypeName('')).toBe('AnonymousType');
  });

  it('should return a valid type name unchanged', () => {
    expect(sanitizeTypeName('ValidType')).toBe('ValidType');
  });

  it('should convert Optional marker (?) to Optional suffix', () => {
    expect(sanitizeTypeName('Class?')).toBe('ClassOptional');
  });

  it('should handle multiple ? characters', () => {
    expect(sanitizeTypeName('Type??')).toBe('TypeOptional');
  });

  it('should remove angle brackets and uppercase the following letter', () => {
    // 'Type<something>' → after removing < and uppercasing s → 'TypeSomething'
    expect(sanitizeTypeName('Type<something>')).toBe('TypeSomething');
  });

  it('should prefix with underscore when name starts with a digit', () => {
    expect(sanitizeTypeName('123Type')).toBe('_123Type');
  });

  it('should decode URL-encoded characters', () => {
    expect(sanitizeTypeName('hello%20world')).toBe('Helloworld');
  });

  it('should ensure first letter is uppercase', () => {
    expect(sanitizeTypeName('lowerFirst')).toBe('LowerFirst');
  });

  it('should handle special characters like @', () => {
    expect(sanitizeTypeName('test@name')).toBe('Testname');
  });

  it('should handle hyphen-separated names', () => {
    // Hyphens are removed via the +-/g replacement
    expect(sanitizeTypeName('my-type')).toBe('Mytype');
  });

  it('should not add Optional suffix when already present', () => {
    expect(sanitizeTypeName('MyOptional?')).toBe('MyOptional');
  });
});

describe('sanitizeInterfaceName', () => {
  it('should return AnonymousInterface for empty string', () => {
    expect(sanitizeInterfaceName('')).toBe('AnonymousInterface');
  });

  it('should return a valid interface name unchanged', () => {
    expect(sanitizeInterfaceName('Test')).toBe('Test');
  });

  it('should NOT handle Optional marker (?)', () => {
    // handleOptional is false for interface names
    const result = sanitizeInterfaceName('Class?');
    // ? is removed as a special char, but 'Optional' suffix is NOT added
    expect(result).toBe('Class');
  });

  it('should prefix with underscore when name starts with a digit', () => {
    expect(sanitizeInterfaceName('123Test')).toBe('_123Test');
  });

  it('should remove special characters', () => {
    expect(sanitizeInterfaceName('Invalid@Name')).toBe('InvalidName');
  });

  it('should ensure first letter is uppercase', () => {
    expect(sanitizeInterfaceName('lowerFirst')).toBe('LowerFirst');
  });
});

describe('sanitizeParamName', () => {
  it('should return param for empty string', () => {
    expect(sanitizeParamName('')).toBe('param');
  });

  it('should remove hyphens from hyphenated name', () => {
    // 'user-name' → hyphens are removed by the [+-] regex → 'username'
    expect(sanitizeParamName('user-name')).toBe('username');
  });

  it('should return a valid param name lowercased', () => {
    expect(sanitizeParamName('ValidName')).toBe('validName');
  });

  it('should remove special characters', () => {
    expect(sanitizeParamName('@invalid')).toBe('invalid');
  });

  it('should prefix with underscore when name starts with a digit', () => {
    expect(sanitizeParamName('123param')).toBe('_123param');
  });

  it('should ensure first letter is lowercase', () => {
    expect(sanitizeParamName('UpperFirst')).toBe('upperFirst');
  });
});

describe('sanitizePropertyName', () => {
  it('should return property for empty string', () => {
    expect(sanitizePropertyName('')).toBe('property');
  });

  it('should return normal property name unchanged', () => {
    expect(sanitizePropertyName('normal')).toBe('normal');
  });

  it('should quote property names with spaces', () => {
    expect(sanitizePropertyName('with-space')).toBe("'with-space'");
  });

  it('should NOT quote property names starting with a digit but containing letters', () => {
    // '123invalid' contains letters, so it is not a pure digit string
    expect(sanitizePropertyName('123invalid')).toBe('123invalid');
  });

  it('should quote JavaScript keywords', () => {
    expect(sanitizePropertyName('class')).toBe("'class'");
    expect(sanitizePropertyName('return')).toBe("'return'");
    expect(sanitizePropertyName('delete')).toBe("'delete'");
    expect(sanitizePropertyName('function')).toBe("'function'");
    expect(sanitizePropertyName('interface')).toBe("'interface'");
    expect(sanitizePropertyName('const')).toBe("'const'");
    expect(sanitizePropertyName('let')).toBe("'let'");
    expect(sanitizePropertyName('var')).toBe("'var'");
    expect(sanitizePropertyName('null')).toBe("'null'");
    expect(sanitizePropertyName('true')).toBe("'true'");
    expect(sanitizePropertyName('false')).toBe("'false'");
  });

  it('should NOT quote property names containing $', () => {
    // $ is allowed in identifiers (matched by [^a-zA-Z0-9_$])
    expect(sanitizePropertyName('my$prop')).toBe('my$prop');
  });

  it('should NOT quote normal camelCase names', () => {
    expect(sanitizePropertyName('validName')).toBe('validName');
  });

  it('should NOT quote names with only $', () => {
    expect(sanitizePropertyName('$')).toBe('$');
  });

  it('should NOT quote names with underscore', () => {
    expect(sanitizePropertyName('my_prop')).toBe('my_prop');
  });

  it('should handle URL-encoded characters before quoting', () => {
    // %20 decodes to space, which is a special char, so it gets quoted
    expect(sanitizePropertyName('hello%20world')).toBe("'hello world'");
  });

  it('should escape single quotes within quoted property names', () => {
    expect(sanitizePropertyName("it's")).toBe("'it\\'s'");
  });

  it('should NOT quote numeric-only names since they match the digit pattern', () => {
    expect(sanitizePropertyName('123')).toBe("'123'");
  });
});

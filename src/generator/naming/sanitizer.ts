/**
 * @description 名称清理模块
 * 提供标识符名称清理和规范化功能
 * 确保生成的代码符合 TypeScript 标识符命名规则
 */

/**
 * @description 清理并语义化类型名称
 * 移除非法字符，解码 URL 编码，添加语义化后缀
 * @param typeName 原始类型名称
 * @returns 清理后的类型名称
 *
 * @example
 * ```typescript
 * sanitizeTypeName('Class?') // → 'ClassOptional'
 * sanitizeTypeName('TypeVariable?') // → 'TypeVariableOptional'
 * sanitizeTypeName('Type<something>') // → 'Typesomething'
 * sanitizeTypeName('123Type') // → '_123Type'
 * sanitizeTypeName('') // → 'AnonymousType'
 * sanitizeTypeName('ValidType') // → 'ValidType'
 * ```
 */
export function sanitizeTypeName(typeName: string): string {
  if (!typeName) {
    return 'AnonymousType';
  }

  const original = typeName;
  let cleaned = typeName;
  let hasOptionalMarker = false;

  // 1. 解码 URL 编码字符
  try {
    cleaned = decodeURIComponent(cleaned);
  } catch {
    // 如果解码失败，继续使用原名称
  }

  // 2. 检查是否有问号（可选类型标记）
  if (cleaned.includes('?')) {
    hasOptionalMarker = true;
    // 移除所有问号
    cleaned = cleaned.replace(/\?/g, '');
  }

  // 3. 移除其他非法字符，并将移除的字符后的字母大写
  cleaned = cleaned
    .replace(/([<>{}[\],;'"\\|/.])([a-z])/g, (_, __, letter) => letter.toUpperCase()) // 移除特殊字符并将后跟的小写字母大写
    .replace(/[<>{}[\],;'"\\|/.]/g, '') // 移除特殊字符
    .replace(/\s+/g, '') // 移除空格
    .replace(/[+-]/g, '') // 移除 + 和 -
    .replace(/@/g, ''); // 移除 @

  // 4. 处理数字开头（TypeScript 标识符不能以数字开头）
  if (/^\d/.test(cleaned)) {
    cleaned = `_${cleaned}`;
  }

  // 5. 移除连续的下划线和点
  cleaned = cleaned.replace(/[_.]+/g, '_');

  // 6. 移除开头和结尾的下划线和点
  cleaned = cleaned.replace(/^[_.]+|[_.]+$/g, '');

  // 7. 再次处理数字开头（在移除开头下划线之后）
  if (/^\d/.test(cleaned)) {
    cleaned = `_${cleaned}`;
  }

  // 8. 如果清理后为空，使用原名称的字母部分或默认名称
  if (!cleaned) {
    const alphanumeric = original.replace(/[^a-zA-Z0-9]/g, '');
    cleaned = alphanumeric || 'AnonymousType';
  }

  // 9. 如果有可选标记，添加 Optional 后缀
  if (hasOptionalMarker && !cleaned.endsWith('Optional')) {
    cleaned += 'Optional';
  }

  // 10. 确保首字母大写（类型名称应该是 PascalCase）
  if (cleaned.length > 0 && /^[a-z]/.test(cleaned.charAt(0))) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return cleaned;
}

/**
 * @description 清理接口名称
 * 移除非法字符，确保生成合法的 TypeScript 标识符
 * @param interfaceName 原始接口名称
 * @returns 清理后的接口名称
 *
 * @example
 * ```typescript
 * sanitizeInterfaceName('Invalid@Name') // → 'InvalidName'
 * sanitizeInterfaceName('123Test') // → '_123Test'
 * sanitizeInterfaceName('') // → 'AnonymousInterface'
 * sanitizeInterfaceName('ValidName') // → 'ValidName'
 * ```
 */
export function sanitizeInterfaceName(interfaceName: string): string {
  if (!interfaceName) {
    return 'AnonymousInterface';
  }

  let cleaned = interfaceName;

  // 1. 解码 URL 编码
  try {
    cleaned = decodeURIComponent(cleaned);
  } catch {
    // 如果解码失败，继续使用原名称
  }

  // 2. 移除特殊字符，并将移除的字符后的字母大写
  cleaned = cleaned
    .replace(/([<>{}[\],;'"\\|/.])([a-z])/g, (_, __, letter) => letter.toUpperCase())
    .replace(/[<>{}[\],;'"\\|/.]/g, '')
    .replace(/\s+/g, '')
    .replace(/[+-]/g, '')
    .replace(/@/g, '');

  // 3. 处理数字开头
  if (/^\d/.test(cleaned)) {
    cleaned = `_${cleaned}`;
  }

  // 4. 移除连续的非字母数字字符
  cleaned = cleaned.replace(/[^a-zA-Z0-9]+/g, '_');

  // 5. 移除开头和结尾的下划线
  cleaned = cleaned.replace(/^_+|_+$/g, '');

  // 6. 如果为空，使用默认名称
  if (!cleaned) {
    return 'AnonymousInterface';
  }

  // 7. 确保首字母大写
  if (/^[a-z]/.test(cleaned.charAt(0))) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return cleaned;
}

/**
 * @description 清理参数名称
 * 移除非法字符，确保生成合法的 TypeScript 参数名
 * @param paramName 原始参数名称
 * @returns 清理后的参数名称
 *
 * @example
 * ```typescript
 * sanitizeParamName('user-name') // → 'userName'
 * sanitizeParamName('@invalid') // → 'invalid'
 * sanitizeParamName('') // → 'param'
 * sanitizeParamName('ValidName') // → 'validName'
 * ```
 */
export function sanitizeParamName(paramName: string): string {
  if (!paramName) {
    return 'param';
  }

  let cleaned = paramName;

  // 1. 解码 URL 编码
  try {
    cleaned = decodeURIComponent(cleaned);
  } catch {
    // 如果解码失败，继续使用原名称
  }

  // 2. 移除特殊字符，并将移除的字符后的字母大写
  cleaned = cleaned
    .replace(/([<>{}[\],;'"\\|/.])([a-z])/g, (_, __, letter) => letter.toUpperCase())
    .replace(/[<>{}[\],;'"\\|/.]/g, '')
    .replace(/\s+/g, '')
    .replace(/[+-]/g, '')
    .replace(/@/g, '');

  // 3. 处理数字开头
  if (/^\d/.test(cleaned)) {
    cleaned = `_${cleaned}`;
  }

  // 4. 移除连续的非字母数字字符
  cleaned = cleaned.replace(/[^a-zA-Z0-9]+/g, '_');

  // 5. 移除开头和结尾的下划线
  cleaned = cleaned.replace(/^_+|_+$/g, '');

  // 6. 如果为空，使用默认名称
  if (!cleaned) {
    return 'param';
  }

  // 7. 确保首字母小写（参数名应该是 camelCase）
  if (/^[A-Z]/.test(cleaned.charAt(0))) {
    cleaned = cleaned.charAt(0).toLowerCase() + cleaned.slice(1);
  }

  return cleaned;
}

/**
 * @description 清理属性名称
 * 移除非法字符，保留引号中的原始名称（如果需要）
 * @param propName 原始属性名称
 * @returns 清理后的属性名称（可能带引号）
 *
 * @example
 * ```typescript
 * sanitizePropertyName('normal') // → 'normal'
 * sanitizePropertyName('with-space') // → "'with-space'"
 * sanitizePropertyName('123invalid') // → "'123invalid'"
 * sanitizePropertyName('') // → 'property'
 * sanitizePropertyName('validName') // → 'validName'
 * ```
 */
export function sanitizePropertyName(propName: string): string {
  if (!propName) {
    return 'property';
  }

  // JavaScript 对象属性名可以包含更多字符，甚至可以是保留字
  // 但为了安全起见，我们仍然清理一些特殊字符

  let cleaned = propName;

  // 1. 解码 URL 编码
  try {
    cleaned = decodeURIComponent(cleaned);
  } catch {
    // 如果解码失败，继续使用原名称
  }

  // 2. 如果包含特殊字符或保留字，用引号包裹
  const needsQuotes =
    /[^a-zA-Z0-9_$]|^(\d+)$/.test(cleaned) ||
    /^(break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|false|finally|for|function|if|implements|import|in|instanceof|interface|let|new|null|package|private|protected|public|return|super|switch|this|throw|true|try|typeof|var|void|while|with)$/.test(
      cleaned,
    );

  if (needsQuotes) {
    // 对于需要引号的属性名，返回带引号的版本
    return `'${cleaned.replace(/'/g, "\\'")}'`;
  }

  // 3. 对于安全的属性名，直接返回
  return cleaned;
}

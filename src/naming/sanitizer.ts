/**
 * @description 名称清理模块
 * 提供标识符名称清理和规范化功能
 * 确保生成的代码符合 TypeScript 标识符命名规则
 */

/** sanitizeIdentifier 的配置选项 */
interface SanitizeOptions {
  /** 空名称时的默认回退值 */
  defaultName: string;
  /** 首字母大小写：'upper' = PascalCase，'lower' = camelCase */
  firstCharCase: 'upper' | 'lower';
  /** 是否处理可选标记（?）并添加 Optional 后缀 */
  handleOptional: boolean;
}

/**
 * @description 核心标识符清理函数
 * 执行公共的清理步骤：URL 解码、特殊字符移除、数字前缀处理、首字母大小写
 * @param name 原始名称
 * @param options 清理选项
 * @returns 清理后的名称
 */
function sanitizeIdentifier(name: string, options: SanitizeOptions): string {
  if (!name) {
    return options.defaultName;
  }

  const original = name;
  let cleaned = name;
  let hasOptionalMarker = false;

  // 1. 解码 URL 编码字符
  try {
    cleaned = decodeURIComponent(cleaned);
  } catch {
    // 如果解码失败，继续使用原名称
  }

  // 2. 检查是否有问号（可选类型标记），仅对 sanitizeTypeName 启用
  if (options.handleOptional && cleaned.includes('?')) {
    hasOptionalMarker = true;
    cleaned = cleaned.replace(/\?/g, '');
  }

  // 3. 移除特殊字符，并将移除的字符后的字母大写
  cleaned = cleaned
    .replace(/([<>{}[\],;'"\\|/.])([a-z])/g, (_, __, letter) => letter.toUpperCase())
    .replace(/[<>{}[\],;'"\\|/.]/g, '')
    .replace(/\s+/g, '')
    .replace(/[+-]/g, '')
    .replace(/@/g, '');

  // 4. 处理数字开头（TypeScript 标识符不能以数字开头）
  if (/^\d/.test(cleaned)) {
    cleaned = `_${cleaned}`;
  }

  // 5. 移除连续的非字母数字字符
  cleaned = cleaned.replace(/[^a-zA-Z0-9]+/g, '_');

  // 6. 移除开头和结尾的下划线
  cleaned = cleaned.replace(/^[_.]+|[_.]+$/g, '');

  // 7. 再次处理数字开头（在移除开头下划线之后）
  if (/^\d/.test(cleaned)) {
    cleaned = `_${cleaned}`;
  }

  // 8. 如果清理后为空，使用原名称的字母部分或默认名称
  if (!cleaned) {
    const alphanumeric = original.replace(/[^a-zA-Z0-9]/g, '');
    cleaned = alphanumeric || options.defaultName;
  }

  // 9. 如果有可选标记，添加 Optional 后缀（仅 sanitizeTypeName）
  if (hasOptionalMarker && !cleaned.endsWith('Optional')) {
    cleaned += 'Optional';
  }

  // 10. 确保首字母大小写
  if (cleaned.length > 0) {
    if (options.firstCharCase === 'upper' && /^[a-z]/.test(cleaned.charAt(0))) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    } else if (options.firstCharCase === 'lower' && /^[A-Z]/.test(cleaned.charAt(0))) {
      cleaned = cleaned.charAt(0).toLowerCase() + cleaned.slice(1);
    }
  }

  return cleaned;
}

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
  return sanitizeIdentifier(typeName, {
    defaultName: 'AnonymousType',
    firstCharCase: 'upper',
    handleOptional: true,
  });
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
  return sanitizeIdentifier(interfaceName, {
    defaultName: 'AnonymousInterface',
    firstCharCase: 'upper',
    handleOptional: false,
  });
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
  return sanitizeIdentifier(paramName, {
    defaultName: 'param',
    firstCharCase: 'lower',
    handleOptional: false,
  });
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
    return `'${cleaned.replace(/'/g, "\\'")}'`;
  }

  return cleaned;
}

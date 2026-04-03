/**
 * @description 路径工具函数
 */

/**
 * 计算相对导入路径的辅助函数
 * @param fromDir 源目录
 * @param toFile 目标文件
 * @returns 相对导入路径
 */
export function getRelativeImportPath(fromDir: string, toFile: string): string {
  // 标准化路径
  const fromPath = fromDir.replace(/\\/g, '/');
  const toPath = toFile.replace(/\\/g, '/');

  // 将路径拆分为部分
  const fromParts = fromPath.split('/').filter((part) => part !== '');
  const toParts = toPath.split('/').filter((part) => part !== '');

  // 查找公共部分
  let commonLength = 0;
  while (
    commonLength < fromParts.length &&
    commonLength < toParts.length &&
    fromParts[commonLength] === toParts[commonLength]
  ) {
    commonLength++;
  }

  // 计算相对路径
  const upLevels = fromParts.length - commonLength;
  const downParts = toParts.slice(commonLength);

  // 构建相对路径
  const relativeParts = Array(upLevels).fill('..');
  const result = [...relativeParts, ...downParts].join('/');
  const resultStartsWithDot = result.startsWith('.') ? result : `./${result}`;
  return result ? resultStartsWithDot : '.';
}

/**
 * 检测路径是否为 alias 格式
 * @param path 路径
 * @returns 是否为 alias 路径
 */
function isAliasPath(path: string): boolean {
  // 检测常见的 alias 前缀：@, @@, ~, #, $ 等
  // 格式：@/、@@/、~/、#/$ 等，后跟任意路径
  const aliasPattern = /^[@~$#]{1,2}\//;
  return aliasPattern.test(path);
}

/**
 * 将 alias 路径转换为实际文件路径
 * @param aliasPath alias 路径（如 @/service/request.ts）
 * @returns 实际文件路径
 */
export function aliasToRealPath(aliasPath: string): string {
  // 如果不是 alias 路径，直接返回
  if (!isAliasPath(aliasPath)) {
    return aliasPath;
  }

  // 移除 alias 前缀，添加 src/ 前缀
  // @/service/request.ts -> src/service/request.ts
  // @@/service/request.ts -> src/service/request.ts
  // ~/service/request.ts -> src/service/request.ts
  const withoutAlias = aliasPath.replace(/^[@~$#]{1,2}\//, 'src/');
  return withoutAlias;
}

/**
 * 将相对路径转换为 alias 路径
 * @param relativePath 相对路径
 * @returns alias 路径
 */
export function getAliasPath(relativePath: string): string {
  // 如果路径已经是 alias 格式（支持 @/、@@/、~/、#/ 等多种前缀），直接返回
  if (isAliasPath(relativePath)) {
    return relativePath;
  }

  // 将路径标准化，统一使用 POSIX 分隔符
  const normalizedPath = relativePath.replace(/\\/g, '/');

  // 检查路径是否包含 src/ (支持 /src/ 和 src/ 两种格式)
  if (normalizedPath.includes('src/')) {
    // 查找 src/ 的位置 (支持 /src/ 和 src/ 两种格式)
    const srcIndex = normalizedPath.indexOf('src/');
    if (srcIndex !== -1) {
      // 跳过 '/src/' 部分
      // 如果 srcIndex = 0 (格式: src/xxx)，substring(4) 跳过 'src/'
      // 如果 srcIndex = 1 且前导是 / (格式: /src/xxx)，substring(5) 跳过 '/src/'
      const startIndex = normalizedPath[srcIndex - 1] === '/' ? srcIndex - 1 : srcIndex;
      const afterSrc = normalizedPath.substring(startIndex + (startIndex === srcIndex ? 4 : 5));
      // 移除文件扩展名 (修复正则表达式转义)
      const withoutExt = afterSrc.replace(/\.(ts|js|tsx|jsx)$/, '');
      // 默认使用 @/ 作为 alias 前缀
      return `@/${withoutExt}`;
    }
  }

  // 如果无法转换，返回原始路径
  return relativePath;
}

/**
 * 获取规范化的相对路径，支持 alias 路径
 * @param from 源文件路径
 * @param to 目标文件路径
 * @returns 规范化的路径
 */
export function getNormalizedPathWithAlias(from: string, to: string): string {
  // 首先尝试使用 alias 路径
  const aliasPath = getAliasPath(to);
  if (aliasPath.startsWith('@/')) {
    return aliasPath;
  }

  // 如果无法使用 alias，回退到相对路径
  return getRelativeImportPath(from, to);
}

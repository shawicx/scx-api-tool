/**
 * @description 路径工具函数
 */

/**
 * 计算相对路径的辅助函数
 */
export function getRelativePath(from: string, to: string): string {
  // 如需要，转换为绝对路径
  const fromPath = from.startsWith('./') ? from : `./${from}`;
  const toPath = to.startsWith('./') ? to : `./${to}`;

  // 目前，我们将使用简单方法
  // 在更完整的实现中，我们将计算实际的相对路径
  // 但对于此项目，我们只需返回带有适当前缀的 to 路径
  if (toPath.startsWith(fromPath)) {
    return `./${toPath.substring(fromPath.length).replace(/^\//, '')}`;
  }

  // 通过移除公共部分来尝试制作相对路径
  const fromParts = fromPath.split('/').filter(Boolean);
  const toParts = toPath.split('/').filter(Boolean);

  // 移除公共部分
  while (fromParts.length > 0 && toParts.length > 0 && fromParts[0] === toParts[0]) {
    fromParts.shift();
    toParts.shift();
  }

  // 为 fromParts 中的每个剩余部分添加 '../'
  const relativeParts = Array(fromParts.length).fill('..');

  // 添加 toParts 的剩余部分
  const result = [...relativeParts, ...toParts].join('/');
  return result ? `./${result}` : '.';
}

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

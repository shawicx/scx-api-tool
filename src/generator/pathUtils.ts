// Helper function to calculate relative path
export function getRelativePath(from: string, to: string): string {
  // Convert to absolute paths if needed
  const fromPath = from.startsWith('./') ? from : `./${from}`;
  const toPath = to.startsWith('./') ? to : `./${to}`;

  // For now, we'll use a simple approach
  // In a more complete implementation, we would calculate the actual relative path
  // But for this project, we'll just return the to path with appropriate prefix
  if (toPath.startsWith(fromPath)) {
    return `./${toPath.substring(fromPath.length).replace(/^\//, '')}`;
  }

  // Try to make it relative by removing common parts
  const fromParts = fromPath.split('/').filter(Boolean);
  const toParts = toPath.split('/').filter(Boolean);

  // Remove common parts
  while (fromParts.length > 0 && toParts.length > 0 && fromParts[0] === toParts[0]) {
    fromParts.shift();
    toParts.shift();
  }

  // Add '../' for each remaining part in fromParts
  const relativeParts = Array(fromParts.length).fill('..');

  // Add remaining parts from toParts
  const result = [...relativeParts, ...toParts].join('/');
  return result ? `./${result}` : '.';
}

// Helper function to calculate relative import path
export function getRelativeImportPath(fromDir: string, toFile: string): string {
  // Normalize paths
  const fromPath = fromDir.replace(/\\/g, '/');
  const toPath = toFile.replace(/\\/g, '/');

  // Split paths into parts
  const fromParts = fromPath.split('/').filter((part) => part !== '');
  const toParts = toPath.split('/').filter((part) => part !== '');

  // Find common parts
  let commonLength = 0;
  while (
    commonLength < fromParts.length &&
    commonLength < toParts.length &&
    fromParts[commonLength] === toParts[commonLength]
  ) {
    commonLength++;
  }

  // Calculate relative path
  const upLevels = fromParts.length - commonLength;
  const downParts = toParts.slice(commonLength);

  // Build relative path
  const relativeParts = Array(upLevels).fill('..');
  const result = [...relativeParts, ...downParts].join('/');
  const resultStartsWithDot = result.startsWith('.') ? result : `./${result}`;
  return result ? resultStartsWithDot : '.';
}

import { access, mkdir, writeFile } from 'fs/promises';
import { dirname } from 'path';

export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await access(dirPath);
  } catch {
    await mkdir(dirPath, { recursive: true });
  }
}

export async function writeFormattedFile(filePath: string, content: string): Promise<void> {
  // Ensure the directory exists
  await ensureDir(dirname(filePath));

  // Write the file
  await writeFile(filePath, content, 'utf8');
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

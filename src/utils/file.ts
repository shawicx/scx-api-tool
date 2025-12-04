import {
  ensureDir as fseEnsureDir,
  outputFile as fseOutputFile,
  pathExists as fsePathExists,
} from 'fs-extra';
import { dirname } from 'path';

export async function ensureDir(dirPath: string): Promise<void> {
  await fseEnsureDir(dirPath);
}

export async function writeFormattedFile(filePath: string, content: string): Promise<void> {
  // Ensure the directory exists
  await ensureDir(dirname(filePath));

  // Write the file
  await fseOutputFile(filePath, content);
}

export async function fileExists(filePath: string): Promise<boolean> {
  return await fsePathExists(filePath);
}

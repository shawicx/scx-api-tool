import { existsSync } from 'fs';
import { resolve } from 'path';
import { pathToFileURL } from 'url';

export async function loadConfig(configPath: string): Promise<any> {
  const absolutePath = resolve(configPath);

  if (!existsSync(absolutePath)) {
    throw new Error(`Configuration file not found: ${absolutePath}`);
  }

  try {
    // Convert file path to file URL for ESM compatibility
    const fileUrl = pathToFileURL(absolutePath).href;

    // Dynamically import the configuration
    const configModule = await import(fileUrl);

    // Handle both default and named exports
    const config = configModule.default || configModule;

    return config;
  } catch (error: any) {
    throw new Error(`Failed to load configuration from ${absolutePath}: ${error.message}`);
  }
}

import consola from 'consola';
import { ProcessedApiData } from '../processors/openapi';
import { ApiConfig } from '../types';
import { generateInterfaceFiles, generateRequestFile, generateTypeFiles } from './fileGenerator';

export async function generateFiles(
  processedData: ProcessedApiData,
  config: ApiConfig,
): Promise<void> {
  // Log debug information if enabled
  if (process.env.DEBUG) {
    consola.debug('Generating files...');
  }

  try {
    // Create request function file if it doesn't exist
    await generateRequestFile(config);

    // Generate interface files
    await generateInterfaceFiles(processedData, config);

    // Generate type files
    await generateTypeFiles(processedData, config);

    consola.success('Files generated successfully!');
  } catch (error: any) {
    consola.error('Failed to generate files:', error.message);
    throw error;
  }
}

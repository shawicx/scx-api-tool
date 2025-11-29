import consola from 'consola';
import { fetchData } from '../clients';
import { loadConfig } from '../config/loader';
import { processOpenApiData } from '../processors/openapi';
import { ApiConfig } from '../types';
import { generateFiles } from './codegen';

export async function generateCode(configPath: string): Promise<void> {
  try {
    consola.info('Starting code generation with config', configPath);
    // Load configuration
    const config: ApiConfig = await loadConfig(configPath);

    // Process the configuration
    await processConfig(config);

    consola.success('Code generation completed successfully!');
  } catch (error: any) {
    consola.error('Code generation failed:', error.message);
    throw error;
  }
}

async function processConfig(config: ApiConfig): Promise<void> {
  // Log debug information if enabled
  if (process.env.DEBUG) {
    consola.debug('Processing configuration:', JSON.stringify(config, null, 2));
  }

  try {
    // Fetch data from the API source
    const rawData = await fetchData(config);

    if (process.env.DEBUG) {
      consola.debug('Fetched raw data from API source', rawData);
    }

    // Process the OpenAPI data
    const processedData = processOpenApiData(rawData, config);

    // Log debug information if enabled
    if (process.env.DEBUG) {
      consola.debug('Processed data count:', {
        interfaces: processedData.interfaces.length,
        types: processedData.types.length,
        categories: processedData.categories.length,
      });
    }

    // Generate files
    await generateFiles(processedData, config);

    consola.info(`Processing project with serverType: ${config.serverType}`);
    consola.info(`Output directory: ${config.outputDir}`);
  } catch (error: any) {
    consola.error('Failed to process configuration:', error.message);
    throw error;
  }
}

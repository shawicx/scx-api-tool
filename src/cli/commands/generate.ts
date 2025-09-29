import { Command } from 'commander';
import consola from 'consola';
import { watch } from 'fs';
import { join } from 'path';
import { generateCode } from '../../generator';

export const generateCommand = new Command('generate')
  .alias('gen')
  .description('Generate API request functions and types from OpenAPI/Swagger definitions')
  .option('-c, --config <path>', 'Path to configuration file', 'api-power.config.ts')
  .option('-w, --watch', 'Watch for changes and regenerate automatically', false)
  .action(async (options) => {
    try {
      if (options.watch) {
        consola.info('Watching for changes...');
        // Watch the config file for changes
        const configPath = join(process.cwd(), options.config);
        watch(configPath, async () => {
          consola.info('Configuration changed, regenerating...');
          try {
            await generateCode(options.config);
          } catch (error) {
            consola.error('Regeneration failed:', error);
          }
        });
      }

      await generateCode(options.config);
    } catch (error: any) {
      consola.error('Code generation failed:', error.message);
      process.exit(1);
    }
  });

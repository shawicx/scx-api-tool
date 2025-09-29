import { Command } from 'commander';
import consola from 'consola';
import { generateCode } from '../../generator';

export const debugCommand = new Command('debug')
  .description('Generate code with debug output enabled')
  .option('-c, --config <path>', 'Path to configuration file', 'api-power.config.ts')
  .action(async (options) => {
    try {
      // Enable debug mode
      process.env.DEBUG = 'true';
      await generateCode(options.config, false);
    } catch (error: any) {
      consola.error('Debug generation failed:', error.message);
      process.exit(1);
    }
  });

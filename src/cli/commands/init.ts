import { Command } from 'commander';
import consola from 'consola';
import { access, writeFile } from 'fs/promises';
import { join } from 'path';
import { cwd } from 'process';
import { DEFAULT_CONFIG } from '../constants';

export const initCommand = new Command('init')
  .description('Initialize a new api-power.config.ts configuration file')
  .option('-f, --force', 'Overwrite existing configuration file', false)
  .action(async (options) => {
    const configPath = join(cwd(), 'api-power.config.ts');

    try {
      // Check if file exists
      if (!options.force) {
        try {
          await access(configPath);
          consola.warn('Configuration file already exists. Use --force to overwrite.');
          return;
        } catch {
          // File doesn't exist, continue
        }
      }

      await writeFile(configPath, DEFAULT_CONFIG, 'utf8');
      consola.success('Configuration file created successfully!');
      consola.info(`Location: ${configPath}`);
    } catch (error: any) {
      consola.error('Failed to create configuration file:', error.message);
      process.exit(1);
    }
  });

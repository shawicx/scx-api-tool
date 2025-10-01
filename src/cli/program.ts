/*
 * @Author: shawicx d35f3153@proton.me
 * @Description:
 */
import { Command } from 'commander';
import { version } from '../../package.json';
import { debugCommand } from './commands/debug';
import { generateCommand } from './commands/generate';
import { initCommand } from './commands/init';

export const program = new Command();

program
  .name('api-power')
  .description(
    'CLI tool for generating API request functions and types from OpenAPI/Swagger definitions',
  )
  .version(version);

// Register commands
program.addCommand(initCommand);
program.addCommand(generateCommand);
program.addCommand(debugCommand);

// Default help command
program.helpOption('-h, --help', 'Display help for command');

// If no command is specified, show help
program.action(() => {
  program.help();
});

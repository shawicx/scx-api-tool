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
  .description('用于从 OpenAPI/Swagger 定义生成 API 请求函数和类型的 CLI 工具')
  .version(version);

// 注册命令
program.addCommand(initCommand);
program.addCommand(generateCommand);
program.addCommand(debugCommand);

// 默认帮助命令
program.helpOption('-h, --help', '显示命令帮助');

// 如果未指定命令，则显示帮助
program.action(() => {
  program.help();
});

import { Command } from 'commander';
import consola from 'consola';
import { access, writeFile } from 'fs-extra';
import { join } from 'path';
import { cwd } from 'process';
import { DEFAULT_CONFIG } from '../constants';

export const initCommand = new Command('init')
  .description('初始化一个新的 api-power.config.ts 配置文件')
  .option('-f, --force', '覆盖现有配置文件', false)
  .action(async (options) => {
    const configPath = join(cwd(), 'api-power.config.ts');

    try {
      // 检查文件是否存在
      if (!options.force) {
        try {
          await access(configPath);
          consola.warn('配置文件已存在。使用 --force 覆盖。');
          return;
        } catch {
          // 文件不存在，继续
        }
      }

      await writeFile(configPath, DEFAULT_CONFIG, 'utf8');
      consola.success('配置文件创建成功！');
      consola.info(`位置: ${configPath}`);
    } catch (error: any) {
      consola.error('创建配置文件失败:', error.message);
      process.exit(1);
    }
  });

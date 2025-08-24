/*
 * @Author: shawicx d35f3153@proton.me
 * @Date: 2025-08-24 09:00:00
 * @LastEditors: shawicx d35f3153@proton.me
 * @LastEditTime: 2025-08-24 11:19:21
 * @Description: CLI 程序入口
 */

import { Command } from 'commander';
import consola from 'consola';
import packageJson from '../../package.json';
import { GenerateCommand, HelpCommand, InitCommand } from './commands.js';

// 获取版本信息
const version = packageJson.version || '0.0.0';

/**
 * CLI 程序类
 */
export class CLIProgram {
  private program: Command;

  constructor() {
    this.program = new Command();
    this.setupProgram();
    this.registerCommands();
    this.setupErrorHandling();
  }

  /**
   * 设置程序基本信息
   */
  private setupProgram(): void {
    this.program
      .name('api-power')
      .description('一个强大的 API 代码生成工具，支持 Swagger、YApi、Apifox 等平台')
      .version(version, '-v, --version', '显示版本号')
      .option('-c, --config <path>', '指定配置文件路径')
      .option('--verbose', '显示详细信息');
  }

  /**
   * 注册命令
   */
  private registerCommands(): void {
    // 初始化命令
    this.program
      .command('init')
      .description('初始化配置文件')
      .option('-c, --config <path>', '指定配置文件路径')
      .action(async (options) => {
        try {
          await InitCommand.execute(options.config);
        } catch (error: any) {
          consola.error('初始化失败:', error.message);
          process.exit(1);
        }
      });

    // 帮助命令
    this.program
      .command('help')
      .description('显示帮助信息')
      .action(() => {
        HelpCommand.execute(version);
      });

    // 默认生成命令（无参数时执行）
    this.program.action(async (options) => {
      try {
        await GenerateCommand.execute(options.config);
      } catch (error: any) {
        consola.error('代码生成失败:', error.message);
        process.exit(1);
      }
    });
  }

  /**
   * 设置错误处理
   */
  private setupErrorHandling(): void {
    // 优雅地处理未捕获的异常
    process.on('uncaughtException', (error) => {
      consola.error('未捕获的异常:', error.message);
      if (process.env.DEBUG) {
        console.error(error);
      }
      process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
      consola.error('未处理的 Promise 拒绝:', reason);
      if (process.env.DEBUG) {
        console.error(reason);
      }
      process.exit(1);
    });

    // 处理 Ctrl+C 信号
    process.on('SIGINT', () => {
      consola.info('\n操作已取消');
      process.exit(0);
    });
  }

  /**
   * 解析并执行命令
   */
  async parse(argv?: string[]): Promise<void> {
    try {
      // 设置进程标题
      process.title = 'api-power';

      // 设置日志级别
      const args = argv || process.argv;
      if (args.includes('--verbose')) {
        process.env.DEBUG = '1';
      }

      await this.program.parseAsync(argv);
    } catch (error: any) {
      consola.error('程序执行失败:', error.message);
      if (process.env.DEBUG) {
        console.error(error);
      }
      process.exit(1);
    }
  }

  /**
   * 获取 Commander 程序实例
   */
  getProgram(): Command {
    return this.program;
  }
}

/**
 * 创建并运行 CLI 程序
 */
export async function runCLI(argv?: string[]): Promise<void> {
  const cli = new CLIProgram();
  await cli.parse(argv);
}

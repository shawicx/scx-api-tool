#!/usr/bin/env node
import * as p from '@clack/prompts';
import consola from 'consola';
import fs from 'fs-extra';
import path from 'path';
import { Generator } from './Generator';
import { ConfigWithHooks, dedent, wait } from './utils';
import { generateConfigContent } from './utils/templateUtils';

// 版本信息
const packageJson = require('../package.json');
const version = packageJson.version || '0.0.0';

// 设置进程标题
process.title = 'api-power';

// 优雅地处理未捕获的异常
process.on('uncaughtException', (error) => {
  consola.error('未捕获的异常:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  consola.error('未处理的 Promise 拒绝:', reason);
  process.exit(1);
});

// 处理 Ctrl+C 信号
process.on('SIGINT', () => {
  consola.info('\n操作已取消');
  process.exit(0);
});

/**
 * 命令行工具主函数
 * @param cmd 命令类型
 * @param options 选项配置
 */
export async function run(
  cmd: string | undefined,
  options?: {
    configFile?: string;
  },
) {
  let useCustomConfigFile = false;
  let cwd!: string;
  let configTSFile!: string;
  let configJSFile!: string;
  let configFile!: string;
  let configFileExist!: boolean;

  // 处理配置文件路径
  if (!options?.configFile) {
    cwd = process.cwd();
    configTSFile = path.join(cwd, 'api-power.config.ts');
    configJSFile = path.join(cwd, 'api-power.config.js');

    const configTSFileExist = await fs.pathExists(configTSFile);
    const configJSFileExist = !configTSFileExist && (await fs.pathExists(configJSFile));

    configFileExist = configTSFileExist || configJSFileExist;

    if (configTSFileExist) {
      configFile = configTSFile;
    } else if (configJSFileExist) {
      configFile = configJSFile;
    } else {
      configFile = configTSFile; // 默认使用新命名
    }
  } else {
    useCustomConfigFile = true;
    configFile = path.resolve(process.cwd(), options.configFile);
    cwd = path.dirname(configFile);
    configFileExist = await fs.pathExists(configFile);
  }

  if (cmd === 'help') {
    consola.log(
      `\n${dedent`
                # API Power CLI v${version}
                一个强大的 API 代码生成工具，支持 Swagger、YApi、Apifox 等平台

                # 用法
                    初始化配置文件: api-power init
                    生成代码: api-power
                    查看帮助: api-power help
                    查看版本: api-power --version

                # 选项
                    -c, --config <path>  指定配置文件路径
                    -h, --help           显示帮助信息
                    -v, --version        显示版本号

                # 示例
                    api-power init                           # 初始化默认配置文件
                    api-power                                # 使用默认配置生成代码
                    api-power -c custom.config.ts            # 使用自定义配置文件
                    api-power init -c ./configs/dev.config.ts # 初始化自定义配置文件

                # GitHub
                    https://github.com/shawicx/scx-api-tool
            `}\n`,
    );
  } else if (cmd === 'init') {
    if (configFileExist) {
      consola.info(`检测到配置文件: ${configFile}`);
      const override = await p.confirm({
        message: '是否覆盖已有配置文件?',
      });
      if (p.isCancel(override) || !override) {
        consola.info('操作已取消');
        return;
      }
    }

    let outputConfigFile!: string;
    let outputConfigFileType!: 'ts' | 'js';

    if (useCustomConfigFile) {
      outputConfigFile = configFile;
      outputConfigFileType = configFile.endsWith('.js') ? 'js' : 'ts';
    } else {
      const configFileType = await p.select({
        message: '选择配置文件类型?',
        options: [
          { label: 'TypeScript (api-power.config.ts)', value: 'ts' },
          { label: 'JavaScript (api-power.config.js)', value: 'js' },
        ],
      });

      if (p.isCancel(configFileType)) {
        consola.info('操作已取消');
        return;
      }

      outputConfigFile =
        configFileType === 'js'
          ? path.join(cwd, 'api-power.config.js')
          : path.join(cwd, 'api-power.config.ts');
      outputConfigFileType = configFileType as 'ts' | 'js';
    }

    try {
      await fs.outputFile(outputConfigFile, generateConfigContent(outputConfigFileType));
      consola.success(`配置文件已生成: ${path.relative(cwd, outputConfigFile)}`);
    } catch (error) {
      consola.error('生成配置文件失败:', error);
      process.exit(1);
    }
  } else {
    // 默认命令：代码生成
    if (!configFileExist) {
      const configFiles = useCustomConfigFile
        ? [configFile]
        : ['api-power.config.ts', 'api-power.config.js'];

      consola.error(`找不到配置文件: ${configFiles.join(' 或 ')}`);
      consola.info('请先运行 "api-power init" 初始化配置文件');
      process.exit(1);
    }

    consola.success(`找到配置文件: ${path.relative(cwd, configFile)}`);

    let config: ConfigWithHooks | undefined;
    let generator: Generator | undefined;
    let spinner: ReturnType<typeof p.spinner> | undefined;

    try {
      // 动态加载配置文件
      delete require.cache[require.resolve(configFile)];
      const configModule = require(configFile);
      config = configModule.default || configModule;

      if (!config) {
        throw new Error('配置文件必须导出一个默认配置对象');
      }

      generator = new Generator(config, { cwd });

      spinner = p.spinner();
      spinner.start('正在获取数据并生成代码...');

      // 5秒后显示进度提示
      const delayNotice = wait(5000);
      delayNotice.then(() => {
        spinner!.message(
          '正在获取数据并生成代码... (若长时间处于此状态，请检查是否有接口定义的数据过大导致拉取或解析缓慢)',
        );
      });

      await generator.prepare();
      delayNotice.cancel();

      const output = await generator.generate();
      spinner.stop('获取数据并生成代码完毕');
      consola.success('获取数据并生成代码完毕');

      await generator.write(output);
      consola.success('写入文件完毕');

      await generator.destroy();
      await config.hooks?.success?.();
    } catch (err: any) {
      if (spinner) {
        spinner.stop('操作失败');
      }

      await generator?.destroy();
      await config?.hooks?.fail?.();

      // 更友好的错误信息
      if (err.code === 'MODULE_NOT_FOUND') {
        consola.error('配置文件加载失败，请检查文件语法和依赖');
      } else if (err.code === 'EACCES') {
        consola.error('文件权限不足，请检查目录权限');
      } else {
        consola.error('操作失败:', err.message || err);
      }

      if (process.env.DEBUG) {
        console.error(err);
      }

      process.exit(1);
    } finally {
      await config?.hooks?.complete?.();
    }
  }
}

/**
 * 解析命令行参数
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    command: undefined as string | undefined,
    config: undefined as string | undefined,
    help: false,
    version: false,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      parsed.help = true;
    } else if (arg === '--version' || arg === '-v') {
      parsed.version = true;
    } else if (arg === '--verbose') {
      parsed.verbose = true;
    } else if (arg === '--config' || arg === '-c') {
      parsed.config = args[i + 1];
      i++; // 跳过下一个参数
    } else if (!parsed.command && !arg.startsWith('-')) {
      parsed.command = arg;
    }
  }

  return parsed;
}

/**
 * CLI 入口函数
 */
async function main() {
  const parsed = parseArgs();

  // 设置日志级别
  if (parsed.verbose) {
    process.env.DEBUG = '1';
  }

  // 处理版本显示
  if (parsed.version) {
    console.log(version);
    return;
  }

  // 处理帮助信息
  if (parsed.help) {
    await run('help');
    return;
  }

  // 执行对应的命令
  await run(parsed.command, {
    configFile: parsed.config,
  });
}

// 只在直接运行时执行
main().catch((error) => {
  consola.error('未捕获的错误:', error.message);
  if (process.env.DEBUG) {
    console.error(error);
  }
  process.exit(1);
});

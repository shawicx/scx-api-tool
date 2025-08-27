/*
 * @Author: shawicx d35f3153@proton.me
 * @Date: 2025-08-24 09:00:00
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2025-08-27 20:19:18
 * @Description: CLI 命令处理器
 */

import * as p from '@clack/prompts';
import consola from 'consola';
import fs from 'fs-extra';
import path from 'path';
import { Generator } from '../Generator';
import { ConfigWithHooks } from '../types';
import { dedent, wait } from '../utils/index';
import { generateConfigContent } from '../utils/templateUtils';

/**
 * 配置文件加载器
 */
export class ConfigLoader {
  /**
   * 加载配置文件（支持 TypeScript 和 JavaScript）
   */
  static async loadConfig(configFile: string): Promise<ConfigWithHooks> {
    try {
      // 在 ESM 中，我们使用动态 import
      let configModule;

      if (configFile.endsWith('.ts')) {
        // TypeScript 配置文件需要特殊处理
        try {
          configModule = await import(`${configFile}`);
        } catch (error: any) {
          if (error.code === 'ERR_UNKNOWN_FILE_EXTENSION') {
            throw new Error('加载 TypeScript 配置文件失败。请使用 JS 配置文件。');
          }
          throw error;
        }
      } else {
        // JavaScript 配置文件
        configModule = await import(`${configFile}?t=${Date.now()}`);
      }

      return configModule.default || configModule;
    } catch (error: any) {
      if (error.code === 'ERR_MODULE_NOT_FOUND') {
        throw new Error(`配置文件不存在: ${configFile}`);
      }
      throw error;
    }
  }

  /**
   * 查找配置文件
   */
  static async findConfigFile(customConfigFile?: string): Promise<{
    configFile: string;
    configFileExist: boolean;
    useCustomConfigFile: boolean;
    cwd: string;
  }> {
    let useCustomConfigFile = false;
    let cwd = process.cwd();
    let configFile: string;
    let configFileExist = false;

    if (!customConfigFile) {
      const configTSFile = path.join(cwd, 'api-power.config.ts');
      const configJSFile = path.join(cwd, 'api-power.config.js');

      const configTSFileExist = await fs.pathExists(configTSFile);
      const configJSFileExist = !configTSFileExist && (await fs.pathExists(configJSFile));

      configFileExist = configTSFileExist || configJSFileExist;

      if (configTSFileExist) {
        configFile = configTSFile;
      } else if (configJSFileExist) {
        configFile = configJSFile;
      } else {
        configFile = configTSFile; // 默认使用 TS 格式
      }
    } else {
      useCustomConfigFile = true;
      configFile = path.resolve(cwd, customConfigFile);
      cwd = path.dirname(configFile);
      configFileExist = await fs.pathExists(configFile);
    }

    return {
      configFile,
      configFileExist,
      useCustomConfigFile,
      cwd,
    };
  }
}

/**
 * 帮助命令处理器
 */
export class HelpCommand {
  static execute(version: string): void {
    console.log(`
${dedent`
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
    `}\n`);
  }
}

/**
 * 初始化命令处理器
 */
export class InitCommand {
  static async execute(customConfigFile?: string): Promise<void> {
    const { configFile, configFileExist, useCustomConfigFile, cwd } =
      await ConfigLoader.findConfigFile(customConfigFile);

    if (configFileExist) {
      consola.info(`检测到配置文件: ${configFile}`);
      const override = await p.confirm({
        message: '是否覆盖已有配置文件?',
        initialValue: false,
      });
      if (p.isCancel(override) || !override) {
        consola.info('操作已取消');
        return;
      }
    }

    let outputConfigFile: string;
    let outputConfigFileType: 'ts' | 'js';

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
    } catch (error: any) {
      consola.error('生成配置文件失败:', error.message || error);
      process.exit(1);
    }
  }
}

/**
 * 代码生成命令处理器
 */
export class GenerateCommand {
  static async execute(customConfigFile?: string): Promise<void> {
    const { configFile, configFileExist, useCustomConfigFile, cwd } =
      await ConfigLoader.findConfigFile(customConfigFile);

    // 检查配置文件是否存在
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
      // 加载配置文件
      config = await ConfigLoader.loadConfig(configFile);

      if (!config) {
        throw new Error('配置文件必须导出一个默认配置对象');
      }

      generator = new Generator(config, { cwd });
      spinner = p.spinner();
      spinner.start('正在获取数据并生成代码...');

      // 5秒后显示进度提示
      const delayNotice = wait(5000);
      delayNotice.then(() => {
        if (spinner) {
          spinner.message(
            '正在获取数据并生成代码... (若长时间处于此状态，请检查是否有接口定义的数据过大导致拉取或解析缓慢)',
          );
        }
      });

      await generator.prepare();
      delayNotice.cancel();

      const output = await generator.generate();
      spinner.stop('获取数据并生成代码完毕');
      consola.success('获取数据并生成代码完毕');

      await generator.write(output);
      consola.success('写入文件完毕');

      await generator.destroy();
      if (config.hooks?.success) {
        await config.hooks.success();
      }
    } catch (err: any) {
      if (spinner) {
        spinner.stop('操作失败');
      }

      if (generator) {
        await generator.destroy();
      }
      if (config?.hooks?.fail) {
        await config.hooks.fail();
      }

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
      if (config?.hooks?.complete) {
        await config.hooks.complete();
      }
    }
  }
}

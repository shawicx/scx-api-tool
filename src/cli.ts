#!/usr/bin/env node
import * as p from '@clack/prompts';
import consola from 'consola';
import fs from 'fs-extra';
import path from 'path';
import TSNode from 'ts-node';
import { Generator } from './Generator';
import { ConfigWithHooks, dedent, wait } from './utils';
import { generateConfigContent } from './utils/templateUtils';

// 只在开发环境中注册 ts-node
// 使用更严格的条件判断来避免在生产构建中包含ts-node
if (process.env.NODE_ENV === 'development') {
  // 动态导入 ts-node 以避免在生产构建中包含它
  try {
    TSNode.register({
      // 不加载本地的 tsconfig.json
      // skipProject: true,
      // 仅转译，不做类型检查
      transpileOnly: true,
      // 自定义编译选项
      compilerOptions: {
        strict: false,
        target: 'es2017',
        module: 'commonjs',
        moduleResolution: 'node',
        declaration: false,
        removeComments: false,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        importHelpers: false,
        // 转换 js，支持在 apiPower.config.js 里使用最新语法
        allowJs: true,
        lib: ['ESNext'],
      },
    });
  } catch {
    // 如果 ts-node 不可用，忽略错误（在生产环境中这是正常的）
    // console.warn('ts-node not available, skipping registration');
  }
}

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

  if (!options?.configFile) {
    cwd = process.cwd();
    configTSFile = path.join(cwd, 'apiPower.config.ts');
    configJSFile = path.join(cwd, 'apiPower.config.js');
    const configTSFileExist = await fs.pathExists(configTSFile);
    const configJSFileExist = !configTSFileExist && (await fs.pathExists(configJSFile));
    configFileExist = configTSFileExist || configJSFileExist;
    configFile = configTSFileExist ? configTSFile : configJSFile;
  } else {
    useCustomConfigFile = true;
    configFile = options.configFile;
    cwd = path.dirname(configFile);
    configFileExist = await fs.pathExists(configFile);
  }

  if (cmd === 'help') {
    consola.log(
      `\n${dedent`
                # 用法
                    初始化配置文件: apiPower init
                    生成代码: apiPower
                    查看帮助: apiPower help

                # GitHub
                    https://github.com/shawicx/scx-api-tool.git
            `}\n`,
    );
  } else if (cmd === 'init') {
    if (configFileExist) {
      consola.info(`检测到配置文件: ${configFile}`);
      const override = await p.confirm({
        message: '是否覆盖已有配置文件?',
      });
      if (!override) return;
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
          { label: 'TypeScript(apiPower.config.ts)', value: 'ts' },
          { label: 'JavaScript(apiPower.config.js)', value: 'js' },
        ],
      });
      if (p.isCancel(configFileType)) return;
      outputConfigFile = configFileType === 'js' ? configJSFile : configTSFile;
      outputConfigFileType = configFileType as 'ts' | 'js';
    }
    await fs.outputFile(outputConfigFile, generateConfigContent(outputConfigFileType));
    consola.success('写入配置文件完毕');
  } else {
    if (!configFileExist) {
      return consola.error(
        `找不到配置文件: ${
          useCustomConfigFile ? configFile : `${configTSFile} 或 ${configJSFile}`
        }`,
      );
    }
    consola.success(`找到配置文件: ${configFile}`);
    let config: ConfigWithHooks | undefined;
    let generator: Generator | undefined;
    let spinner: ReturnType<typeof p.spinner> | undefined;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      config = require(configFile).default;
      generator = new Generator(config!, { cwd });

      spinner = p.spinner();
      spinner.start('正在获取数据并生成代码...');
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
      await config!.hooks?.success?.();
    } catch (err) {
      spinner?.stop('操作失败');
      await generator?.destroy();
      await config?.hooks?.fail?.();
      /* istanbul ignore next */
      consola.error(err);
    }
    await config?.hooks?.complete?.();
  }
}

/* istanbul ignore next */
if (require.main === module) {
  const args = process.argv.slice(2);
  const cmd = args[0];
  const configIndex = args.indexOf('-c') !== -1 ? args.indexOf('-c') : args.indexOf('--config');
  const configFile =
    configIndex !== -1 && args[configIndex + 1]
      ? path.resolve(process.cwd(), args[configIndex + 1])
      : undefined;

  run(cmd, {
    configFile,
  });
}

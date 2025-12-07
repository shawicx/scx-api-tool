#!/usr/bin/env node

import { program } from './cli/program';
import { ApiConfig } from './types';

/**
 * 定义配置
 */
export function defineConfig(config: ApiConfig): ApiConfig {
  return config;
}

export { ServerType, RequestMethod, RequestMethodStyle } from './types/index';

// 执行 CLI 程序
program.parse(process.argv);

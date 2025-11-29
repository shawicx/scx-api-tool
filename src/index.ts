#!/usr/bin/env node

import { program } from './cli/program';
import { ApiConfig } from './types';

/** 定义配置 */
export function defineConfig(config: ApiConfig): ApiConfig {
  // if (hooks) {
  //   Object.defineProperty(config, 'hooks', {
  //     value: hooks,
  //     configurable: false,
  //     enumerable: false,
  //     writable: false,
  //   });
  // }
  return config;
}

export { ServerType, RequestMethod } from './types/index';

// Execute the CLI program
program.parse(process.argv);

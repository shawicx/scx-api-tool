/**
 * @description 库主入口文件
 * 仅导出公共 API 和类型，不包含任何 CLI 副作用；
 * CLI 可执行入口见 src/cli/main.ts（bin: dist/cli.js）
 */

import { defineConfig } from './utils/config';
import { resolveServiceConfigs } from './utils/multiService';
import {
  ServerType,
  RequestMethod,
  RequestMethodStyle,
  RequestBodyType,
  ResponseBodyType,
  RequestParamType,
  RequestQueryType,
  RequestFormItemType,
  QueryStringArrayFormat,
  Required,
} from './types';
import type {
  OutputFileList,
  RequestFunctionConfig,
  ApiConfig,
  MultiServiceConfig,
  ServiceConfig,
  CommonServiceConfig,
  CategoryInfo,
  ProjectInfo,
  CliHooks,
  PresetType,
  NamingStrategy,
  NamingContext,
} from './types';
import { PRESETS } from './types';

// 导出纯类型
export type {
  OutputFileList,
  RequestFunctionConfig,
  ApiConfig,
  MultiServiceConfig,
  ServiceConfig,
  CommonServiceConfig,
  CategoryInfo,
  ProjectInfo,
  CliHooks,
  PresetType,
  NamingStrategy,
  NamingContext,
};

// 导出常量和函数
export {
  defineConfig,
  resolveServiceConfigs,
  PRESETS,
  ServerType,
  RequestMethod,
  RequestMethodStyle,
  RequestBodyType,
  ResponseBodyType,
  RequestParamType,
  RequestQueryType,
  RequestFormItemType,
  QueryStringArrayFormat,
  Required,
};

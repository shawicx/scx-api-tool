#!/usr/bin/env node

/**
 * @description 主入口文件
 * 导出所有公共 API 和类型
 */

import { program } from './cli/program';
import { defineConfig } from './utils/config';
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
  UserConfig,
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
  UserConfig,
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

// 执行 CLI 程序
program.parse(process.argv);

#!/usr/bin/env node

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

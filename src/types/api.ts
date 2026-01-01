/*
 * @Author: shawicx d35f3153@proton.me
 * @Description: API 相关类型定义
 */

import { RequestMethod } from './enums';

/**
 * 接口定义
 */
export interface InterfaceInfo {
  /** 接口路径 */
  path: string;
  /** 请求方法 */
  method: RequestMethod;
  /** 接口名称 */
  name: string;
  /** 接口描述 */
  description: string;
  /** 请求参数 */
  parameters: any[];
  /** 请求体 */
  requestBody: any;
  /** 响应 */
  responses: any;
  /** 所属分类 */
  category: string;
}

/**
 * 分类信息
 */
export interface CategoryInfo {
  /** 分类ID */
  id: number;
  /** 分类名称 */
  name: string;
  /** 分类描述 */
  description: string;
}

/**
 * 项目信息
 */
export interface ProjectInfo {
  /** 项目名称 */
  name: string;
  /** 项目版本 */
  version: string;
  /** 项目描述 */
  description: string;
}

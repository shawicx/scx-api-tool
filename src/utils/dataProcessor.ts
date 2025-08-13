/*
 * @Author: shawicx d35f3153@proton.me
 * @Date: 2025-08-09 23:30:00
 * @LastEditors: shawicx d35f3153@proton.me
 * @LastEditTime: 2025-08-09 23:30:00
 * @Description: 数据处理相关的工具函数
 */
import castArray from 'lodash/castArray';
import isEmpty from 'lodash/isEmpty';
import omit from 'lodash/omit';
import uniq from 'lodash/uniq';
import { InterfaceList } from './apiTypes';
import { SyntheticalConfig } from './config';

/**
 * 处理分类ID列表
 * @param categoryConfig 分类配置
 * @param projectCats 项目分类列表
 * @returns 处理后的分类ID列表
 */
export function processCategoryIds(categoryConfig: any, projectCats: any[]): number[] {
  // 数组化
  let categoryIds = castArray(categoryConfig.id);

  // 全部分类
  if (categoryIds.includes(0)) {
    const cats = Array.isArray(projectCats) ? projectCats : [];
    categoryIds.push(...cats.map((cat) => cat._id));
  }

  // 唯一化
  categoryIds = uniq(categoryIds);

  // 去掉被排除的分类
  const excludedCategoryIds = categoryIds.filter((id) => id < 0).map(Math.abs);
  categoryIds = categoryIds.filter((id) => !excludedCategoryIds.includes(Math.abs(id)));

  // 删除不存在的分类
  const cats = Array.isArray(projectCats) ? projectCats : [];
  categoryIds = categoryIds.filter((id) => !!cats.find((cat) => cat._id === id));

  // 顺序化
  return categoryIds.sort();
}

/**
 * 获取项目配置列表
 * @param serverConfig 服务器配置
 * @returns 项目配置列表
 */
export function getProjectConfigs(serverConfig: any): any[] {
  return serverConfig.projects.reduce((acc: any[], project: any) => {
    acc.push(
      ...castArray(project.token).map((token) => ({
        ...project,
        token,
      })),
    );
    return acc;
  }, []);
}

/**
 * 获取分类的接口列表
 * @param fetchExport 获取导出的函数
 * @param serverUrl 服务器URL
 * @param token 令牌
 * @param categoryId 分类ID
 * @returns 接口列表
 */
export async function getInterfaceList(
  fetchExport: (config: { serverUrl: string; token: string }) => Promise<any[]>,
  serverUrl: string,
  token: string,
  categoryId: number,
): Promise<InterfaceList> {
  const category = ((await fetchExport({ serverUrl, token })) || []).find(
    (cat: any) => !isEmpty(cat) && !isEmpty(cat.list) && cat.list[0].catid === categoryId,
  );

  if (category) {
    category.list.forEach((interfaceInfo: any) => {
      // 实现 _category 字段
      const updatedInterfaceInfo = interfaceInfo;
      updatedInterfaceInfo._category = omit(category, 'list');
    });
  }

  return category ? category.list : [];
}

/**
 * 获取项目信息
 * @param fetchProject 获取项目的函数
 * @param fetchApi 获取API的函数
 * @param syntheticalConfig 综合配置
 * @returns 项目信息
 */
export async function getProjectInfo(
  fetchProject: (config: any) => Promise<any>,
  fetchApi: (url: string, query: any) => Promise<any>,
  syntheticalConfig: SyntheticalConfig,
): Promise<any> {
  const projectInfo = await fetchProject(syntheticalConfig);
  const projectCats = await fetchApi(`${syntheticalConfig.serverUrl}/api/interface/getCatMenu`, {
    token: syntheticalConfig.token!,
    project_id: projectInfo._id,
  });

  return {
    ...projectInfo,
    cats: projectCats,
    getMockUrl: () => `${syntheticalConfig.serverUrl}/mock/${projectInfo._id}`,
    getDevUrl: (devEnvName: string) => {
      const env = projectInfo.env.find((e: any) => e.name === devEnvName);
      return (env && env.domain) || '';
    },
    getProdUrl: (prodEnvName: string) => {
      const env = projectInfo.env.find((e: any) => e.name === prodEnvName);
      return (env && env.domain) || '';
    },
  };
}

/**
 * 处理项目配置
 * @param serverConfig 服务器配置
 * @param projects 项目列表
 * @returns 处理后的项目配置
 */
export function processProjectConfigs(serverConfig: any, projects: any[]): any[] {
  return projects.map((project) => ({
    ...project,
    basePath: `/${project.basepath || '/'}`.replace(/\/+$/, '').replace(/^\/+/, '/'),
    url: `${serverConfig.serverUrl}/project/${project._id}/interface/api`,
  }));
}

/**
 * 处理分类配置
 * @param category: 分类信息
 * @param serverUrl: 服务器URL
 * @returns 处理后的分类配置
 */
export function processCategoryConfig(category: any, serverUrl: string): any {
  const projectId = category.list?.[0]?.project_id || 0;
  const catId = category.list?.[0]?.catid || 0;

  return {
    ...category,
    _url: `${serverUrl}/project/${projectId}/interface/api/cat_${catId}`,
    list: (category.list || []).map((item: any) => {
      const interfaceId = item._id;
      return {
        ...item,
        _url: `${serverUrl}/project/${projectId}/interface/api/${interfaceId}`,
      };
    }),
  };
}

/**
 * 验证配置参数
 * @param config 配置对象
 * @returns 验证结果
 */
export function validateConfig(config: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.serverUrl) {
    errors.push('serverUrl 是必需的');
  }

  if (!config.projects || !Array.isArray(config.projects) || config.projects.length === 0) {
    errors.push('projects 必须是包含至少一个项目的数组');
  }

  if (config.serverType === 'apifox' && !config.apifoxProjectId) {
    errors.push('apifox 类型需要提供 apifoxProjectId');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

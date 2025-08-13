/*
 * @Author: shawicx d35f3153@proton.me
 * @Date: 2025-08-09 23:30:00
 * @LastEditors: shawicx d35f3153@proton.me
 * @LastEditTime: 2025-08-13 23:02:56
 * @Description: 项目处理相关的工具函数
 */
import { CategoryList, Project } from './apiTypes';
import { SyntheticalConfig } from './config';
import { httpGet, throwError } from './index';

/**
 * @description 获取项目信息
 * @param syntheticalConfig 综合配置
 * @returns 项目信息
 */
export async function fetchProject({ serverUrl, token }: SyntheticalConfig): Promise<Project> {
  const tokenValue = Array.isArray(token) ? token[0] : token;
  const projectInfo = await httpGet<{
    errcode: any;
    errmsg: any;
    data: any;
  }>(`${serverUrl}/api/project/get`, {
    token: tokenValue,
  });

  if (projectInfo && projectInfo.errcode) {
    throwError(
      `${projectInfo.errmsg} [请求地址: ${serverUrl}/api/project/get] [请求参数: ${new URLSearchParams({ token: token! }).toString()}]`,
    );
  }

  const data = projectInfo.data || projectInfo;
  const basePath = `/${data.basepath || '/'}`.replace(/\/+$/, '').replace(/^\/+/, '/');
  data.basepath = basePath;

  // 实现项目在 YApi 上的地址
  data._url = `${serverUrl}/project/${data._id}/interface/api`;

  return data;
}

/**
 * @description 获取项目分类信息
 * @param syntheticalConfig 综合配置
 * @param projectInfo 项目信息
 * @returns 项目分类信息
 */
export async function fetchProjectCategories(
  syntheticalConfig: SyntheticalConfig,
  projectInfo: Project,
): Promise<CategoryList> {
  const projectCats = await httpGet<{
    errcode: any;
    errmsg: any;
    data: any;
  }>(`${syntheticalConfig.serverUrl}/api/interface/getCatMenu`, {
    token: Array.isArray(syntheticalConfig.token)
      ? syntheticalConfig.token[0]
      : syntheticalConfig.token,
    project_id: projectInfo._id,
  });

  if (projectCats && projectCats.errcode) {
    throwError(
      `${projectCats.errmsg} [请求地址: ${syntheticalConfig.serverUrl}/api/interface/getCatMenu] [请求参数: ${new URLSearchParams({ token: Array.isArray(syntheticalConfig.token) ? syntheticalConfig.token[0] : syntheticalConfig.token, project_id: projectInfo._id.toString() }).toString()}]`,
    );
  }

  return projectCats.data || projectCats;
}

/**
 * @description 获取完整的项目信息（包含分类）
 * @param syntheticalConfig 综合配置
 * @returns 完整的项目信息
 */
export async function fetchProjectInfo(syntheticalConfig: SyntheticalConfig) {
  const projectInfo = await fetchProject(syntheticalConfig);
  const projectCats = await fetchProjectCategories(syntheticalConfig, projectInfo);

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
 * @description 获取项目导出数据
 * @param syntheticalConfig 综合配置
 * @returns 项目导出数据
 */
export async function fetchProjectExport({ serverUrl, token }: SyntheticalConfig) {
  const projectInfo = await fetchProject({ serverUrl, token });
  const categoryList = await httpGet<{
    errcode: any;
    errmsg: any;
    data: any;
  }>(`${serverUrl}/api/plugin/export`, {
    type: 'json',
    status: 'all',
    isWiki: 'false',
    token: Array.isArray(token) ? token[0] : token,
  });

  if (categoryList && categoryList.errcode) {
    throwError(
      `${categoryList.errmsg} [请求地址: ${serverUrl}/api/plugin/export] [请求参数: ${new URLSearchParams({ type: 'json', status: 'all', isWiki: 'false', token: Array.isArray(token) ? token[0] : token }).toString()}]`,
    );
  }

  const data = categoryList.data || categoryList;

  return data.map((cat) => {
    const projectId = cat.list?.[0]?.project_id || 0;
    const catId = cat.list?.[0]?.catid || 0;

    // 实现分类在 YApi 上的地址
    const updatedCat = {
      ...cat,
      _url: `${serverUrl}/project/${projectId}/interface/api/cat_${catId}`,
    };

    updatedCat.list = (cat.list || []).map((item) => {
      const interfaceId = item._id;
      // 实现接口在 YApi 上的地址
      const updatedItem = {
        ...item,
        _url: `${serverUrl}/project/${projectId}/interface/api/${interfaceId}`,
        path: `${projectInfo.basepath}${item.path}`,
      };
      return updatedItem;
    });

    return updatedCat;
  });
}

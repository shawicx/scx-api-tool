import _ from 'lodash';
import { CategoryList, InterfaceList, Project } from './apiTypes';
import { SyntheticalConfig } from './config';
import { httpGet, throwError } from './index';

// 从lodash主包中提取需要的函数
const { memoize, isEmpty, omit } = _;

export class ProjectFetcher {
  fetchProject = memoize(async ({ serverUrl, token }: SyntheticalConfig) => {
    const projectInfo = await this.fetchApi<Project>(`${serverUrl}/api/project/get`, {
      token: token!,
    });
    const basePath = `/${projectInfo.basepath || '/'}`.replace(/\/+$/, '').replace(/^\/+/, '/');
    projectInfo.basepath = basePath;
    // 实现项目在 YApi 上的地址
    projectInfo._url = `${serverUrl}/project/${projectInfo._id}/interface/api`;
    return projectInfo;
  });

  fetchExport = memoize(async ({ serverUrl, token }: SyntheticalConfig) => {
    const projectInfo = await this.fetchProject({ serverUrl, token });
    const categoryList = await this.fetchApi<CategoryList>(`${serverUrl}/api/plugin/export`, {
      type: 'json',
      status: 'all',
      isWiki: 'false',
      token: token!,
    });
    return categoryList.map((cat) => {
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
  });

  async fetchApi<T = any>(url: string, query: Record<string, any>): Promise<T> {
    const res = await httpGet<{
      errcode: any;
      errmsg: any;
      data: any;
    }>(url, query);
    /* istanbul ignore next */
    if (res && res.errcode) {
      throwError(
        `${res.errmsg} [请求地址: ${url}] [请求参数: ${new URLSearchParams(query).toString()}]`,
      );
    }
    return res.data || res;
  }

  /** 获取分类的接口列表 */
  async fetchInterfaceList({ serverUrl, token, id }: SyntheticalConfig): Promise<InterfaceList> {
    const category = ((await this.fetchExport({ serverUrl, token })) || []).find(
      (cat: any) => !isEmpty(cat) && !isEmpty(cat.list) && cat.list[0].catid === id,
    ) as any;

    if (category) {
      category.list.forEach((interfaceInfo: any) => {
        // 实现 _category 字段
        const updatedInterfaceInfo = interfaceInfo;
        updatedInterfaceInfo._category = omit(category, 'list');
      });
    }

    return category ? category.list : [];
  }

  /** 获取项目信息 */
  async fetchProjectInfo(syntheticalConfig: SyntheticalConfig) {
    const projectInfo = await this.fetchProject(syntheticalConfig);
    const projectCats = await this.fetchApi<CategoryList>(
      `${syntheticalConfig.serverUrl}/api/interface/getCatMenu`,
      {
        token: syntheticalConfig.token!,
        project_id: projectInfo._id,
      },
    );
    return {
      ...projectInfo,
      cats: projectCats,
      getMockUrl: () => `${syntheticalConfig.serverUrl}/mock/${projectInfo._id}`,
      getDevUrl: (devEnvName: string) => {
        const env = projectInfo.env.find((e: any) => e.name === devEnvName);
        return (env && env.domain) /* istanbul ignore next */ || '';
      },
      getProdUrl: (prodEnvName: string) => {
        const env = projectInfo.env.find((e: any) => e.name === prodEnvName);
        return (env && env.domain) /* istanbul ignore next */ || '';
      },
    };
  }
}

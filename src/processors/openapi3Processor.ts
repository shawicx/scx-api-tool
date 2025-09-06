/*
 * @Author: shawicx d35f3153@proton.me
 * @Description: OpenAPI 3.0 数据处理器
 */
import dayjs from 'dayjs';
import { each, find } from 'lodash-es';
import { OpenAPIV3 } from 'openapi-types';
import { Category, Interface, Project } from '../types';
import {
  handleOpenAPI3Response,
  handlePath,
  processOpenAPI3Parameter,
  processOpenAPI3RequestBody,
} from '../utils/openapi3Utils';

/**
 * @description 处理 OpenAPI 3.0 数据并转换为接口数据
 * @param openApiData OpenAPI 3.0 数据
 * @returns 处理后的接口数据
 */
export async function processOpenAPI3Data(openApiData: OpenAPIV3.Document): Promise<{
  project: Project;
  cats: Category[];
  interfaces: Interface[];
}> {
  const interfaceData = {
    apis: [] as Interface[],
    cats: [] as Category[],
    basePath: '',
    openApiData,
  };

  // 设置基础路径
  interfaceData.basePath = openApiData.servers?.[0]?.url || '';

  // 处理 tags 作为分类
  if (openApiData.tags && Array.isArray(openApiData.tags)) {
    openApiData.tags.forEach((tag) => {
      interfaceData.cats.push({
        name: tag.name,
        desc: tag.description || '',
        _id: interfaceData.cats.length + 1,
        add_time: dayjs().unix(),
        up_time: dayjs().unix(),
      });
    });
  }

  // 处理 paths 中的接口
  each(openApiData.paths, (pathItem, path) => {
    if (!pathItem) return;

    // 遍历每个 HTTP 方法
    Object.entries(pathItem).forEach(([method, operation]) => {
      // 跳过 parameters（这是路径级别的参数，不是方法）
      if (method === 'parameters') return;

      // 确保 operation 是 OperationObject 类型
      if (!operation || typeof operation !== 'object' || '$ref' in operation) return;

      // 类型断言为 OpenAPIV3.OperationObject
      const op = operation as OpenAPIV3.OperationObject;

      const api: Interface = {};

      // 基本信息
      api.method = method.toUpperCase();
      api.title = op.summary || op.operationId || path;
      api.desc = op.description || '';
      api.path = handlePath(path);

      // 初始化参数数组
      api.req_params = [];
      api.req_body_form = [];
      api.req_headers = [];
      api.req_query = [];
      api.req_body_type = 'raw';
      api.res_body_type = 'raw';

      // 处理 tags 作为分类
      api.catname = null;
      if (op.tags && Array.isArray(op.tags) && op.tags.length > 0) {
        // 使用第一个 tag 作为分类名
        api.catname = op.tags[0];

        // 如果分类不存在，添加到分类列表中
        if (!find(interfaceData.cats, (item) => item.name === api.catname)) {
          interfaceData.cats.push({
            name: api.catname,
            desc: api.catname,
            _id: interfaceData.cats.length + 1,
            add_time: dayjs().unix(),
            up_time: dayjs().unix(),
          });
        }
      }

      // 处理 consumes/produces
      if (op.requestBody) {
        api.req_body_type = 'json';
        api.req_body_is_json_schema = true;
      }

      // 处理响应
      api.res_body = handleOpenAPI3Response(op.responses || {}, openApiData);

      // 确保响应体类型正确设置
      if (api.res_body) {
        try {
          // 尝试解析响应体，如果成功则设置为JSON类型
          JSON.parse(api.res_body);
          api.res_body_type = 'json';
          api.res_body_is_json_schema = true;
        } catch {
          // 如果解析失败，保持为原始类型
          if (api.res_body_type === 'raw') {
            // 检查是否包含JSON特征
            if (api.res_body.trim().startsWith('{') || api.res_body.trim().startsWith('[')) {
              api.res_body_type = 'json';
              api.res_body_is_json_schema = true;
            }
          }
        }
      }

      // 处理参数
      if (op.parameters && Array.isArray(op.parameters)) {
        op.parameters.forEach((param) => {
          processOpenAPI3Parameter(param, api, openApiData);
        });
      }

      // 处理请求体
      if (op.requestBody) {
        processOpenAPI3RequestBody(op.requestBody, api, openApiData);
      }

      // 添加其他必要字段
      api._id = interfaceData.apis.length + 1;
      api.project_id = 1;
      api.catid = interfaceData.cats.find((cat) => cat.name === api.catname)?._id || 1;
      api.tag = op.tags || [];
      api.add_time = dayjs().unix();
      api.up_time = dayjs().unix();
      api._url = '';
      api.status = 'done';
      api.markdown = '';
      api.uid = 1;

      interfaceData.apis.push(api);
    });
  });

  // 兼容没有分类的情况
  if (!interfaceData.cats.length) {
    interfaceData.cats = [
      {
        name: 'default',
        desc: 'default',
        _id: 1,
        add_time: dayjs().unix(),
        up_time: dayjs().unix(),
      },
    ];
    interfaceData.apis.forEach((api) => {
      // eslint-disable-next-line no-param-reassign
      api.catname = 'default';
      // eslint-disable-next-line no-param-reassign
      api.catid = 1;
    });
  }

  const currentTime = dayjs().unix();
  const project: Project = {
    _id: 1,
    name: openApiData.info.title,
    desc: openApiData.info.description || '',
    basepath: interfaceData.basePath,
    tag: [],
    env:
      openApiData.servers?.map((server, index) => ({
        name: `server${index + 1}`,
        domain: server.url,
      })) || [],
    _url: '',
  };

  const cats = interfaceData.cats.map((cat, index) => ({
    ...cat,
    _id: index + 1,
    add_time: currentTime,
    up_time: currentTime,
  }));

  const interfaces = interfaceData.apis.map((api, index) => {
    // 查找对应的分类信息
    const category = cats.find((cat) => cat._id === api.catid);

    return {
      ...api,
      _id: index + 1,
      project_id: 1,
      catid: api.catid || 1,
      tag: api.tag || [],
      add_time: currentTime,
      up_time: currentTime,
      // 添加 _category 属性
      _category: category || {
        _id: 1,
        name: 'default',
        desc: 'default',
        add_time: currentTime,
        up_time: currentTime,
      },
      // 添加 _project 属性
      _project: project,
    };
  });

  return { project, cats, interfaces };
}

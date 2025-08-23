// ref: https://github.com/YMFE/yapi/blob/master/exts/yapi-plugin-import-swagger/run.js
import dayjs from 'dayjs';
import { each, find } from 'lodash-es';
import { OpenAPIV2 as SwaggerType } from 'openapi-types';
// 动态导入swagger-client以减少bundle大小
import swagger from 'swagger-client';
import { Category, Interface, Project } from './utils';
import {
  handlePath,
  handleResponse,
  openapi2swagger,
  processParameter,
} from './utils/swaggerUtils';

let SwaggerData;
let isOAS3;

// 使用 utils/swaggerUtils.ts 中的 handlePath 函数

// 使用 utils/swaggerUtils.ts 中的 openapi2swagger 函数

async function handleSwaggerData(res: SwaggerType.Document) {
  return new Promise((resolve) => {
    const data = swagger({
      spec: res,
    });

    data.then((swaggerRes) => {
      resolve(swaggerRes.spec);
    });
  });
}

async function run(resParam): Promise<{
  apis: Interface[];
  cats: Category[];
  basePath: string;
  swaggerData: SwaggerType.Document;
}> {
  const interfaceData = { apis: [], cats: [], basePath: '', swaggerData: {} } as any;
  let res = resParam;
  if (typeof res === 'string' && res) {
    try {
      res = JSON.parse(res);
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error('json 解析出错', error.message);
    }
  }

  isOAS3 = res.openapi && String(res.openapi).startsWith('3.');
  if (isOAS3) {
    res = openapi2swagger(res);
  }
  const processedRes = (await handleSwaggerData(res)) as SwaggerType.Document;
  SwaggerData = processedRes;
  interfaceData.swaggerData = SwaggerData;

  interfaceData.basePath = processedRes.basePath || '';

  if (processedRes.tags && Array.isArray(processedRes.tags)) {
    processedRes.tags.forEach((tag) => {
      interfaceData.cats.push({
        name: tag.name,
        desc: tag.description,
      });
    });
  } else {
    processedRes.tags = [];
  }

  each(processedRes.paths, (apis, path) => {
    // parameters is common parameters, not a method
    const { parameters, ...apisCopy } = apis;
    each(apisCopy, (api, method) => {
      const apiCopy = { ...api };
      apiCopy.path = path;
      apiCopy.method = method;
      let data = {} as any;
      try {
        data = handleSwagger(apiCopy, (processedRes?.tags || {}) as any) as any;
        if (data.catname) {
          if (!find(interfaceData.cats, (item) => item.name === data.catname)) {
            if ((processedRes?.tags || []).length === 0) {
              interfaceData.cats.push({
                name: data.catname,
                desc: data.catname,
              });
            }
          }
        }
      } catch {
        data = null;
      }
      if (data) {
        interfaceData.apis.push(data);
      }
    });
  });

  interfaceData.cats = interfaceData.cats.filter((catData) => {
    const catName = catData.name;
    return find(interfaceData.apis, (apiData) => {
      return apiData.catname === catName;
    });
  });

  return interfaceData;
}

function handleSwagger(data, originTags = []) {
  const api = {} as any;
  // 处理基本信息
  api.method = data.method.toUpperCase();
  api.title = data.summary || data.path;
  api.desc = data.description;
  api.catname = null;
  if (data.tags && Array.isArray(data.tags)) {
    api.tag = data.tags;
    for (let i = 0; i < data.tags.length; i++) {
      if (/v[0-9.]+/.test(data.tags[i])) {
        continue;
      }

      // 如果根路径有 tags，使用根路径 tags,不使用每个接口定义的 tag 做完分类
      if (
        originTags.length > 0 &&
        find(originTags, (item: any) => {
          return item.name === data.tags[i];
        })
      ) {
        api.catname = data.tags[i];
        break;
      }

      if (originTags.length === 0) {
        api.catname = data.tags[i];
        break;
      }
    }
  }

  api.path = handlePath(data.path);
  api.req_params = [];
  api.req_body_form = [];
  api.req_headers = [];
  api.req_query = [];
  api.req_body_type = 'raw';
  api.res_body_type = 'raw';

  if (data.produces && data.produces.indexOf('application/json') > -1) {
    api.res_body_type = 'json';
    api.res_body_is_json_schema = true;
  }

  if (data.consumes && Array.isArray(data.consumes)) {
    if (
      data.consumes.indexOf('application/x-www-form-urlencoded') > -1 ||
      data.consumes.indexOf('multipart/form-data') > -1
    ) {
      api.req_body_type = 'form';
    } else if (data.consumes.indexOf('application/json') > -1) {
      api.req_body_type = 'json';
      api.req_body_is_json_schema = true;
    }
  }

  // 处理response
  api.res_body = handleResponse(data.responses);
  try {
    JSON.parse(api.res_body);
    api.res_body_type = 'json';
    api.res_body_is_json_schema = true;
  } catch {
    api.res_body_type = 'raw';
  }
  // 处理参数 - 使用工具函数
  if (data.parameters && Array.isArray(data.parameters)) {
    data.parameters.forEach((param) => {
      processParameter(param, api, SwaggerData);
    });
  }

  return api;
}

// 使用 utils/swaggerUtils.ts 中的 isJson 函数

// 使用 utils/swaggerUtils.ts 中的 handleBodyParams 函数

// 使用 utils/swaggerUtils.ts 中的 handleResponse 函数

export async function swaggerJsonToYApiData(data: any): Promise<{
  project: Project;
  cats: Category[];
  interfaces: Interface[];
}> {
  const yapiData = (await run(data)) as any;

  // 兼容没有分类的情况
  if (!yapiData.cats.length) {
    yapiData.cats = [
      {
        name: 'default',
        desc: 'default',
      },
    ];
    yapiData.apis.forEach((api) => {
      // eslint-disable-next-line no-param-reassign
      api.catname = 'default';
    });
  }

  const currentTime = dayjs().unix();
  const project: Project = {
    _id: 1, // 修改为1，避免undefined问题
    name: yapiData.swaggerData.info.title,
    desc: yapiData.swaggerData.info.description || '',
    basepath: yapiData.swaggerData.basePath || '',
    tag: [],
    env: [
      {
        name: 'local',
        domain: `${yapiData.swaggerData.schemes?.[0] || 'http'}://${
          yapiData.swaggerData.host || '127.0.0.1'
        }`,
      },
    ],
  };
  const cats = yapiData.cats.map((cat: any, index: number) => ({
    _id: index + 1,
    name: cat.name,
    desc: cat.desc,
    add_time: currentTime,
    up_time: currentTime,
  }));
  const interfaces = yapiData.apis.map((api, index) => ({
    ...api,
    _id: index + 1,
    project_id: 1, // 修改为1，与project._id保持一致
    catid: cats.find((cat) => cat.name === api.catname)?._id || -1,
    tag: api.tag || [],
    add_time: currentTime,
    up_time: currentTime,
  }));

  return { project, cats, interfaces };
}

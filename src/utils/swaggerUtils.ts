/*
 * @Author: shawicx d35f3153@proton.me
 * @Date: 2025-08-08 20:57:10
 * @LastEditors: shawicx d35f3153@proton.me
 * @LastEditTime: 2025-08-13 23:00:43
 * @Description: Swagger相关的工具函数
 */

/**
 * @description 处理路径参数，确保路径格式正确
 * @param pathParam 原始路径
 * @returns 处理后的路径
 */
export function handlePath(pathParam: string): string {
  let path = pathParam;
  if (path === '/') return path;
  if (path.charAt(0) !== '/') {
    path = `/${path}`;
  }
  if (path.charAt(path.length - 1) === '/') {
    path = path.substr(0, path.length - 1);
  }
  return path;
}

/**
 * @description 将OpenAPI 3.0转换为Swagger 2.0格式
 * @param dataParam OpenAPI 3.0数据
 * @returns Swagger 2.0格式的数据
 */
export function openapi2swagger(dataParam: any): any {
  const data = { ...dataParam };
  data.swagger = '2.0';

  Object.values(data.paths).forEach((apis: any) => {
    Object.values(apis).forEach((api: any) => {
      // 处理响应内容
      Object.values(api.responses || {}).forEach((res: any) => {
        if (
          res.content &&
          res.content['application/json'] &&
          typeof res.content['application/json'] === 'object'
        ) {
          Object.assign(res, res.content['application/json']);
          Reflect.deleteProperty(res, 'content');
        }
        if (
          res.content &&
          res.content['application/hal+json'] &&
          typeof res.content['application/hal+json'] === 'object'
        ) {
          Object.assign(res, res.content['application/hal+json']);
          Reflect.deleteProperty(res, 'content');
        }
        if (res.content && res.content['*/*'] && typeof res.content['*/*'] === 'object') {
          Object.assign(res, res.content['*/*']);
          Reflect.deleteProperty(res, 'content');
        }
      });

      // 处理请求体
      if (api.requestBody) {
        if (!api.parameters) {
          (api as any).parameters = [];
        }
        const body: any = {
          type: 'object',
          name: 'body',
          in: 'body',
        };
        try {
          body.schema = api.requestBody.content['application/json'].schema;

          // 处理数组类型
          if (body.schema && body.schema.properties) {
            Object.keys(body.schema.properties).forEach((propName) => {
              const prop = body.schema.properties[propName];
              if (prop.type === 'array' && prop.items && prop.items.type) {
                // 为数组类型添加特殊标记
                prop.__isArrayType = true;
                prop.__arrayItemType = prop.items.type;
              }
            });
          }
        } catch {
          body.schema = {};
        }
        api.parameters.push(body);
      }
    });
  });

  return data;
}

/**
 * @description 检查字符串是否为有效的JSON
 * @param json 要检查的字符串
 * @returns 如果是有效JSON返回解析后的对象，否则返回false
 */
export function isJson(json: string): any {
  try {
    return JSON.parse(json);
  } catch {
    return false;
  }
}

/**
 * @description 处理响应数据
 * @param api 响应对象
 * @returns 处理后的响应体
 */
export function handleResponse(api: any): string {
  let res_body = '';
  if (!api || typeof api !== 'object') {
    return res_body;
  }

  const codes = Object.keys(api);
  let curCode;

  if (codes.length > 0) {
    if (codes.indexOf('200') > -1) {
      curCode = '200';
    } else {
      curCode = codes[0];
    }

    const res = api[curCode];
    if (res && typeof res === 'object') {
      if (res.schema) {
        res_body = JSON.stringify(res.schema, null, 2);
      } else if (res.description) {
        res_body = res.description;
      }
    } else if (typeof res === 'string') {
      res_body = res;
    } else {
      res_body = '';
    }
  } else {
    res_body = '';
  }

  return res_body;
}

/**
 * @description 处理请求体参数
 * @param data 请求体数据
 * @param api API对象
 */
export function handleBodyParams(data: any, api: any): void {
  // 递归处理schema内部的数组类型
  const processArrayTypes = (schema: any): any => {
    if (!schema || typeof schema !== 'object') {
      return schema;
    }

    if (schema.type === 'array' && schema.items && schema.items.type) {
      // 为数组类型添加特殊标记
      return {
        ...schema,
        __isArrayType: true,
        __arrayItemType: schema.items.type,
      };
    }

    if (schema.properties) {
      // 递归处理properties中的字段
      const processedProperties: any = {};
      Object.keys(schema.properties).forEach((propName) => {
        processedProperties[propName] = processArrayTypes(schema.properties[propName]);
      });
      return {
        ...schema,
        properties: processedProperties,
      };
    }

    return schema;
  };

  // 处理数组类型
  const processedData = processArrayTypes(data);
  (api as any).req_body_other = JSON.stringify(processedData, null, 2);

  if (isJson((api as any).req_body_other)) {
    (api as any).req_body_type = 'json';
    (api as any).req_body_is_json_schema = true;
  }
}

/**
 * @description 解析JSON路径引用
 * @param key 引用路径
 * @param jsonParam 根JSON对象
 * @returns 解析后的值
 */
export function simpleJsonPathParse(key: string, jsonParam: any): any {
  if (!key || typeof key !== 'string' || key.indexOf('#/') !== 0 || key.length <= 2) {
    return null;
  }

  let keys = key.substr(2).split('/');
  keys = keys.filter((item) => item);

  let json = jsonParam;
  for (let i = 0, l = keys.length; i < l; i++) {
    try {
      json = json[keys[i]];
    } catch {
      json = '';
      break;
    }
  }

  return json;
}

/**
 * @description 创建默认参数对象
 * @param param 参数对象
 * @returns 默认参数对象
 */
export function createDefaultParam(param: any): any {
  return {
    name: param.name,
    desc: param.description,
    required: param.required ? '1' : '0',
  };
}

/**
 * @description 处理参数类型
 * @param param 参数对象
 * @param api API对象
 * @param swaggerData Swagger数据
 */
export function processParameter(param: any, api: any, swaggerData: any): void {
  let paramCopy = param;

  // 处理引用参数
  if (param && typeof param === 'object' && param.$ref) {
    paramCopy = simpleJsonPathParse(param.$ref, {
      parameters: swaggerData.parameters,
    });
  }

  const defaultParam = createDefaultParam(paramCopy);

  // 处理数组类型
  if (paramCopy.type === 'array') {
    if (paramCopy.items && paramCopy.items.type) {
      // 数组类型，格式为 "array:number" 或 "array:string" 等
      defaultParam.type = `array:${paramCopy.items.type}`;
    } else {
      // 默认数组类型
      defaultParam.type = 'array';
    }
  } else {
    defaultParam.type = paramCopy.type;
  }

  if (paramCopy.in) {
    switch (paramCopy.in) {
      case 'path':
        api.req_params.push(defaultParam);
        break;
      case 'query':
        api.req_query.push(defaultParam);
        break;
      case 'body':
        handleBodyParams(paramCopy.schema, api);
        break;
      case 'formData':
        defaultParam.type = paramCopy.type === 'file' ? 'file' : 'text';
        if (paramCopy.example) {
          defaultParam.example = paramCopy.example;
        }
        api.req_body_form.push(defaultParam);
        break;
      case 'header':
        api.req_headers.push(defaultParam);
        break;
      default:
        break;
    }
  } else {
    api.req_query.push(defaultParam);
  }
}

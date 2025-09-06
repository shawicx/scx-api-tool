/*
 * @Author: shawicx d35f3153@proton.me
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

  // 处理 components.schemas 到 definitions 的转换
  if (data.components && data.components.schemas) {
    data.definitions = data.components.schemas;
    delete data.components.schemas;
  }

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

        // 处理引用类型
        if (res.schema && res.schema.$ref) {
          // 将 OpenAPI 3.0 的引用路径转换为 Swagger 2.0 的引用路径
          res.schema.$ref = res.schema.$ref.replace('#/components/schemas/', '#/definitions/');
        }
      });

      // 处理请求体
      if (api.requestBody) {
        if (!api.parameters) {
          // eslint-disable-next-line no-param-reassign
          (api as any).parameters = [];
        }
        const body: any = {
          type: 'object',
          name: 'body',
          in: 'body',
        };
        try {
          if (api.requestBody.content && api.requestBody.content['application/json']) {
            body.schema = api.requestBody.content['application/json'].schema;

            // 处理引用类型
            if (body.schema && body.schema.$ref) {
              // 将 OpenAPI 3.0 的引用路径转换为 Swagger 2.0 的引用路径
              body.schema.$ref = body.schema.$ref.replace(
                '#/components/schemas/',
                '#/definitions/',
              );
            }

            // 处理数组类型
            if (body.schema && body.schema.properties) {
              Object.keys(body.schema.properties).forEach((propName) => {
                const prop = body.schema.properties[propName];
                if (prop.type === 'array' && prop.items && prop.items.type) {
                  // 为数组类型添加特殊标记
                  prop.__isArrayType = true;
                  prop.__arrayItemType = prop.items.type;
                }
                // 处理属性中的引用类型
                if (prop && prop.$ref) {
                  prop.$ref = prop.$ref.replace('#/components/schemas/', '#/definitions/');
                }
              });
            }
          }
        } catch {
          body.schema = {};
        }
        api.parameters.push(body);
      }

      // 处理参数中的引用类型
      if (api.parameters && Array.isArray(api.parameters)) {
        api.parameters.forEach((param: any) => {
          if (param.schema && param.schema.$ref) {
            // eslint-disable-next-line no-param-reassign
            param.schema.$ref = param.schema.$ref.replace(
              '#/components/schemas/',
              '#/definitions/',
            );
          }
        });
      }
    });
  });

  // 删除不再需要的 components
  if (data.components) {
    delete data.components;
  }

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
 * @param swaggerData 完整的Swagger数据（用于解析引用）
 * @returns 处理后的响应体
 */
export function handleResponse(api: any, swaggerData?: any): string {
  let res_body = '';
  if (!api || typeof api !== 'object') {
    return res_body;
  }

  const codes = Object.keys(api);
  let curCode;

  if (codes.length > 0) {
    // 优先选择2xx状态码
    const successCodes = codes.filter((code) => code.startsWith('2'));
    if (successCodes.length > 0) {
      curCode = successCodes[0];
    } else if (codes.indexOf('200') > -1) {
      curCode = '200';
    } else if (codes.indexOf('201') > -1) {
      // 201 也是成功状态码
      curCode = '201';
    } else {
      curCode = codes[0];
    }

    const res = api[curCode];
    if (res && typeof res === 'object') {
      // 优先使用 content 中的 schema
      if (res.content && typeof res.content === 'object') {
        const contentTypes = Object.keys(res.content);
        // 优先选择 application/json，否则选择第一个
        const contentType =
          contentTypes.find((type) => type.includes('application/json')) || contentTypes[0];
        if (contentType && res.content[contentType] && res.content[contentType].schema) {
          let { schema } = res.content[contentType];

          // 处理引用类型
          if (schema.$ref && swaggerData) {
            const refData = simpleJsonPathParse(schema.$ref, swaggerData);
            if (refData) {
              schema = refData;
            }
          }

          res_body = JSON.stringify(schema, null, 2);
        } else if (res.schema) {
          let { schema } = res;

          // 处理引用类型
          if (schema.$ref && swaggerData) {
            const refData = simpleJsonPathParse(schema.$ref, swaggerData);
            if (refData) {
              schema = refData;
            }
          }

          res_body = JSON.stringify(schema, null, 2);
        } else if (res.description) {
          res_body = res.description;
        }
      } else if (res.schema) {
        let { schema } = res;

        // 处理引用类型
        if (schema.$ref && swaggerData) {
          const refData = simpleJsonPathParse(schema.$ref, swaggerData);
          if (refData) {
            schema = refData;
          }
        }

        res_body = JSON.stringify(schema, null, 2);
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
  // eslint-disable-next-line no-param-reassign
  (api as any).req_body_other = JSON.stringify(processedData, null, 2);

  if (isJson((api as any).req_body_other)) {
    // eslint-disable-next-line no-param-reassign
    (api as any).req_body_type = 'json';
    // eslint-disable-next-line no-param-reassign
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
      // 处理特殊字符解码
      const decodedKey = decodeURIComponent(keys[i]);
      json = json[decodedKey];
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
      definitions: swaggerData.definitions, // 添加对 definitions 的支持
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

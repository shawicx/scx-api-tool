/*
 * @Author: shawicx d35f3153@proton.me
 * @Description: OpenAPI 3.0 相关的工具函数
 */

import { OpenAPIV3 } from 'openapi-types';

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
 * @description 处理 OpenAPI 3.0 响应数据
 * @param responses OpenAPI 3.0 响应对象
 * @param openApiData 完整的 OpenAPI 数据（用于解析引用）
 * @returns 处理后的响应体
 */
export function handleOpenAPI3Response(
  responses: OpenAPIV3.ResponsesObject,
  openApiData?: OpenAPIV3.Document,
): string {
  let res_body = '';
  if (!responses || typeof responses !== 'object') {
    return res_body;
  }

  const codes = Object.keys(responses);
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

    const res = responses[curCode] as OpenAPIV3.ResponseObject;
    if (res && typeof res === 'object') {
      // 处理 OpenAPI 3.0 的 content 结构
      if (res.content && typeof res.content === 'object') {
        const contentTypes = Object.keys(res.content);
        // 优先选择 application/json，否则选择第一个
        const contentType =
          contentTypes.find((type) => type.includes('application/json')) || contentTypes[0];
        if (contentType && res.content[contentType] && res.content[contentType].schema) {
          let { schema } = res.content[contentType];

          // 处理引用类型
          if (schema && '$ref' in schema && typeof schema.$ref === 'string' && openApiData) {
            const refData = simpleJsonPathParse(schema.$ref, openApiData);
            if (refData) {
              schema = refData as OpenAPIV3.SchemaObject;
            }
          }

          res_body = JSON.stringify(schema, null, 2);
        } else if (res.description) {
          res_body = res.description;
        }
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
export function createDefaultParam(param: OpenAPIV3.ParameterObject): any {
  return {
    name: param.name,
    desc: param.description,
    required: param.required ? '1' : '0',
  };
}

/**
 * @description 处理 OpenAPI 3.0 参数类型
 * @param param 参数对象
 * @param api API对象
 * @param openApiData OpenAPI 数据
 */
export function processOpenAPI3Parameter(
  param: OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject,
  api: any,
  openApiData: OpenAPIV3.Document,
): void {
  let paramCopy: OpenAPIV3.ParameterObject = param as OpenAPIV3.ParameterObject;

  // 处理引用参数
  if ('$ref' in param && param.$ref) {
    const refData = simpleJsonPathParse(param.$ref, openApiData);
    if (refData) {
      paramCopy = refData as OpenAPIV3.ParameterObject;
    }
  }

  const defaultParam = createDefaultParam(paramCopy);

  // 处理数组类型
  if (paramCopy.schema && 'type' in paramCopy.schema && paramCopy.schema.type === 'array') {
    if (paramCopy.schema.items && 'type' in paramCopy.schema.items && paramCopy.schema.items.type) {
      // 数组类型，格式为 "array:number" 或 "array:string" 等
      defaultParam.type = `array:${paramCopy.schema.items.type}`;
    } else {
      // 默认数组类型
      defaultParam.type = 'array';
    }
  } else if (paramCopy.schema && 'type' in paramCopy.schema) {
    defaultParam.type = paramCopy.schema.type;
  }

  if (paramCopy.in) {
    switch (paramCopy.in) {
      case 'path':
        api.req_params.push(defaultParam);
        break;
      case 'query':
        api.req_query.push(defaultParam);
        break;
      case 'header':
        api.req_headers.push(defaultParam);
        break;
      case 'cookie':
        // Cookie 参数暂时不处理
        break;
      default:
        break;
    }
  } else {
    api.req_query.push(defaultParam);
  }
}

/**
 * @description 处理 OpenAPI 3.0 请求体
 * @param requestBody 请求体对象
 * @param api API对象
 * @param openApiData OpenAPI 数据
 */
export function processOpenAPI3RequestBody(
  requestBody: OpenAPIV3.ReferenceObject | OpenAPIV3.RequestBodyObject | undefined,
  api: any,
  openApiData: OpenAPIV3.Document,
): void {
  if (!requestBody) {
    return;
  }

  let requestBodyObj: OpenAPIV3.RequestBodyObject | null = null;

  // 处理引用
  if ('$ref' in requestBody && requestBody.$ref) {
    const refData = simpleJsonPathParse(requestBody.$ref, openApiData);
    if (refData) {
      requestBodyObj = refData as OpenAPIV3.RequestBodyObject;
    }
  } else {
    requestBodyObj = requestBody as OpenAPIV3.RequestBodyObject;
  }

  if (!requestBodyObj) {
    return;
  }

  // 处理 content
  if (requestBodyObj.content) {
    const contentTypes = Object.keys(requestBodyObj.content);
    // 优先选择 application/json，否则选择第一个
    const contentType =
      contentTypes.find((type) => type.includes('application/json')) || contentTypes[0];

    if (contentType && requestBodyObj.content[contentType]) {
      const mediaType = requestBodyObj.content[contentType];
      if (mediaType.schema) {
        let { schema } = mediaType;

        // 处理引用类型
        if ('$ref' in schema && schema.$ref && openApiData) {
          const refData = simpleJsonPathParse(schema.$ref, openApiData);
          if (refData) {
            schema = refData as OpenAPIV3.SchemaObject;
          }
        }

        handleBodyParams(schema, api);
      }
    }
  }
}

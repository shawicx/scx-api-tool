import { JSONSchema4, JSONSchema4TypeName } from 'json-schema';
import JSON5 from 'json5';
import _ from 'lodash';
import { Interface, PropDefinition } from './apiTypes';
import {
  isPostLikeMethod,
  RequestBodyType,
  RequestFormItemType,
  Required,
  ResponseBodyType,
} from './enums';
import {
  jsonSchemaStringToJsonSchema,
  jsonToJsonSchema,
  mockjsTemplateToJsonSchema,
  propDefinitionsToJsonSchema,
  reachJsonSchema,
} from './jsonSchema';
import { OneOrMore } from './types';

// 从lodash主包中提取需要的函数
const { isArray } = _;

/**
 * @description 获得请求数据 JSONSchema 对象。
 * @param interfaceInfo 接口信息
 * @param customTypeMapping 自定义类型映射
 * @returns 请求数据 JSONSchema 对象
 */
export function getRequestDataJsonSchema(
  interfaceInfo: Interface,
  customTypeMapping: Record<string, JSONSchema4TypeName>,
): JSONSchema4 {
  let jsonSchema: JSONSchema4 | undefined;

  // 处理表单数据（仅 POST 类接口）
  if (isPostLikeMethod(interfaceInfo.method)) {
    switch (interfaceInfo.req_body_type) {
      case RequestBodyType.form:
        jsonSchema = propDefinitionsToJsonSchema(
          interfaceInfo.req_body_form.map<PropDefinition>((item) => ({
            name: item.name,
            required: item.required === Required.true,
            type: (item.type === RequestFormItemType.file ? 'file' : 'string') as any,
            comment: item.desc,
          })),
          customTypeMapping,
        );
        break;
      case RequestBodyType.json:
        if (interfaceInfo.req_body_other) {
          jsonSchema = interfaceInfo.req_body_is_json_schema
            ? jsonSchemaStringToJsonSchema(interfaceInfo.req_body_other, customTypeMapping)
            : jsonToJsonSchema(JSON5.parse(interfaceInfo.req_body_other), customTypeMapping);
        }
        break;
      default:
        /* istanbul ignore next */
        break;
    }
  }

  // 处理查询数据
  if (isArray(interfaceInfo.req_query) && interfaceInfo.req_query.length) {
    const queryJsonSchema = propDefinitionsToJsonSchema(
      interfaceInfo.req_query.map<PropDefinition>((item) => ({
        name: item.name,
        required: item.required === Required.true,
        type: item.type || 'string',
        comment: item.desc,
      })),
      customTypeMapping,
    );
    /* istanbul ignore else */
    if (jsonSchema) {
      jsonSchema.properties = {
        ...jsonSchema.properties,
        ...queryJsonSchema.properties,
      };
      jsonSchema.required = [
        ...(Array.isArray(jsonSchema.required) ? jsonSchema.required : []),
        ...(Array.isArray(queryJsonSchema.required) ? queryJsonSchema.required : []),
      ];
    } else {
      jsonSchema = queryJsonSchema;
    }
  }

  // 处理路径参数
  if (isArray(interfaceInfo.req_params) && interfaceInfo.req_params.length) {
    const paramsJsonSchema = propDefinitionsToJsonSchema(
      interfaceInfo.req_params.map<PropDefinition>((item) => ({
        name: item.name,
        required: true,
        type: item.type || 'string',
        comment: item.desc,
      })),
      customTypeMapping,
    );
    /* istanbul ignore else */
    if (jsonSchema) {
      jsonSchema.properties = {
        ...jsonSchema.properties,
        ...paramsJsonSchema.properties,
      };
      jsonSchema.required = [
        ...(Array.isArray(jsonSchema.required) ? jsonSchema.required : []),
        ...(Array.isArray(paramsJsonSchema.required) ? paramsJsonSchema.required : []),
      ];
    } else {
      jsonSchema = paramsJsonSchema;
    }
  }

  return jsonSchema || {};
}

/**
 * @description 获得响应数据 JSONSchema 对象。
 * @param interfaceInfo 接口信息
 * @param customTypeMapping 自定义类型映射
 * @param dataKey 数据键
 * @returns 响应数据 JSONSchema 对象
 */
export function getResponseDataJsonSchema(
  interfaceInfo: Interface,
  customTypeMapping: Record<string, JSONSchema4TypeName>,
  dataKey?: OneOrMore<string>,
): JSONSchema4 {
  let jsonSchema: JSONSchema4 = {};

  switch (interfaceInfo.res_body_type) {
    case ResponseBodyType.json:
      if (interfaceInfo.res_body) {
        jsonSchema = interfaceInfo.res_body_is_json_schema
          ? jsonSchemaStringToJsonSchema(interfaceInfo.res_body, customTypeMapping)
          : mockjsTemplateToJsonSchema(JSON5.parse(interfaceInfo.res_body), customTypeMapping);
      }
      break;
    default:
      jsonSchema = { __is_any__: true };
      break;
  }

  if (dataKey && jsonSchema) {
    jsonSchema = reachJsonSchema(jsonSchema, dataKey);
  }

  return jsonSchema;
}

/**
 * @description 请求参数提取模块
 * 从 OpenAPI 操作中提取请求体属性与 query/path 参数，支持按来源分组
 * （body/query/path）供模板生成解构拆分，以及 @ParameterObject 风格
 * `param.schema.$ref` 的 DTO 展开。从 extractor.ts 抽出以控制文件行数。
 */

import type { ProcessedApiData } from '../processors/openapi';
import type { ApiProperty, OpenApiOperation, OpenApiParameter } from '../types';
import { sanitizePropertyName, sanitizeTypeName } from '@/naming';
import { escapeJsDocComment } from '@/utils/escape';
import { resolveComposedSchema } from '@/utils/refResolver';
import { getPropertyType } from './propertyType';
import { getRequestBodySchema } from '@/schema/operation';

/**
 * @description 提取请求体属性（$ref 展开 / 内联 / allOf 展平）
 * @param operation OpenAPI 操作对象
 * @param processedData 处理后的 API 数据
 * @returns 请求体属性数组
 */
function extractBodyProperties(
  operation: OpenApiOperation,
  processedData: ProcessedApiData,
): ApiProperty[] {
  const properties: ApiProperty[] = [];
  const requestBodySchema = getRequestBodySchema(operation);
  if (!requestBodySchema) return properties;

  const { schema } = requestBodySchema;
  // allOf 展平（顶层合并）
  const resolved = resolveComposedSchema(schema, processedData);

  if (resolved.$ref) {
    const refName = sanitizeTypeName(resolved.$ref.split('/').pop()!);
    const refSchema = processedData.types.find((t) => t.name === refName)?.schema;
    if (refSchema?.properties) {
      for (const [name, property] of Object.entries(refSchema.properties)) {
        properties.push({
          name: sanitizePropertyName(name),
          type: getPropertyType(property),
          description: escapeJsDocComment(property.description || ''),
          required: refSchema.required?.includes(name) || false,
        });
      }
    }
  } else if (resolved.properties) {
    for (const [name, property] of Object.entries(resolved.properties)) {
      properties.push({
        name: sanitizePropertyName(name),
        type: getPropertyType(property),
        description: escapeJsDocComment(property.description || ''),
        required: resolved.required?.includes(name) || false,
      });
    }
  }
  return properties;
}

/**
 * @description 将单个 OpenAPI 参数解析为属性列表
 * 兼容三种写法：
 * - `param.schema.$ref` 指向 DTO（Spring `@ParameterObject` 风格）：展开为独立参数
 * - `param.schema` 为具体 schema：按 getPropertyType 取类型
 * - 旧式 `param.type`：回退基础类型映射（默认 string）
 * @param param OpenAPI 参数对象
 * @param processedData 处理后的 API 数据
 * @returns 属性数组（$ref 展开时为多个）
 */
function resolveParameterProperties(
  param: OpenApiParameter,
  processedData: ProcessedApiData,
): ApiProperty[] {
  if (param.schema?.$ref) {
    const refName = sanitizeTypeName(param.schema.$ref.split('/').pop()!);
    const refSchema = processedData.types.find((t) => t.name === refName)?.schema;
    if (refSchema?.properties) {
      return Object.entries(refSchema.properties).map(([name, property]) => ({
        name: sanitizePropertyName(name),
        type: getPropertyType(property),
        description: escapeJsDocComment(property.description || ''),
        required: refSchema.required?.includes(name) || false,
      }));
    }
  }
  return [
    {
      name: sanitizePropertyName(param.name),
      type: param.schema
        ? getPropertyType(param.schema)
        : getPropertyType({ type: param.type || 'string' }),
      description: escapeJsDocComment(param.description || ''),
      required: !!param.required,
    },
  ];
}

/**
 * @description 请求参数分组结果
 * body/query/path 三组来源明确（OpenAPI 声明），供模板生成解构拆分
 */
export interface RequestParameterGroups {
  /** 请求体属性（requestBody schema 展开） */
  bodyProperties: ApiProperty[];
  /** query 参数（含 header/cookie 及 @ParameterObject 展开字段，保持既有打平行为） */
  queryProperties: ApiProperty[];
  /** path 参数（已被 URL 插值消费） */
  pathProperties: ApiProperty[];
}

/**
 * @description 按来源分组提取请求参数
 * body 来自 requestBody schema；query/path 按参数的 `in` 声明划分
 * （header/cookie 归入 query 组以保持既有行为）
 * @param operation OpenAPI 操作对象
 * @param processedData 处理后的 API 数据
 * @returns 参数分组
 *
 * @example
 * ```typescript
 * const groups = extractRequestParameterGroups(operation, processedData);
 * // groups = { bodyProperties: [...], queryProperties: [...], pathProperties: [...] }
 * ```
 */
export function extractRequestParameterGroups(
  operation: OpenApiOperation,
  processedData: ProcessedApiData,
): RequestParameterGroups {
  const groups: RequestParameterGroups = {
    bodyProperties: extractBodyProperties(operation, processedData),
    queryProperties: [],
    pathProperties: [],
  };
  if (operation.parameters && Array.isArray(operation.parameters)) {
    for (const param of operation.parameters) {
      const resolved = resolveParameterProperties(param, processedData);
      if (param.in === 'path') {
        groups.pathProperties.push(...resolved);
      } else {
        groups.queryProperties.push(...resolved);
      }
    }
  }
  return groups;
}

/**
 * @description 提取请求属性
 * 从 OpenAPI 操作中提取请求参数和请求体属性（打平为单个列表，
 * 用于生成 RequestType 接口与类型 import 收集；分组场景用 extractRequestParameterGroups）
 * @param operation OpenAPI 操作对象
 * @param processedData 处理后的 API 数据
 * @returns 请求属性数组
 *
 * @example
 * ```typescript
 * const properties = extractRequestProperties(operation, processedData);
 * // properties = [
 * //   { name: 'userId', type: 'number', description: '用户ID', required: true },
 * //   { name: 'userName', type: 'string', description: '用户名', required: false }
 * // ]
 * ```
 */
export function extractRequestProperties(
  operation: OpenApiOperation,
  processedData: ProcessedApiData,
): ApiProperty[] {
  const properties = extractBodyProperties(operation, processedData);
  if (operation.parameters && Array.isArray(operation.parameters)) {
    for (const param of operation.parameters) {
      properties.push(...resolveParameterProperties(param, processedData));
    }
  }
  return properties;
}

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
import {
  getRequestBodyKind,
  getRequestBodySchema,
  getRequestContentType,
  type RequestBodyKind,
} from '@/schema/operation';

const RAW_BODY_PROPERTY_CANDIDATES = ['data', 'body', 'requestBody'] as const;

/**
 * @description 请求体提取结果
 * 除属性列表外，保留 content-type 分类与 raw body 字段名，供模板层生成请求配置
 */
interface RequestBodyInfo {
  properties: ApiProperty[];
  kind: RequestBodyKind;
  contentType: string | null;
  rawBodyPropertyName?: string;
}

/**
 * @description 提取请求体属性（$ref 展开 / 内联 / allOf 展平）
 * @param operation OpenAPI 操作对象
 * @param processedData 处理后的 API 数据
 * @returns 请求体属性数组
 */
function extractBodyProperties(
  operation: OpenApiOperation,
  processedData: ProcessedApiData,
  reservedNames: ReadonlySet<string> = new Set(),
  includeSchema = false,
): RequestBodyInfo {
  const kind = getRequestBodyKind(operation);
  const contentType = getRequestContentType(operation);
  const properties: ApiProperty[] = [];
  const requestBodySchema = getRequestBodySchema(operation);
  if (!requestBodySchema) {
    return { properties, kind, contentType };
  }

  if (kind === 'binary') {
    const rawBodyPropertyName = RAW_BODY_PROPERTY_CANDIDATES.find(
      (candidate) => !reservedNames.has(candidate),
    );
    if (!rawBodyPropertyName) {
      throw new Error('无法为原始二进制请求体生成不冲突的字段名');
    }

    return {
      properties: [
        {
          name: rawBodyPropertyName,
          type: 'Blob',
          ...(includeSchema ? { schema: requestBodySchema.schema } : {}),
          description: '原始二进制请求体',
          required: true,
        },
      ],
      kind,
      contentType,
      rawBodyPropertyName,
    };
  }

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
          ...(includeSchema ? { schema: property } : {}),
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
        ...(includeSchema ? { schema: property } : {}),
        description: escapeJsDocComment(property.description || ''),
        required: resolved.required?.includes(name) || false,
      });
    }
  }
  return { properties, kind, contentType };
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
  includeSchema = false,
): ApiProperty[] {
  if (param.schema?.$ref) {
    const refName = sanitizeTypeName(param.schema.$ref.split('/').pop()!);
    const refSchema = processedData.types.find((t) => t.name === refName)?.schema;
    if (refSchema?.properties) {
      return Object.entries(refSchema.properties).map(([name, property]) => ({
        name: sanitizePropertyName(name),
        type: getPropertyType(property),
        ...(includeSchema ? { schema: property } : {}),
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
      ...(includeSchema ? { schema: param.schema ?? { type: param.type || 'string' } } : {}),
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
  /** 请求体分类 */
  requestBodyKind: RequestBodyKind;
  /** 请求体 content-type */
  requestContentType: string | null;
  /** 原始二进制请求体字段名 */
  rawBodyPropertyName?: string;
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
  includeSchema = false,
): RequestParameterGroups {
  const queryProperties: ApiProperty[] = [];
  const pathProperties: ApiProperty[] = [];

  if (operation.parameters && Array.isArray(operation.parameters)) {
    for (const param of operation.parameters) {
      const resolved = resolveParameterProperties(param, processedData, includeSchema);
      if (param.in === 'path') {
        pathProperties.push(...resolved);
      } else {
        queryProperties.push(...resolved);
      }
    }
  }

  const reservedNames = new Set(
    [...queryProperties, ...pathProperties].map((property) => property.name),
  );
  const requestBody = extractBodyProperties(operation, processedData, reservedNames, includeSchema);

  const groups: RequestParameterGroups = {
    bodyProperties: requestBody.properties,
    queryProperties: [],
    pathProperties,
    requestBodyKind: requestBody.kind,
    requestContentType: requestBody.contentType,
    ...(requestBody.rawBodyPropertyName
      ? { rawBodyPropertyName: requestBody.rawBodyPropertyName }
      : {}),
  };

  groups.queryProperties.push(...queryProperties);
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
  const groups = extractRequestParameterGroups(operation, processedData);
  if (groups.requestBodyKind === 'binary') {
    return [...groups.pathProperties, ...groups.queryProperties, ...groups.bodyProperties];
  }

  return [...groups.bodyProperties, ...groups.queryProperties, ...groups.pathProperties];
}

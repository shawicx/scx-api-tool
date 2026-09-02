/**
 * @description 公共处理模块
 * 提供数据处理相关的公共函数
 */

import type { ApiInterface, ApiProperty } from '../types';
import { ProcessedApiData } from './openapi';
import { getRequestBodySchema, getResponseSchema } from '@/schema';
import { isDepthExceeded, CircularRefGuard } from '@/utils/schemaSafety';

/**
 * @description 按标签分组接口
 * 将接口列表按标签分组，没有标签的接口归入 default 组
 * @param interfaces 接口数组
 * @returns 按标签分组的接口对象
 *
 * @example
 * ```typescript
 * const interfaces = [
 *   { operation: { tags: ['user'] }, path: '/user/get' },
 *   { operation: { tags: ['user'] }, path: '/user/list' },
 *   { operation: {}, path: '/info' }
 * ];
 * const grouped = groupInterfacesByTag(interfaces);
 * // grouped = {
 * //   user: [接口1, 接口2],
 * //   default: [接口3]
 * // }
 * ```
 */
export function groupInterfacesByTag(interfaces: ApiInterface[]): Record<string, ApiInterface[]> {
  const interfacesByTag: Record<string, ApiInterface[]> = {};

  for (const apiInterface of interfaces) {
    const tags = apiInterface.operation.tags || [];
    if (tags.length > 0) {
      const tag = tags[0];
      if (!interfacesByTag[tag]) {
        interfacesByTag[tag] = [];
      }
      interfacesByTag[tag].push(apiInterface);
    } else {
      if (!interfacesByTag.default) {
        interfacesByTag.default = [];
      }
      interfacesByTag.default.push(apiInterface);
    }
  }

  return interfacesByTag;
}

/**
 * @description 从属性列表中收集使用的自定义类型名称
 * 将属性类型串按分隔符（联合 |、交叉 &、泛型 <>、数组 []、逗号与空白）
 * 拆分为标识符 token 后，对自定义类型名集合做命中检查。
 * 因此可空联合（X | null）、Record<string, X>、A | B、A & B、嵌套数组
 * 等复合类型串中的自定义类型都能被收集，避免生成的文件缺少 import。
 * @param properties 属性数组
 * @param processedData 处理后的 API 数据
 * @returns 类型名称集合
 *
 * @example
 * ```typescript
 * const used = collectUsedTypesFromProperties(
 *   [{ name: 'preferences', type: 'UserPreferences | null', description: '', required: false }],
 *   processedData,
 * );
 * // used = Set(['UserPreferences'])
 * ```
 */
export function collectUsedTypesFromProperties(
  properties: ApiProperty[],
  processedData: ProcessedApiData,
): Set<string> {
  const usedTypes = new Set<string>();
  const knownTypeNames = new Set(processedData.types.map((t) => t.name));
  // 分隔符涵盖：联合 |、交叉 &、泛型 <>、数组 []、Record 逗号与空白
  const SEPARATOR_RE = /[|&<>[\],\s]+/;
  for (const prop of properties) {
    for (const token of prop.type.split(SEPARATOR_RE)) {
      if (token && knownTypeNames.has(token)) {
        usedTypes.add(token);
      }
    }
  }
  return usedTypes;
}

/**
 * @description 提取所有使用的类型名称
 * 从接口数据中提取所有引用的类型名称
 * @param interfaces 接口数组
 * @param processedData 处理后的 API 数据
 * @returns 类型名称集合
 *
 * @example
 * ```typescript
 * const usedTypes = extractUsedTypeNames(interfaces, processedData);
 * // usedTypes = Set(['User', 'Product', 'Order'])
 * ```
 */
export function extractUsedTypeNames(
  interfaces: ApiInterface[],
  processedData: ProcessedApiData,
): Set<string> {
  const usedTypes = new Set<string>();

  for (const apiInterface of interfaces) {
    const { operation } = apiInterface;

    // 从请求参数中提取类型
    if (operation.parameters && Array.isArray(operation.parameters)) {
      for (const param of operation.parameters) {
        if (param.type) {
          const baseType = param.type.endsWith('[]') ? param.type.slice(0, -2) : param.type;
          if (isCustomType(baseType, processedData)) {
            usedTypes.add(baseType);
          }
        }
      }
    }

    // 从请求体中提取类型（走 getRequestBodySchema 以兼容 */* 等 content-type）
    const requestBodySchema = getRequestBodySchema(operation);
    if (requestBodySchema) {
      const extracted = extractTypesFromSchema(requestBodySchema.schema, processedData);
      extracted.forEach((type) => usedTypes.add(type));
    }

    // 从响应中提取类型（走 getResponseSchema 以兼容 */* 等 content-type）
    const responseSchema = getResponseSchema(operation);
    if (responseSchema) {
      const extracted = extractTypesFromSchema(responseSchema.schema, processedData);
      extracted.forEach((type) => usedTypes.add(type));
    }
  }

  return usedTypes;
}

/**
 * @description 从 Schema 中提取类型名称
 * 递归解析 Schema 提取所有引用的自定义类型
 * @param schema OpenAPI Schema 对象
 * @param processedData 处理后的 API 数据
 * @param depth 当前递归深度（内部使用，防 DoS）
 * @param guard 循环引用检测器（内部使用）
 * @returns 类型名称数组
 */
function extractTypesFromSchema(
  schema: any,
  processedData: ProcessedApiData,
  depth = 0,
  guard: CircularRefGuard = new CircularRefGuard(),
): string[] {
  const types: string[] = [];

  if (!schema || isDepthExceeded(depth)) {
    return types;
  }

  // 循环引用检测（仅对对象生效）
  if (typeof schema === 'object' && guard.begin(schema)) {
    return types;
  }

  try {
    // 处理引用类型
    if (schema.$ref) {
      const refName = schema.$ref.split('/').pop();
      if (isCustomType(refName, processedData)) {
        types.push(refName);
      }
      return types;
    }

    // 处理对象属性
    if (schema.properties) {
      for (const property of Object.values(schema.properties) as any[]) {
        const extracted = extractTypesFromSchema(property, processedData, depth + 1, guard);
        extracted.forEach((type) => types.push(type));
      }
    }

    // 处理数组
    if (schema.type === 'array' && schema.items) {
      const extracted = extractTypesFromSchema(schema.items, processedData, depth + 1, guard);
      extracted.forEach((type) => types.push(type));
    }

    // 处理 additionalProperties
    if (schema.additionalProperties) {
      const extracted = extractTypesFromSchema(
        schema.additionalProperties,
        processedData,
        depth + 1,
        guard,
      );
      extracted.forEach((type) => types.push(type));
    }

    // 处理 allOf / oneOf / anyOf 组合（递归子 schema，透传 depth+1 与 guard）
    for (const compositeKey of ['allOf', 'oneOf', 'anyOf'] as const) {
      const composite = schema[compositeKey];
      if (Array.isArray(composite)) {
        for (const sub of composite) {
          const extracted = extractTypesFromSchema(sub, processedData, depth + 1, guard);
          extracted.forEach((type) => types.push(type));
        }
      }
    }
  } finally {
    if (typeof schema === 'object') guard.end(schema);
  }

  return types;
}

/**
 * @description 检查是否为自定义类型
 * @param typeName 类型名称
 * @param processedData 处理后的 API 数据
 * @returns 是否为自定义类型
 */
function isCustomType(typeName: string, processedData: ProcessedApiData): boolean {
  if (!typeName) return false;

  // 排除基本类型
  const basicTypes = ['any', 'string', 'number', 'boolean', 'object', 'unknown', 'never', 'null'];
  if (basicTypes.includes(typeName.toLowerCase())) {
    return false;
  }

  // 检查是否在类型定义中
  return processedData.types.some((t) => t.name === typeName);
}

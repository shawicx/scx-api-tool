/**
 * @description 数据提取模块
 * 从 OpenAPI 操作中提取请求和响应属性
 */

import { ProcessedApiData } from '../processors/openapi';
import type { ApiProperty, OpenApiOperation, OpenApiSchema } from '../types';
import { sanitizePropertyName, sanitizeTypeName } from './naming';

/**
 * @description 提取请求属性
 * 从操作中提取请求参数和请求体属性
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
  const properties: ApiProperty[] = [];

  // 处理请求体
  if (operation.requestBody && operation.requestBody.content) {
    const jsonContent = operation.requestBody.content['application/json'];
    if (jsonContent && jsonContent.schema) {
      const { schema } = jsonContent;

      // 处理引用模式
      if (schema.$ref) {
        const refName = schema.$ref.split('/').pop();
        const refSchema = processedData.types.find((t) => t.name === refName)?.schema;
        if (refSchema && refSchema.properties) {
          for (const [name, property] of Object.entries(refSchema.properties)) {
            properties.push({
              name: sanitizePropertyName(name),
              type: getPropertyType(property),
              description: property.description || '',
              required: refSchema.required?.includes(name) || false,
            });
          }
        }
      } else if (schema.properties) {
        // 处理内联模式
        for (const [name, property] of Object.entries(schema.properties)) {
          properties.push({
            name: sanitizePropertyName(name),
            type: getPropertyType(property),
            description: property.description || '',
            required: schema.required?.includes(name) || false,
          });
        }
      }
    }
  }

  // 处理查询/路径参数
  if (operation.parameters && Array.isArray(operation.parameters)) {
    for (const param of operation.parameters) {
      properties.push({
        name: sanitizePropertyName(param.name),
        type: getPropertyType({ type: param.type || 'string' }),
        description: param.description || '',
        required: !!param.required,
      });
    }
  }

  return properties;
}

/**
 * @description 提取响应属性
 * 从响应中提取响应属性
 * @param responses OpenAPI 响应对象
 * @param processedData 处理后的 API 数据
 * @returns 响应属性数组
 *
 * @example
 * ```typescript
 * const properties = extractResponseProperties(responses, processedData);
 * // properties = [
 * //   { name: 'data', type: 'User', description: '用户数据', required: true }
 * // ]
 * ```
 */
export function extractResponseProperties(
  responses: OpenApiOperation['responses'],
  processedData: ProcessedApiData,
): ApiProperty[] {
  if (!responses) return [];

  const properties: ApiProperty[] = [];

  // 从200响应中提取属性
  const successResponse = responses['200'] || responses['201'];
  if (successResponse && successResponse.content) {
    const jsonContent = successResponse.content['application/json'];
    if (jsonContent && jsonContent.schema) {
      const { schema } = jsonContent;

      // 处理引用模式
      if (schema.$ref) {
        const refName = schema.$ref.split('/').pop()!;
        const refSchema = processedData.types.find((t) => t.name === refName)?.schema;
        if (refSchema && refSchema.properties) {
          for (const [name, property] of Object.entries(refSchema.properties)) {
            properties.push({
              name: sanitizePropertyName(name),
              type: getPropertyType(property),
              description: property.description || '',
              required: refSchema.required?.includes(name) || false,
            });
          }
        } else if (refSchema) {
          // 如果我们找到了引用模式但没有属性，
          // 它可能是一个直接类型引用
          properties.push({
            name: 'data',
            type: sanitizeTypeName(refName),
            description: '响应数据',
            required: true,
          });
        } else {
          // 如果我们找不到引用，添加一个通用响应
          properties.push({
            name: 'data',
            type: sanitizeTypeName(refName),
            description: '响应数据',
            required: true,
          });
        }
      } else if (schema.properties) {
        // 处理内联模式
        for (const [name, property] of Object.entries(schema.properties)) {
          properties.push({
            name: sanitizePropertyName(name),
            type: getPropertyType(property),
            description: property.description || '',
            required: schema.required?.includes(name) || false,
          });
        }
      } else if (schema.type === 'array' && schema.items) {
        // 处理数组响应
        properties.push({
          name: 'data',
          type: `${getPropertyType(schema.items)}[]`,
          description: '响应数据数组',
          required: true,
        });
      } else if (schema.type) {
        // 处理基本类型
        properties.push({
          name: 'data',
          type: getPropertyType(schema),
          description: '响应数据',
          required: true,
        });
      } else {
        // 处理通用对象响应
        properties.push({
          name: 'data',
          type: 'any',
          description: '响应数据',
          required: true,
        });
      }
    }
  }

  return properties;
}

/**
 * @description 提取类型属性
 * 从 Schema 中提取类型属性
 * @param schema OpenAPI Schema 对象
 * @returns 类型属性数组
 *
 * @example
 * ```typescript
 * const properties = extractTypeProperties(schema);
 * // properties = [
 * //   { name: 'id', type: 'number', description: 'ID', required: true },
 * //   { name: 'name', type: 'string', description: '名称', required: false }
 * // ]
 * ```
 */
export function extractTypeProperties(schema: OpenApiSchema): ApiProperty[] {
  if (!schema) {
    return [];
  }

  // 处理引用模式
  if (schema.$ref) {
    // 目前，我们对引用类型返回空数组
    // 在更完整的实现中，我们将解析引用
    // 并从引用的模式中提取属性
    return [];
  }

  if (!schema.properties) {
    return [];
  }

  const properties: ApiProperty[] = [];

  for (const [name, property] of Object.entries(schema.properties)) {
    properties.push({
      name: sanitizePropertyName(name),
      type: getPropertyType(property),
      description: property.description || '',
      required: schema.required?.includes(name) || false,
    });
  }

  return properties;
}

/**
 * @description 获取属性类型
 * 将 OpenAPI Schema 属性转换为 TypeScript 类型字符串
 * @param property OpenAPI Schema 属性对象
 * @returns TypeScript 类型字符串
 *
 * @example
 * ```typescript
 * const type = getPropertyType({ type: 'string' }); // 'string'
 * const type = getPropertyType({ type: 'array', items: { type: 'number' } }); // 'number[]'
 * const type = getPropertyType({ $ref: '#/components/schemas/User' }); // 'User'
 * ```
 */
export function getPropertyType(property: OpenApiSchema): string {
  if (!property) return 'any';

  // 处理引用类型
  if (property.$ref) {
    const refName = property.$ref.split('/').pop()!;
    return sanitizeTypeName(refName);
  }

  // 处理数组类型
  if (property.type === 'array' && property.items) {
    return `${getPropertyType(property.items)}[]`;
  }

  // 处理对象类型
  if (property.type === 'object') {
    // 检查是否为引用对象
    if (property.additionalProperties && property.additionalProperties.$ref) {
      const refName = property.additionalProperties.$ref.split('/').pop()!;
      return `Record<string, ${sanitizeTypeName(refName)}>`;
    }
    return 'Record<string, any>';
  }

  // 映射基本类型
  switch (property.type) {
    case 'string':
      return 'string';
    case 'number':
    case 'integer':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'null':
      return 'null';
    default:
      return 'any';
  }
}

/**
 * @description 检查是否有请求体
 * @param operation OpenAPI 操作对象
 * @returns 是否有请求体
 *
 * @example
 * ```typescript
 * const hasBody = hasRequestBody(operation);
 * // 如果操作有 requestBody，返回 true
 * ```
 */
export function hasRequestBody(operation: OpenApiOperation): boolean {
  return !!operation.requestBody;
}

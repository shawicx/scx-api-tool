import { ProcessedApiData } from '../processors/openapi';
import { sanitizePropertyName, sanitizeTypeName } from './naming';

export function extractRequestProperties(operation: any, processedData: ProcessedApiData): any[] {
  const properties: any[] = [];

  // 处理请求体
  if (operation.requestBody && operation.requestBody.content) {
    const jsonContent = operation.requestBody.content['application/json'];
    if (jsonContent && jsonContent.schema) {
      const { schema } = jsonContent;

      // 处理引用模式
      if (schema.$ref) {
        const refName = schema.$ref.split('/').pop();
        const refSchema = processedData.types.find((t: any) => t.name === refName)?.schema;
        if (refSchema && refSchema.properties) {
          for (const [name, property] of Object.entries(refSchema.properties)) {
            properties.push({
              name: sanitizePropertyName(name),
              type: getPropertyType(property),
              description: (property as any).description || '',
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
            description: (property as any).description || '',
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

export function extractResponseProperties(responses: any, processedData: ProcessedApiData): any[] {
  if (!responses) return [];

  const properties: any[] = [];

  // 从200响应中提取属性
  const successResponse = responses['200'] || responses['201'];
  if (successResponse && successResponse.content) {
    const jsonContent = successResponse.content['application/json'];
    if (jsonContent && jsonContent.schema) {
      const { schema } = jsonContent;

      // 处理引用模式
      if (schema.$ref) {
        const refName = schema.$ref.split('/').pop();
        const refSchema = processedData.types.find((t: any) => t.name === refName)?.schema;
        if (refSchema && refSchema.properties) {
          for (const [name, property] of Object.entries(refSchema.properties)) {
            properties.push({
              name: sanitizePropertyName(name),
              type: getPropertyType(property),
              description: (property as any).description || '',
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
            description: (property as any).description || '',
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

export function extractTypeProperties(schema: any): any[] {
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

  const properties: any[] = [];

  for (const [name, property] of Object.entries(schema.properties)) {
    properties.push({
      name: sanitizePropertyName(name),
      type: getPropertyType(property),
      description: (property as any).description || '',
      required: schema.required?.includes(name) || false,
    });
  }

  return properties;
}

export function getPropertyType(property: any): string {
  if (!property) return 'any';

  // 处理引用类型
  if (property.$ref) {
    const refName = property.$ref.split('/').pop();
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
      const refName = property.additionalProperties.$ref.split('/').pop();
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

export function hasRequestBody(operation: any): boolean {
  return !!operation.requestBody;
}

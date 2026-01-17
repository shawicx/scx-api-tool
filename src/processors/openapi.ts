/**
 * @description OpenAPI 数据处理模块
 * 处理 OpenAPI 格式的数据，提取接口、类型和类别信息
 */

import consola from 'consola';
import { ServerType } from '@/types';
import type { ApiConfig } from '@/types';
import { sanitizeTypeName } from '../generator/naming';

export interface ProcessedApiData {
  interfaces: any[];
  types: any[];
  categories: any[];
}

export { groupInterfacesByTag, extractUsedTypeNames } from './common';

export function processOpenApiData(data: any, config: ApiConfig): ProcessedApiData {
  // 如果启用，则记录调试信息
  if (process.env.DEBUG) {
    if (typeof data === 'object' && data !== null) {
      consola.debug('数据键:', Object.keys(data));
      // 记录第一个路径条目用于调试
      if (data.paths) {
        const firstPath = Object.keys(data.paths)[0];
        const firstMethod = Object.keys(data.paths[firstPath])[0];
        consola.debug('第一个路径条目:', firstPath, firstMethod);
        consola.debug('第一个操作键:', Object.keys(data.paths[firstPath][firstMethod]));
      }

      // 记录标签信息
      if (data.tags) {
        consola.debug('标签:', data.tags);
      }
    }
  }

  const interfaces: any[] = [];
  const types: any[] = [];
  const categories: any[] = [];

  // 处理包括 Apifox 在内的所有服务器类型的标准 OpenAPI 格式
  if (data.paths) {
    for (const [path, methods] of Object.entries(data.paths)) {
      // 应用路径前缀转换
      const normalizedPath = config.pathPrefix
        ? path.replace(new RegExp(`^${config.pathPrefix}`), '')
        : path;

      for (const [method, operation] of Object.entries(methods as any)) {
        // 处理 Apifox 特定格式的操作
        const processedOperation = processOperation(operation, config);

        if (process.env.DEBUG) {
          // 记录前几个操作用于调试
          if (interfaces.length < 3) {
            consola.debug(`操作 ${path} ${method}:`, Object.keys(processedOperation));
          }
        }

        interfaces.push({
          path: normalizedPath,
          method,
          operation: processedOperation,
        });
      }
    }
  }

  // 提取 components/schemas 用于类型定义
  if (data.components?.schemas) {
    for (const [name, schema] of Object.entries(data.components.schemas)) {
      types.push({
        name: sanitizeTypeName(name),
        originalName: name, // 保留原始名称用于调试
        schema,
      });
    }
  }

  // 处理不同服务器类型的类别提取
  if (config.serverType === ServerType.Apifox && data.tags) {
    // 对于 Apifox，使用标签作为类别
    categories.push(...data.tags);
  } else if (config.serverType === ServerType.Swagger && data.tags) {
    // 对于 Swagger，也使用标签作为类别
    categories.push(...data.tags);
  }

  if (process.env.DEBUG) {
    consola.debug(
      `Processed ${interfaces.length} interfaces, ${types.length} types, ${categories.length} categories`,
    );
  }

  return {
    interfaces,
    types,
    categories,
  };
}

function processOperation(operation: any, config: ApiConfig): any {
  // 对于 Apifox，我们需要以特定方式处理参数和响应
  if (config.serverType === ServerType.Apifox) {
    return {
      ...operation,
      parameters: processApifoxParameters(operation.parameters),
      responses: processApifoxResponses(operation.responses),
      requestBody: processApifoxRequestBody(operation.requestBody),
    };
  }

  // 对于其他服务器类型，原样返回
  return operation;
}

function processApifoxParameters(parameters: any): any[] {
  if (!parameters || !Array.isArray(parameters)) return [];

  return parameters.map((param) => ({
    name: param.name,
    in: param.in || 'query',
    description: param.description || '',
    required: !!param.required,
    type: param.type || 'string',
  }));
}

function processApifoxResponses(responses: any): any {
  if (!responses) return {};

  const processed: any = {};
  for (const [statusCode, response] of Object.entries(responses)) {
    processed[statusCode] = {
      description: (response as any).description || '',
      content: {
        'application/json': {
          schema:
            (response as any).content?.['application/json']?.schema ||
            (response as any).schema ||
            {},
        },
      },
    };
  }
  return processed;
}

function processApifoxRequestBody(requestBody: any): any {
  if (!requestBody) return undefined;

  return {
    content: {
      'application/json': {
        schema: requestBody.content?.['application/json']?.schema || requestBody.schema || {},
      },
    },
  };
}

import consola from 'consola';
import { ApiConfig, ServerType } from '../types';

export interface ProcessedApiData {
  interfaces: any[];
  types: any[];
  categories: any[];
}

export function processOpenApiData(data: any, config: ApiConfig): ProcessedApiData {
  // Log debug information if enabled
  if (process.env.DEBUG) {
    consola.debug('Processing OpenAPI data');
    consola.debug('Data type:', typeof data);
    if (typeof data === 'object' && data !== null) {
      consola.debug('Data keys:', Object.keys(data));
      // Log first path entry for debugging
      if (data.paths) {
        const firstPath = Object.keys(data.paths)[0];
        const firstMethod = Object.keys(data.paths[firstPath])[0];
        consola.debug('First path entry:', firstPath, firstMethod);
        consola.debug('First operation keys:', Object.keys(data.paths[firstPath][firstMethod]));
      }

      // Log tags information
      if (data.tags) {
        consola.debug('Tags:', data.tags);
      }
    }
  }

  const interfaces: any[] = [];
  const types: any[] = [];
  const categories: any[] = [];

  // Handle standard OpenAPI format for all server types including Apifox
  if (data.paths) {
    for (const [path, methods] of Object.entries(data.paths)) {
      // Apply pathPrefix transformation
      const normalizedPath = config.pathPrefix
        ? path.replace(new RegExp(`^${config.pathPrefix}`), '')
        : path;

      for (const [method, operation] of Object.entries(methods as any)) {
        // Process operation for Apifox specific format
        const processedOperation = processOperation(operation, config);

        if (process.env.DEBUG) {
          // Log first few operations for debugging
          if (interfaces.length < 3) {
            consola.debug(`Operation ${path} ${method}:`, Object.keys(processedOperation));
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

  // Extract components/schemas for types
  if (data.components?.schemas) {
    for (const [name, schema] of Object.entries(data.components.schemas)) {
      types.push({
        name,
        schema,
      });
    }
  }

  // Handle different server types for category extraction
  if (config.serverType === ServerType.Apifox && data.tags) {
    // For Apifox, use tags as categories
    categories.push(...data.tags);
  } else if (config.serverType === ServerType.Swagger && data.tags) {
    // For Swagger, also use tags as categories
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
  // For Apifox, we need to process parameters and responses in a specific way
  if (config.serverType === ServerType.Apifox) {
    return {
      ...operation,
      parameters: processApifoxParameters(operation.parameters),
      responses: processApifoxResponses(operation.responses),
      requestBody: processApifoxRequestBody(operation.requestBody),
    };
  }

  // For other server types, return as is
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

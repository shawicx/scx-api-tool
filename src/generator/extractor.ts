import { ProcessedApiData } from '../processors/openapi';

export function extractRequestProperties(operation: any, processedData: ProcessedApiData): any[] {
  const properties: any[] = [];

  // Handle request body
  if (operation.requestBody && operation.requestBody.content) {
    const jsonContent = operation.requestBody.content['application/json'];
    if (jsonContent && jsonContent.schema) {
      const { schema } = jsonContent;

      // Handle reference schemas
      if (schema.$ref) {
        const refName = schema.$ref.split('/').pop();
        const refSchema = processedData.types.find((t: any) => t.name === refName)?.schema;
        if (refSchema && refSchema.properties) {
          for (const [name, property] of Object.entries(refSchema.properties)) {
            properties.push({
              name,
              type: getPropertyType(property),
              description: (property as any).description || '',
              required: refSchema.required?.includes(name) || false,
            });
          }
        }
      } else if (schema.properties) {
        // Handle inline schemas
        for (const [name, property] of Object.entries(schema.properties)) {
          properties.push({
            name,
            type: getPropertyType(property),
            description: (property as any).description || '',
            required: schema.required?.includes(name) || false,
          });
        }
      }
    }
  }

  // Handle query/path parameters
  if (operation.parameters && Array.isArray(operation.parameters)) {
    for (const param of operation.parameters) {
      properties.push({
        name: param.name,
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

  // Extract properties from 200 response
  const successResponse = responses['200'] || responses['201'];
  if (successResponse && successResponse.content) {
    const jsonContent = successResponse.content['application/json'];
    if (jsonContent && jsonContent.schema) {
      const { schema } = jsonContent;

      // Handle reference schemas
      if (schema.$ref) {
        const refName = schema.$ref.split('/').pop();
        const refSchema = processedData.types.find((t: any) => t.name === refName)?.schema;
        if (refSchema && refSchema.properties) {
          for (const [name, property] of Object.entries(refSchema.properties)) {
            properties.push({
              name,
              type: getPropertyType(property),
              description: (property as any).description || '',
              required: refSchema.required?.includes(name) || false,
            });
          }
        } else if (refSchema) {
          // If we found the reference schema but it has no properties,
          // it might be a direct type reference
          properties.push({
            name: 'data',
            type: refName,
            description: 'Response data',
            required: true,
          });
        } else {
          // If we can't find the reference, add a generic response
          properties.push({
            name: 'data',
            type: refName,
            description: 'Response data',
            required: true,
          });
        }
      } else if (schema.properties) {
        // Handle inline schemas
        for (const [name, property] of Object.entries(schema.properties)) {
          properties.push({
            name,
            type: getPropertyType(property),
            description: (property as any).description || '',
            required: schema.required?.includes(name) || false,
          });
        }
      } else if (schema.type === 'array' && schema.items) {
        // Handle array responses
        properties.push({
          name: 'data',
          type: `${getPropertyType(schema.items)}[]`,
          description: 'Response data array',
          required: true,
        });
      } else if (schema.type) {
        // Handle primitive types
        properties.push({
          name: 'data',
          type: getPropertyType(schema),
          description: 'Response data',
          required: true,
        });
      } else {
        // Handle generic object responses
        properties.push({
          name: 'data',
          type: 'any',
          description: 'Response data',
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

  // Handle reference schemas
  if (schema.$ref) {
    // For now, we'll return an empty array for reference types
    // In a more complete implementation, we would resolve the reference
    // and extract properties from the referenced schema
    return [];
  }

  if (!schema.properties) {
    return [];
  }

  const properties: any[] = [];

  for (const [name, property] of Object.entries(schema.properties)) {
    properties.push({
      name,
      type: getPropertyType(property),
      description: (property as any).description || '',
      required: schema.required?.includes(name) || false,
    });
  }

  return properties;
}

export function getPropertyType(property: any): string {
  if (!property) return 'any';

  // Handle reference types
  if (property.$ref) {
    const refName = property.$ref.split('/').pop();
    return refName;
  }

  // Handle array types
  if (property.type === 'array' && property.items) {
    return `${getPropertyType(property.items)}[]`;
  }

  // Handle object types
  if (property.type === 'object') {
    // Check if it's a reference object
    if (property.additionalProperties && property.additionalProperties.$ref) {
      const refName = property.additionalProperties.$ref.split('/').pop();
      return `Record<string, ${refName}>`;
    }
    return 'Record<string, any>';
  }

  // Map basic types
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

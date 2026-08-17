/**
 * @description 共享测试夹具
 * 提供各模块测试所需的通用 mock 数据
 */

import type {
  OpenApiDocument,
  OpenApiOperation,
  ApiInterface,
  ApiTypeDefinition,
  ApiCategory,
  MultiServiceConfig,
  ServiceConfig,
  ApiConfig,
} from '@/types';
import { ServerType, RequestMethodStyle } from '@/types';
import type { ProcessedApiData } from '@/processors/openapi';

// ==================== OpenAPI 文档 mock ====================

export const mockOpenApiDocument: OpenApiDocument = {
  openapi: '3.0.0',
  info: { title: 'Test API', version: '1.0.0' },
  paths: {
    '/api/users': {
      get: {
        summary: '获取用户列表',
        tags: ['用户管理'],
        parameters: [
          { name: 'page', in: 'query', type: 'number', required: false, description: '页码' },
        ],
        responses: {
          '200': {
            description: '成功',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserListResponse' },
              },
            },
          },
        },
      },
      post: {
        summary: '创建用户',
        tags: ['用户管理'],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateUserRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: '创建成功',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
        },
      },
    },
    '/api/users/{id}': {
      get: {
        summary: '获取用户详情',
        tags: ['用户管理'],
        parameters: [
          { name: 'id', in: 'path', type: 'number', required: true, description: '用户ID' },
        ],
        responses: {
          '200': {
            description: '成功',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'number', description: '用户ID' },
          name: { type: 'string', description: '用户名' },
          email: { type: 'string', description: '邮箱' },
        },
        required: ['id', 'name'],
      },
      CreateUserRequest: {
        type: 'object',
        properties: {
          name: { type: 'string', description: '用户名' },
          email: { type: 'string', description: '邮箱' },
        },
        required: ['name'],
      },
      UserListResponse: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/User' },
            description: '用户列表',
          },
          total: { type: 'number', description: '总数' },
        },
        required: ['data', 'total'],
      },
    },
  },
  tags: [
    { name: '用户管理', description: '用户相关接口' },
    { name: 'system', description: '系统接口' },
  ],
};

export const emptyOpenApiDocument: OpenApiDocument = {
  openapi: '3.0.0',
  info: { title: 'Empty API', version: '1.0.0' },
};

// ==================== ApiConfig mock ====================

export const minimalApiConfig: ApiConfig = {
  source: 'https://petstore.swagger.io/v2/swagger.json',
  token: '',
  serverUrl: 'https://petstore.swagger.io',
  serverType: ServerType.Swagger,
  generateApi: true,
  generateTypes: true,
  typesFormat: 'typescript',
  target: 'typescript',
  transformPath: (p: string) => p,
  outputDir: 'src/service',
  indentSize: 2,
  comment: true,
  prodEnvName: 'production',
  requestFunctionFilePath: 'src/service/request.ts',
  requestMethodStyle: RequestMethodStyle.CONFIG,
  requestFunctionName: 'request',
  requestMethodsObjectName: 'requestMethods',
  requestParamName: 'params',
  responseTypeName: 'Response',
  concurrency: 50,
};

export const apifoxApiConfig: ApiConfig = {
  ...minimalApiConfig,
  source: 'https://api.apifox.com/v1/projects/123456/export-openapi',
  token: 'test-token-123',
  serverUrl: 'https://api.apifox.com',
  serverType: ServerType.Apifox,
  apifoxProjectId: '123456',
};

// ==================== ServiceConfig / MultiServiceConfig mock ====================

export const validSwaggerServiceConfig: ServiceConfig = {
  name: 'petstore',
  source: 'https://petstore.swagger.io/v2/swagger.json',
  token: '',
};

export const validApifoxServiceConfig: ServiceConfig = {
  name: 'apifox-demo',
  source: 'https://api.apifox.com/v1/projects/123456/export-openapi',
  token: 'test-token-123',
};

// 向后兼容别名（旧测试可能引用）
export const validSwaggerUserConfig = validSwaggerServiceConfig;
export const validApifoxUserConfig = validApifoxServiceConfig;

/** 单服务多服务配置（Swagger 源） */
export const validSwaggerMultiServiceConfig: MultiServiceConfig = {
  baseOutputDir: 'src/api',
  services: [validSwaggerServiceConfig],
};

/** 单服务多服务配置（Apifox 源） */
export const validApifoxMultiServiceConfig: MultiServiceConfig = {
  baseOutputDir: 'src/api',
  services: [validApifoxServiceConfig],
};

// ==================== ProcessedApiData mock ====================

export const mockProcessedApiData: ProcessedApiData = {
  interfaces: [
    {
      path: '/api/users',
      method: 'get',
      operation: {
        summary: '获取用户列表',
        tags: ['用户管理'],
        parameters: [
          { name: 'page', in: 'query', type: 'number', required: false, description: '页码' },
        ],
        responses: {
          '200': {
            description: '成功',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserListResponse' },
              },
            },
          },
        },
      },
    },
    {
      path: '/api/users',
      method: 'post',
      operation: {
        summary: '创建用户',
        tags: ['用户管理'],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateUserRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: '创建成功',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
        },
      },
    },
  ],
  types: [
    { name: 'User', originalName: 'User', schema: { type: 'object' } },
    { name: 'CreateUserRequest', originalName: 'CreateUserRequest', schema: { type: 'object' } },
    { name: 'UserListResponse', originalName: 'UserListResponse', schema: { type: 'object' } },
  ],
  categories: [
    { name: '用户管理', description: '用户相关接口' },
    { name: 'system', description: '系统接口' },
  ],
};

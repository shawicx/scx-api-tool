/**
 * @description E2E 生成结果正确性测试的 OpenAPI 契约夹具
 *
 * 有意覆盖以下契约形态，保证「生成结果正确性」测试不是只在简单场景下通过：
 * - 路径参数 / 查询参数（含枚举）/ JSON 请求体（$ref 与内联）/ multipart 表单
 * - 顶层非对象 Schema（字符串枚举 PetStatus / OrderStatus，被属性与查询参数同时 $ref 引用）
 * - 嵌套 $ref、$ref 数组、required 与可选属性混合、无响应体（204）
 * - 中文标签（目录名转拼音）与英文标签并存
 *
 * 与 tests/fixtures/mockData.ts 的分工：mockData 服务于模块级单元测试；
 * 本文件服务于端到端「生成 → 类型检查 → 运行时请求行为」验证，形态以标准 OpenAPI 3.0 为准。
 */

import type { OpenApiDocument } from '@/types';

/** 宠物域 OpenAPI 契约（中文标签「宠物管理」→ 输出目录为拼音 ChongWuGuanLi） */
export const petOpenApiDocument: OpenApiDocument = {
  openapi: '3.0.3',
  info: { title: 'Pet API', version: '1.0.0' },
  paths: {
    '/pets/{petId}': {
      get: {
        operationId: 'getPetById',
        summary: '查询宠物详情',
        tags: ['宠物管理'],
        parameters: [
          {
            name: 'petId',
            in: 'path',
            required: true,
            description: '宠物 ID',
            schema: { type: 'integer', format: 'int64' },
          },
        ],
        responses: {
          '200': {
            description: '成功',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Pet' } },
            },
          },
        },
      },
      delete: {
        // 有意不提供 operationId：覆盖命名策略的路径回退分支
        summary: '删除宠物',
        tags: ['宠物管理'],
        parameters: [
          {
            name: 'petId',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: { '204': { description: '已删除，无响应体' } },
      },
    },
    '/pets': {
      get: {
        operationId: 'listPets',
        summary: '分页查询宠物列表',
        tags: ['宠物管理'],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer' } },
          {
            name: 'status',
            in: 'query',
            description: '按状态过滤（枚举）',
            schema: { $ref: '#/components/schemas/PetStatus' },
          },
        ],
        responses: {
          '200': {
            description: '成功',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/PetListResponse' } },
            },
          },
        },
      },
      post: {
        operationId: 'createPet',
        summary: '创建宠物',
        tags: ['宠物管理'],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CreatePetRequest' } },
          },
        },
        responses: {
          '201': {
            description: '创建成功',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Pet' } },
            },
          },
        },
      },
    },
    '/pets/{petId}/photos': {
      post: {
        operationId: 'uploadPetPhoto',
        summary: '上传宠物照片',
        tags: ['宠物管理'],
        parameters: [
          {
            name: 'petId',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: { type: 'string', format: 'binary', description: '图片文件' },
                  caption: { type: 'string', description: '图片说明' },
                },
                required: ['file'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: '上传成功',
            content: {
              'application/json': {
                // 内联响应对象（非 $ref）：覆盖内联 schema 的类型生成
                schema: {
                  type: 'object',
                  properties: {
                    photoId: { type: 'string' },
                    url: { type: 'string' },
                  },
                  required: ['photoId', 'url'],
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      PetStatus: {
        description: '宠物状态（顶层枚举 Schema）',
        type: 'string',
        enum: ['available', 'pending', 'sold'],
      },
      Category: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
        },
        required: ['id', 'name'],
      },
      Tag: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
        },
      },
      Pet: {
        type: 'object',
        properties: {
          id: { type: 'integer', format: 'int64' },
          name: { type: 'string' },
          status: { $ref: '#/components/schemas/PetStatus' },
          category: { $ref: '#/components/schemas/Category' },
          tags: { type: 'array', items: { $ref: '#/components/schemas/Tag' } },
          photoUrls: { type: 'array', items: { type: 'string' } },
        },
        required: ['id', 'name', 'photoUrls'],
      },
      CreatePetRequest: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          status: { $ref: '#/components/schemas/PetStatus' },
          category: { $ref: '#/components/schemas/Category' },
          photoUrls: { type: 'array', items: { type: 'string' } },
        },
        required: ['name'],
      },
      PetListResponse: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/Pet' } },
          total: { type: 'integer' },
        },
        required: ['data', 'total'],
      },
    },
  },
};

/** 订单域 OpenAPI 契约（英文标签 store + 内联请求体），与宠物域分开供多服务场景使用 */
export const storeOpenApiDocument: OpenApiDocument = {
  openapi: '3.0.3',
  info: { title: 'Store API', version: '1.0.0' },
  paths: {
    '/store/orders/{orderId}': {
      get: {
        operationId: 'getOrderById',
        summary: '查询订单详情',
        tags: ['store'],
        parameters: [
          {
            name: 'orderId',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          '200': {
            description: '成功',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Order' } },
            },
          },
        },
      },
    },
    '/store/orders': {
      post: {
        operationId: 'placeOrder',
        summary: '下单',
        tags: ['store'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              // 内联请求体（非 $ref）：覆盖内联 body 的类型生成
              schema: {
                type: 'object',
                properties: {
                  petId: { type: 'integer' },
                  quantity: { type: 'integer' },
                },
                required: ['petId'],
              },
            },
          },
        },
        responses: {
          '201': {
            description: '下单成功',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Order' } },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      OrderStatus: {
        description: '订单状态（顶层枚举 Schema）',
        type: 'string',
        enum: ['placed', 'approved', 'delivered'],
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          petId: { type: 'integer' },
          quantity: { type: 'integer' },
          status: { $ref: '#/components/schemas/OrderStatus' },
          shipDate: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'petId'],
      },
    },
  },
};

/** 行为测试用的合法 Pet 样本（与 Pet schema 的 required/枚举约束一致） */
export const petSample = {
  id: 42,
  name: 'Rex',
  photoUrls: ['https://cdn.example.com/rex.png'],
  status: 'available',
  category: { id: 1, name: 'dogs' },
  tags: [{ id: 7, name: 'cute' }],
};

/** 行为测试用的合法订单样本 */
export const orderSample = {
  id: 1001,
  petId: 42,
  quantity: 3,
  status: 'placed',
};

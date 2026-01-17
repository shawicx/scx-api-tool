# Design: Unify Zod Schema with Type Exports

**Change ID**: `unify-zod-schema-with-api`

## Architecture Overview

### 当前架构问题

1. **配置复杂**：
   - `typesFormat` 控制 API 文件中的类型格式（TypeScript 或 Zod）
   - `validation.enabled` 控制是否生成独立的 Schema 文件
   - 两个配置项独立但相关，容易混淆

2. **文件分散**：
   - TypeScript 类型：`src/service/types/<TypeName>.ts`
   - Zod Schema（独立模式）：`src/service/schemas/<Tag>/<InterfaceName>.ts`
   - Zod Schema（同级模式）：`src/service/<Tag>/<InterfaceName>Schema.ts`
   - 接口文件：`src/service/<Tag>/index.ts`

3. **导入路径复杂**：
   - API 文件需要从 types 目录或 schemas 目录导入类型
   - 根据 `validation.enabled` 的不同，导入路径也不同

### 目标架构

1. **简化配置**：
   - 只保留 `typesFormat` 配置，移除 `validation`
   - `typesFormat='zod'`：使用 Zod Schema 生成类型
   - `typesFormat='typescript'`：使用 TypeScript 接口定义类型

2. **统一文件结构**：
   - **Zod 模式**：
     - 接口级 Schema：`src/service/<Tag>/<InterfaceName>Schema.ts`（包含 Request/Response Schema + 推导类型）
     - 类型 Schema：`src/service/schemas/<TypeName>Schema.ts`（包含 Schema + 推导类型）
     - 接口文件：`src/service/<Tag>/index.ts`（包含 API 函数，从 schema 文件导入类型）
   - **TypeScript 模式**：
     - 类型文件：`src/service/<Tag>/<TypeName>.ts`（包含 TypeScript 类型定义）
     - 接口文件：`src/service/<Tag>/index.ts`（包含 API 函数，从类型文件导入类型）

3. **统一导入路径**：
   - Zod 模式：API 文件从同级 schema 文件导入
   - TypeScript 模式：API 文件从同级类型文件导入

## Detailed Design

### 配置结构

#### 新的 ApiConfig

```typescript
export interface ApiConfig {
  // ... 其他配置项

  /** 类型生成格式 */
  typesFormat: TypesFormat;

  // 移除以下字段：
  // validation?: ValidationConfig;
}

export type TypesFormat = 'typescript' | 'zod';
```

#### 新的 UserConfig

```typescript
export interface UserConfig {
  // ... 其他配置项

  /** 类型生成格式 */
  typesFormat?: TypesFormat;

  // 移除以下字段：
  // validation?: ValidationConfig;
}
```

### Zod 模式文件结构

#### 目录结构

```
src/service/
├── request.ts                          # 请求函数文件
├── index.ts                            # 根索引文件
├── AIFuwu/                            # Tag 目录
│   ├── PostAiCompletionSchema.ts       # 接口级 Schema 文件
│   ├── GetUserInfoSchema.ts           # 接口级 Schema 文件
│   └── index.ts                       # 接口文件（API 函数）
└── schemas/                           # 类型 Schema 目录
    ├── UserSchema.ts                  # 类型 Schema 文件
    ├── OrderSchema.ts                 # 类型 Schema 文件
    └── index.ts                       # Schema 索引文件
```

#### 接口级 Schema 文件示例

**文件位置**：`src/service/AIFuwu/PostAiCompletionSchema.ts`

```typescript
import { z } from 'zod';
import { UserSchema } from '../schemas/UserSchema';

/**
 * @description AI 完成请求
 */
export const PostAiCompletionRequestSchema = z.object({
  userId: z.string(),
  prompt: z.string(),
  maxTokens: z.number().optional(),
});

/**
 * @description AI 完成响应
 */
export const PostAiCompletionResponseSchema = z.object({
  id: z.string(),
  result: z.string(),
  user: UserSchema.optional(),
});

// 推导类型
export type PostAiCompletionRequest = z.infer<typeof PostAiCompletionRequestSchema>;
export type PostAiCompletionResponse = z.infer<typeof PostAiCompletionResponseSchema>;
```

#### 类型 Schema 文件示例

**文件位置**：`src/service/schemas/UserSchema.ts`

```typescript
import { z } from 'zod';

/**
 * @description 用户信息
 */
export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});

// 推导类型
export type User = z.infer<typeof UserSchema>;
```

#### 接口文件示例

**文件位置**：`src/service/AIFuwu/index.ts`

```typescript
import { request } from '../request';
import type { RequestConfig } from '../request';
import {
  PostAiCompletionRequestSchema,
  PostAiCompletionResponseSchema,
} from './PostAiCompletionSchema';
import type { PostAiCompletionRequest, PostAiCompletionResponse } from './PostAiCompletionSchema';

export async function postAiCompletionApi(
  params: PostAiCompletionRequest,
): Promise<PostAiCompletionResponse> {
  const config: RequestConfig = {
    url: '/ai/completion',
    method: 'POST',
    data: params,
  };
  return request<PostAiCompletionResponse>(config);
}
```

### TypeScript 模式文件结构

#### 目录结构

```
src/service/
├── request.ts                          # 请求函数文件
├── index.ts                            # 根索引文件
└── AIFuwu/                            # Tag 目录
    ├── User.ts                         # 类型文件
    ├── Order.ts                        # 类型文件
    └── index.ts                       # 接口文件（API 函数）
```

#### 类型文件示例

**文件位置**：`src/service/AIFuwu/User.ts`

```typescript
/**
 * @description 用户信息
 */
export interface User {
  id: string;
  name: string;
  email: string;
}
```

#### 接口文件示例

**文件位置**：`src/service/AIFuwu/index.ts`

```typescript
import { request } from '../request';
import type { RequestConfig } from '../request';
import type { User } from './User';

export async function getUserInfoApi(params: { userId: string }): Promise<User> {
  const config: RequestConfig = {
    url: '/user/info',
    method: 'GET',
    params,
  };
  return request<User>(config);
}
```

## Implementation Details

### 代码生成流程

#### Zod 模式

1. **生成类型 Schema 文件**：
   - 遍历 `processedData.types`
   - 为每个类型生成 `src/service/schemas/<TypeName>Schema.ts`
   - 包含 Schema 定义和推导类型

2. **生成接口级 Schema 文件**：
   - 遍历 `processedData.interfaces`（按 tag 分组）
   - 为每个接口生成 `src/service/<Tag>/<InterfaceName>Schema.ts`
   - 包含 Request Schema、Response Schema 和推导类型

3. **生成接口文件**：
   - 遍历 `processedData.interfaces`（按 tag 分组）
   - 为每个 tag 生成 `src/service/<Tag>/index.ts`
   - 包含 API 函数，从同级 schema 文件导入类型

4. **生成根索引文件**：
   - 生成 `src/service/index.ts`
   - 导出所有 tag 目录和 request 函数

5. **生成 Schema 索引文件**：
   - 生成 `src/service/schemas/index.ts`
   - 导出所有类型 Schema

#### TypeScript 模式

1. **生成类型文件**：
   - 遍历 `processedData.types`
   - 为每个类型生成 `src/service/<Tag>/<TypeName>.ts`
   - 包含 TypeScript 类型定义

2. **生成接口文件**：
   - 遍历 `processedData.interfaces`（按 tag 分组）
   - 为每个 tag 生成 `src/service/<Tag>/index.ts`
   - 包含 API 函数，从同级类型文件导入类型

3. **生成根索引文件**：
   - 生成 `src/service/index.ts`
   - 导出所有 tag 目录和 request 函数

### 模板修改

#### Zod 类型模板

**修改文件**：`src/templates/schema-zod.ts`

**修改内容**：

- `getZodTypeTemplateWithComment()` 和 `getZodTypeTemplateWithoutComment()` 添加推导类型导出

```typescript
function getZodTypeTemplateWithComment(): string {
  return `import { z } from 'zod';

/**
{{#if description}}
 * @description {{description}}
{{/if}}
 */
export const {{schemaName}} = {{{schemaContent}}};

// 推导类型
export type {{typeName}} = z.infer<typeof {{schemaName}}>;
`;
}
```

#### 接口级 Schema 模板

**修改文件**：`src/templates/schema-zod.ts`

**新增模板函数**：

```typescript
function getZodInterfaceSchemaTemplateWithComment(): string {
  return `import { z } from 'zod';
{{#each typeImports}}
import { {{.}} } from '../schemas/{{.}}';
{{/each}}

/**
{{#if requestDescription}}
 * @description {{requestDescription}}
{{/if}}
 */
export const {{requestSchemaName}} = {{{requestSchemaContent}}};

/**
{{#if responseDescription}}
 * @description {{responseDescription}}
{{/if}}
 */
export const {{responseSchemaName}} = {{{responseSchemaContent}}};

// 推导类型
export type {{requestTypeName}} = z.infer<typeof {{requestSchemaName}}>;
export type {{responseTypeName}} = z.infer<typeof {{responseSchemaName}}>;
`;
}
```

#### 接口文件模板（Zod 模式）

**修改文件**：`src/templates/template.ts`

**修改内容**：

- `getZodInterfaceTemplateWithComment()` 和 `getZodInterfaceTemplateWithoutComment()` 更新导入路径

```typescript
export function getZodInterfaceTemplateWithComment(): string {
  return `import { z } from 'zod';
import { {{requestSchemaName}}, {{responseSchemaName}} } from './{{interfaceName}}Schema';
import type { {{requestTypeName}}, {{responseTypeName}} } from './{{interfaceName}}Schema';

/**
 * @description {{description}}
 * @param {{requestParamName}} {{requestTypeName}}
 * @returns Promise<{{responseTypeName}}>
 */
export async function {{functionName}}(
  {{requestParamName}}: {{requestTypeName}}
): Promise<{{responseTypeName}}> {
  // 实现逻辑
}
`;
}
```

### 代码生成器修改

#### 修改文件：`src/generator/fileGenerator.ts`

**主要修改**：

1. **`generateTypeFiles()` 函数**：
   - 修改为生成类型文件到 `src/service/<Tag>/<TypeName>.ts`（TypeScript 模式）
   - 或者完全移除（Zod 模式，类型由 Schema 文件生成）

2. **`generateInterfaceSchemasFiles()` 函数**：
   - 修改为生成接口级 Schema 文件到 `src/service/<Tag>/<InterfaceName>Schema.ts`
   - 包含 Request Schema、Response Schema 和推导类型

3. **`generateInterfaceFileForTag()` 函数**：
   - 更新类型导入路径：
     - Zod 模式：`import type { ... } from './<InterfaceName>Schema'`
     - TypeScript 模式：`import type { ... } from './<TypeName>'`

4. **移除函数**：
   - `generateTypeFiles()` 的部分逻辑
   - `generateTypesIndexFile()` 完全移除

#### 修改文件：`src/generator/codegen.ts`

**主要修改**：

1. **`generateFiles()` 函数**：
   - 移除 `if (config.validation?.enabled && config.typesFormat !== 'zod')` 的判断
   - 简化生成流程：
     - 如果 `typesFormat === 'zod'`，调用 `generateSchemaFiles()`
     - 如果 `typesFormat === 'typescript'`，调用 `generateTypeFiles()`

## Trade-offs

### 优点

1. **配置简化**：移除 `validation` 配置，减少配置复杂度
2. **类型一致性**：Schema 和 Type 在同一文件中，确保一致性
3. **导入路径简化**：从同级文件导入，路径更短、更清晰
4. **文件数量减少**：合并 Schema 和 Type 导出，减少文件数量
5. **符合文档方案**：实现 ZOD.md 的单文件导出设计

### 缺点

1. **破坏性变更**：需要迁移现有配置和导入路径
2. **学习成本**：用户需要适应新的文件结构
3. **灵活性降低**：无法单独控制 Schema 文件的生成位置

### 决策

采用该方案的优点大于缺点，主要理由：

1. 符合 ZOD.md 的设计目标
2. 显著简化配置和代码结构
3. 提高类型一致性和开发体验
4. 破坏性变更可以通过迁移指南和文档缓解

## Testing Strategy

### 单元测试

- 测试配置验证逻辑（移除 `validation` 相关）
- 测试模板生成逻辑
- 测试导入路径计算

### 集成测试

- 测试完整的代码生成流程（Zod 模式）
- 测试完整的代码生成流程（TypeScript 模式）
- 验证生成的代码能够编译通过

### 手动测试

- 使用真实 OpenAPI 文档生成代码
- 验证生成的文件结构符合设计
- 验证导入路径正确
- 验证类型推导正确

## Migration Guide

### 配置迁移

**旧配置**：

```typescript
{
  typesFormat: 'typescript',
  validation: {
    enabled: true,
    library: 'zod',
    outputDir: 'src/service/schemas'
  }
}
```

**新配置**：

```typescript
{
  typesFormat: 'zod';
}
```

### 导入路径迁移

**旧导入路径**：

```typescript
import type { User } from '../types/User';
```

**新导入路径（Zod 模式）**：

```typescript
import type { User } from '../schemas/UserSchema';
```

**新导入路径（TypeScript 模式）**：

```typescript
import type { User } from './User';
```

## Future Considerations

1. **根索引文件**：是否需要在根索引文件中导出所有 Schema 和类型？
2. **Schema 验证**：是否需要在 API 函数中添加 Schema 验证逻辑？
3. **性能优化**：是否需要缓存生成的 Schema？
4. **类型推导优化**：是否需要优化 `z.infer` 的使用方式？

# 使用示例

本文档提供完整的使用示例，展示不同配置选项下的生成代码。

## 示例 1: Zod 模式（推荐）

Zod 模式提供运行时验证能力，适合需要数据校验的项目。

### 配置文件

`api-power.config.ts`:

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  // API 数据源
  source: 'https://api.apifox.com/v1/projects/YOUR_PROJECT_ID/export-openapi',
  token: 'APS-YourAccessTokenHere',

  // 类型生成格式：使用 Zod Schema（运行时验证）
  typesFormat: 'zod',

  // 输出配置
  outputDir: 'src/service',
  generateApi: true,
  generateTypes: true,

  // 请求函数配置
  requestFunctionName: 'request',
  requestParamName: 'params',

  // 代码生成选项
  comment: true,
});
```

### 生成的文件结构

```
src/service/
├── request.ts                    # 请求函数（axios 封装）
├── index.ts                      # 根导出文件
├── AIFuWu/                      # 分类目录
│   ├── index.ts                  # API 函数（从 schema 导入类型）
│   └── schema.ts                 # 合并的 Schema 文件
├── YongHuGuanLi/                 # 分类目录
│   ├── index.ts
│   └── schema.ts
└── schemas/                      # 类型 Schema 目录
    ├── CompletionRequestDtoSchema.ts
    ├── UserResponseDtoSchema.ts
    ├── RoleSchema.ts
    └── index.ts                  # Schema 索引
```

### 生成的代码示例

#### 接口级 Schema 文件 (`src/service/AIFuWu/schema.ts`)

```typescript
import { z } from 'zod';
import { CompletionRequestDtoSchema } from '../schemas/CompletionRequestDtoSchema';

/**
 * @description 生成 AI 回复
 */
export const PostAiCompletionRequestTypeSchema = CompletionRequestDtoSchema;

/**
 * @description 生成 AI 回复
 */
export const PostAiCompletionResponseTypeSchema = z.object({
  success: z.boolean().optional(),
  data: z
    .object({
      content: z.string().optional(),
      model: z.string().optional(),
      tokensUsed: z
        .object({
          prompt: z.number().optional(),
          completion: z.number().optional(),
          total: z.number().optional(),
        })
        .optional(),
      finishReason: z.string().optional(),
      provider: z.string().optional(),
    })
    .optional(),
});

// 推导类型
export type PostAiCompletionRequestType = z.infer<typeof PostAiCompletionRequestTypeSchema>;
export type PostAiCompletionResponseType = z.infer<typeof PostAiCompletionResponseTypeSchema>;
```

#### 接口文件 (`src/service/AIFuWu/index.ts`)

```typescript
import { RequestConfig, request } from '@/service/request';
import { PostAiCompletionRequestTypeSchema, PostAiCompletionResponseTypeSchema } from './schema';
import type { PostAiCompletionRequestType, PostAiCompletionResponseType } from './schema';

/**
 * @description 生成 AI 回复
 * @param params PostAiCompletionRequestType
 * @returns Promise<PostAiCompletionResponseType>
 */
export async function postAiCompletionApi(
  params: PostAiCompletionRequestType,
): Promise<PostAiCompletionResponseType> {
  const config: RequestConfig = {
    url: '/api/ai/completion',
    method: 'POST',
    data: params,
  };
  return request<PostAiCompletionResponseType>(config);
}
```

#### 类型 Schema 文件 (`src/service/schemas/UserSchema.ts`)

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

### 使用示例

```typescript
import { postAiCompletionApi } from '@/service/AIFuWu';
import type { PostAiCompletionRequestType } from '@/service/AIFuWu';
import { UserSchema } from '@/service/schemas';

// 调用 API
const result = await postAiCompletionApi({
  messages: [{ role: 'user', content: 'Hello' }],
  options: {
    provider: 'copilot',
  },
});

// 使用 Zod Schema 进行验证
import { z } from 'zod';

const userData = {
  name: 'John',
  email: 'john@example.com',
};

// 验证数据
const validatedUser = UserSchema.parse(userData);
```

## 示例 2: TypeScript 模式

TypeScript 模式只生成类型定义，适合只需要编译时类型检查的项目。

### 配置文件

`api-power.config.ts`:

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  // API 数据源
  source: 'https://api.apifox.com/v1/projects/YOUR_PROJECT_ID/export-openapi',
  token: 'APS-YourAccessTokenHere',

  // 类型生成格式：使用 TypeScript 类型定义
  typesFormat: 'typescript',

  // 输出配置
  outputDir: 'src/service',
  generateApi: true,
  generateTypes: true,

  // 请求函数配置
  requestFunctionName: 'request',
  requestParamName: 'params',

  // 代码生成选项
  comment: true,
});
```

### 生成的文件结构

```
src/service/
├── request.ts                    # 请求函数
├── index.ts                      # 根导出文件
├── AIFuWu/                      # 分类目录
│   ├── index.ts                  # API 函数
│   ├── User.ts                   # 类型定义
│   └── PostAiCompletion.ts       # 类型定义
├── YongHuGuanLi/                 # 分类目录
│   ├── index.ts
│   ├── User.ts
│   └── Role.ts
```

### 生成的代码示例

#### 类型定义文件 (`src/service/AIFuWu/PostAiCompletion.ts`)

```typescript
/**
 * @description AI 完成请求
 */
export interface PostAiCompletionRequestType {
  messages: Array<{
    role: string;
    content: string;
  }>;
  options?: {
    provider?: 'copilot' | 'glm' | 'qwen';
  };
}

/**
 * @description AI 完成响应
 */
export interface PostAiCompletionResponseType {
  success?: boolean;
  data?: {
    content?: string;
    model?: string;
    tokensUsed?: {
      prompt?: number;
      completion?: number;
      total?: number;
    };
    finishReason?: string;
    provider?: string;
  };
}
```

#### 接口文件 (`src/service/AIFuWu/index.ts`)

```typescript
import { RequestConfig, request } from '@/service/request';
import type { PostAiCompletionRequestType } from './PostAiCompletion';
import type { PostAiCompletionResponseType } from './PostAiCompletion';

/**
 * @description 生成 AI 回复
 * @param params PostAiCompletionRequestType
 * @returns Promise<PostAiCompletionResponseType>
 */
export async function postAiCompletionApi(
  params: PostAiCompletionRequestType,
): Promise<PostAiCompletionResponseType> {
  const config: RequestConfig = {
    url: '/api/ai/completion',
    method: 'POST',
    data: params,
  };
  return request<PostAiCompletionResponseType>(config);
}
```

### 使用示例

```typescript
import { postAiCompletionApi } from '@/service/AIFuWu';
import type { PostAiCompletionRequestType } from '@/service/AIFuWu';

// 调用 API
const result = await postAiCompletionApi({
  messages: [{ role: 'user', content: 'Hello' }],
  options: {
    provider: 'copilot',
  },
});
```

## 示例 3: 只生成类型（Types Only）

只生成类型定义，不生成 API 函数。

### 配置文件

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  source: 'YOUR_API_SOURCE',
  token: 'YOUR_TOKEN',

  // 只生成类型，不生成 API 函数
  generateApi: false,
  generateTypes: true,

  // 选择类型格式
  typesFormat: 'typescript',
});
```

### 使用示例

```typescript
// 只导入类型定义
import type { User } from '@/service/AIFuWu/User';
import type { Role } from '@/service/YongHuGuanLi/Role';

// 在代码中使用类型
const user: User = {
  id: '123',
  name: 'John',
  email: 'john@example.com',
};
```

## 示例 4: 只生成 API（API Only）

只生成 API 函数，不生成类型定义（使用 `any` 类型）。

### 配置文件

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  source: 'YOUR_API_SOURCE',
  token: 'YOUR_TOKEN',

  // 只生成 API 函数，不生成类型
  generateApi: true,
  generateTypes: false,
});
```

### 使用示例

```typescript
import { postAiCompletionApi } from '@/service/AIFuWu';

// 调用 API（参数类型为 any）
const result = await postAiCompletionApi({
  messages: [{ role: 'user', content: 'Hello' }],
  options: {
    provider: 'copilot',
  },
});
```

## 示例 5: 自定义命名策略

使用自定义命名策略覆盖默认的命名规则。

### 配置文件

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  source: 'YOUR_API_SOURCE',
  token: 'YOUR_TOKEN',
  typesFormat: 'zod',

  // 自定义命名策略
  namingStrategy: {
    // 自定义接口名称
    interfaceName: (info) => {
      const method = info.method.charAt(0).toUpperCase() + info.method.slice(1).toLowerCase();
      const pathName = info.path
        .replace(/\{[^}]+\}/g, '')
        .replace(/^\//, '')
        .replace(/\//g, '-')
        .replace(/^-+|-+$/g, '');
      return `${method}${pathName}`;
    },

    // 自定义函数名称
    functionName: (info) => {
      const method = info.method.toLowerCase();
      const pathName = info.path
        .replace(/\{[^}]+\}/g, '')
        .replace(/^\//, '')
        .replace(/\//g, '-')
        .replace(/^-+|-+$/g, '');
      return `${method}${pathName}Func`;
    },

    // 自定义请求类型名称
    requestTypeName: (info) => {
      const interfaceName = info.summary || 'Api';
      return `${interfaceName}RequestType`;
    },

    // 自定义响应类型名称
    responseTypeName: (info) => {
      const interfaceName = info.summary || 'Api';
      return `${interfaceName}ResponseType`;
    },
  },
});
```

## 示例 6: 环境变量配置

使用环境变量管理配置。

### 配置文件

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  source:
    process.env.API_SOURCE || 'https://api.apifox.com/v1/projects/YOUR_PROJECT_ID/export-openapi',
  token: process.env.API_TOKEN || 'default-token',
  outputDir: process.env.OUTPUT_DIR || 'src/service',
  typesFormat: (process.env.TYPES_FORMAT as 'typescript' | 'zod') || 'typescript',
});
```

### .env 文件

```bash
# .env
API_SOURCE=https://api.apifox.com/v1/projects/YOUR_PROJECT_ID/export-openapi
API_TOKEN=APS-YourAccessTokenHere
OUTPUT_DIR=src/service
TYPES_FORMAT=zod
```

## 模式对比

| 特性           | TypeScript 模式 | Zod 模式 |
| -------------- | --------------- | -------- |
| 编译时类型检查 | 是              | 是       |
| 运行时验证     | 否              | 是       |
| Schema 定义    | 否              | 是       |
| 文件数量       | 较多            | 较少     |
| 生成速度       | 较快            | 较慢     |
| 运行时开销     | 无              | 较小     |
| 代码复杂度     | 简单            | 中等     |

## 推荐配置

### 推荐配置 1: 标准项目（Zod 模式）

适合需要运行时验证的 Web 应用。

```typescript
export default defineConfig({
  source: process.env.API_SOURCE!,
  token: process.env.API_TOKEN!,
  outputDir: 'src/service',
  typesFormat: 'zod',
  generateApi: true,
  generateTypes: true,
});
```

### 推荐配置 2: 简化项目（TypeScript 模式）

适合只需要类型检查的项目。

```typescript
export default defineConfig({
  source: process.env.API_SOURCE!,
  token: process.env.API_TOKEN!,
  outputDir: 'src/service',
  typesFormat: 'typescript',
  generateApi: true,
  generateTypes: true,
});
```

### 推荐配置 3: 微服务（API Only）

适合多个微服务项目，由中心仓库管理类型。

```typescript
export default defineConfig({
  source: process.env.API_SOURCE!,
  token: process.env.API_TOKEN!,
  outputDir: 'src/service',
  generateApi: true,
  generateTypes: false,
});
```

## 下一步

- 查看[迁移指南](./migration.md)了解如何从旧版本迁移
- 查看[配置文档](./configuration.md)了解所有配置选项
- 查看[高级用法](./advanced.md)学习自定义模板和钩子

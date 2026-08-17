# 使用示例

本文档提供完整的使用示例，展示不同配置选项下的生成代码。

## 示例 1: Zod 模式（推荐）

Zod 模式提供运行时验证能力，适合需要数据校验的项目。

### 配置文件

`api-power.config.ts`:

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  // 公共输出根目录
  baseOutputDir: 'src/service',

  // 类型生成格式：使用 Zod Schema（运行时验证）
  typesFormat: 'zod',

  // 输出配置
  generateApi: true,
  generateTypes: true,

  // 请求函数配置
  requestFunctionName: 'request',
  requestParamName: 'params',

  // 代码生成选项
  comment: true,

  // 服务声明（单服务）
  services: [
    {
      name: 'main',
      folder: '.',
      source: 'https://api.apifox.com/v1/projects/YOUR_PROJECT_ID/export-openapi',
      token: 'APS-YourAccessTokenHere',
    },
  ],
});
```

**说明**：`generateApi` 控制是否生成 API 函数，`typesFormat` 控制类型生成格式。两者是独立配置。

### 生成的文件结构

```
src/service/
├── request.ts                    # 请求函数（axios 封装）
├── index.ts                      # 根导出文件（从各分类的 schema 导出）
├── AIFuWu/                      # 分类目录
│   ├── index.ts                  # API 函数（当 generateApi: true 时生成）
│   └── schema.ts                 # Schema 文件（从 schemas/ 导入并导出类型）
├── YongHuGuanLi/                 # 分类目录
│   ├── index.ts
│   └── schema.ts
└── schemas/                      # 类型 Schema 目录
    ├── CompletionRequestDtoSchema.ts   # 单独的 Schema 文件
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

// 调用 API（当 generateApi: true 时，会生成 API 函数）
const result = await postAiCompletionApi({
  messages: [{ role: 'user', content: 'Hello' }],
  options: {
    provider: 'copilot',
  },
});

// 使用 Zod Schema 进行运行时验证
const userData = {
  name: 'John',
  email: 'john@example.com',
};

const validatedUser = UserSchema.parse(userData);
```

## 示例 2: TypeScript 模式

TypeScript 模式只生成类型定义，适合只需要编译时类型检查的项目。

### 配置文件

`api-power.config.ts`:

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  // 公共输出根目录
  baseOutputDir: 'src/service',

  // 类型生成格式：使用 TypeScript 类型定义
  typesFormat: 'typescript',

  // 输出配置
  generateApi: true,
  generateTypes: true,

  // 请求函数配置
  requestFunctionName: 'request',
  requestParamName: 'params',

  // 代码生成选项
  comment: true,

  // 服务声明（单服务）
  services: [
    {
      name: 'main',
      folder: '.',
      source: 'https://api.apifox.com/v1/projects/YOUR_PROJECT_ID/export-openapi',
      token: 'APS-YourAccessTokenHere',
    },
  ],
});
```

### 生成的文件结构

```
src/service/
├── request.ts                    # 请求函数
├── index.ts                      # 根导出文件
├── AIFuWu/                      # 分类目录
│   ├── index.ts                  # 类型定义文件（包含所有接口类型）
│   ├── User.ts                   # 单独类型定义
│   └── PostAiCompletion.ts       # 单独类型定义
├── YongHuGuanLi/                 # 分类目录
│   ├── index.ts
│   ├── User.ts
│   └── Role.ts
```

### 注意：TypeScript 模式不生成 API 函数

TypeScript 模式只生成类型定义文件，不生成 API 函数。用户需要：

1. 使用 `@/service/request` 中的 `request` 函数自行调用 API
2. 使用生成的类型定义进行类型检查

```typescript
// 示例：使用类型定义并手动调用 API
import type { PostAiCompletionRequestType } from '@/service/AIFuWu';
import { request } from '@/service/request';

const response = await request({
  url: '/api/ai/completion',
  method: 'POST',
  data: {
    messages: [{ role: 'user', content: 'Hello' }],
    options: { provider: 'copilot' },
  } as PostAiCompletionRequestType,
});
```

## 示例 3: 只生成类型（Types Only）

只生成类型定义，不生成 API 函数。

### 配置文件

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  baseOutputDir: 'src/service',

  // 只生成类型，不生成 API 函数
  generateApi: false,
  generateTypes: true,

  // 选择类型格式
  typesFormat: 'typescript',

  services: [
    {
      name: 'main',
      folder: '.',
      source: 'YOUR_API_SOURCE',
      token: 'YOUR_TOKEN',
    },
  ],
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

只生成 API 函数，不生成类型定义（不使用类型系统）。

### 配置文件

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  baseOutputDir: 'src/service',

  // 只生成 API 函数，不生成类型
  generateApi: true,
  generateTypes: false,

  services: [
    {
      name: 'main',
      folder: '.',
      source: 'YOUR_API_SOURCE',
      token: 'YOUR_TOKEN',
    },
  ],
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
  baseOutputDir: 'src/service',
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

  services: [
    {
      name: 'main',
      folder: '.',
      source: 'YOUR_API_SOURCE',
      token: 'YOUR_TOKEN',
    },
  ],
});
```

## 示例 6: 环境变量配置

使用环境变量管理配置。

### 配置文件

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  baseOutputDir: process.env.OUTPUT_DIR || 'src/service',
  typesFormat: (process.env.TYPES_FORMAT as 'typescript' | 'zod') || 'typescript',

  services: [
    {
      name: 'main',
      folder: '.',
      source:
        process.env.API_SOURCE ||
        'https://api.apifox.com/v1/projects/YOUR_PROJECT_ID/export-openapi',
      token: process.env.API_TOKEN || 'default-token',
    },
  ],
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
| 编译时类型检查 | ✅              | ✅       |
| 运行时验证     | ✅              | ✅       |
| Schema 定义    | ✅              | ✅       |
| 文件数量       | 较多            | 较少     |
| 生成速度       | 较快            | 较慢     |
| 运行时开销     | 无              | 较小     |
| 代码复杂度     | 简单            | 中等     |

## 推荐配置

### 推荐配置 1: 标准项目（单服务 - Zod 模式）

适合需要运行时验证的 Web 应用。只有一个数据源时，使用 `services` 数组长度为 1 的配置，并设置 `folder: '.'` 让输出直接落在 `baseOutputDir`。

```typescript
export default defineConfig({
  baseOutputDir: 'src/service',
  typesFormat: 'zod',
  generateApi: true,
  generateTypes: true,

  services: [
    {
      name: 'main',
      folder: '.',
      source: process.env.API_SOURCE!,
      token: process.env.API_TOKEN!,
    },
  ],
});
```

### 推荐配置 2: 简化项目（单服务 - TypeScript 模式）

适合只需要类型检查的项目。

```typescript
export default defineConfig({
  baseOutputDir: 'src/service',
  typesFormat: 'typescript',
  generateApi: true,
  generateTypes: true,

  services: [
    {
      name: 'main',
      folder: '.',
      source: process.env.API_SOURCE!,
      token: process.env.API_TOKEN!,
    },
  ],
});
```

### 推荐配置 3: 微服务（多服务）

多服务是本工具的核心能力。同时对接多个后端服务时，声明多个 `services` 元素：每个服务有独立的数据源、token 与输出子目录（`folder`），共享 `baseOutputDir` 下的 `request.ts`。各服务还可以通过服务级字段覆盖公共配置（如下方 order 服务的 `generateTypes: false`）。

```typescript
export default defineConfig({
  baseOutputDir: 'src/service', // request.ts 生成于此层级并被共享
  generateApi: true,
  generateTypes: true,
  typesFormat: 'typescript',

  services: [
    {
      name: 'user', // folder 默认取 name → 输出 src/service/user
      source: process.env.USER_API_SOURCE!,
      token: process.env.USER_API_TOKEN!,
    },
    {
      name: 'order',
      source: process.env.ORDER_API_SOURCE!,
      token: process.env.ORDER_API_TOKEN!,
      folder: 'trade/order', // 多段 folder → 输出 src/service/trade/order
      generateTypes: false, // 服务级覆盖：order 服务不生成类型
    },
  ],
});
```

对应输出结构：

```
src/service/                    # baseOutputDir
├── request.ts                  # 共享请求函数（仅生成一次）
├── user/                       # src/service/user
│   ├── index.ts
│   ├── <tag拼音>/index.ts
│   └── types/
└── trade/order/                # src/service/trade/order
    ├── index.ts
    └── <tag拼音>/index.ts      # order 服务未生成 types/
```

> 注意：各服务计算后的 `outputDir` 不能相同或互相嵌套，否则会抛 `E1002`。`name` 也不能重复。详见[配置指南 - 多服务配置](./configuration.md#多服务--微服务配置)。

## 下一步

- 查看[迁移指南](./migration.md)了解如何从旧版本迁移
- 查看[配置文档](./configuration.md)了解所有配置选项
- 查看[高级用法](./advanced.md)学习自定义模板和钩子

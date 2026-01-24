# 迁移指南

本文档帮助您从旧版本的配置迁移到新的简化配置。

## 破坏性变更

### 1. 移除 `validation` 配置项

**旧配置：**

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  source: 'YOUR_API_SOURCE',
  token: 'YOUR_TOKEN',

  // ❌ 已移除
  validation: {
    enabled: true,
    library: 'zod',
    outputDir: 'src/service/schemas',
    generateRequestSchemas: true,
    generateResponseSchemas: true,
    generateTypeSchemas: true,
  },

  typesFormat: 'zod',
});
```

**新配置：**

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  source: 'YOUR_API_SOURCE',
  token: 'YOUR_TOKEN',

  // 只需设置 typesFormat
  typesFormat: 'zod',
});
```

### 2. 文件结构变更

#### 旧结构（validation.enabled = true）

```
src/service/
├── request.ts
├── index.ts
├── AIFuWu/
│   ├── index.ts
│   └── PostAiCompletion.ts      # 接口文件
└── schemas/                      # 独立的 schemas 目录
    ├── AIFuWu/
    │   ├── PostAiCompletion.ts    # Schema 文件
    │   └── GetAiProviders.ts
    └── index.ts
```

#### 新结构（Zod 模式）

```
src/service/
├── request.ts
├── index.ts
├── AIFuWu/
│   ├── index.ts                # 接口文件
│   └── schema.ts             # 合并的 Schema 文件（包含所有接口的 Schema）
└── schemas/                   # 类型 Schema 目录
    ├── CompletionRequestDtoSchema.ts
    ├── UserResponseDtoSchema.ts
    └── index.ts
```

#### 新结构（TypeScript 模式）

```
src/service/
├── request.ts
├── index.ts
├── AIFuWu/
│   ├── index.ts                # 接口文件
│   ├── User.ts                # 类型定义
│   └── PostAiCompletion.ts   # 类型定义
```

### 3. 导入路径变更

#### Zod 模式

**旧导入路径：**

```typescript
// 从独立的 schemas 目录导入
import { PostAiCompletionRequestSchema } from '../schemas/AIFuWu/PostAiCompletion';
import type { PostAiCompletionRequest } from '../schemas/AIFuWu/PostAiCompletion';
```

**新导入路径：**

```typescript
// 从同级 schema.ts 文件导入
import { PostAiCompletionRequestSchema, PostAiCompletionResponseSchema } from './schema';
import type { PostAiCompletionRequest, PostAiCompletionResponse } from './schema';

// 类型 Schema 从 schemas 目录导入
import { UserSchema } from '../schemas/UserSchema';
import type { User } from '../schemas/UserSchema';
```

#### TypeScript 模式

**旧导入路径：**

```typescript
// 从独立的 types 目录导入
import type { User } from '../types/User';
import type { Role } from '../types/Role';
```

**新导入路径：**

```typescript
// 从同级类型文件导入
import type { User } from './User';
import type { Role } from './Role';
```

## 迁移步骤

### 步骤 1: 更新配置文件

1. 打开 `api-power.config.ts` 文件
2. 删除 `validation` 配置项及其所有子字段
3. 确认 `typesFormat` 设置正确：
   - 如果您需要运行时验证，使用 `typesFormat: 'zod'`
   - 如果您只需要编译时类型检查，使用 `typesFormat: 'typescript'`

### 步骤 2: 更新导入语句

根据您的 `typesFormat` 配置，更新代码中的导入语句：

#### 如果使用 Zod 模式

```typescript
// 旧的导入方式（如果有多个 schema 文件）
import { PostAiCompletionSchema, GetAiProvidersSchema } from '../schemas/AIFuWu/PostAiCompletion';
import { GetAiProvidersSchema } from '../schemas/AIFuWu/GetAiProviders';

// 新的导入方式（统一的 schema.ts）
import {
  PostAiCompletionRequestSchema,
  PostAiCompletionResponseSchema,
  GetAiProvidersRequestSchema,
  GetAiProvidersResponseSchema,
} from './schema';
import type {
  PostAiCompletionRequest,
  PostAiCompletionResponse,
  GetAiProvidersRequest,
  GetAiProvidersResponse,
} from './schema';
```

#### 如果使用 TypeScript 模式

```typescript
// 旧的导入方式
import type { User } from '../types/User';
import type { Role } from '../types/Role';

// 新的导入方式
import type { User } from './User';
import type { Role } from './Role';
```

### 步骤 3: 删除旧文件

删除以下旧文件：

```bash
# 删除独立的 schemas 目录（如果是旧结构）
rm -rf src/service/schemas/[分类目录]/  # 只保留 schemas/index.ts

# 删除独立的 types 目录（TypeScript 模式）
rm -rf src/service/types/
```

### 步骤 4: 重新生成代码

```bash
npx api-power generate --config api-power.config.ts
```

### 步骤 5: 验证编译

```bash
# 如果是 TypeScript 项目
npx tsc --noEmit

# 或使用项目构建命令
npm run build
```

## 迁移示例

### 示例 1: 从 validation 配置迁移

**旧配置：**

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  source: 'https://api.apifox.com/v1/projects/123/export-openapi',
  token: 'APS-YourToken',

  // 旧配置：启用 validation
  validation: {
    enabled: true,
    library: 'zod',
    outputDir: 'src/service/schemas',
  },
  typesFormat: 'zod',
});
```

**新配置：**

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  source: 'https://api.apifox.com/v1/projects/123/export-openapi',
  token: 'APS-YourToken',

  // 新配置：只需设置 typesFormat
  typesFormat: 'zod',
});
```

### 示例 2: 从 TypeScript 模式迁移

**旧配置：**

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  source: 'https://api.apifox.com/v1/projects/123/export-openapi',
  token: 'APS-YourToken',
  typesFormat: 'typescript',
});
```

**新配置：**

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  source: 'https://api.apifox.com/v1/projects/123/export-openapi',
  token: 'APS-YourToken',
  typesFormat: 'typescript', // 配置不变，无需修改
});
```

## 常见问题

### Q: 为什么移除了 `validation` 配置？

A: 为了简化配置，我们统一了类型生成的逻辑。现在 `typesFormat` 配置项就能控制：

- `typescript`：生成 TypeScript 类型定义
- `zod`：生成 Zod Schema（包含运行时验证）

### Q: 我的 Schema 文件在哪里？

A: 位置取决于 `typesFormat` 配置：

- **Zod 模式**：
  - 接口 Schema：在每个分类目录的 `schema.ts` 文件中
  - 类型 Schema：在 `schemas/` 目录中

- **TypeScript 模式**：
  - 类型定义：在每个分类目录的独立 `.ts` 文件中以及 `types/` 目录中

### Q: 如何切换到 Zod 模式？

A: 只需修改配置：

```typescript
export default defineConfig({
  // ...
  typesFormat: 'zod',
});
```

然后重新生成代码即可。

### Q: 迁移后代码无法编译怎么办？

A: 检查以下几点：

1. 确认所有导入路径已更新
2. 检查是否使用了旧的 `validation` 配置
3. 删除旧的 `types` 目录（TypeScript 模式）
4. 重新生成代码后清理构建缓存：
   ```bash
   rm -rf node_modules/.cache
   npm run build
   ```

## 需要帮助？

如果迁移过程中遇到问题：

1. 查看[配置文档](./configuration.md)了解新的配置选项
2. 查看[使用示例](./examples.md)参考完整示例
3. 在 [GitHub Issues](https://github.com/shawicx/api-tool/issues) 提问

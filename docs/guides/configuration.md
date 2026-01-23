# 配置指南

`@scx/api-tool` 使用简单的配置文件来生成 API 代码。

## 配置文件

### 文件类型

推荐使用 TypeScript 配置文件以获得完整的类型提示：

- **TypeScript** (`api-power.config.ts`) - ✅ 推荐
- **JavaScript** (`api-power.config.js`) - 支持

### 配置文件位置

工具按以下顺序查找配置文件：

1. 命令行指定的配置文件 (`--config` 参数)
2. 当前目录的 `api-power.config.ts`
3. 当前目录的 `api-power.config.js`

## 快速开始

### 创建配置文件

```bash
npx api-power init
```

这将在当前目录创建一个默认的 `api-power.config.ts` 文件。

### 配置文件模板

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  // API 数据源 (必需)
  source: 'https://api.apifox.com/v1/projects/YOUR_PROJECT_ID/export-openapi',
  token: 'YOUR_ACCESS_TOKEN',

  // 输出配置 (可选)
  outputDir: 'src/service',
  generateApi: true,
  generateTypes: true,

  // 代码生成选项 (可选)
  target: 'typescript',
  indentSize: 2,
  comment: true,
});
```

## 完整配置选项

### 必需配置

| 配置项   | 类型     | 说明                 | 示例                                                      |
| -------- | -------- | -------------------- | --------------------------------------------------------- |
| `source` | `string` | API 数据源的完整 URL | `'https://api.apifox.com/v1/projects/123/export-openapi'` |
| `token`  | `string` | API 访问令牌         | `'APS-YourAccessTokenHere'`                               |

### 输出配置

| 配置项          | 类型                           | 默认值          | 说明                  |
| --------------- | ------------------------------ | --------------- | --------------------- |
| `outputDir`     | `string`                       | `'src/service'` | 生成的代码输出目录    |
| `generateApi`   | `boolean`                      | `true`          | 是否生成 API 请求方法 |
| `generateTypes` | `boolean`                      | `true`          | 是否生成类型定义      |
| `target`        | `'typescript' \| 'javascript'` | `'typescript'`  | 目标语言              |

### 代码生成选项

| 配置项        | 类型                    | 默认值         | 说明         |
| ------------- | ----------------------- | -------------- | ------------ |
| `indentSize`  | `number`                | `2`            | 代码缩进大小 |
| `comment`     | `boolean`               | `true`         | 是否生成注释 |
| `pathPrefix`  | `string`                | `''`           | API 路径前缀 |
| `prodEnvName` | `string`                | `'production'` | 生产环境名称 |
| `typesFormat` | `'typescript' \| 'zod'` | `'typescript'` | 类型生成格式 |

### 请求函数配置

| 配置项                     | 类型                                      | 默认值                     | 说明             |
| -------------------------- | ----------------------------------------- | -------------------------- | ---------------- |
| `requestFunctionFilePath`  | `string`                                  | `'src/service/request.ts'` | 请求函数文件路径 |
| `requestFunctionName`      | `string`                                  | `'request'`                | 请求函数名称     |
| `requestMethodsObjectName` | `string`                                  | `'requestMethods'`         | 请求方法对象名称 |
| `requestMethodStyle`       | `'config' \| 'method-specific' \| 'both'` | `'config'`                 | 请求方法调用风格 |

### 性能配置

| 配置项        | 类型     | 默认值 | 说明                               |
| ------------- | -------- | ------ | ---------------------------------- |
| `concurrency` | `number` | `5`    | 并发写入数量（文件生成的并发控制） |

### 预设配置

工具提供三种预设配置，可以快速设置常用选项：

| 预设       | 说明                                                 |
| ---------- | ---------------------------------------------------- |
| `minimal`  | 只生成类型，不生成 API，不生成注释，使用 config 风格 |
| `standard` | 生成类型和 API，生成注释，使用 config 风格           |
| `verbose`  | 生成类型和 API，生成注释，4 空进，使用 both 风格     |

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  source: 'YOUR_API_SOURCE',
  token: 'YOUR_TOKEN',

  // 使用预设
  preset: 'minimal', // 或 'standard', 'verbose'

  // 预设后仍可覆盖单个选项
  outputDir: 'src/api',
});
```

## 配置示例

### 基础配置

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  source: 'https://api.apifox.com/v1/projects/6997172/export-openapi',
  token: 'APS-YourAccessTokenHere',
});
```

### 完整配置

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  // API 数据源
  source: 'https://api.apifox.com/v1/projects/6997172/export-openapi',
  token: 'APS-YourAccessTokenHere',

  // 输出配置
  outputDir: 'src/service',
  generateApi: true,
  generateTypes: true,
  target: 'typescript',

  // 代码生成选项
  indentSize: 2,
  comment: true,
  pathPrefix: '/api/v1',
  prodEnvName: 'production',

  // 请求函数配置
  requestFunctionFilePath: 'src/service/request.ts',
  requestFunctionName: 'request',
  requestMethodsObjectName: 'requestMethods',
  requestMethodStyle: 'config',

  // 性能配置
  concurrency: 5,
});
```

### 使用预设

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  source: 'https://api.apifox.com/v1/projects/6997172/export-openapi',
  token: 'APS-YourAccessTokenHere',

  // 使用 verbose 预设
  preset: 'verbose',

  // 覆盖预设中的某些选项
  outputDir: 'src/api',
});
```

### 只生成类型定义

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  source: 'https://api.apifox.com/v1/projects/6997172/export-openapi',
  token: 'APS-YourAccessTokenHere',

  // 只生成类型，不生成请求函数
  generateApi: false,
  generateTypes: true,
});
```

### 只生成 API 函数

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  source: 'https://api.apifox.com/v1/projects/6997172/export-openapi',
  token: 'APS-YourAccessTokenHere',

  // 只生成 API 函数，不生成类型
  generateApi: true,
  generateTypes: false,
});
```

### JavaScript 输出

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  source: 'https://api.apifox.com/v1/projects/6997172/export-openapi',
  token: 'APS-YourAccessTokenHere',

  // 生成 JavaScript 代码
  target: 'javascript',
});
```

### 自定义路径前缀

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  source: 'https://api.apifox.com/v1/projects/6997172/export-openapi',
  token: 'APS-YourAccessTokenHere',

  // 所有 API 路径会添加此前缀
  pathPrefix: '/api/v1',
});
```

### 环境变量配置

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  source: process.env.API_SOURCE || 'https://api.apifox.com/v1/projects/6997172/export-openapi',
  token: process.env.API_TOKEN || 'default-token',
  outputDir: process.env.OUTPUT_DIR || 'src/service',
  generateApi: process.env.GENERATE_API !== 'false',
  generateTypes: process.env.GENERATE_TYPES !== 'false',
});
```

对应的 `.env` 文件：

```bash
# .env
API_SOURCE=https://api.apifox.com/v1/projects/6997172/export-openapi
API_TOKEN=APS-YourAccessTokenHere
OUTPUT_DIR=src/service
TYPES_ONLY=false
```

## 配置验证

### TypeScript 类型检查

使用 `defineConfig` 函数确保类型安全：

```typescript
import { defineConfig } from '@scxfe/api-tool';

// 自动类型推断和验证
export default defineConfig({
  source: 'https://api.apifox.com/v1/projects/6997172/export-openapi',
  token: 'APS-YourAccessTokenHere',

  // IDE 会提供完整的类型提示和验证
  // 如果配置项名称错误或类型不匹配，会立即报错
  outputDir: 'src/service',
});
```

### 运行时验证

工具会自动验证配置：

- ✅ 必填字段检查（`source`, `token`）
- ✅ 字段类型验证
- ✅ 枚举值验证
- ✅ URL 格式验证

如果配置有误，工具会显示详细的错误信息并退出。

## 最佳实践

### 1. 配置文件管理

```bash
project/
├── api-power.config.ts     # 主配置文件
├── .env.example           # 环境变量示例
├── .env.local             # 本地环境变量（不提交）
└── src/
    └── service/            # 生成的代码目录
```

### 2. 安全建议

- ✅ **不要**将包含真实 `token` 的配置文件提交到版本控制
- ✅ 使用 `.env.example` 提供配置模板
- ✅ 使用 `.gitignore` 排除 `.env.local` 和敏感配置
- ✅ 在团队文档中说明如何获取 API token

### 3. 环境变量

推荐使用环境变量管理敏感信息：

```typescript
// api-power.config.ts
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  source: process.env.API_SOURCE!,
  token: process.env.API_TOKEN!,

  // 其他非敏感配置
  outputDir: 'src/service',
  target: 'typescript',
});
```

```bash
# .env.example
API_SOURCE=https://api.apifox.com/v1/projects/YOUR_PROJECT_ID/export-openapi
API_TOKEN=your-access-token-here
```

### 4. 多环境配置

```typescript
import { defineConfig } from '@scxfe/api-tool';

const isDev = process.env.NODE_ENV === 'development';

export default defineConfig({
  source: process.env.API_SOURCE!,
  token: process.env.API_TOKEN!,

  // 开发环境使用不同配置
  ...(isDev && {
    comment: true,
    indentSize: 4,
  }),
});
```

## 故障排除

### 常见问题

#### 1. 配置文件找不到

```bash
Error: Cannot find config file
```

**解决方案：**

- 确认配置文件名为 `api-power.config.ts` 或 `api-power.config.js`
- 确保配置文件在项目根目录
- 或使用 `--config` 参数指定配置文件路径

#### 2. 类型错误

```bash
error TS2345: Argument of type 'string' is not assignable to parameter of type 'ServerType'
```

**解决方案：**

- 使用 TypeScript 配置文件获得类型提示
- 确保所有配置项类型正确
- 使用 `defineConfig` 函数包装配置

#### 3. API 连接失败

```bash
Error: Failed to fetch API data
```

**解决方案：**

- 检查 `source` URL 是否正确
- 验证 `token` 是否有效
- 检查网络连接和代理设置
- 使用 `debug` 命令查看详细信息：
  ```bash
  npx api-power debug
  ```

## 类型生成格式

`typesFormat` 配置项控制生成代码的类型定义格式：

### TypeScript 模式

使用 TypeScript 接口定义类型：

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  source: 'YOUR_API_SOURCE',
  token: 'YOUR_TOKEN',

  // 使用 TypeScript 类型定义
  typesFormat: 'typescript',
});
```

**输出结构（TypeScript 模式）：**

```
src/service/
├── request.ts                # 请求函数
├── index.ts                  # 根导出文件
├── AIFuWu/                   # 分类目录
│   └── index.ts              # API 函数
├── YongHuGuanLi/             # 分类目录
│   └── index.ts
└── types/                    # 类型定义目录
    ├── index.ts              # 类型索引文件
    ├── User.ts
    └── Role.ts
```

### Zod 模式

使用 Zod Schema 定义类型，包含运行时验证：

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  source: 'YOUR_API_SOURCE',
  token: 'YOUR_TOKEN',

  // 使用 Zod Schema
  typesFormat: 'zod',
});
```

**输出结构（Zod 模式）：**

```
src/service/
├── request.ts
├── index.ts
├── AIFuWu/
│   ├── index.ts              # API 函数（从 schema 导入类型）
│   └── schema.ts            # 合并的 Schema 文件（包含所有接口的 Schema + 推导类型）
└── schemas/                 # 类型 Schema 文件
    ├── UserSchema.ts        # 类型 Schema（包含 Schema + 推导类型）
    ├── RoleSchema.ts
    └── index.ts
```

### 模式对比

| 特性           | TypeScript 模式 | Zod 模式                 |
| -------------- | --------------- | ------------------------ |
| 编译时类型检查 | ✅              | ✅                       |
| 运行时验证     | ❌              | ✅                       |
| 文件数量       | 较多            | 较少                     |
| Schema 定义    | ❌              | ✅                       |
| 推导类型       | 直接使用接口    | `z.infer<typeof Schema>` |

- [CLI 命令参考](./cli) - 了解所有可用命令
- [高级用法](./advanced) - 学习自定义模板和钩子

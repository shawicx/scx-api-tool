# 配置指南

`@scx/api-tool` 使用简单的配置文件来生成 API 代码。

## 配置文件

### 文件类型

推荐使用 TypeScript 配置文件以获得完整的类型提示：

- **TypeScript** (`api-power.config.ts`) - 推荐
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
  // 公共输出根目录（原 outputDir 改名，所有服务共享 request.ts 所在层级）
  baseOutputDir: 'src/service',

  // 输出配置 (可选，公共配置，可被服务覆盖)
  generateApi: true,
  generateTypes: true,

  // 代码生成选项 (可选)
  target: 'typescript',
  indentSize: 2,
  comment: true,

  // 服务声明 (必需，数组长度 ≥ 1)
  services: [
    {
      name: 'main', // 服务名（唯一），用于日志/错误/默认 folder
      folder: '.', // 输出直接落在 baseOutputDir（等价于旧的单源配置）
      source: 'https://api.apifox.com/v1/projects/YOUR_PROJECT_ID/export-openapi', // API 数据源 (必需)
      token: 'YOUR_ACCESS_TOKEN', // API 访问令牌 (Apifox 必需，Swagger 可省)
    },
  ],
});
```

> `defineConfig` 返回 `ApiConfig[]`。即使只有一个数据源，`services` 数组长度也为 1。单源场景建议使用 `name: 'main', folder: '.'`，让输出直接落在 `baseOutputDir`，与旧的单源配置保持一致。

## 完整配置选项

配置由**公共配置**（顶层，所有服务继承）和 **`services` 数组**（每个服务独立的数据源、token、folder，可覆盖任何公共字段）两部分组成。

### 服务配置（`services`，必需）

每个 `services[]` 元素（`ServiceConfig`）声明一个数据源。`source`/`token` 从顶层下沉到服务级，每个服务可以有独立的值。

| 配置项   | 类型     | 必填 | 说明                                                                       | 示例                                                      |
| -------- | -------- | ---- | -------------------------------------------------------------------------- | --------------------------------------------------------- |
| `name`   | `string` | 是   | 服务名（唯一），用于日志/错误提示/默认 folder                              | `'user'`                                                  |
| `source` | `string` | 是   | 该服务的 API 数据源完整 URL                                                | `'https://api.apifox.com/v1/projects/123/export-openapi'` |
| `token`  | `string` | 否   | 该服务的 API 访问令牌（Apifox 必需，Swagger 可省）                         | `'APS-YourAccessTokenHere'`                               |
| `folder` | `string` | 否   | 相对 `baseOutputDir` 的子目录，默认取 `name`；可多段（如 `'trade/order'`） | `'user'` / `'trade/order'` / `'.'`                        |

> 除上述字段外，`ServiceConfig` 可包含任意公共字段（如 `transformPath`、`typesFormat`、`generateApi` 等），会浅合并覆盖公共配置，实现服务级个性化。

### 公共配置（顶层）

#### 输出配置

| 配置项          | 类型                           | 默认值          | 说明                                                                                                                    |
| --------------- | ------------------------------ | --------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `baseOutputDir` | `string`                       | `'src/service'` | 公共根输出目录（原 `outputDir` 改名）；共享 `request.ts` 位于此层级，各服务输出至 `join(baseOutputDir, folder ?? name)` |
| `generateApi`   | `boolean`                      | `true`          | 是否生成 API 请求方法（可被服务覆盖）                                                                                   |
| `generateTypes` | `boolean`                      | `true`          | 是否生成类型定义（可被服务覆盖）                                                                                        |
| `target`        | `'typescript' \| 'javascript'` | `'typescript'`  | 目标语言                                                                                                                |

### 代码生成选项

| 配置项          | 类型                       | 默认值         | 说明                                        |
| --------------- | -------------------------- | -------------- | ------------------------------------------- |
| `indentSize`    | `number`                   | `2`            | 代码缩进大小                                |
| `comment`       | `boolean`                  | `true`         | 是否生成注释                                |
| `transformPath` | `(path: string) => string` | `(p) => p`     | 路径转换函数（接收 path 返回转换后的 path） |
| `prodEnvName`   | `string`                   | `'production'` | 生产环境名称                                |
| `typesFormat`   | `'typescript' \| 'zod'`    | `'typescript'` | 类型生成格式                                |

### 请求函数配置

| 配置项                     | 类型                                      | 默认值                              | 说明                                                                                |
| -------------------------- | ----------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------- |
| `requestFunctionFilePath`  | `string`                                  | `join(baseOutputDir, 'request.ts')` | 请求函数文件路径（位于 `baseOutputDir` 层级，所有服务共享；多服务场景下仅生成一次） |
| `requestFunctionName`      | `string`                                  | `'request'`                         | 请求函数名称                                                                        |
| `requestMethodsObjectName` | `string`                                  | `'requestMethods'`                  | 请求方法对象名称                                                                    |
| `requestParamName`         | `string`                                  | `'params'`                          | 请求参数名                                                                          |
| `responseTypeName`         | `string`                                  | `'Response'`                        | 返回数据类型名                                                                      |
| `requestMethodStyle`       | `'config' \| 'method-specific' \| 'both'` | `'config'`                          | 请求方法调用风格                                                                    |

### 性能配置

| 配置项        | 类型     | 默认值 | 说明                               |
| ------------- | -------- | ------ | ---------------------------------- |
| `concurrency` | `number` | `50`   | 并发写入数量（文件生成的并发控制） |

### 钩子配置

| 配置项  | 类型                    | 默认值      | 说明             |
| ------- | ----------------------- | ----------- | ---------------- |
| `hooks` | `CliHooks \| undefined` | `undefined` | 代码生成钩子函数 |

钩子函数允许你在代码生成的不同阶段执行自定义操作：

- `beforeGenerate`: 开始生成前执行
- `afterGenerate`: 生成完成后执行
- `beforeWriteFile`: 每个文件写入前执行（可修改内容）
- `afterWriteFile`: 每个文件写入后执行

详细用法请参考 [高级用法 - 钩子系统](./advanced.md#钩子系统)。

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
  // 使用预设
  preset: 'minimal', // 或 'standard', 'verbose'

  // 预设后仍可覆盖单个选项
  baseOutputDir: 'src/api',

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

## 多服务 / 微服务配置

`defineConfig` 统一采用多服务配置形态：顶层是所有服务共享的公共配置，`services` 数组声明每个服务独立的数据源与输出位置。单源即数组长度为 1；微服务则声明多个服务。返回值为 `ApiConfig[]`。

### 合并规则

`{...公共配置（剔除 services）, ...每个 service 配置}` 浅合并，产出 `ApiConfig[]`。服务级字段会覆盖同名的公共字段，实现「公共配置继承 + 服务级个性化」。

### 输出目录计算与隔离

- 每个服务的输出目录 = `join(baseOutputDir, service.folder ?? service.name)`
- `folder` 可省略（默认取 `name`），可单段（如 `'user'`），也可多段（如 `'trade/order'`）
- `request.ts` 位于 `baseOutputDir` 层级，**默认只生成一次**，所有服务共享；每个服务清理自己的子目录，不会触及共享的 `request.ts`
- 单源场景建议使用 `name: 'main', folder: '.'`，让输出直接落在 `baseOutputDir`，与旧的单源配置保持一致

### 校验规则（配置合并阶段执行，基于计算后的绝对路径）

| 情况                                        | 处理            |
| ------------------------------------------- | --------------- |
| 两个服务计算后的 `outputDir` **完全相同**   | ❌ 报错 `E1002` |
| 两个服务 `outputDir` **嵌套**（一方是祖先） | ❌ 报错 `E1002` |
| 服务名 `name` **重复**                      | ❌ 报错         |
| `folder` 多段（如 `'trade/order'`）         | ✅ 允许         |

### 多服务完整示例

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  // 公共配置：所有服务继承
  baseOutputDir: 'src/service', // request.ts 生成于此层级并被共享
  typesFormat: 'typescript',
  generateApi: true,
  generateTypes: true,
  concurrency: 5,

  // 公共命名策略
  namingStrategy: {/* ... */},

  services: [
    {
      name: 'user', // folder 省略 → 默认 'user' → 输出 src/service/user
      source: 'https://user-svc.example.com/v3/api-docs',
      token: 'APS-user-token',
    },
    {
      name: 'order',
      source: 'https://order-svc.example.com/swagger.json',
      token: 'APS-order-token',
      folder: 'trade/order', // 多段 folder → 输出 src/service/trade/order
      transformPath: (p) => '/order' + p, // 服务级覆盖公共配置
    },
  ],
});
```

对应的输出结构：

```
src/service/                    # baseOutputDir
├── request.ts                  # 共享请求函数（仅生成一次）
├── user/                       # join(base, 'user')（folder 默认取 name）
│   ├── index.ts
│   ├── <tag拼音>/index.ts
│   └── types/
└── trade/order/                # join(base, 'trade/order')（多段 folder）
    ├── index.ts
    ├── <tag拼音>/index.ts
    └── types/
```

> 单源示例见上方各「配置示例」。把单个服务声明放进 `services` 数组，并用 `folder: '.'` 让其输出直接落在 `baseOutputDir` 即可。

## 配置示例

### 基础配置

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  baseOutputDir: 'src/service',
  services: [
    {
      name: 'main',
      folder: '.',
      source: 'https://api.apifox.com/v1/projects/6997172/export-openapi',
      token: 'APS-YourAccessTokenHere',
    },
  ],
});
```

### 完整配置

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  // 公共输出根目录
  baseOutputDir: 'src/service',

  // 输出配置
  generateApi: true,
  generateTypes: true,
  target: 'typescript',

  // 代码生成选项
  indentSize: 2,
  comment: true,
  transformPath: (p) => '/api/v1' + p,
  prodEnvName: 'production',

  // 请求函数配置
  requestFunctionFilePath: 'src/service/request.ts',
  requestFunctionName: 'request',
  requestMethodsObjectName: 'requestMethods',
  requestMethodStyle: 'config',

  // 性能配置
  concurrency: 5,

  // 服务声明
  services: [
    {
      name: 'main',
      folder: '.',
      source: 'https://api.apifox.com/v1/projects/6997172/export-openapi',
      token: 'APS-YourAccessTokenHere',
    },
  ],
});
```

### 使用预设

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  // 使用 verbose 预设
  preset: 'verbose',

  // 覆盖预设中的某些选项
  baseOutputDir: 'src/api',

  services: [
    {
      name: 'main',
      folder: '.',
      source: 'https://api.apifox.com/v1/projects/6997172/export-openapi',
      token: 'APS-YourAccessTokenHere',
    },
  ],
});
```

### 只生成类型定义

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  baseOutputDir: 'src/service',

  // 只生成类型，不生成请求函数
  generateApi: false,
  generateTypes: true,

  services: [
    {
      name: 'main',
      folder: '.',
      source: 'https://api.apifox.com/v1/projects/6997172/export-openapi',
      token: 'APS-YourAccessTokenHere',
    },
  ],
});
```

### 只生成 API 函数

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
      source: 'https://api.apifox.com/v1/projects/6997172/export-openapi',
      token: 'APS-YourAccessTokenHere',
    },
  ],
});
```

### JavaScript 输出

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  baseOutputDir: 'src/service',

  // 生成 JavaScript 代码
  target: 'javascript',

  services: [
    {
      name: 'main',
      folder: '.',
      source: 'https://api.apifox.com/v1/projects/6997172/export-openapi',
      token: 'APS-YourAccessTokenHere',
    },
  ],
});
```

### 自定义路径转换（transformPath）

`transformPath` 是一个**函数**，接收原始 path，返回转换后的 path。可用于添加前缀、去除前缀、正则替换等任意路径变换。

**类型**：`(path: string) => string`
**默认值**：`(p) => p`（恒等函数，不做任何修改）

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  baseOutputDir: 'src/service',

  // 示例 1：去除前缀（文档是 /api/users，生成代码里是 /users）
  transformPath: (p) => (p.startsWith('/api') ? p.slice(4) : p),

  // 示例 2：添加前缀（文档是 /users，生成代码里调用 /api/v1/users）
  // transformPath: (p) => '/api/v1' + p,

  // 示例 3：正则替换（去除版本号前缀）
  // transformPath: (p) => p.replace(/^\/v\d+/, ''),

  services: [
    {
      name: 'main',
      folder: '.',
      source: 'https://api.apifox.com/v1/projects/6997172/export-openapi',
      token: 'APS-YourAccessTokenHere',
    },
  ],
});
```

#### ⚠️ 注意事项

1. **函数命名副作用**：path 会完整地参与生成的函数命名（路径中的所有段都会出现在函数名里）。修改 path 会连带改变生成的函数名，例如 `/api/users` 会生成 `getApiUsersFunc`，而配置 `transformPath: (p) => p.replace(/^\/api/, '')` 后会生成 `getUsersFunc`。
2. **关于 baseURL**：本工具生成的 `request.ts` 中硬编码了 axios `baseURL: '/api'`，与 `transformPath` 独立工作。如果同时配置了"加前缀"transformPath 和硬编码 baseURL，运行时 URL 会双重叠加（如 `/api/api/users`）。如需修改 baseURL，请直接编辑生成的 `request.ts`。
3. **函数必须是纯函数**：不要在函数内部进行副作用操作（如修改全局状态、发起请求）。

#### 错误处理

如果 `transformPath` 函数抛出异常或返回非字符串值，生成阶段会抛出 `E3005 GENERATE_PATH_TRANSFORM_ERROR` 错误，包含触发异常的具体 path。

### 环境变量配置

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  baseOutputDir: process.env.OUTPUT_DIR || 'src/service',
  generateApi: process.env.GENERATE_API !== 'false',
  generateTypes: process.env.GENERATE_TYPES !== 'false',

  services: [
    {
      name: 'main',
      folder: '.',
      source: process.env.API_SOURCE || 'https://api.apifox.com/v1/projects/6997172/export-openapi',
      token: process.env.API_TOKEN || 'default-token',
    },
  ],
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
  baseOutputDir: 'src/service',

  // IDE 会提供完整的类型提示和验证
  // 如果配置项名称错误或类型不匹配，会立即报错
  services: [
    {
      name: 'main',
      folder: '.',
      source: 'https://api.apifox.com/v1/projects/6997172/export-openapi',
      token: 'APS-YourAccessTokenHere',
    },
  ],
});
```

### 运行时验证

工具会自动验证配置：

- ✅ 必填字段检查（每个 `services[]` 的 `name`、`source`）
- ✅ 服务名 `name` 唯一性检查
- ✅ 各服务计算后的 `outputDir` 不相同、不嵌套（否则抛 `E1002`）
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
  // 其他非敏感配置
  baseOutputDir: 'src/service',
  target: 'typescript',

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
  baseOutputDir: 'src/service',

  services: [
    {
      name: 'main',
      folder: '.',
      source: process.env.API_SOURCE!,
      token: process.env.API_TOKEN!,
    },
  ],

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
  这将显示详细的 API 请求和响应信息，帮助你诊断问题

## 类型生成格式

`typesFormat` 配置项控制生成代码的类型定义格式：

### TypeScript 模式

使用 TypeScript 接口定义类型：

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  baseOutputDir: 'src/service',

  // 使用 TypeScript 类型定义
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
  baseOutputDir: 'src/service',

  // 使用 Zod Schema
  typesFormat: 'zod',

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

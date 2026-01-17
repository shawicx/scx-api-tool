# @scx/api-tool

一个强大的 Node.js CLI 工具，专门用于从各种 API 管理平台（如 Swagger/OpenAPI 3.0、Apifox）自动生成 TypeScript/JavaScript 代码。

## ✨ 主要特性

- 🚀 **多平台支持**: 支持 Swagger、Apifox 等主流 API 管理平台
- 📝 **类型生成**: 自动生成完整的 TypeScript 类型定义
- 🔧 **代码生成**: 自动生成 HTTP 请求函数和接口代码
- 🎨 **模板定制**: 支持自定义代码生成模板
- ⚙️ **配置灵活**: 丰富的配置选项和钩子函数
- 📦 **多格式输出**: 支持 TypeScript 和 JavaScript

## 🚀 快速开始

### 安装

```bash
# 全局安装（推荐）
pnpm install -g @scxfe/api-tool

# 或项目本地安装
pnpm install --save-dev @scxfe/api-tool

# 或使用 npx
npx @scxfe/api-tool
```

### 基本使用

```bash
# 1. 初始化配置文件
npx api-power init

# 2. 编辑配置文件 api-power.config.ts / api-power.config.js

# 3. 生成代码
npx api-power
```

## features

[x] 请求方法与数据类型分离
[x]

## 📖 文档

- [CLI 工具介绍](./docs/getting-started/index.md) - 工具介绍和安装说明
- [CLI 使用说明](./docs/guides/cli.md) - 详细的使用方法和命令说明
- [配置指南](./docs/guides/configuration.md) - 完整的配置项说明和示例
- [使用示例](./docs/guides/examples.md) - 完整的使用示例和代码生成展示
- [迁移指南](./docs/guides/migration.md) - 从旧版本迁移到新版本

## 🔧 配置示例

### Zod 模式（运行时验证）

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  source: 'https://api.apifox.com/v1/projects/YOUR_PROJECT_ID/export-openapi',
  token: 'YOUR_ACCESS_TOKEN',

  // 使用 Zod Schema 进行类型定义和运行时验证
  typesFormat: 'zod',

  // 输出配置
  outputDir: 'src/service',
  generateApi: true,
  generateTypes: true,
});
```

### TypeScript 模式（编译时类型检查）

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  source: 'https://api.apifox.com/v1/projects/YOUR_PROJECT_ID/export-openapi',
  token: 'YOUR_ACCESS_TOKEN',

  // 使用 TypeScript 接口进行类型定义
  typesFormat: 'typescript',

  // 输出配置
  outputDir: 'src/service',
  generateApi: true,
  generateTypes: true,
});
```

### 完整配置

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  // API 数据源
  source: 'https://api.apifox.com/v1/projects/YOUR_PROJECT_ID/export-openapi',
  token: 'YOUR_ACCESS_TOKEN',

  // 输出配置
  outputDir: 'src/service',
  typesOnly: false,
  apiOnly: false,

  // 类型生成格式
  typesFormat: 'zod', // 或 'typescript'

  // 代码生成选项
  indentSize: 2,
  comment: true,
  pathPrefix: '/api/v1',

  // 请求函数配置
  requestFunctionName: 'request',
  requestParamName: 'params',
});
```

## 📁 项目结构

### Zod 模式输出结构

```
src/service/
├── request.ts                      # 请求函数
├── index.ts                        # 根导出文件
├── AIFuWu/                        # 分类目录
│   ├── index.ts                    # API 函数（从 schema 导入类型）
│   └── schema.ts                   # 合并的 Schema 文件（包含所有接口的 Schema + 推导类型）
├── YongHuGuanLi/                  # 分类目录
│   ├── index.ts
│   └── schema.ts
└── schemas/                       # 类型 Schema 目录
    ├── UserSchema.ts               # 类型 Schema（包含 Schema + 推导类型）
    ├── RoleSchema.ts
    └── index.ts                   # Schema 索引文件
```

### TypeScript 模式输出结构

```
src/service/
├── request.ts                      # 请求函数
├── index.ts                        # 根导出文件
├── AIFuWu/                        # 分类目录
│   ├── index.ts                    # API 函数
│   ├── User.ts                     # 类型定义
│   └── PostAiCompletion.ts         # 类型定义
└── YongHuGuanLi/                  # 分类目录
    ├── index.ts
    ├── User.ts
    └── Role.ts
```

## 🛠️ 开发

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm run docs:dev

# 构建文档
pnpm run docs:build

# 预览构建结果
pnpm run docs:preview
```

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 联系方式

- 作者: shawicx
- 邮箱: d35f3153@proton.me
- GitHub: [@shawicx](https://github.com/shawicx)

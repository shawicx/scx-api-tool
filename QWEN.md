# @scx/api-tool 项目上下文

## 项目概述

`@scx/api-tool` 是一个强大的 Node.js 命令行工具，可以从各种 API 管理平台（如 Swagger/OpenAPI 3.0 和 Apifox）生成 TypeScript/JavaScript 代码。它自动化创建 API 请求函数和类型定义，简化了消费 API 应用的开发过程。

## 主要特性

- 多平台支持：支持 Swagger、Apifox 和其他 API 管理平台
- 类型生成：自动生成完整的 TypeScript 类型定义
- 代码生成：生成 HTTP 请求函数和接口代码
- 模板定制：支持自定义代码生成模板
- 灵活配置：丰富的配置选项和钩子函数
- 多种输出格式：支持 TypeScript 和 JavaScript

## 项目结构

```
scx-api-tool/
├── src/                    # 源代码
│   ├── cli/               # 命令行界面组件
│   ├── clients/           # 不同平台的 API 客户端
│   ├── config/            # 配置加载和验证
│   ├── generator/         # 代码生成逻辑
│   ├── processors/        # 数据处理逻辑
│   ├── service/           # 服务相关模块
│   ├── templates/         # 用于代码生成的 Handlebars 模板
│   ├── types/             # 类型定义
│   └── utils/             # 工具函数
├── dist/                  # 编译输出
├── docs/                  # 文档
├── scripts/               # 构建和工具脚本
├── api-power.config.ts    # 默认配置示例
├── package.json          # 项目清单
├── tsconfig.json         # TypeScript 配置
├── tsdown.config.ts      # 构建配置
└── README.md             # 项目文档
```

## 核心组件

### CLI 组件

- `src/cli/program.ts`：使用 Commander.js 的主 CLI 程序
- `src/cli/commands/`：包含 init、generate 和 debug 命令
- `src/index.ts` 中的入口点注册 CLI 命令

### 配置系统

- `defineConfig()` 函数提供类型安全的配置
- 从 `api-power.config.ts` 或 `api-power.config.js` 加载配置
- 支持 Apifox、Swagger/OpenAPI 3.0 来源
- 可配置的输出目录、文件路径和生成选项

### 代码生成管道

1. `src/clients/`：从远程源获取 API 定义
2. `src/processors/openapi.ts`：处理 OpenAPI/Swagger 数据
3. `src/generator/`：主要代码生成逻辑包括：
   - `codegen.ts`：文件生成
   - `template.ts`：Handlebars 模板处理
   - `extractor.ts`：数据提取逻辑
4. 使用 Handlebars 作为模板引擎实现可定制输出

### 类型定义

- `src/types/index.ts` 中的完整 TypeScript 接口
- HTTP 方法、请求/响应类型和参数类型的枚举
- API 配置、接口信息和项目信息的接口

## 构建和运行

### 安装

```bash
# 全局安装（推荐）
pnpm install -g @scxfe/api-tool

# 或项目本地安装
pnpm install --save-dev @scxfe/api-tool

# 或使用 npx
npx @scxfe/api-tool
```

### 命令

```bash
# 初始化配置文件
npx api-power init

# 从 API 定义生成代码
npx api-power

# 使用特定配置文件生成
npx api-power generate --config api-power.config.js

# 监视模式下生成
npx api-power generate --config api-power.config.js --watch

# 调试命令
npx api-power debug
```

### 开发脚本

- `pnpm run build`：使用 tsdown 编译工具
- `pnpm run dev`：在监视模式下运行开发
- `pnpm run docs:dev`：启动文档开发服务器
- `pnpm run docs:build`：构建文档
- `pnpm run docs:preview`：预览构建的文档
- `pnpm run lint`：检查代码风格
- `pnpm run lint:fix`：修复代码风格问题

### 配置示例

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  serverUrl: 'https://api.apifox.com',
  serverType: 'apifox',
  apifoxProjectId: 'your-project-id',
  typesOnly: false,
  target: 'typescript',
  outputDir: 'src/service',
  projects: [
    {
      token: 'your-project-token',
      categories: [{ id: 0 }],
    },
  ],
});
```

## 开发规范

- 使用 TypeScript 编写，启用了严格模式
- ESM 模块格式，支持原生 ESNext
- 使用 Husky 进行 git 钩子（pre-commit, commitlint）
- 遵循约定式提交规范
- ESLint 配合 @commitlint/config-conventional 和 prettier 进行代码格式化
- 最小 Node.js 版本：>=20.0.0

## 依赖项

- 核心：commander（命令行工具）、axios（HTTP 请求）、handlebars（模板）
- 工具：fs-extra、lodash-es、change-case、json-schema-to-typescript
- 开发：tsdown（构建工具）、vitepress（文档）、typescript、eslint

## 文件生成

该工具生成：

- 类型定义（types.ts）
- 请求函数（request.ts）
- 接口导出（index.ts）
- 可通过 Handlebars 模板自定义
- 根据指定的缩进大小正确格式化

# Project Context

## Purpose

根据 Swagger/OpenAPI 3.0 和 Apifox 的接口定义生成 TypeScript/JavaScript 的接口类型及其请求函数代码。这是一个 CLI 工具，帮助开发者自动化 API 客户端代码生成，减少手动编写接口定义的重复工作，提高开发效率。

## Tech Stack

- **语言**: TypeScript (ES Modules, Node.js >= 20.0.0)
- **包管理器**: pnpm
- **构建工具**: tsdown
- **CLI 框架**: Commander.js
- **日志**: consola
- **HTTP 客户端**: axios
- **模板引擎**: Handlebars
- **代码质量**:
  - ESLint: `eslint-config-ali`
  - Prettier: `prettier-config-ali`
  - Husky + lint-staged: 提交前钩子
- **其他依赖**:
  - @clack/prompts: 交互式提示
  - dayjs: 日期处理
  - pinyin-pro: 拼音转换

## Project Conventions

### Code Style

**导入顺序**:

1. 外部库/包导入
2. 内部模块导入（使用 @ 别名）
3. 类型导入（使用 `import type`）

**命名约定**:

- 文件: camelCase 或 kebab-case (如 `apifox.ts`, `openapi.ts`)
- 函数: camelCase (如 `fetchData`, `processOpenApiData`)
- 类: PascalCase (如 `SimpleProgress`, `BaseError`)
- 常量/工厂: PascalCase (如 `ErrorFactory`, `PRESETS`)
- 接口/类型: PascalCase (如 `ApiConfig`, `ProcessedApiData`)
- 私有成员: 使用 `private` 关键字

**格式化**:

- 换行符: LF
- 使用 `prettier-config-ali` 和 `eslint-config-ali` 配置
- 运行 `pnpm run lint:fix` 自动修复

**注释**:

- 使用 JSDoc 风格
- 文件头注释包含中文描述
- 使用 `@description` 标记用途
- 可选使用 `@author` 标记作者

**禁止使用**:

- `delete` 关键字
- `eval` 语法
- 过度使用闭包

### Architecture Patterns

**分层架构**:

- **CLI 层** (`src/cli/`): Commander.js 命令行界面，负责参数解析和命令路由
- **Client 层** (`src/clients/`): API 数据获取器，支持 Apifox 和 Swagger
- **Generator 层** (`src/generator/`): 代码生成管道，协调各组件
- **Processors** (`src/processors/`): 数据转换，将 OpenAPI 数据转换为内部格式
- **Templates** (`src/templates/`): Handlebars 模板，用于代码生成

**错误处理系统**:

- 自定义错误类: `ConfigError`、`FetchError`、`GenerateError`
- 错误代码枚举: `E1xxx` (配置)、`E2xxx` (网络)、`E3xxx` (生成)
- 使用 `ErrorFactory` 创建结构化错误
- 提供详细的错误解决方案建议

**模块系统**:

- 使用 ES Modules (`"type": "module"`)
- 类型路径别名: `@/*` 映射到 `./src/*`
- 输出目录: `dist/` (由 tsdown 构建)

### Testing Strategy

**无单元测试**: 本项目**没有单元测试**。

**验证方式**:

- 运行 `npx ts-node src/index.ts` 执行代码生成
- 检查 `src/service/` 目录下生成的文件
- 使用 `npx api-power init` 初始化配置文件
- 使用 `npx api-power generate --config xxx` 生成代码
- 使用 `npx api-power debug` 调试配置和数据获取

**调试**:

- 使用 `process.env.DEBUG` 环境变量启用调试输出
- 使用 consola 库进行日志记录
- 检查生成的代码是否符合预期

### Git Workflow

**分支策略**:

- 主分支: `main`
- 功能分支: 通过 issue 或 proposal 创建，建议命名: `feat/xxx`, `fix/xxx`

**提交规范**:

- 使用 **Commitlint** 约定式提交
- 支持的类型: `feat`、`fix`、`docs`、`style`、`test`、`refactor`、`chore`、`revert`、`RELEASING`
- 格式: `type(scope): description`
- 支持大写类型和小写类型

**发布流程**:

- `pnpm run versioning`: 生成版本和 CHANGELOG
- `pnpm run release`: 完整发布流程 (构建、版本控制、推送)

## Domain Context

**OpenAPI/Swagger**: RESTful API 描述格式，定义端点、参数、响应等
**Apifox**: API 管理平台，支持导入/导出 OpenAPI 规范
**代码生成**: 根据接口定义自动生成类型安全的客户端代码
**类型安全**: 使用 TypeScript 接口定义请求/响应数据结构
**验证**: 支持 Zod schema 生成用于运行时验证

**核心概念**:

- **接口** (Interfaces): API 端点定义，包含路径、方法、参数等
- **类型** (Types): 数据结构定义，从 OpenAPI 的 components/schemas 提取
- **分类** (Categories): API 分组，使用 OpenAPI 的 tags 字段
- **配置** (Config): 定义如何生成代码，包括输出目录、命名规则等

## Important Constraints

**技术约束**:

- Node.js 版本: >= 20.0.0
- 必须使用 pnpm 作为包管理器
- 生成的代码不包含单元测试，依赖人工验证
- 禁止在生成代码中使用 `delete`、`eval`

**业务约束**:

- 仅支持 OpenAPI 3.0 和 Swagger 3.1 规范
- 生成的代码仅适用于 TypeScript/JavaScript 项目
- 输出目录 `src/service/` 中的文件不应手动修改
- 所有代理必须使用 MCP (Model Context Protocol)

**性能约束**:

- API 请求超时时间: 30 秒
- 大型 API 文档可能影响处理速度

## External Dependencies

**API 数据源**:

- **Apifox API**: https://api.apifox.cn (需要 Bearer token 认证)
- **Swagger 文档**: 用户提供的 URL (OpenAPI 3.0/3.1)

**构建和发布**:

- **npm registry**: https://registry.npmjs.org/
- **GitHub**: https://github.com/shawicx/scx-api-tool

**文档**:

- **VitePress**: 文档站点生成器
- **GitHub Pages** 或其他静态托管: 文档部署

**开发工具**:

- **Husky**: Git hooks 管理
- **lint-staged**: 提交前代码检查

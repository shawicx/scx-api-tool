# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 常用命令

```bash
pnpm run build        # 生产构建 (tsdown, 输出到 dist/)
pnpm run dev          # 开发模式，使用 tsx 直接运行代码生成
pnpm run lint         # ESLint 检查
pnpm run lint:fix     # ESLint + Prettier 自动修复
pnpm run check:linesize  # 检查是否有超过 360 行的文件
```

发布流程：`pnpm run release`（构建 → standard-version 版本号 → 推送 → npm 发布）

文档：`pnpm run docs:dev` / `pnpm run docs:build`（VitePress）

## 架构概述

这是一个 CLI 工具，从 Swagger/OpenAPI 3.0 或 Apifox 获取 API 定义，自动生成前端请求代码。

### 核心数据流

```
CLI 入口 (src/cli/program.ts)
  → 加载配置 (src/config/loader.ts → src/utils/config.ts defineConfig())
  → 验证配置 (src/validation/)
  → 获取 API 数据 (src/clients/ — apifox.ts / swagger.ts)
  → 数据处理 (src/processors/openapi.ts — 解析为 ProcessedApiData)
  → 文件生成 (src/generator/codegen.ts 协调)
```

### 代码生成管线

`src/generator/codegen.ts` 是生成协调器，根据配置决定调用哪些生成器：

- **接口文件** `generators/interfaceGenerator.ts` — 按 API tag 分组，每个 tag 生成一个 index 文件
- **请求函数** `fileGenerator.ts` — 生成 request 请求工具文件
- **类型文件** `generators/typeGenerator.ts` — 独立的 TypeScript 类型定义（`target: 'typescript'` 时）
- **Zod Schema** `generators/schemaGenerator.ts` — Zod 验证 Schema（`typesFormat: 'zod'` 时）

模板编译在 `src/generator/template/compiler.ts`，使用 Handlebars 模板引擎，模板缓存提升性能。

### 配置系统

- **类型定义**：`src/types/config.ts` — `UserConfig`（用户输入）→ `ApiConfig`（完整配置）
- **默认值与合并**：`src/utils/config.ts` — 默认值 < 预设值 < 用户配置
- **验证**：`src/validation/` — 基础验证 + URL 验证 + 逻辑验证，支持 WARNING 级别继续执行

### 文件扩展名与 target 配置

`target: 'javascript'` 时（通过 `getFileExtension()` 辅助函数）：

- 所有输出文件扩展名变为 `.js`
- 不论 `typesFormat` 值如何，均不生成 TS 类型和 Zod 内容
- `requestFunctionFilePath` 默认值自动从 `.ts` 调整为 `.js`

## 项目约定

- **语言**：TypeScript strict 模式，ESM 模块系统，ESNext target
- **构建工具**：tsdown（基于 rolldown）
- **包管理器**：pnpm
- **路径别名**：`@/*` → `src/*`，`@scxfe/api-tool` → `src/index.ts`
- **Commit 规范**：遵循 commitlint conventional 规范，允许的类型：`feat`、`fix`、`docs`、`style`、`test`、`refactor`、`chore`、`revert`
- **Pre-commit**：husky + lint-staged（ESLint + Prettier）
- **ESLint**：基于 eslint-config-ali + prettier 集成
- **CLI 入口**：`api-power`（package.json bin），源码入口 `src/index.ts`
- **Node.js 版本**：>= 20.0.0

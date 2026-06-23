# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 要求

- 执行任务之前必须阅读 `.wiki/` 中的项目概述和文档结构，了解项目的整体架构和设计原则。
- 在处理代码时，必须遵循项目的编码规范和提交规范，确保代码质量和一致性。
- 在修改或添加功能时，必须更新相关文档，确保文档与代码保持一致。
- 在生成代码时，必须遵循项目的代码生成模式和文件结构。

## 规则

1. **禁止提交代码** — 不要执行 `git commit`、`git push` 等提交操作，由用户自行提交
2. **删除文件前必须告知用户并取得同意** — 不能未经确认删除任何文件
3. **Superpowers spec/plan 文件位置** — 仅存放在 `superpowers/spec/` 和 `superpowers/plan/` 下。这两个目录已在 `.gitignore` 中，禁止从 `.gitignore` 中删除 `superpowers/` 条目，禁止将 spec/plan 文件放到其他文件夹

## 常用命令

```bash
pnpm run build        # 生产构建 (tsdown, 输出到 dist/)
pnpm run dev          # 开发模式，使用 tsx 直接运行代码生成
pnpm run lint         # ESLint 检查
pnpm run lint:fix     # ESLint + Prettier 自动修复
pnpm run check:linesize  # 检查是否有超过 360 行的文件
pnpm test             # 运行单元测试 (Vitest)
pnpm test:watch       # 监听模式运行测试
pnpm test:coverage    # 运行测试并生成覆盖率报告
```

发布：`pnpm run release`（构建 → standard-version → 推送 → npm 发布）
文档：`pnpm run docs:dev` / `pnpm run docs:build`（VitePress）

## 核心数据流

```
CLI 入口 (src/cli/program.ts)
  → 加载配置 (src/config/loader.ts → src/utils/config.ts defineConfig())
  → 验证配置 (src/validation/)
  → 获取 API 数据 (src/clients/ — apifox.ts / swagger.ts)
  → 数据处理 (src/processors/openapi.ts — 解析为 ProcessedApiData)
  → 文件生成 (src/generator/codegen.ts 协调)
```

详细架构说明见 `.wiki/architecture.md`。

## 项目约定

- **语言**：TypeScript strict 模式，ESM 模块系统，ESNext target
- **构建工具**：tsdown（基于 rolldown）
- **包管理器**：pnpm
- **路径别名**：`@/*` → `src/*`，`@scxfe/api-tool` → `src/index.ts`
- **Commit 规范**：遵循 commitlint conventional 规范，允许的类型：`feat`、`fix`、`docs`、`style`、`test`、`refactor`、`chore`、`revert`
- **单元测试**：Vitest + @vitest/coverage-v8（v8 覆盖率，阈值 75%）
- **Pre-commit**：husky + lint-staged（ESLint + Prettier）
- **CLI 入口**：`api-power`（package.json bin），源码入口 `src/index.ts`
- **Node.js 版本**：>= 20.0.0

## 文档验证

当更新实现或添加新功能时，请同步更新文档：

1. **CLI 命令文档** (`docs/guides/cli.md`)：运行 `npx api-power --help` 验证命令选项，更新示例
2. **配置文档** (`docs/guides/configuration.md`)：参考 `src/types/config.ts` 确认默认值，更新配置选项
3. **代码示例文档** (`docs/guides/examples.md`)：检查 `src/service/` 输出，验证文件结构和代码模式
4. **快速入门指南** (`docs/getting-started/quick-start.md`)：验证初始化和生成流程
5. **高级用法文档** (`docs/guides/advanced.md`)：测试钩子、监视模式等高级特性
6. **项目 wiki 文档** (`.wiki/`)：确保架构、设计决策等内容与实现一致

## 测试约定

- **框架**：Vitest（ESM 原生、Vite 驱动）
- **测试文件位置**：与被测模块同级的 `__tests__/` 目录下，命名为 `<module>.test.ts`
- **共享夹具**：`tests/fixtures/mockData.ts`
- **Mock 策略**：使用 `vi.mock()` 模块级 mock，`vi.fn()` 函数级 mock
- **ESLint 覆盖**：测试文件禁用 `consistent-type-assertions` 和 `no-unused-vars` 规则
- **覆盖率配置**：`vitest.config.ts`，覆盖率阈值各维度 75%
- **排除目录**：`src/service/**/*`（生成文件）、`src/templates/**/*`（模板字符串）

**重要**：文档必须与实际实现保持一致。

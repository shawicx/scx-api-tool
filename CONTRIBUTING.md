# 贡献指南 | Contributing Guide

**[简体中文](#简体中文) · [English](#english)**

感谢您对 `@scxfe/api-tool` 项目的关注！欢迎各种形式的贡献。

Thank you for your interest in `@scxfe/api-tool`! Contributions of all kinds are welcome.

---

<a id="简体中文"></a>

## 简体中文

我们欢迎以下形式的贡献：

- 🐛 报告 Bug（[提交 Issue](https://github.com/shawicx/scx-api-tool/issues/new?template=bug_report.yml)）
- 💡 提出新功能建议（[提交 Issue](https://github.com/shawicx/scx-api-tool/issues/new?template=feature_request.yml)）
- 📝 改进文档（中英双语）
- 🔧 提交代码修改
- 🧪 编写测试用例

### 开发环境

- Node.js >= 22.18.0（发布产物的 `engines` 为 >= 22.12.0）
- pnpm（包管理器）
- Git

```bash
git clone https://github.com/shawicx/scx-api-tool.git
cd scx-api-tool
pnpm install
```

### 常用命令

```bash
pnpm run dev           # 开发模式（用仓库配置生成一次代码）
pnpm run build         # 构建（tsdown，产物在 dist/）
pnpm test              # 运行全部测试（单元 + 生成结果 E2E）
pnpm test:watch        # 监听模式
pnpm test:coverage     # 测试 + 覆盖率报告
pnpm run lint          # 代码检查（OxLint）
pnpm run lint:fix      # Prettier 格式化 + OxLint 修复
```

> 修改生成器代码后务必运行 `pnpm test`。改动生成器模板/输出形态时，`tests/e2e` 的快照需随有意变更一起更新（`npx vitest run tests/e2e -u`）。

### 开发流程

1. Fork 并创建分支：`git checkout -b feature/your-feature`（或 `fix/...`、`docs/...`）
2. 开发与自测：`pnpm run dev` 验证生成效果，`pnpm test` 全量测试，`pnpm run lint` 静态检查
3. 提交：遵循 [Conventional Commits](https://www.conventionalcommits.org/)（commitlint 校验，提交描述可为中文）：
   - `feat: 支持新的数据源类型`
   - `fix: 修复目录嵌套校验遗漏`
   - `docs: 更新配置参考`
4. 推送并创建 Pull Request，描述动机与验证方式

### 代码规范要点

- TypeScript 严格模式（`noImplicitAny: false`），类型路径别名 `@/*` → `./src/*`
- 使用 `interface` 定义对象类型，`enum` 定义常量集合，`export type` 导出纯类型
- 禁止使用 `delete` 关键字与 `eval` 语法；所有源码文件保持在 360 行以下（`pnpm run check:linesize`）
- 文件：camelCase 或 kebab-case；函数：camelCase；类/接口：PascalCase
- 每个文件有中文 `@description` 文件头注释；函数有 `@description` / `@param` / `@returns`，核心函数附 `@example`
- 日志统一使用 `@/utils/logger`，不要手写 `if (process.env.DEBUG)` 守卫
- 修改或添加功能时同步更新相关文档（`docs/` 与 `.wiki/`），保持文档与代码一致

### 测试指南

- **单元测试**：验证工具内部函数，位于各模块的 `__tests__/` 目录，共享夹具在 `tests/fixtures/mockData.ts`
- **生成结果正确性测试**（`tests/e2e/`）：走完整真实链路生成代码后，验证生成结果本身——结构断言与快照、TypeScript `noEmit` 类型检查、运行时请求行为。契约夹具在 `tests/e2e/fixtures/openApiContract.ts`

```bash
pnpm test                        # 全部
npx vitest run tests/e2e         # 只跑 E2E
npx vitest run tests/e2e -u      # 有意变更生成产物后更新快照
```

### 版本与发布

版本与 CHANGELOG 由维护者使用 [standard-version](https://github.com/conventional-changelog/standard-version) 统一管理（遵循 Conventional Commits），贡献者无需关心版本号。

### 需要帮助？

- [架构说明](https://github.com/shawicx/scx-api-tool/blob/main/docs/development/architecture.md) - 项目架构与设计
- [配置参考](https://github.com/shawicx/scx-api-tool/blob/main/docs/guides/config-reference.md) - 完整配置项说明
- [GitHub Issues](https://github.com/shawicx/scx-api-tool/issues) - 提问与反馈
- [GitHub Discussions](https://github.com/shawicx/scx-api-tool/discussions) - 使用讨论（如未开启请使用 Issues）

---

<a id="english"></a>

## English

We welcome the following kinds of contributions:

- 🐛 Bug reports ([open an Issue](https://github.com/shawicx/scx-api-tool/issues/new?template=bug_report.yml))
- 💡 Feature suggestions ([open an Issue](https://github.com/shawicx/scx-api-tool/issues/new?template=feature_request.yml))
- 📝 Documentation improvements (bilingual English/Chinese is preferred)
- 🔧 Code changes
- 🧪 Test cases

### Development Environment

- Node.js >= 22.18.0 (the published package declares `engines: >= 22.12.0`)
- pnpm (package manager)
- Git

```bash
git clone https://github.com/shawicx/scx-api-tool.git
cd scx-api-tool
pnpm install
```

### Common Commands

```bash
pnpm run dev           # Dev mode (run one generation with the repo config)
pnpm run build         # Build (tsdown, output in dist/)
pnpm test              # Run all tests (unit + generated-output E2E)
pnpm test:watch        # Watch mode
pnpm test:coverage     # Tests + coverage report
pnpm run lint          # Lint (OxLint)
pnpm run lint:fix      # Prettier formatting + OxLint fixes
```

> Always run `pnpm test` after changing generator code. When intentionally changing generator templates/output shape, update the `tests/e2e` snapshots together with the change (`npx vitest run tests/e2e -u`).

### Development Workflow

1. Fork and create a branch: `git checkout -b feature/your-feature` (or `fix/...`, `docs/...`)
2. Develop and self-check: `pnpm run dev` to verify generation output, `pnpm test` for the full suite, `pnpm run lint` for static checks
3. Commit following [Conventional Commits](https://www.conventionalcommits.org/) (enforced by commitlint; the description may be written in Chinese):
   - `feat: support a new data source type`
   - `fix: correct a nested-directory validation gap`
   - `docs: update the config reference`
4. Push and open a Pull Request describing the motivation and how it was verified

### Code Style Essentials

- TypeScript strict mode (`noImplicitAny: false`), path alias `@/*` → `./src/*`
- Use `interface` for object types, `enum` for constant sets, `export type` for pure types
- No `delete` keyword or `eval`; keep source files under 360 lines (`pnpm run check:linesize`)
- Files: camelCase or kebab-case; functions: camelCase; classes/interfaces: PascalCase
- Every file has a `@description` header comment (Chinese); functions have `@description` / `@param` / `@returns`, key functions include `@example`
- Use the shared `@/utils/logger` for logging; never hand-write `if (process.env.DEBUG)` guards
- When adding or changing features, update the related docs (`docs/` and `.wiki/`) to keep them in sync with the code

### Testing Guide

- **Unit tests**: verify internal functions, located in each module's `__tests__/` directory, with shared fixtures in `tests/fixtures/mockData.ts`
- **Generated-output correctness tests** (`tests/e2e/`): run the full real pipeline, then verify the generated code itself — structural assertions and snapshots, TypeScript `noEmit` type checks, and runtime request behavior. Contract fixtures live in `tests/e2e/fixtures/openApiContract.ts`

```bash
pnpm test                        # All tests
npx vitest run tests/e2e         # E2E only
npx vitest run tests/e2e -u      # Update snapshots after intentional output changes
```

### Versioning & Release

Versions and the CHANGELOG are managed by the maintainer with [standard-version](https://github.com/conventional-changelog/standard-version) (Conventional Commits). Contributors don't need to bump version numbers.

### Need Help?

- [Architecture](https://github.com/shawicx/scx-api-tool/blob/main/docs/development/architecture.md) - project architecture and design
- [Config Reference](https://github.com/shawicx/scx-api-tool/blob/main/docs/guides/config-reference.md) - full configuration reference
- [GitHub Issues](https://github.com/shawicx/scx-api-tool/issues) - questions and feedback
- [GitHub Discussions](https://github.com/shawicx/scx-api-tool/discussions) - usage discussions (fall back to Issues if unavailable)

---

行为准则见 [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)。安全漏洞报告方式见 [SECURITY.md](./SECURITY.md)。

See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) for our code of conduct, and [SECURITY.md](./SECURITY.md) for how to report security vulnerabilities.

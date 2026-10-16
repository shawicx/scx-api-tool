# 贡献指南

感谢您对 `@scxfe/api-tool` 项目的关注！我们欢迎各种形式的贡献，包括但不限于：

- 🐛 报告 Bug
- 💡 提出新功能建议
- 📝 改进文档
- 🔧 提交代码修改
- 🧪 编写测试用例

## 开发环境设置

### 前置要求

- Node.js >= 22.18.0（开发工具链要求；发布产物的 `engines` 为 >= 22.12.0）
- pnpm（包管理器）
- Git

### 克隆项目

```bash
git clone https://github.com/shawicx/scx-api-tool.git
cd scx-api-tool
```

### 安装依赖

```bash
pnpm install
```

### 开发命令

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

## 项目结构

```
scx-api-tool/
├── src/
│   ├── cli/                 # CLI：入口与子命令（init/generate/verify/debug/visualize）
│   ├── clients/             # 数据源适配层（base + implementations：Apifox/Swagger）
│   ├── config/              # 配置文件加载（loader，带缓存）
│   ├── errors/              # 结构化错误系统（错误码 E1xxx/E2xxx/E3xxx + 工厂）
│   ├── generator/           # 代码生成主模块
│   │   ├── generators/      # 接口/类型/Hook/barrel 各产物生成器
│   │   ├── template/        # Handlebars 模板编译、缓存、partials 与各库 Hook 适配器
│   │   └── fileWriter.ts    # 文件写入
│   ├── naming/              # 命名策略与标识符清理
│   ├── processors/          # OpenAPI 文档 → 中间表示（接口/类型/分类）
│   ├── schema/              # Schema 处理
│   ├── types/               # 类型定义（config/api/hooks/enums）
│   ├── utils/               # 日志、路径（拼音转换）、格式化、多服务解析
│   ├── index.ts             # 库主入口（无 CLI 副作用）
│   └── cli/main.ts          # CLI 可执行入口（bin）
├── tests/
│   ├── fixtures/            # 单元测试共享夹具
│   └── e2e/                 # 生成结果正确性测试（真实链路 + 快照 + 类型检查 + 请求行为）
├── api-power.config.ts      # 仓库自身的生成配置（多服务）
├── docs/                    # 文档（VitePress，配置在 .vitepress/config.mts）
└── src/service/            # 仓库配置的真实生成产物
```

## 开发流程

### 1. 创建分支

```bash
git checkout -b feature/your-feature-name   # 功能
git checkout -b fix/bug-description         # 修复
```

### 2. 开发和测试

```bash
pnpm run dev        # 本地跑一次生成验证效果
pnpm test           # 全部测试
pnpm run lint       # 代码检查
```

### 3. 提交代码

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范（commitlint 校验，中文提交信息亦可，需符合类型前缀）：

```bash
git commit -m "feat: 支持新的数据源类型"
git commit -m "fix: 修复目录嵌套校验遗漏"
git commit -m "docs: 更新配置参考"
```

### 4. 推送和 PR

```bash
git push origin feature/your-feature-name
# 在 GitHub 上创建 Pull Request
```

## 代码规范

### TypeScript 规范

- 严格模式启用（`noImplicitAny: false`），类型路径别名 `@/*` → `./src/*`
- 使用 `interface` 定义对象类型，`enum` 定义常量集合，`export type` 导出纯类型
- 禁止使用 `delete` 关键字与 `eval` 语法
- 所有源码文件保持在 360 行以下（例外：`src/generator/template/compiler.ts`）；可用 `pnpm run check:linesize` 检查

### 命名与注释

- 文件：camelCase 或 kebab-case；函数：camelCase；类/接口：PascalCase
- 每个文件有中文 `@description` 文件头注释；函数有 `@description` / `@param` / `@returns`，核心函数附 `@example`
- 日志统一使用 `@/utils/logger`（consola 封装），不要手写 `if (process.env.DEBUG)` 守卫

### 代码风格

格式化使用 **prettier-config-ali**，代码检查使用 **OxLint**（correctness + suspicious）：

```bash
pnpm run lint:fix   # 自动格式化并修复
```

提交前钩子由 Husky + lint-staged 自动执行。

## 测试指南

测试分两类：

- **单元测试**：验证工具内部函数，位于各模块的 `__tests__/` 目录，共享夹具在 `tests/fixtures/mockData.ts`；
- **生成结果正确性测试**（`tests/e2e/`）：走完整真实链路（本地 HTTP 数据源 + 真实 `generateCode`）生成代码后，验证生成结果本身——结构断言与快照、TypeScript `noEmit` 类型检查、运行时请求行为（axios 适配器捕获）。契约夹具在 `tests/e2e/fixtures/openApiContract.ts`。

```bash
pnpm test                              # 全部
npx vitest run tests/e2e               # 只跑 E2E
npx vitest run tests/e2e -u            # 有意变更生成产物后更新快照
pnpm run test:coverage                 # 覆盖率报告
```

## 版本与发布

项目使用 [standard-version](https://github.com/conventional-changelog/standard-version) 管理版本与 CHANGELOG（遵循 Conventional Commits，配置见 `.versionrc.json`）：

```bash
pnpm run release   # 构建 → 版本号 + CHANGELOG → 发布 tag → npm publish
```

## 需要帮助？

- [架构说明](./architecture.md) - 项目架构与设计
- [CHANGELOG.md](https://github.com/shawicx/scx-api-tool/blob/main/CHANGELOG.md) - 变更记录
- [GitHub Issues](https://github.com/shawicx/scx-api-tool/issues) - 提问与反馈

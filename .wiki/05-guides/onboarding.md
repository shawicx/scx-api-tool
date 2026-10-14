# 项目上手指南

<details>
<summary>Relevant source files</summary>

- api-power.config.ts
- pnpm-lock.yaml
- src/cli/commands/debug.ts
- src/cli/commands/generate.ts
- src/cli/commands/init.ts
- src/cli/commands/verify.ts
- src/cli/commands/visualize.ts
- src/cli/constants.ts
- src/cli/main.ts
- src/cli/program.ts
- src/clients/base/index.ts
- src/clients/implementations/ApifoxClient.ts
- src/clients/implementations/index.ts
- src/clients/implementations/SwaggerClient.ts
- src/clients/index.ts

</details>

本页面帮助新成员快速搭建开发环境、理解项目结构并运行常用开发流程。

## 环境准备

- **Node.js**：要求版本 `>=22.12.0`（依据项目配置中的 `nodeVersion` 字段）。
- **包管理器**：使用 `pnpm`（依据项目配置中的 `packageManager` 字段）。
- **系统要求**：数据中未提供特殊系统要求，通常支持 Node.js 的常见操作系统均可。

### 核心依赖及用途

下表列出在源码中有明确导入记录的核心依赖及其使用场景。「导入证据」列为实际导入该依赖的文件路径。

| 依赖         | 作用                                  | 使用证据（file:line 形式的锚点用文件路径）                                                                                                                                                    |
| ------------ | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `axios`      | HTTP 请求客户端，用于拉取远端接口文档 | `src/clients/implementations/ApifoxClient.ts`、`src/clients/implementations/SwaggerClient.ts`、`src/generator/template/requestFileGenerator.ts`、`src/generator/template/templatePartials.ts` |
| `commander`  | CLI 命令解析与注册                    | `src/cli/commands/debug.ts`、`src/cli/commands/generate.ts`、`src/cli/commands/init.ts`、`src/cli/commands/verify.ts`、`src/cli/commands/visualize.ts`                                        |
| `consola`    | 日志输出                              | `src/generator/template/requestFileGenerator.ts`、`src/generator/template/templatePartials.ts`、`src/utils/logger.ts`                                                                         |
| `handlebars` | 代码模板渲染引擎                      | `src/generator/template/compiler.ts`、`src/generator/template/templateHelpers.ts`、`src/generator/template/templatePartials.ts`                                                               |
| `pinyin-pro` | 中文转拼音，用于生成路径命名          | `src/utils/path.ts`                                                                                                                                                                           |
| `prettier`   | 生成代码的格式化                      | `src/utils/formatter.ts`                                                                                                                                                                      |
| `typescript` | 编译期类型检查（校验命令中调用）      | `src/cli/commands/verify.ts`                                                                                                                                                                  |
| `tsdown`     | 生产构建工具                          | `tsdown.config.ts`                                                                                                                                                                            |
| `vitest`     | 测试运行器                            | `vitest.config.ts`                                                                                                                                                                            |

以下依赖在 `scripts` 中被调用，属于工具链脚本依赖：`husky`（`prepare` 脚本）、`oxlint`（`lint`/`ci:lint` 脚本）、`standard-version`（`versioning` 脚本）、`tsx`（`dev` 脚本）、`vitepress`（`docs:dev`/`docs:build`/`docs:preview` 脚本）。

以下依赖在本次数据中未定位到源码导入点，也未挂载到脚本：`@clack/prompts`、`dayjs`、`@commitlint/cli`、`@commitlint/config-conventional`、`@types/node`、`@vitest/coverage-v8`、`lint-staged`、`prettier-config-ali`。其中 `@types/node` 属于类型声明类依赖，`prettier-config-ali` 属于共享配置类依赖，通常经工具链隐式生效，无需源码显式导入。

## 安装步骤

1. **确认 Node.js 版本**

   ```bash
   node -v
   ```

   预期输出形如 `v22.12.0` 或更高。若低于 `v22.12.0`，需先升级 Node.js。

2. **确认 pnpm 可用**

   ```bash
   pnpm -v
   ```

   若未安装，可通过 Corepack 启用：`corepack enable pnpm`。

3. **安装依赖**

   ```bash
   pnpm install
   ```

   预期结果：`node_modules` 生成，`pnpm-lock.yaml` 中声明的依赖被解析安装。安装完成后会自动执行 `prepare` 脚本（即 `husky`），用于安装 Git 提交钩子。

4. **验证安装**

   ```bash
   pnpm run test
   ```

   预期结果：`vitest run` 启动并输出测试结果摘要。

## 项目初始化

> 本次数据未提供 CLI 命令清单（`cliCommands` 为空），因此命令的**参数与选项无法给出**，具体用法有待补充证据。以下仅列出源码中真实存在的命令模块文件，命令名称按文件名对应关系给出。

源码中 `src/cli/commands/` 下存在以下命令模块，可对应到同名子命令：

| 命令（按模块文件名对应） | 对应文件                        |
| ------------------------ | ------------------------------- |
| `init`                   | `src/cli/commands/init.ts`      |
| `generate`               | `src/cli/commands/generate.ts`  |
| `verify`                 | `src/cli/commands/verify.ts`    |
| `visualize`              | `src/cli/commands/visualize.ts` |
| `debug`                  | `src/cli/commands/debug.ts`     |

CLI 入口与命令注册分别位于 `src/cli/main.ts` 与 `src/cli/program.ts`，常量定义位于 `src/cli/constants.ts`。各子命令的参数选项「待确认」——本次数据未提供命令选项结构。

## 基本使用

以下命令均直接取自项目的 `scripts` 配置，可直接执行。

### 开发与运行

```bash
# 以开发模式运行 CLI 生成流程（使用 api-power.config.ts 配置）
pnpm run dev
```

对应脚本：`tsx src/cli/main.ts generate --config api-power.config.ts`。该命令说明 `generate` 子命令接受 `--config` 参数并指向 `api-power.config.ts`。

### 构建

```bash
# 生产构建
pnpm run build
```

对应脚本：`NODE_ENV=production tsdown`——以生产环境变量运行 `tsdown` 构建。

### 测试

```bash
# 单次运行测试
pnpm run test

# 监听模式运行测试
pnpm run test:watch

# 带覆盖率运行测试
pnpm run test:coverage
```

### 代码检查与格式化

```bash
# 全量检查
pnpm run lint

# 自动修复：先 prettier 格式化，再 oxlint 修复
pnpm run lint:fix

# 以 JSON 格式输出检查结果到 .ci/oxlint.json
pnpm run ci:lint

# 检查源码中超过 360 行的文件
pnpm run check:linesize
```

### 文档

```bash
# 本地启动文档开发服务器
pnpm run docs:dev

# 构建文档
pnpm run docs:build

# 预览构建后的文档
pnpm run docs:preview
```

### 依赖分析

```bash
# 运行依赖分析脚本
pnpm run analyze:deps
```

对应脚本：`node scripts/analyze-deps.js`。

### 发布相关

```bash
# 生成版本号与 changelog
pnpm run versioning

# 发布前置：先构建
pnpm run prepublish

# 完整发布流程
pnpm run release
```

`release` 脚本串联了 `prepublish`（构建）→ `versioning`（`standard-version`）→ `postaction`（推送 tag 与 main 分支）→ `pnpm publish` 四个阶段。

### 典型工作流

从零到产出代码的典型顺序可参照现有脚本的组织方式：

1. `pnpm run dev` 或 `pnpm run build` —— 先确保 CLI 可运行 / 构建产物可用。
2. `pnpm run test` —— 验证改动未破坏现有行为。
3. `pnpm run lint:fix` —— 统一代码风格。
4. `pnpm run release` —— 需要发版时执行完整发布链路。

> 端到端的「读取接口文档 → 生成代码」命令序列（如 `init` → `generate` 的具体串联方式）「待确认」：本次数据未提供各命令的参数与调用示例。

## 环境变量

| 变量名     | 敏感 | 引用位置              |
| ---------- | ---- | --------------------- |
| `DEBUG`    | 否   | `src/utils/logger.ts` |
| `NODE_ENV` | 否   | `tsdown.config.ts`    |

- `DEBUG`：在日志模块 `src/utils/logger.ts` 中被引用，用于控制日志输出级别。
- `NODE_ENV`：在构建配置 `tsdown.config.ts` 中被引用；`build` 脚本会将其设为 `production`。

两者均非敏感信息，不含密钥类数据。

## 项目结构概览

项目为单包结构（monorepo 形态，源码集中于 `src`）。以下按源码目录说明各目录职责，每条均锚定到真实文件路径。

| 目录             | 职责                                       | 真实文件样本                                                                                                                                                                                                                                                                          |
| ---------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/cli`        | CLI 入口、命令注册与子命令实现             | `src/cli/main.ts`、`src/cli/program.ts`、`src/cli/constants.ts`、`src/cli/commands/init.ts`、`src/cli/commands/generate.ts`、`src/cli/commands/verify.ts`、`src/cli/commands/visualize.ts`、`src/cli/commands/debug.ts`                                                               |
| `src/clients`    | 接口文档来源客户端：定义基础抽象与具体实现 | `src/clients/index.ts`、`src/clients/base/index.ts`、`src/clients/implementations/index.ts`、`src/clients/implementations/ApifoxClient.ts`、`src/clients/implementations/SwaggerClient.ts`                                                                                            |
| `src/config`     | 配置加载与解析                             | `src/config/index.ts`                                                                                                                                                                                                                                                                 |
| `src/errors`     | 错误类型定义                               | `src/errors/index.ts`                                                                                                                                                                                                                                                                 |
| `src/generator`  | 代码生成主流程及模板体系                   | `src/generator/index.ts`、`src/generator/template/index.ts`、`src/generator/template/zod/index.ts`、`src/generator/template/compiler.ts`、`src/generator/template/templateHelpers.ts`、`src/generator/template/templatePartials.ts`、`src/generator/template/requestFileGenerator.ts` |
| `src/naming`     | 命名转换                                   | `src/naming/index.ts`                                                                                                                                                                                                                                                                 |
| `src/schema`     | 接口数据结构定义                           | `src/schema/index.ts`                                                                                                                                                                                                                                                                 |
| `src/types`      | 公共类型定义                               | `src/types/index.ts`                                                                                                                                                                                                                                                                  |
| `src/utils`      | 通用工具：日志、路径、格式化               | `src/utils/logger.ts`、`src/utils/path.ts`、`src/utils/formatter.ts`                                                                                                                                                                                                                  |
| `src/validation` | 校验逻辑                                   | `src/validation/index.ts`                                                                                                                                                                                                                                                             |
| `src/index.ts`   | 包对外入口                                 | `src/index.ts`                                                                                                                                                                                                                                                                        |

要点说明：

- **客户端抽象分层**：`src/clients/base/index.ts` 提供基类，`src/clients/implementations/` 下有两个具体实现（`ApifoxClient.ts`、`SwaggerClient.ts`），分别对接 Apifox 与 Swagger 两类文档来源；`axios` 正是在这两个实现中被导入。
- **模板体系**：`src/generator/template/` 下 `compiler.ts` 负责模板编译、`templateHelpers.ts` 提供模板辅助函数、`templatePartials.ts` 提供可复用片段，`zod/index.ts` 与 `requestFileGenerator.ts` 面向具体产物类型。`handlebars` 导入于 `compiler.ts`、`templateHelpers.ts`、`templatePartials.ts`。
- **命名与路径**：`src/naming/index.ts` 负责命名转换，`src/utils/path.ts` 借助 `pinyin-pro` 处理中文路径命名。

## 开发指南

### 构建

```bash
pnpm run build
```

以生产环境变量调用 `tsdown`（配置见 `tsdown.config.ts`，其中读取 `NODE_ENV`）。发版前的构建由 `pnpm run prepublish` 触发。

### 运行测试

```bash
pnpm run test          # 单次运行
pnpm run test:watch    # 监听模式
pnpm run test:coverage # 覆盖率
```

测试运行器为 `vitest`，配置位于 `vitest.config.ts`。

### 开发调试

```bash
pnpm run dev
```

该脚本以 `tsx` 直接运行 `src/cli/main.ts`，并带上 `generate --config api-power.config.ts` 参数，即跳过构建直接以 TS 源码执行 CLI 的生成流程，适合迭代调试。

调试日志可通过设置 `DEBUG` 环境变量开启，日志逻辑位于 `src/utils/logger.ts`。

命令实现中另有一个 `debug` 子命令模块 `src/cli/commands/debug.ts`，可作为排查问题的辅助入口。

### 代码规范

- 提交前由 `husky`（`prepare` 脚本安装）挂钩子执行检查。
- 风格统一使用 `pnpm run lint:fix`（`prettier` + `oxlint`）。
- 单文件行数上限由 `pnpm run check:linesize` 检查，超过 360 行的文件会被列出，建议在新增代码时留意拆分。

### 待确认

- CLI 各子命令（`init` / `generate` / `verify` / `visualize` / `debug`）的参数与选项定义，本次数据未提供。
- `pnpm run dev` 所依赖的 `api-power.config.ts` 配置文件内容，本次数据未提供其结构说明。
- 端到端「拉取接口文档并生成代码」的推荐命令编排顺序，缺少命令用法证据。

## Related

- 同目录：[testing.md](testing.md) · [troubleshooting.md](troubleshooting.md)
- 共享 5 个源文件、共享 57 个符号：[overview.md](../01-overview/overview.md)
- 共享 7 个源文件、共享 44 个符号：[tech-stack.md](../01-overview/tech-stack.md)
- 共享 2 个源文件、共享 33 个符号：[environment.md](../01-overview/environment.md)
- 总入口：[README](../README.md)

<!-- wiki:source: llm -->

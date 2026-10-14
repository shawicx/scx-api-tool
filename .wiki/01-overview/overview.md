# @scxfe/api-tool 项目概述

<details>
<summary>Relevant source files</summary>

- .oxlintrc.json
- .scx-code-agent.yaml
- .versionrc.json
- AGENTS.md
- api-power.config.ts
- CHANGELOG.md
- cliff.toml
- package.json
- pnpm-lock.yaml
- pnpm-workspace.yaml
- README.md
- scripts/analyze-deps.js
- src/cli/commands/debug.ts
- src/cli/commands/generate.ts
- src/cli/commands/init.ts

</details>

> 一句话职责：这是一个 Node.js CLI 工具兼可编程库，把 Swagger/OpenAPI 3.0 与 Apifox 等 API 平台导出的接口定义，转换成 TypeScript/JavaScript 的类型定义、Zod Schema 与请求函数代码。

## 项目概述

`@scxfe/api-tool`（包名与描述见 `package.json`）解决的是「接口定义 → 前端调用代码」之间的手工同步问题：接口在 API 管理平台上变更后，开发者不再需要手写类型与请求函数，而是通过 CLI 或库调用一次性生成。README 自述其定位为「一个强大的 Node.js CLI 工具，专门用于从各种 API 管理平台（如 Swagger/OpenAPI 3.0、Apifox）自动生成 TypeScript/JavaScript 代码」（`README.md#@scx/api-tool`）。其宣称的能力范围覆盖多平台数据源、TypeScript/Zod 双模式类型生成、请求函数生成、OpenAPI 路径中的 `{param}` 占位符插值、自定义命名策略、钩子系统、Watch 模式以及 React Query v5 风格的 Hooks 生成（`README.md#主要特性`）。

面向场景是前端工程中需要批量、可复现地维护后端接口调用层的团队，尤其是使用 pnpm 工作区组织代码库的项目（仓库根存在 `pnpm-workspace.yaml`）。项目以「库 + CLI」双形态发布：既可以通过 `import { defineConfig } from '@scxfe/api-tool'` 在配置文件中声明式定义多服务（microservice）配置，也可以通过 `npx api-power` 直接执行生成（`README.md#全局安装（推荐）`）。

## 语言构成与各语言职责域

| 语言       | 文件数 | 职责域（锚点）                                                                                                                                                        |
| ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript | 99     | 全部生产逻辑：CLI 命令、API 客户端、配置解析、错误系统、代码生成器与模板系统（如 `api-power.config.ts`、`src/cli/commands/debug.ts`、`src/cli/commands/generate.ts`） |
| JSON       | 4      | 工程与工具配置（如 `.oxlintrc.json`、`.versionrc.json`、`package.json`）                                                                                              |
| YAML       | 3      | 工作区与智能体/流程配置（如 `.scx-code-agent.yaml`、`pnpm-lock.yaml`、`pnpm-workspace.yaml`）                                                                         |
| Markdown   | 3      | 项目文档与变更记录（如 `AGENTS.md`、`CHANGELOG.md`、`README.md`）                                                                                                     |
| JavaScript | 1      | 辅助脚本（`scripts/analyze-deps.js`）                                                                                                                                 |
| TOML       | 1      | 变更日志生成配置（`cliff.toml`）                                                                                                                                      |

该仓库不存在前后端分语言的双端结构：TypeScript 同时承担 CLI 侧与库侧的全部逻辑，其余语言文件均为配置、文档或脚本层面的辅助资产。

## 核心设计思路

**第一，库入口与 CLI 入口被刻意拆开，避免 import 产生副作用。** `src/index.ts` 的文件头明确写道：「库主入口文件 仅导出公共 API 和类型，不包含任何 CLI 副作用；CLI 可执行入口见 src/cli/main.ts（bin: dist/cli.js）」（`src/index.ts:1`）；对应的 `src/cli/main.ts` 也写明「CLI 可执行入口（bin 专用）仅负责启动命令行程序；库入口见 src/index.ts（不含任何 CLI 副作用，确保外部 `import { defineConfig } from '@scxfe/api-tool'` 不会触发命令解析）」（`src/cli/main.ts:1`）。这条约束保证配置文件里 import 工具包时不会意外执行命令解析。

**第二，客户端层被设计为可插拔适配器。** `src/clients/index.ts` 的模块说明是「客户端主模块 负责与不同类型的 API 服务器通信 支持插件化客户端架构」（`src/clients/index.ts:1`），其下再分 `base`（`src/clients/base/index.ts:1`，客户端基础模块导出）与 `implementations`（`src/clients/implementations/index.ts:1`，客户端实现模块导出）两层，具体平台实现包括 `src/clients/implementations/ApifoxClient.ts` 与 `src/clients/implementations/SwaggerClient.ts`。这与 README 中的「多平台支持」表述（`README.md#主要特性`）相互印证。

**第三，生成过程走「模板编译 → 代码格式化」的管道，且错误与命名被抽成独立子系统。** 模板系统模块自述「提供 Handlebars 模板编译、缓存、辅助函数和 partials 管理」（`src/generator/template/index.ts:1`），Zod 分支单独成层「统一导出 Zod Schema 相关的模板和生成函数」（`src/generator/template/zod/index.ts:1`），错误处理则「提供结构化的错误类型和解决方案建议」（`src/errors/index.ts:1`），命名「提供统一的命名策略和名称清理功能」（`src/naming/index.ts:1`）。从 handlebars 引入于 `src/generator/template/compiler.ts`、`src/generator/template/templateHelpers.ts`、`src/generator/template/templatePartials.ts`，而 prettier 引入于 `src/utils/formatter.ts` 来看，生成产物在模板渲染后还会经过一次格式化（**推断**，依据：上述两个 import 点分布在编译与格式化两个不同职责的模块中）。

**第四，中文名称的处理被显式纳入命名管线。** `pinyin-pro` 只在 `src/utils/path.ts` 被引入，说明路径/名称处理环节具备中文转写能力，与 README 宣称的「灵活配置: 支持自定义命名策略」（`README.md#主要特性`）以及 `src/naming/index.ts:1` 的命名清理定位方向一致。

## 技术栈

下表仅列出在源码或工程配置中被实际引入的技术，并给出引入位置作为使用证据。

| 技术       | 用途                                                                                                                                | 使用证据（引入位置）                                                                                                                                                                          |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| axios      | 从 API 平台拉取接口定义，并在生成的请求代码模板中使用                                                                               | `src/clients/implementations/ApifoxClient.ts`、`src/clients/implementations/SwaggerClient.ts`、`src/generator/template/requestFileGenerator.ts`、`src/generator/template/templatePartials.ts` |
| commander  | 定义 CLI 命令与参数                                                                                                                 | `src/cli/commands/debug.ts`、`src/cli/commands/generate.ts`、`src/cli/commands/init.ts`、`src/cli/commands/verify.ts`、`src/cli/commands/visualize.ts`                                        |
| consola    | 日志输出                                                                                                                            | `src/utils/logger.ts`、`src/generator/template/requestFileGenerator.ts`、`src/generator/template/templatePartials.ts`                                                                         |
| handlebars | 模板编译、缓存与 partials/helper 管理                                                                                               | `src/generator/template/compiler.ts`、`src/generator/template/templateHelpers.ts`、`src/generator/template/templatePartials.ts`                                                               |
| pinyin-pro | 中文转拼音，服务于命名/路径处理                                                                                                     | `src/utils/path.ts`                                                                                                                                                                           |
| prettier   | 生成代码的格式化                                                                                                                    | `src/utils/formatter.ts`                                                                                                                                                                      |
| tsdown     | 构建打包（构建配置中引入）                                                                                                          | `tsdown.config.ts`                                                                                                                                                                            |
| typescript | 在 `verify` 命令中直接引入编译器能力，用于校验生成结果（**推断**，依据：引入点位于 `src/cli/commands/verify.ts` 且命令名为 verify） | `src/cli/commands/verify.ts`                                                                                                                                                                  |
| vitest     | 测试运行（测试配置中引入）                                                                                                          | `vitest.config.ts`                                                                                                                                                                            |

**选型合理性分析：** 生成器类工具的复杂度集中在「模板的可维护性」与「产物的可读性」两端。项目选择 handlebars 而非字符串拼接，配合 `src/generator/template/index.ts:1` 所描述的「编译、缓存、辅助函数和 partials 管理」机制，使模板片段可复用、可缓存；再用 prettier（`src/utils/formatter.ts`）对渲染结果统一格式化，从而让机器生成的代码接近手写风格。数据源侧统一使用 axios（`src/clients/implementations/ApifoxClient.ts`、`SwaggerClient.ts`）则让不同平台的适配器共享同一套 HTTP 能力。

**运行形态相关的技术边界：** vitest 仅出现在 `vitest.config.ts` 中，属于测试专用工具；tsdown 出现在 `tsdown.config.ts` 中，属于构建期工具；`husky`、`oxlint`、`standard-version`、`tsx`、`vitepress` 通过 `package.json` 脚本方式调用（具体命令名未在数据中提供），属于工程链路工具而非运行时依赖。另有一批在 `package.json` 中声明、但在当前扫描到的源码中未见引用点的包，包括 `@clack/prompts`、`dayjs`、`@commitlint/cli`、`@commitlint/config-conventional`、`@types/node`、`@vitest/coverage-v8`、`lint-staged`、`prettier-config-ali`，其实际使用方式待确认。

## 项目结构

源码统一位于 `src` 目录，生产文件 111 个，测试文件 55 个；测试文件的具体目录未在数据中给出，因此本页只描述生产侧结构。

| 目录                          | 职责                                                                                  | 证据                                                                                                                                                                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/cli/`                    | 命令行层：可执行入口与各子命令（debug / generate / init / verify / visualize）        | `src/cli/main.ts:1`、`src/cli/commands/generate.ts` 等 commander 引入点                                                                                                                                                |
| `src/clients/`                | 数据源适配层，插件化组织；`base/` 为客户端基础导出，`implementations/` 为具体平台实现 | `src/clients/index.ts:1`、`src/clients/base/index.ts:1`、`src/clients/implementations/index.ts:1`、`src/clients/implementations/ApifoxClient.ts`、`src/clients/implementations/SwaggerClient.ts`                       |
| `src/config/`                 | 配置模块导出（配置文件解析与 `defineConfig` 所在层）                                  | `src/config/index.ts:1`                                                                                                                                                                                                |
| `src/errors/`                 | 统一的错误处理系统，提供结构化错误类型和解决方案建议                                  | `src/errors/index.ts:1`                                                                                                                                                                                                |
| `src/generator/`              | 代码生成主模块                                                                        | `src/generator/index.ts:1`                                                                                                                                                                                             |
| `src/generator/template/`     | Handlebars 模板编译、缓存、辅助函数与 partials 管理                                   | `src/generator/template/index.ts:1`、`src/generator/template/compiler.ts`、`src/generator/template/templateHelpers.ts`、`src/generator/template/templatePartials.ts`、`src/generator/template/requestFileGenerator.ts` |
| `src/generator/template/zod/` | Zod Schema 相关模板与生成函数的统一导出                                               | `src/generator/template/zod/index.ts:1`                                                                                                                                                                                |
| `src/naming/`                 | 命名策略与名称清理                                                                    | `src/naming/index.ts:1`                                                                                                                                                                                                |
| `src/schema/`                 | 模块导出入口（文件头未提供进一步描述）                                                | `src/schema/index.ts`                                                                                                                                                                                                  |
| `src/types/`                  | 模块导出入口（文件头未提供进一步描述）                                                | `src/types/index.ts`                                                                                                                                                                                                   |
| `src/validation/`             | 模块导出入口（文件头未提供进一步描述）                                                | `src/validation/index.ts`                                                                                                                                                                                              |
| `src/utils/`                  | 通用工具：日志封装、路径/名称处理、代码格式化                                         | `src/utils/logger.ts`、`src/utils/path.ts`、`src/utils/formatter.ts`                                                                                                                                                   |

目录间关系可以概括为一条自外向内的链路：`src/cli/` 负责命令编排 → `src/config/` 提供运行配置 → `src/clients/` 拉取并归一化各平台接口定义 → `src/schema/`、`src/validation/`、`src/naming/` 完成中间表示与命名决策 → `src/generator/`（含 `template/`、`template/zod/`）渲染代码 → `src/utils/` 提供全程共用的日志与格式化能力。仓库根目录另放置 `api-power.config.ts`、`tsdown.config.ts`、`vitest.config.ts` 等工程配置文件，以及 `scripts/analyze-deps.js` 辅助脚本。

## 入口文件

数据中登记的入口点共 14 个，分为「可执行入口」与「模块统一导出入口」两类。

| 入口                                   | 类型与职责                                                                     | 证据                                     |
| -------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------- |
| `src/cli/main.ts`                      | CLI 可执行入口（bin 专用），仅负责启动命令行程序；不含库导出语义               | `src/cli/main.ts:1`                      |
| `src/index.ts`                         | 库主入口，仅导出公共 API 和类型，不含任何 CLI 副作用（bin 指向 `dist/cli.js`） | `src/index.ts:1`                         |
| `src/clients/index.ts`                 | 客户端主模块，负责与不同类型的 API 服务器通信，支持插件化客户端架构            | `src/clients/index.ts:1`                 |
| `src/clients/base/index.ts`            | 客户端基础模块导出                                                             | `src/clients/base/index.ts:1`            |
| `src/clients/implementations/index.ts` | 客户端实现模块导出                                                             | `src/clients/implementations/index.ts:1` |
| `src/config/index.ts`                  | 配置模块导出                                                                   | `src/config/index.ts:1`                  |
| `src/errors/index.ts`                  | 统一错误处理系统的导出，提供结构化错误类型和解决方案建议                       | `src/errors/index.ts:1`                  |
| `src/generator/index.ts`               | 代码生成器主模块导出                                                           | `src/generator/index.ts:1`               |
| `src/generator/template/index.ts`      | 模板系统模块导出（编译、缓存、辅助函数、partials 管理）                        | `src/generator/template/index.ts:1`      |
| `src/generator/template/zod/index.ts`  | Zod Schema 模板系统导出                                                        | `src/generator/template/zod/index.ts:1`  |
| `src/naming/index.ts`                  | 命名策略模块导出，提供统一命名策略和名称清理功能                               | `src/naming/index.ts:1`                  |
| `src/schema/index.ts`                  | 子系统统一导出入口（文件头未提供描述）                                         | —                                        |
| `src/types/index.ts`                   | 子系统统一导出入口（文件头未提供描述）                                         | —                                        |
| `src/validation/index.ts`              | 子系统统一导出入口（文件头未提供描述）                                         | —                                        |

启动流程上，二进制的实际入口是 `src/cli/main.ts`（注释明确其为 bin 专用入口），由它加载 `src/cli/commands/` 下的各子命令；而库使用者的入口是 `src/index.ts`，两者的副作用边界被刻意隔离（`src/index.ts:1`、`src/cli/main.ts:1`）。

## 核心组件

下表按被调用次数（扇入）降序列出项目中复用最广的十个符号。扇入高意味着它们处在多条调用链的公共路径上，是理解项目骨架的捷径。

| 符号                    | 类型     | 被调用次数（扇入） | 设计角色                                                                              |
| ----------------------- | -------- | ------------------ | ------------------------------------------------------------------------------------- |
| `debug`                 | function | 26                 | 调试级别日志，覆盖最广，说明生成流程中大量分支需要可观测性                            |
| `error`                 | function | 18                 | 错误级别日志，与结构化错误系统（`src/errors/index.ts:1`）配套                         |
| 符号                    | 类型     | 被调用次数（扇入） | 设计角色                                                                              |
| ---                     | ---      | ---                | ---                                                                                   |
| `error`                 | function | 18                 | 错误级别日志，与结构化错误系统（`src/errors/index.ts:1`）配套，用于失败路径上报       |
| `compileTemplate`       | function | 16                 | 模板编译核心，是 Handlebars 模板层（`src/generator/template/index.ts:1`）暴露的主能力 |
| `info`                  | function | 15                 | 常规进度日志，供生成流程向用户回报阶段结果                                            |
| `sanitizeTypeName`      | function | 15                 | 类型名清理，服务于命名模块（`src/naming/index.ts:1`）提供的名称清理能力               |
| `createValidationError` | function | 13                 | 结构化校验错误构造，把校验失败统一成可携带解决方案建议的错误对象                      |
| `success`               | function | 12                 | 成功级别日志，与 `error` 成对使用，构成命令执行结果的反馈闭环                         |
| `escapeJsDocComment`    | function | 12                 | JSDoc 注释转义，防止接口描述中的字符破坏生成代码的注释结构                            |
| `warn`                  | function | 11                 | 警告级别日志，用于可继续执行但需提示的场景                                            |
| `sanitizePropertyName`  | function | 10                 | 属性名清理，与 `sanitizeTypeName` 同属命名清理族，区分「类型」与「属性」两类命名对象  |

把这十个符号放在一起看，项目的骨架由三组能力支撑：**可观测性**（`debug`/`error`/`info`/`success`/`warn`，由 `src/utils/logger.ts` 统一封装）贯穿全部命令与生成阶段；**模板渲染**（`compileTemplate`）与**产物安全**（`escapeJsDocComment`）共同保证生成代码的语法与注释合法；**命名规范化**（`sanitizeTypeName`/`sanitizePropertyName`）与**结构化报错**（`createValidationError`）则分别处理「接口定义里的名字不能直接当标识符」和「失败必须给出可操作的解决方案」这两类工程现实问题。它们的扇入普遍在 10 以上，说明这些并非某个子系统的私有工具，而是被 CLI、客户端、生成器多处共享的横切能力——这也是 `src/naming/`、`src/errors/`、`src/utils/` 独立成模块的直接原因。

### 日志符号与命令/生成模块的调用关系

| 调用方（模块） | 被调用方（符号）                                                  | 证据锚点                                                                                                                                               |
| -------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 日志封装层     | `debug` / `info` / `warn` / `error` / `success`                   | `src/utils/logger.ts`（consola 引入点）                                                                                                                |
| CLI 命令层     | `debug`、`error` 等日志符号                                       | `src/cli/commands/generate.ts`、`src/cli/commands/debug.ts`、`src/cli/commands/init.ts`、`src/cli/commands/verify.ts`、`src/cli/commands/visualize.ts` |
| 模板渲染层     | `compileTemplate`                                                 | `src/generator/template/compiler.ts`、`src/generator/template/templateHelpers.ts`、`src/generator/template/templatePartials.ts`                        |
| 请求文件生成   | `compileTemplate`、日志符号                                       | `src/generator/template/requestFileGenerator.ts`                                                                                                       |
| 校验环节       | `createValidationError`                                           | `src/validation/index.ts`、`src/errors/index.ts`                                                                                                       |
| 命名处理       | `sanitizeTypeName` / `sanitizePropertyName`、`escapeJsDocComment` | `src/naming/index.ts`、`src/utils/path.ts`                                                                                                             |

> 说明：上表按模块职责归并展示调用方向与证据位置；具体到每个函数调用的精确行号未在数据中提供，故以对应模块文件为锚点。

## 数据流概览

按模块职责归并，一次完整的代码生成大致经过下列阶段。各阶段的承担者是数据中真实存在的目录/文件，未在数据中出现的中间步骤不予列出。

| 阶段             | 输入                                       | 承担者                                                                                                                                                                     | 输出                                                           |
| ---------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 1. 命令解析      | 命令行参数                                 | `src/cli/main.ts` + `src/cli/commands/*`（commander 引入点：`src/cli/commands/generate.ts` 等）                                                                            | 待执行的子命令（init / generate / debug / verify / visualize） |
| 2. 配置加载      | 配置文件 `api-power.config.ts` / `.js`     | `src/config/index.ts`                                                                                                                                                      | 多服务配置（`services` 数组 + 公共配置）                       |
| 3. 数据源拉取    | Swagger/OpenAPI 3.0、Apifox 导出的接口定义 | `src/clients/implementations/SwaggerClient.ts`、`src/clients/implementations/ApifoxClient.ts`（axios）                                                                     | 平台无关的接口定义对象                                         |
| 4. Schema 与校验 | 接口定义对象                               | `src/schema/index.ts`、`src/validation/index.ts`                                                                                                                           | 归一化后的 schema（校验失败经 `createValidationError` 上报）   |
| 5. 命名决策      | schema 中的类型名/属性名/路径              | `src/naming/index.ts`、`src/utils/path.ts`（pinyin-pro）                                                                                                                   | 合法标识符、处理后的路径（含 `{param}` 插值）                  |
| 6. 模板渲染      | 命名结果 + 模板与 partials                 | `src/generator/template/index.ts`、`compiler.ts`、`templateHelpers.ts`、`templatePartials.ts`、`requestFileGenerator.ts`；Zod 分支走 `src/generator/template/zod/index.ts` | 未格式化的代码文本                                             |
| 7. 格式化与落盘  | 渲染结果                                   | `src/utils/formatter.ts`（prettier）                                                                                                                                       | 写入输出目录的最终文件                                         |

阶段 4 与阶段 5 的先后关系（是先校验再命名，还是命名后校验）在数据中未给出显式调用边，待确认。同样，钩子系统与 Watch 模式（`README.md#主要特性`）在数据中只出现在 README 描述里，未在扫描到的源码文件中找到对应的实现锚点，其具体介入上面流程的哪一阶段待确认。

## 使用方式

项目同时提供 CLI 与库两种入口（`src/index.ts:1`、`src/cli/main.ts:1`），README 给出的基本用法为三步：初始化配置、编辑配置文件、执行生成（`README.md#全局安装（推荐）` 及 README 快速开始小节）。

| 步骤 | 命令                                               | 依赖产物                                            |
| ---- | -------------------------------------------------- | --------------------------------------------------- |
| 1    | `npx api-power init`                               | `src/cli/commands/init.ts`                          |
| 2    | 编辑 `api-power.config.ts` / `api-power.config.js` | `src/config/index.ts`、根目录 `api-power.config.ts` |
| 3    | `npx api-power`                                    | `src/cli/commands/generate.ts`                      |

除上述三个命令外，CLI 还注册了 `debug`、`verify`、`visualize` 三个子命令（依据 commander 的引入点 `src/cli/commands/debug.ts`、`src/cli/commands/verify.ts`、`src/cli/commands/visualize.ts`）。其中 `verify` 直接引入了 typescript（`src/cli/commands/verify.ts`），`visualize` 从命名看面向结构可视化（**推断**，依据：命令名与文件位置，数据中未提供该命令的实现细节）。

配置形态方面，README 说明 `defineConfig` 采用多服务配置：所有服务共享公共配置（如 `typesFormat`、`baseOutputDir`、`namingStrategy`），每个服务在 `services` 数组中声明自己的数据源和输出位置，返回值为配置数组，单源即数组长度为 1（`README.md` 配置示例小节）。类型生成支持 `typesFormat: 'zod'` 与 TypeScript 两种模式，前者对应 `src/generator/template/zod/index.ts` 的模板分支。

> 注意：README 中列出的文档链接（如 `./docs/getting-started/index.md`、`./docs/guides/cli.md`、`./docs/guides/configuration.md`、`./docs/guides/advanced.md`、`./docs/guides/examples.md`）在本次数据中未作为文档文件被收录（`docsFiles` 为空），因此本页不展开其内容；文档体系的实际规模待确认。

## 工程配套

仓库根目录的工程配置体现了完整的提交期与构建期链路：

| 配置/脚本      | 作用                      | 证据                                                                                                           |
| -------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 构建           | 打包产出 bin 与库入口     | `tsdown.config.ts`（tsdown 引入点）                                                                            |
| 测试           | 单元测试运行              | `vitest.config.ts`（vitest 引入点）                                                                            |
| Lint           | 代码检查                  | `.oxlintrc.json`、`oxlint`（`package.json` 脚本）                                                              |
| 版本与变更日志 | 版本发布与 CHANGELOG 生成 | `.versionrc.json`、`standard-version`（`package.json` 脚本）、`cliff.toml`（变更日志生成配置）、`CHANGELOG.md` |
| 提交钩子       | 提交前自动化              | `husky`（`package.json` 脚本）                                                                                 |
| 工作区         | 多包管理                  | `pnpm-workspace.yaml`、`pnpm-lock.yaml`                                                                        |
| 依赖分析       | 辅助脚本                  | `scripts/analyze-deps.js`                                                                                      |
| 协作约定       | 开发者/智能体协作说明     | `AGENTS.md`                                                                                                    |

测试规模方面，仓库共有测试文件 55 个，生产文件 111 个（占比约 1:2），与 `vitest.config.ts` 的存在相印证，说明该项目对生成逻辑的回归验证有持续投入。

## 延伸阅读

本仓库根目录层面的可读文档（按数据中实际存在的文件列出）：

- `README.md` — 项目定位、主要特性、安装与配置示例
- `AGENTS.md` — 仓库协作约定
- `CHANGELOG.md` — 版本变更记录
- `package.json` — 包名 `@scxfe/api-tool`、对外描述与脚本入口

## 待确认

1. **`README.md` 中列出的 `docs/` 系列文档**（getting-started、guides/cli、guides/configuration、guides/advanced、guides/examples）未出现在本次扫描的文档文件清单中，其是否存在及其内容规模无法核实。
2. **钩子系统与 Watch 模式**在 README 中被列为主要特性（`README.md#主要特性`），但未在扫描到的源码文件中定位到实现锚点，其所在模块与介入阶段不明。
3. **`src/schema/index.ts`、`src/types/index.ts`、`src/validation/index.ts`** 三个入口的文件头未提供模块说明，其具体边界与在数据流中的确切位置仅能从目录名推断。
4. **`@clack/prompts`、`dayjs`、`@commitlint/cli`、`@commitlint/config-conventional`、`@types/node`、`@vitest/coverage-v8`、`lint-staged`、`prettier-config-ali`** 在 `package.json` 中声明，但在当前扫描范围内未见源码引用点，其真实使用方式是配置声明、脚本间接调用还是待清理残留，需以实际工程配置为准。
5. **`husky`、`oxlint`、`standard-version`、`tsx`、`vitepress`** 通过包脚本方式调用，数据中未给出具体命令名，故本页只说明其属于工程链路工具，不展开命令细节。

## Related

- 同目录：[tech-stack.md](tech-stack.md) · [environment.md](environment.md)
- 互补职责：[tech-stack.md](../01-overview/tech-stack.md)
- 共享 5 个源文件、共享 57 个符号：[onboarding.md](../05-guides/onboarding.md)
- 共享 3 个源文件、共享 21 个符号：[modules.md](../02-architecture/modules.md)
- 共享 1 个源文件、共享 23 个符号：[troubleshooting.md](../05-guides/troubleshooting.md)
- 总入口：[README](../README.md)

<!-- wiki:source: llm -->

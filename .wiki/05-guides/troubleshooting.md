# 故障排除

<details>
<summary>Relevant source files</summary>

- src/cli/commands/debug.ts
- src/cli/commands/verify.ts
- src/cli/main.ts
- src/config/loader.ts
- src/generator/codegen.ts
- src/generator/fileGenerator.ts
- src/generator/index.ts
- src/generator/template/compiler.ts
- src/generator/template/index.ts
- src/generator/template/requestFileGenerator.ts
- src/generator/template/templateHelpers.ts
- src/generator/template/templatePartials.ts
- src/naming/index.ts
- src/processors/openapi.ts
- src/utils/config.ts

</details>

> 本页职责：汇总该项目在环境准备、构建打包、运行时执行三个阶段的典型故障，给出基于源码锚点的原因分析与可操作的解决方案。所有锚点均来自生产源码、配置或提交记录；测试文件不作为功能依据。

## 一、环境问题

### 1.1 Node.js 版本不满足要求

**问题描述**  
执行 `pnpm dev`、`pnpm build` 或 `pnpm test` 时出现语法错误、模块加载失败或 CLI 启动崩溃。

**原因分析**  
项目声明要求 Node.js `>=22.12.0`（锚点：`nodeVersion`）。低于该版本可能不支持项目使用的 ES 语法或工具链特性。

**解决方案**  
使用版本管理器切换到 22.12.0 或更高：

```bash
# 使用 fnm
fnm install 22.12.0
fnm use 22.12.0

# 或使用 nvm
nvm install 22.12.0
nvm use 22.12.0
```

验证：`node -v` 应输出 `v22.12.0` 以上。

### 1.2 包管理器不一致导致依赖安装失败

**问题描述**  
使用 `npm install` 或 `yarn install` 后，`pnpm dev` 报模块找不到，或锁文件冲突。

**原因分析**  
项目声明包管理器为 `pnpm`（锚点：`packageManager`）。混用其他包管理器会生成不同的依赖树，且 `prepare` 脚本可能不会正确执行。

**解决方案**  
统一使用 pnpm：

```bash
corepack enable
corepack prepare pnpm@latest --activate
pnpm install
```

若已有 `node_modules`，先清理再安装：

```bash
rm -rf node_modules
pnpm install
```

### 1.3 `DEBUG` 环境变量未生效导致日志不足

**问题描述**  
运行 CLI 时看不到详细日志，难以定位生成失败的原因。

**原因分析**  
日志工具在 `src/utils/logger.ts` 中引用 `DEBUG` 环境变量，且该文件导入了 `consola`（锚点：`src/utils/logger.ts`；依赖使用证据：`consola` 导入于 `src/utils/logger.ts`）。

**解决方案**  
显式设置 `DEBUG` 后再运行：

```bash
DEBUG=* pnpm dev
```

也可以只对特定命名空间开启（具体命名空间以 `src/utils/logger.ts` 中的实现为准，数据未展开命名空间细节）。

### 1.4 `NODE_ENV` 未设置导致构建行为异常

**问题描述**  
直接运行 `tsdown` 而不通过 `pnpm build`，产物与预期不符。

**原因分析**  
构建脚本 `build` 定义为 `NODE_ENV=production tsdown`（锚点：`scripts.build`），且 `NODE_ENV` 在 `tsdown.config.ts` 中被引用（锚点：`tsdown.config.ts`）。该配置文件导入了 `tsdown`（依赖使用证据：`tsdown` 导入于 `tsdown.config.ts`）。

**解决方案**  
始终使用项目提供的构建命令：

```bash
pnpm build
```

若需手动调试构建，显式传入环境变量：

```bash
NODE_ENV=production pnpm exec tsdown
```

### 1.5 husky 未安装导致 Git 钩子缺失

**问题描述**  
提交代码时没有触发提交信息校验或 lint-staged 检查。

**原因分析**  
`prepare` 脚本定义为 `husky`（锚点：`scripts.prepare`），用于安装 Git 钩子。若安装依赖时使用了 `--ignore-scripts`，该步骤会被跳过。

**解决方案**  
手动执行：

```bash
pnpm install
pnpm run prepare
```

## 二、构建问题

### 2.1 tsdown 构建失败

**问题描述**  
执行 `pnpm build` 时报错退出，常见于模块格式、外部依赖或配置解析阶段。

**原因分析**  
构建命令为 `NODE_ENV=production tsdown`（锚点：`scripts.build`）。`tsdown` 在 `tsdown.config.ts` 中被导入并配置（锚点：`tsdown.config.ts`）。若配置中引用了不存在的入口、外部依赖声明不完整或输出格式与目标环境冲突，会导致失败。

**解决方案**

1. 确认 Node 版本满足 `>=22.12.0`（见 1.1）。
2. 检查 `tsdown.config.ts` 中的入口与输出配置（数据未展开具体配置项，可对照该文件逐项核对）。
3. 清理后重试：

```bash
rm -rf dist .tsdown
pnpm build
```

4. 若报 ESM/CJS 互操作错误，需检查 `tsdown.config.ts` 中的输出格式设置（该细节数据未提供，见「待确认」）。

### 2.2 TypeScript 类型校验相关失败

**问题描述**  
CLI 的 `verify` 命令或生成过程报类型错误。

**原因分析**  
`typescript` 在 `src/cli/commands/verify.ts` 中被导入（依赖使用证据：`typescript` 导入于 `src/cli/commands/verify.ts`），说明该命令使用 TypeScript API 进行程序化校验。若生成的类型代码不符合 TypeScript 规则，会在此阶段暴露。

**解决方案**

1. 通过 CLI 入口 `src/cli/main.ts` 调用 `verify` 子命令（具体参数未在数据中提供，可运行 `pnpm dev --help` 查看）。
2. 若需独立检查项目源码类型，可运行：

```bash
pnpm exec tsc --noEmit
```

（注意：项目未提供 `typecheck`（待确认） 脚本，此命令依赖已安装的 `typescript`，其使用证据见 `src/cli/commands/verify.ts`。）

### 2.3 文档站点构建失败

**问题描述**  
执行 `pnpm run docs:build` 时报错。

**原因分析**  
`docs:build` 定义为 `vitepress build`（锚点：`scripts.docs:build`），`docs:dev` 为 `vitepress dev`（锚点：`scripts.docs:dev`），`docs:preview` 为 `vitepress preview`（锚点：`scripts.docs:preview`）。`vitepress` 以脚本方式使用（依赖使用证据：`vitepress` 使用于 `scripts` 命令）。失败通常源于文档源码中的 Markdown 语法或引用路径错误。

**解决方案**

1. 先用开发模式验证内容再构建：

```bash
pnpm run docs:dev
```

2. 修复报错后再构建：

```bash
pnpm run docs:build
```

3. 本地预览产物：

```bash
pnpm run docs:preview
```

### 2.4 代码行长超限相关告警

**问题描述**  
CI 或本地检查报出超长文件清单，提示若干文件行数超过阈值。

**原因分析**  
脚本 `check:linesize` 按条件过滤（`find src -name '*.ts' ... | awk '$1 > 360 ...'`），即对 `src` 下超过 360 行的 `.ts` 文件予以提示（锚点：`scripts.check:linesize`）。这是项目约定的文件规模边界。

**解决方案**  
运行下述命令获取清单：

```bash
pnpm run check:linesize
```

对列出的文件进行拆分重构。注意 `src/generator/fileGenerator.ts`（30 次提交，锚点：commit:db7ac47c (2026-10-09)）、`src/generator/codegen.ts`（20 次提交，锚点：commit:db7ac47c (2026-10-09)）均为高频变更文件，重构时需格外谨慎。

### 2.5 Lint 失败

**问题描述**  
`pnpm run lint` 或 `pnpm run ci:lint` 报错。

**原因分析**  
`lint` 定义为 `oxlint .`（锚点：`scripts.lint`），CI 版本输出 JSON 到 `./.ci/oxlint.json`（锚点：`scripts.ci:lint`）。`oxlint` 以脚本方式使用（依赖使用证据：`oxlint` 使用于 `scripts` 命令）。

**解决方案**  
自动修复（同时会先跑 prettier）：

```bash
pnpm run lint:fix
```

CI 场景复现：

```bash
pnpm run ci:lint
```

`lint:fix` 定义中先执行 `prettier --write .` 再执行 `oxlint --fix .`（锚点：`scripts.lint:fix`），因此格式化与 lint 修复一次性完成。

## 三、运行时问题

### 3.1 请求超时配置触界

**问题描述**  
生成的请求层在实际调用接口时抛出超时错误；或生成模板中对超时时间的处理与预期不一致。

**原因分析**  
请求文件生成器中的 `TIMEOUT` 常量取值为 `${formatTimeout(config.requestTimeout ?? 5 * 1000)}`（锚点：`src/generator/template/requestFileGenerator.ts:170`），即默认 5000 毫秒，且可由 `config.requestTimeout` 覆盖。该超时能力与 `requestTimeout` 配置、`customizeAxios` 扩展点相关，且 `src/utils/config.ts` 为高频变更文件（24 次提交，锚点：commit:d461f38a (2026-10-11)）。

**触界典型症状**

- 未显式配置 `requestTimeout` 时，慢接口在约 5 秒后失败；
- 配置了 `config.requestTimeout` 但生成结果未反映，因该值在生成期被固化进模板（锚点：`src/generator/template/requestFileGenerator.ts:170`），需重新生成。

**解决方案**

1. 在项目配置中显式设置 `requestTimeout`（字段名见 `src/utils/config.ts`，该文件为此配置的高频变更点，锚点：commit:d461f38a (2026-10-11)）。
2. 修改配置后重新生成请求层（`pnpm dev` 触发生成，锚点：`scripts.dev`）。
3. 若有更复杂的请求定制需求，可使用 `customizeAxios` 扩展点（锚点：commit:d461f38a (2026-10-11) 提交信息提及该扩展点）。

### 3.2 敏感信息脱敏未达阈值

**问题描述**  
日志或输出中包含短 token 未被脱敏，或长 token 被误脱敏。

**原因分析**  
`MIN_TOKEN_LENGTH` 常量为 `8`（锚点：`src/utils/redact.ts:10`），即长度小于 8 的字符串不会被当作 token 处理。

**触界典型症状**

- 长度恰好为 7 或更短的疑似密钥出现在输出中而不被处理；
- 长度 ≥ 8 的普通标识串被当作 token 处理，产生不必要的脱敏结果。

**解决方案**  
对照 `src/utils/redact.ts:10` 的判定逻辑检查输入长度。若需调整阈值，应同步评估所有调用点（具体调用点数据未提供，见「待确认」）。

### 3.3 Schema 深度超过上限

**问题描述**  
处理深层嵌套的 OpenAPI 或 JSON Schema 时，代码生成中断或抛出深度错误。

**原因分析**  
`MAX_SCHEMA_DEPTH` 常量为 `20`（锚点：`src/utils/schemaSafety.ts:12`），是防止无限递归与循环引用的安全边界。`src/processors/openapi.ts` 为高频变更文件（18 次提交，锚点：commit:4465253d (2026-08-24)，提交信息为「拆解循环依赖并加固 watch 模式与多服务失败隔离」），说明该处曾针对循环引用做过专门加固。

**触界典型症状**

- 嵌套层级超过 20 的 Schema 生成失败或抛出安全性异常；
- 含循环引用的 Schema 因触达深度上限而被截断。

**解决方案**

1. 检查源 OpenAPI 文档是否存在超过 20 层的嵌套结构或环形引用。
2. 若确为合法深层结构，需评估放宽 `src/utils/schemaSafety.ts:12` 的上限（同时承担递归风险）。
3. 若为循环引用，应优先在源文档中通过 `$ref` 消解（具体处理逻辑见 `src/processors/openapi.ts`）。

### 3.4 debug 命令输出被截断

**问题描述**  
使用 `debug` 子命令查看信息时，只显示有限条目。

**原因分析**  
`SUMMARY_LIMIT` 常量为 `5`（锚点：`src/cli/commands/debug.ts:17`），即摘要输出的条目上限。

**触界典型症状**

- 仅显示前若干条，其余条目不可见，容易被误判为「数据缺失」而非「展示截断」。

**解决方案**  
对照 `src/cli/commands/debug.ts:17` 确认这是展示层截断。如需完整信息，应直接检查生成的产物文件（产物目录见 2.1 的构建配置说明）。

### 3.5 依赖模块解析失败

**问题描述**  
运行时抛出 `Cannot find module` 或类似错误。

**原因分析**  
项目运行时依赖均由源码显式导入，可能的触发点如下表：

| 依赖       | 使用方式 | 锚点（导入文件 / 脚本）                                                                                                                                                               |
| ---------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| axios      | 源码导入 | src/clients/implementations/ApifoxClient.ts、src/clients/implementations/SwaggerClient.ts、src/generator/template/requestFileGenerator.ts、src/generator/template/templatePartials.ts |
| commander  | 源码导入 | src/cli/commands/debug.ts、src/cli/commands/generate.ts、src/cli/commands/init.ts、src/cli/commands/verify.ts、src/cli/commands/visualize.ts                                          |
| consola    | 源码导入 | src/generator/template/requestFileGenerator.ts、src/generator/template/templatePartials.ts、src/utils/logger.ts                                                                       |
| handlebars | 源码导入 | src/generator/template/compiler.ts、src/generator/template/templateHelpers.ts、src/generator/template/templatePartials.ts                                                             |
| pinyin-pro | 源码导入 | src/utils/path.ts                                                                                                                                                                     |
| prettier   | 源码导入 | src/utils/formatter.ts                                                                                                                                                                |
| typescript | 源码导入 | src/cli/commands/verify.ts                                                                                                                                                            |
| tsdown     | 配置导入 | tsdown.config.ts                                                                                                                                                                      |
| vitest     | 配置导入 | vitest.config.ts                                                                                                                                                                      |

**解决方案**  
确认依赖已正确安装：

```bash
pnpm install
```

若仅单文件报错，按上表定位对应的导入文件，核对其导入路径与包名是否一致。

### 3.6 代码格式化阶段失败

**问题描述**  
生成流程在格式化产物时中断。

**原因分析**  
`prettier` 在 `src/utils/formatter.ts` 中被导入（依赖使用证据：`prettier` 导入于 `src/utils/formatter.ts`），说明生成器在输出前会调用 prettier 对代码进行格式化。

**解决方案**

1. 检查被格式化的代码片段是否为合法语法（非法语法会让格式化抛错）。
2. 确认 `prettier` 相关配置可用（数据未声明具体配置来源，见「待确认」）。
3. 定位报错位置：从入口 `src/cli/main.ts` 开始，经由 `src/generator/index.ts` 到 `src/utils/formatter.ts` 逐层排查。

### 3.7 路径生成中含中文字符异常

**问题描述**  
生成的文件路径出现乱码或不符合预期。

**原因分析**  
`pinyin-pro` 在 `src/utils/path.ts` 中被导入（依赖使用证据：`pinyin-pro` 导入于 `src/utils/path.ts`），用于将中文转换为拼音以构造安全的文件路径。

**解决方案**

1. 检查源数据中的中文标识符是否包含多音字或特殊字符。
2. 核对 `src/utils/path.ts` 中的转换逻辑与预期命名规则的匹配程度。
3. 命名相关能力由 `src/naming/index.ts` 汇集（锚点：`entryFiles` 中的 `src/naming/index.ts`）。

### 3.8 模板编译失败

**问题描述**  
生成过程中报模板语法错误或 helper 未定义。

**原因分析**  
模板编译逻辑位于 `src/generator/template/compiler.ts`，helper 位于 `src/generator/template/templateHelpers.ts`，partials 位于 `src/generator/template/templatePartials.ts`（依赖使用证据：`handlebars` 导入于这三个文件）。三处均依赖 `handlebars`。

**解决方案**

1. 报「helper 未定义」时核对 `src/generator/template/templateHelpers.ts` 中已注册的 helper 名称。
2. 报「partial 未找到」时核对 `src/generator/template/templatePartials.ts` 中已注册的 partial 名称。
3. 上述文件的入口聚合文件为 `src/generator/template/index.ts`（锚点：`entryFiles`），可由此处追踪注册顺序。

### 3.9 多服务生成时的失败隔离

**问题描述**  
多服务场景下，某一个服务生成失败会连带影响其他服务。

**原因分析**  
提交 `4465253d`（2026-08-24）的变更动因明确为「拆解循环依赖并加固 watch 模式与多服务失败隔离」，涉及 `src/processors/openapi.ts` 与 `src/config/loader.ts`（锚点：commit:4465253d (2026-08-24)）。这两个文件均为高频变更区域，意味着隔离逻辑被反复调整，是已知的故障高发地带。

**解决方案**

1. 复现时分别使用多服务配置与单服务配置，定位是否由隔离逻辑引起。
2. 排查 `src/config/loader.ts` 的加载顺序（该文件 17 次提交，锚点：commit:4465253d (2026-08-24)）。
3. 排查 `src/processors/openapi.ts` 的处理管道（该文件 18 次提交，锚点：commit:4465253d (2026-08-24)）。

### 3.10 watch 模式下的循环依赖

**问题描述**  
watch 模式下出现重复生成、死循环或内存增长。

**原因分析**  
提交 `4465253d`（2026-08-24）专门针对循环依赖与 watch 模式做过加固（锚点：commit:4465253d (2026-08-24)）。若生成产物被 watch 目录覆盖，可能引发反复触发。

**解决方案**

1. 确认输出目录未被 watch 包含。
2. 检查 `src/config/loader.ts` 的配置解析是否因文件变动而被反复触发（锚点：commit:4465253d (2026-08-24)）。

## 四、调试技巧

### 4.1 从入口文件开始定位

排障起点为 CLI 入口 `src/cli/main.ts`（锚点：`entryFiles`）。子命令分别位于：

| 子命令    | 文件                          |
| --------- | ----------------------------- |
| debug     | src/cli/commands/debug.ts     |
| generate  | src/cli/commands/generate.ts  |
| init      | src/cli/commands/init.ts      |
| verify    | src/cli/commands/verify.ts    |
| visualize | src/cli/commands/visualize.ts |

调用链：`src/cli/main.ts` → 各命令文件（均依赖 `commander`，依赖使用证据：`commander` 导入于上述五个命令文件）。

### 4.2 常用调试命令

```bash
# 开发模式直接运行生成流程（带配置）
pnpm dev

# 单次测试运行
pnpm test

# 监听模式跑测试（改动即时反馈）
pnpm run test:watch

# 覆盖率
pnpm run test:coverage
```

`dev` 脚本定义即为 `tsx src/cli/main.ts generate --config api-power.config.ts`（锚点：`scripts.dev`），其中 `tsx` 以脚本方式使用（依赖使用证据：`tsx` 使用于 `scripts` 命令）。

### 4.3 单文件测试调试

`vitest` 在 `vitest.config.ts` 中被导入（依赖使用证据：`vitest` 导入于 `vitest.config.ts`），因此测试配置集中在该文件。针对单个测试文件调试：

```bash
pnpm exec vitest run <测试文件路径>
```

覆盖率工具为 `@vitest/coverage-v8`（用于 `test:coverage` 脚本，锚点：`scripts.test:coverage`）。

### 4.4 查看日志

日志统一由 `src/utils/logger.ts` 输出（该文件导入 `consola`，并读取 `DEBUG` 环境变量，锚点：`src/utils/logger.ts`）。开启详细日志：

```bash
DEBUG=* pnpm dev
```

### 4.5 依赖使用关系速查（用于定位缺失依赖问题）

| 依赖             | 使用类型 | 证据锚点                                                   |
| ---------------- | -------- | ---------------------------------------------------------- |
| husky            | 脚本     | scripts.prepare                                            |
| oxlint           | 脚本     | scripts.lint、scripts.ci:lint                              |
| standard-version | 脚本     | scripts.versioning                                         |
| tsx              | 脚本     | scripts.dev                                                |
| vitepress        | 脚本     | scripts.docs:build、scripts.docs:dev、scripts.docs:preview |

上表所列依赖均为脚本驱动，排查时应优先检查对应脚本是否被正确执行（见 1.5）。

### 4.6 定位高频故障文件

以下文件为提交最密集区域，是历史故障聚集处，排障时优先检查：

| 文件                           | 提交次数 | 最近提交                     |
| ------------------------------ | -------- | ---------------------------- |
| src/generator/fileGenerator.ts | 30       | commit:db7ac47c (2026-10-09) |
| src/utils/config.ts            | 24       | commit:d461f38a (2026-10-11) |
| src/generator/codegen.ts       | 20       | commit:db7ac47c (2026-10-09) |
| src/processors/openapi.ts      | 18       | commit:4465253d (2026-08-24) |
| src/config/loader.ts           | 17       | commit:4465253d (2026-08-24) |

其中 `src/generator/fileGenerator.ts` 与 `src/generator/codegen.ts` 的最近变更均为「新增 react-query v5 风格的 Hooks 代码生成」（锚点：commit:db7ac47c (2026-10-09)），若刚升级到含该特性的版本，应优先排查这两处。`src/utils/config.ts` 的最近变更为「支持文件上传的请求层增强，新增 requestTimeout 配置与 customizeAxios 扩展点」（锚点：commit:d461f38a (2026-10-11)），与 3.1 的超时问题直接相关。

### 4.7 依赖分析

```bash
pnpm run analyze:deps
```

该脚本执行 `node scripts/analyze-deps.js`（锚点：`scripts.analyze:deps`），可用于排查依赖使用与循环关系。

## 待确认

- **ESM/CJS 输出格式细节**：数据未提供 `tsdown.config.ts` 的输出格式配置项，无法给出具体的格式冲突排查步骤。（缺 `tsdown.config.ts` 内容）
- **`prettier` 配置来源**：数据仅表明 `prettier` 在 `src/utils/formatter.ts` 中被使用，未说明格式化规则配置文件的路径。（缺格式化配置文件锚点）
- **`DEBUG` 命名空间**：`DEBUG` 变量在 `src/utils/logger.ts` 中被读取，但数据未展开其取值格式与可用命名空间。（缺 `src/utils/logger.ts` 内部实现）
- **`create-cli` 子命令参数**：`verify`、`visualize`、`init` 等子命令的具体参数未在数据中列出，排障时需以 `--help` 输出为准。（缺各命令文件的参数定义）

## Related

- 同目录：[onboarding.md](onboarding.md) · [testing.md](testing.md)
- 共享 6 个源文件、共享 25 个符号：[tech-stack.md](../01-overview/tech-stack.md)
- 共享 1 个源文件、共享 28 个符号：[environment.md](../01-overview/environment.md)
- 共享 1 个源文件、共享 23 个符号：[overview.md](../01-overview/overview.md)
- 总入口：[README](../README.md)

<!-- wiki:source: llm -->

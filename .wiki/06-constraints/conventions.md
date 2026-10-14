# 项目规约

<details>
<summary>Relevant source files</summary>

- .oxlintrc.json
- AGENTS.md
- src/generator/template/compiler.ts

</details>

本页汇总本仓库的工程规约，覆盖工具链配置、代理（AI）协作约定与命名/结构约定，供新成员与编码助手按同一套标准工作。

---

## 一、工具链规约

### 1.1 配置总览

| 检查项           | 状态   | 配置文件                          | 关键信息                                                                     |
| ---------------- | ------ | --------------------------------- | ---------------------------------------------------------------------------- |
| 代码检查（Lint） | 已启用 | `.oxlintrc.json`                  | 使用 OxLint，规则类别为 correctness + suspicious（`AGENTS.md#格式化`）       |
| 编辑器基础约定   | 已启用 | EditorConfig 配置文件             | 缩进 2 空格、LF 换行、UTF-8、单引号、最大行长 100（原文见 1.2）              |
| 代码格式化       | 已约定 | 由 `prettier-config-ali` 标准约束 | 采用 Ali 配置标准，通过 `pnpm run lint:fix` 自动格式化（`AGENTS.md#格式化`） |
| 提交前钩子       | 已启用 | Husky + lint-staged               | 提交前自动执行检查（`AGENTS.md#环境要求`）                                   |

分工口径：**格式**交给 prettier-config-ali，**代码问题检查**交给 OxLint；两者不互相替代，改完代码后统一走 `pnpm run lint:fix`。

### 1.2 EditorConfig 原文

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
indent_size = 2
indent_style = space
insert_final_newline = true
max_line_length = 100
quote_type = single
trim_trailing_whitespace = true
```

### 1.3 EditorConfig 逐项含义

| 配置项                               | 值       | 对代码的约束                                              |
| ------------------------------------ | -------- | --------------------------------------------------------- |
| `root`                               | `true`   | 本文件为配置树的根，不再向上级目录查找配置                |
| `charset`                            | `utf-8`  | 源文件统一 UTF-8 编码                                     |
| `end_of_line`（待确认）              | `lf`     | 换行符统一 LF，与 `AGENTS.md#格式化` 中「换行符：LF」一致 |
| `indent_size`（待确认）              | `2`      | 缩进宽度 2 个空格                                         |
| `indent_style`（待确认）             | `space`  | 使用空格缩进，禁用制表符                                  |
| `insert_final_newline`（待确认）     | `true`   | 文件末尾必须保留一个空行                                  |
| `max_line_length`（待确认）          | `100`    | 单行最长 100 字符                                         |
| `quote_type`（待确认）               | `single` | 字符串统一使用单引号                                      |
| `trim_trailing_whitespace`（待确认） | `true`   | 自动去除行尾空白                                          |

---

## 二、AI 协作规约（AGENTS.md 提炼）

### 2.1 命令与验证基线

| 目的                             | 命令                                  | 锚点                 |
| -------------------------------- | ------------------------------------- | -------------------- |
| 安装依赖并构建项目               | `pnpm install && pnpm run build`      | `AGENTS.md#构建命令` |
| 格式化并修复代码                 | `pnpm run lint:fix`                   | `AGENTS.md#构建命令` |
| 开发模式（使用配置文件生成代码） | `pnpm run dev`                        | `AGENTS.md#构建命令` |
| 按指定配置生成代码               | `npx api-power generate --config xxx` | `AGENTS.md#构建命令` |
| 运行单元测试                     | `pnpm test`                           | `AGENTS.md#构建命令` |
| 监听模式运行测试                 | `pnpm test:watch`                     | `AGENTS.md#构建命令` |
| 运行测试并生成覆盖率报告         | `pnpm test:coverage`                  | `AGENTS.md#构建命令` |

测试相关约束：

- 测试框架为 **Vitest**（`AGENTS.md#构建命令`）。
- 测试文件位于各模块的 `__tests__/` 目录下（`AGENTS.md#构建命令`）。
- 共享夹具位于 `tests/fixtures/mockData.ts`（`AGENTS.md#构建命令`）。
- **修改代码后必须运行 `pnpm test` 确保全部测试通过**（`AGENTS.md#构建命令`）。

### 2.2 硬性禁止项

| 序号 | 规约内容                                                                                                                                            | 锚点                     |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| 1    | 禁止执行 `git commit`、`git push` 等提交操作，提交由用户自行完成                                                                                    | `AGENTS.md#规则`         |
| 2    | 删除文件前必须告知用户并取得同意，不得未经确认删除任何文件                                                                                          | `AGENTS.md#规则`         |
| 3    | spec/plan 文件只能放在 `superpowers/spec/` 和 `superpowers/plan/`；这两个目录已在 `.gitignore` 中，禁止删除 `superpowers/` 条目，禁止放到其他文件夹 | `AGENTS.md#规则`         |
| 4    | 禁止使用 `delete` 关键字                                                                                                                            | `AGENTS.md#代码生成约束` |
| 5    | 禁止使用 `eval` 语法                                                                                                                                | `AGENTS.md#代码生成约束` |
| 6    | 禁止过度使用闭包                                                                                                                                    | `AGENTS.md#代码生成约束` |

### 2.3 工作流约定

| 阶段            | 要求                                                             | 锚点                 |
| --------------- | ---------------------------------------------------------------- | -------------------- |
| 任务开始前      | 必须阅读 `.wiki/` 中的项目概述与文档结构，了解整体架构与设计原则 | `AGENTS.md#规则`     |
| 编码中          | 遵循项目编码规范与提交规范，保证代码质量与一致性                 | `AGENTS.md#规则`     |
| 修改/新增功能时 | 必须同步更新相关文档，保持文档与代码一致                         | `AGENTS.md#规则`     |
| 生成代码时      | 遵循项目的代码生成模式与文件结构                                 | `AGENTS.md#规则`     |
| 改完代码后      | 运行 `pnpm test` 保证测试通过                                    | `AGENTS.md#构建命令` |

### 2.4 导入顺序

约定顺序（`AGENTS.md#导入顺序`）：

1. 外部库/包导入
2. 内部模块导入（使用 `@` 别名）
3. 类型导入（使用 `import type`）

```typescript
import consola from 'consola';
import { ServerType } from '@/types';
import type { ApiConfig } from '@/types';
```

路径别名：`@/*` 映射到 `./src/*`（`AGENTS.md#类型定义`）。

### 2.5 类型定义约定

| 约定项     | 内容                                              | 锚点                 |
| ---------- | ------------------------------------------------- | -------------------- |
| 严格模式   | TypeScript 严格模式启用（`noImplicitAny: false`） | `AGENTS.md#类型定义` |
| 对象类型   | 使用 `interface` 定义                             | `AGENTS.md#类型定义` |
| 常量集合   | 使用 `enum` 定义                                  | `AGENTS.md#类型定义` |
| 纯类型导出 | 优先使用 `export type`                            | `AGENTS.md#类型定义` |
| 路径别名   | `@/*` → `./src/*`                                 | `AGENTS.md#类型定义` |

### 2.6 错误处理约定

使用自定义错误系统（`src/errors/`，`AGENTS.md#错误处理`）：

| 文件              | 职责                                                     | 锚点                 |
| ----------------- | -------------------------------------------------------- | -------------------- |
| `errorCodes.ts`   | 错误代码枚举（`E1xxx` 配置、`E2xxx` 网络、`E3xxx` 生成） | `AGENTS.md#错误处理` |
| `errorFactory.ts` | 工厂方法创建结构化错误                                   | `AGENTS.md#错误处理` |
| `index.ts`        | 统一导出模块                                             | `AGENTS.md#错误处理` |

```typescript
try {
  // 业务逻辑
} catch (error: any) {
  if (error.code && error.code.startsWith('E2')) throw error;
  throw ErrorFactory.fetchFailed(url, statusCode, error);
}
```

要点：已是网络类错误（`E2` 前缀）直接向上抛出，其余错误经错误工厂转换为结构化错误（`AGENTS.md#错误处理`）。

### 2.7 注释规范

采用 JSDoc 风格，文件头使用中文描述（`AGENTS.md#注释规范`）：

| 要求   | 说明                                                         |
| ------ | ------------------------------------------------------------ |
| 文件头 | 每个文件必须有 `@description` 文件头注释（中文）             |
| 函数   | 每个函数必须有 `@description` 注释                           |
| 参数   | 有参数的函数必须有 `@param` 注释                             |
| 返回值 | 有返回值的函数必须有 `@returns` 注释                         |
| 示例   | 核心函数（命名策略、类型清理、生成器等）需要 `@example` 标签 |

````typescript
/**
 * @description 从 Apifox 平台获取 OpenAPI 数据
 * @param config API 配置对象
 * @returns Promise<ApiData> API 数据
 *
 * @example
 * ```typescript
 * const data = await fetchApifoxData({ source: '...', token: '...' });
 * console.log(data);
 * ```
 */
export async function fetchApifoxData(config: ApiConfig): Promise<any> {
  // ...
}
````

### 2.8 日志输出约定

统一使用 `@/utils/logger`（基于 consola 封装，`AGENTS.md#日志输出`）：

| 方法                                                              | 输出时机                                                        |
| ----------------------------------------------------------------- | --------------------------------------------------------------- |
| `logger.info` / `logger.success` / `logger.warn` / `logger.error` | 始终输出                                                        |
| `logger.debug`                                                    | 仅在 `setDebugEnabled(true)` 之后输出（`debug` 命令会自动启用） |

```typescript
import { logger } from '@/utils/logger';

logger.info('处理开始');
logger.debug('调试信息:', data);
```

明确禁止：**不要使用 `if (process.env.DEBUG)` 手动守卫** debug 日志——该模块内部已通过运行时开关控制，`debug` 命令会调用 `setDebugEnabled(true)` 激活（`AGENTS.md#日志输出`）。

### 2.9 代码生成与环境约束

| 约束         | 内容                                                           | 锚点                     |
| ------------ | -------------------------------------------------------------- | ------------------------ |
| 文件行数     | 所有源代码文件保持在 360 行以下                                | `AGENTS.md#代码生成约束` |
| 行数例外     | `src/generator/template/compiler.ts`（主要包含模板字符串）     | `AGENTS.md#代码生成约束` |
| 生成目录     | `src/service/` 目录包含生成的文件                              | `AGENTS.md#代码生成约束` |
| 生成文件改动 | 不要在未获得许可的情况下修改生成的文件                         | `AGENTS.md#代码生成约束` |
| Node.js      | >= 22.18.0（开发工具链要求；发布产物 `engines` 为 >= 22.12.0） | `AGENTS.md#环境要求`     |
| 包管理器     | pnpm                                                           | `AGENTS.md#环境要求`     |
| 构建输出     | `dist/`（由 tsdown 构建）                                      | `AGENTS.md#环境要求`     |
| 提交钩子     | Husky + lint-staged 用于提交前钩子                             | `AGENTS.md#环境要求`     |

### 2.10 核心配置约定（多服务模型）

`defineConfig` 采用**多服务（microservice）配置**：顶层为所有服务共享的公共配置，`services: ServiceConfig[]` 声明每个服务独立的数据源与输出位置；`defineConfig` 返回 `ApiConfig[]`（单源即数组长度 1）。关键变化为破坏式、不向后兼容（`AGENTS.md#核心配置`）：

| 项       | 约定                                                                                                                                                                                                     |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 顶层输出 | 顶层 `outputDir` → `baseOutputDir`（公共根输出目录）                                                                                                                                                     |
| 数据源   | `source` / `token` 下沉到 `services[]` 每个服务级；必填 `name`，可选 `folder`（默认取 `name`，可多段如 `'trade/order'`）                                                                                 |
| 输出位置 | 共享 `request.ts` 位于 `baseOutputDir` 层级（未显式配置时默认路径为 `join(baseOutputDir, 'request.<ext>')`）；各服务输出至 `join(baseOutputDir, folder ?? name)`                                         |
| 请求实例 | 服务级可声明 `requestMode: 'isolated'` 获得独立 request 文件（默认在服务输出目录内）与 `axios.create` 私有实例；`requestBaseURL` 仅 isolated 模式生效，鉴权/响应解包经各文件 `customizeAxios` 扩展点实现 |
| 校验     | `name` 唯一、各服务计算后的 `outputDir` 不相同/不嵌套，否则抛 `E1002`                                                                                                                                    |
| 单源场景 | 使用 `services: [{ name: 'main', folder: '.', source, token }]`，输出直接落在 `baseOutputDir`                                                                                                            |

`typesFormat` 控制类型生成格式，影响文件结构与导入路径（`AGENTS.md#typesFormat 配置`）：

| 取值         | 生成内容                              |
| ------------ | ------------------------------------- |
| `typescript` | TypeScript 类型定义（编译时类型检查） |
| `zod`        | Zod Schema（运行时验证 + 类型推导）   |

```typescript
export default defineConfig({
  baseOutputDir: 'src/service',
  typesFormat: 'zod', // 或 'typescript'
  services: [{ name: 'main', folder: '.', source: 'YOUR_API_SOURCE', token: 'YOUR_TOKEN' }],
});
```

`target: 'javascript'` 时的行为（`AGENTS.md#target 配置`）：

- 所有输出文件扩展名变为 `.js`（通过 `getFileExtension()` 辅助函数）；
- 不论 `typesFormat` 取何值，均不生成 TS 类型与 Zod 内容；
- `requestFunctionFilePath` 默认值自动从 `.ts` 调整为 `.js`。

---

## 三、命名与结构规约

以下内容仅来自 `AGENTS.md` 与工具链配置可确定的部分。

### 3.1 命名约定

| 类型      | 约定                    | 示例                                               | 锚点                 |
| --------- | ----------------------- | -------------------------------------------------- | -------------------- |
| 文件      | camelCase 或 kebab-case | `apifox.ts`、`openapi.ts`、`interfaceGenerator.ts` | `AGENTS.md#命名约定` |
| 函数      | camelCase               | `fetchData`、`processOpenApiData`                  | `AGENTS.md#命名约定` |
| 类        | PascalCase              | `SimpleProgress`、`BaseError`                      | `AGENTS.md#命名约定` |
| 常量/工厂 | PascalCase              | `ErrorFactory`、`PRESETS`                          | `AGENTS.md#命名约定` |
| 接口/类型 | PascalCase              | `ApiConfig`、`ProcessedApiData`                    | `AGENTS.md#命名约定` |

### 3.2 目录组织原则

| 目录          | 命名方式             | 示例                              | 锚点                 |
| ------------- | -------------------- | --------------------------------- | -------------------- |
| `generators/` | `{type}Generator.ts` | `interfaceGenerator.ts`           | `AGENTS.md#命名约定` |
| `naming/`     | 按职责命名           | `strategy.ts`、`sanitizer.ts`     | `AGENTS.md#命名约定` |
| `template/`   | 按功能命名           | `compiler.ts`、`templateCache.ts` | `AGENTS.md#命名约定` |

### 3.3 结构与格式硬约束汇总

| 约束           | 值                                                   | 来源                                      |
| -------------- | ---------------------------------------------------- | ----------------------------------------- |
| 源文件最大行数 | 360 行（例外：`src/generator/template/compiler.ts`） | `AGENTS.md#代码生成约束`                  |
| 最大行长       | 100                                                  | EditorConfig 配置文件                     |
| 缩进           | 2 空格                                               | EditorConfig 配置文件                     |
| 换行符         | LF                                                   | EditorConfig 配置文件、`AGENTS.md#格式化` |
| 引号           | 单引号                                               | EditorConfig 配置文件                     |
| 文件编码       | UTF-8                                                | EditorConfig 配置文件                     |
| 文件末尾       | 保留空行，去除行尾空白                               | EditorConfig 配置文件                     |
| 导入分层       | 外部库 → 内部 `@` 模块 → `import type`               | `AGENTS.md#导入顺序`                      |
| 类型导出       | 纯类型优先 `export type`                             | `AGENTS.md#类型定义`                      |

---

## 四、待确认

| 项                                      | 缺失证据                                                                   |
| --------------------------------------- | -------------------------------------------------------------------------- |
| EditorConfig 配置文件的具体路径与文件名 | 数据仅提供了配置原文，未给出对应文件路径，无法直接指向文件定位             |
| `.oxlintrc.json` 的具体规则条目         | 数据仅给出配置文件名与规则类别（correctness + suspicious），未提供规则明细 |
| 「提交规范」的落地文件                  | `AGENTS.md#规则` 要求遵循提交规范，但未提供对应的规范文件或规则清单        |

## Related

- 同目录：[constraints.md](constraints.md)
- 共享 2 个源文件、共享 12 个符号：[overview.md](../01-overview/overview.md)
- 共享 9 个符号：[chapter:config-validation/multi-service-resolution.md](../09-chapters/config-validation/multi-service-resolution.md)
- 共享 7 个符号：[architecture.md](../02-architecture/architecture.md)
- 总入口：[README](../README.md)

<!-- wiki:source: llm -->

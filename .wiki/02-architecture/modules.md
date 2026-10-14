# 模块

<details>
<summary>Relevant source files</summary>

- src/cli/commands/debug.ts
- src/cli/commands/generate.ts
- src/cli/commands/init.ts
- src/cli/commands/verify.ts
- src/cli/commands/visualize.ts
- src/cli/constants.ts
- src/cli/main.ts
- src/cli/program.ts
- src/clients/base/BaseClient.ts
- src/clients/base/index.ts
- src/clients/base/registry.ts
- src/clients/implementations/ApifoxClient.ts
- src/clients/implementations/index.ts
- src/clients/implementations/SwaggerClient.ts
- src/clients/index.ts

</details>

## generator

文件数：37

语言：ts × 37

关键导出：`compileTemplate`（src/generator/template/compiler.ts:34）, `collectRefTypeNames`（src/generator/template/zod/recursive.ts:62）, `buildCommonImports`（src/generator/generators/hookGenerator.ts:187）, `buildRequestBinding`（src/generator/requestBinding.ts:141）, `buildOptionsArgument`（src/generator/template/adapters/ahooksAdapter.ts:28）

依赖：`utils`, `naming`, `schema`, `processors`

扇入/扇出：0 / 0

### 设计依据（意图证据）

| 证据                                                                                                                                                                                                                                                  | 类型       | 目标                                              | 锚点                                                |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------- | --------------------------------------------------- |
| @description Zod 类型模板模块 处理 Zod 类型的模板生成 /                                                                                                                                                                                               | 文件头自述 | src/generator/template/zod/types.ts               | src/generator/template/zod/types.ts:1               |
| @description 模板字符串定义 提供所有 Handlebars 模板的纯字符串定义 /                                                                                                                                                                                  | 文件头自述 | src/generator/template/templateDefinitions.ts     | src/generator/template/templateDefinitions.ts:1     |
| @description 数据提取模块 从 OpenAPI 操作中提取响应和路径参数；请求参数提取已下沉至 requestParameters.ts（含 body/query/path 分组与 @ParameterObject 展开）， 此处 re-export 以保持既有 `from '../extractor'` 的导入兼容性。 /                        | 文件头自述 | src/generator/extractor.ts                        | src/generator/extractor.ts:1                        |
| @description 模板编译器 提供 Handlebars 模板编译和缓存功能 /                                                                                                                                                                                          | 文件头自述 | src/generator/template/compiler.ts                | src/generator/template/compiler.ts:1                |
| @description 代码生成器主模块 /                                                                                                                                                                                                                       | 文件头自述 | src/generator/index.ts                            | src/generator/index.ts:1                            |
| @description Hook 模板字符串定义 提供 react-query v5 / swr v2 / ahooks v3（vue-query v5 复用 react-query 模板）的 query / mutation Hook Handlebars 模板 类型注解、请求函数表达式等差异通过模板数据（预渲染字符串 + 三花括号）注入，避免模板分支爆炸 / | 文件头自述 | src/generator/template/hookTemplateDefinitions.ts | src/generator/template/hookTemplateDefinitions.ts:1 |

### 文件结构

| 文件                                                   | 关键符号                                                                        |
| ------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `src/generator/template/compiler.ts`                   | `compileTemplate`（src/generator/template/compiler.ts:34）                      |
| `src/generator/template/zod/recursive.ts`              | `collectRefTypeNames`（src/generator/template/zod/recursive.ts:62）             |
| `src/generator/generators/hookGenerator.ts`            | `buildCommonImports`（src/generator/generators/hookGenerator.ts:187）           |
| `src/generator/requestBinding.ts`                      | `buildRequestBinding`（src/generator/requestBinding.ts:141）                    |
| `src/generator/template/adapters/ahooksAdapter.ts`     | `buildOptionsArgument`（src/generator/template/adapters/ahooksAdapter.ts:28）   |
| `src/generator/template/adapters/swrAdapter.ts`        | `buildKeyItems`（src/generator/template/adapters/swrAdapter.ts:22）             |
| `src/generator/template/adapters/reactQueryAdapter.ts` | `buildQueryKeyItems`（src/generator/template/adapters/reactQueryAdapter.ts:24） |
| `src/generator/template/adapters/vueQueryAdapter.ts`   | `buildQueryKeyItems`（src/generator/template/adapters/vueQueryAdapter.ts:25）   |
| `src/generator/template/formDataBody.ts`               | `buildAppendBranchLines`（src/generator/template/formDataBody.ts:22）           |
| `src/generator/template/zod/compose.ts`                | `composeObject`（src/generator/template/zod/compose.ts:61）                     |
| `src/generator/codegen.ts`                             | 未检出已索引符号                                                                |
| `src/generator/extractor.ts`                           | 未检出已索引符号                                                                |

## utils

文件数：16

语言：ts × 16

关键导出：`cleanOutputDir`（src/utils/file.ts:96）, `completeCurrentStep`（src/utils/progress.ts:41）, `buildParamAccess`（src/utils/escape.ts:97）, `begin`（src/utils/schemaSafety.ts:54）, `HookManager`（src/utils/hooks.ts:12）

被依赖：`generator`, `validation`, `clients`, `processors`

扇入/扇出：0 / 0

### 设计依据（意图证据）

| 证据                                                                                                                                                                                                                                                                                                                                                | 类型       | 目标                | 锚点                  |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------- | --------------------- |
| @description 配置工具模块 提供配置解析、验证和预设应用功能 /                                                                                                                                                                                                                                                                                        | 文件头自述 | src/utils/config.ts | src/utils/config.ts:1 |
| @description 统一日志模块 基于 consola 封装，提供运行时 debug 开关，消除全项目的 if(process.env.DEBUG) 手动守卫 设计要点：consola 在模块导入时根据 process.env.DEBUG 固化日志级别， 但 CLI 的 debug 命令在 action 中才设置该变量，导致 consola 内置级别检测失效。 本模块通过运行时布尔开关解决该时序问题，debug 命令调用 setDebugEnabled(true) 即可 | 文件头自述 | src/utils/logger.ts | src/utils/logger.ts:1 |
| @description 文件操作工具函数 /                                                                                                                                                                                                                                                                                                                     | 文件头自述 | src/utils/file.ts   | src/utils/file.ts:1   |
| @description 代码注入防护工具 对进入生成代码的远端自由文本进行转义，防止： - JSDoc 注释逃逸（注释闭合序列闭合注释后注入可执行代码） - 字符串字面量逃逸（单引号/反斜杠破坏字符串边界后注入代码） - 模板字符串逃逸（反引号/${} 破坏模板字符串边界后注入代码） /                                                                                       | 文件头自述 | src/utils/escape.ts | src/utils/escape.ts:1 |
| @description 钩子管理器 提供钩子函数的执行和错误处理 /                                                                                                                                                                                                                                                                                              | 文件头自述 | src/utils/hooks.ts  | src/utils/hooks.ts:1  |
| @description 路径转换工具 提供中文到拼音转换、路径生成等功能 /                                                                                                                                                                                                                                                                                      | 文件头自述 | src/utils/path.ts   | src/utils/path.ts:1   |

### 文件结构

| 文件                        | 关键符号                                                                                                                                        |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/utils/file.ts`         | `cleanOutputDir`（src/utils/file.ts:96）                                                                                                        |
| `src/utils/progress.ts`     | `completeCurrentStep`（src/utils/progress.ts:41）, `complete`（src/utils/progress.ts:72）, `SimpleProgressManager`（src/utils/progress.ts:184） |
| `src/utils/escape.ts`       | `buildParamAccess`（src/utils/escape.ts:97）                                                                                                    |
| `src/utils/schemaSafety.ts` | `begin`（src/utils/schemaSafety.ts:54）                                                                                                         |
| `src/utils/hooks.ts`        | `HookManager`（src/utils/hooks.ts:12）                                                                                                          |
| `src/utils/config.ts`       | `assertValidMethod`（src/utils/config.ts:69）                                                                                                   |
| `src/utils/pathSafety.ts`   | `assertWithinCwd`（src/utils/pathSafety.ts:45）                                                                                                 |
| `src/utils/pathUtils.ts`    | `aliasToRealPath`（src/utils/pathUtils.ts:58）                                                                                                  |
| `src/utils/concurrency.ts`  | 未检出已索引符号                                                                                                                                |
| `src/utils/decorators.ts`   | 未检出已索引符号                                                                                                                                |
| `src/utils/formatter.ts`    | 未检出已索引符号                                                                                                                                |
| `src/utils/logger.ts`       | 未检出已索引符号                                                                                                                                |

## clients

文件数：7

语言：ts × 7

关键导出：`autoSelectClient`（src/clients/base/registry.ts:84）, `clear`（src/clients/base/registry.ts:154）

依赖：`errors`, `utils`

扇入/扇出：0 / 0

### 设计依据（意图证据）

| 证据                                                                             | 类型       | 目标                                         | 锚点                                           |
| -------------------------------------------------------------------------------- | ---------- | -------------------------------------------- | ---------------------------------------------- |
| @description 客户端主模块 负责与不同类型的 API 服务器通信 支持插件化客户端架构 / | 文件头自述 | src/clients/index.ts                         | src/clients/index.ts:1                         |
| @description Apifox 客户端实现 /                                                 | 文件头自述 | src/clients/implementations/ApifoxClient.ts  | src/clients/implementations/ApifoxClient.ts:1  |
| @description Swagger/OpenAPI 客户端实现 /                                        | 文件头自述 | src/clients/implementations/SwaggerClient.ts | src/clients/implementations/SwaggerClient.ts:1 |
| @description 客户端注册器 管理所有 API 客户端的注册和查找 /                      | 文件头自述 | src/clients/base/registry.ts                 | src/clients/base/registry.ts:1                 |
| @description 客户端抽象基类 为所有 API 客户端提供统一的接口和通用功能 /          | 文件头自述 | src/clients/base/BaseClient.ts               | src/clients/base/BaseClient.ts:1               |
| @description 客户端基础模块导出 /                                                | 文件头自述 | src/clients/base/index.ts                    | src/clients/base/index.ts:1                    |

### 文件结构

| 文件                                           | 关键符号                                                                                           |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `src/clients/base/registry.ts`                 | `autoSelectClient`（src/clients/base/registry.ts:84）, `clear`（src/clients/base/registry.ts:154） |
| `src/clients/base/BaseClient.ts`               | 未检出已索引符号                                                                                   |
| `src/clients/base/index.ts`                    | 未检出已索引符号                                                                                   |
| `src/clients/implementations/ApifoxClient.ts`  | 未检出已索引符号                                                                                   |
| `src/clients/implementations/SwaggerClient.ts` | 未检出已索引符号                                                                                   |
| `src/clients/implementations/index.ts`         | 未检出已索引符号                                                                                   |
| `src/clients/index.ts`                         | 未检出已索引符号                                                                                   |

## types

文件数：6

语言：ts × 6

扇入/扇出：0 / 0

### 设计依据（意图证据）

| 证据                             | 类型       | 目标                | 锚点                  |
| -------------------------------- | ---------- | ------------------- | --------------------- |
| @description: 配置相关类型定义 / | 文件头自述 | src/types/config.ts | src/types/config.ts:1 |
| @description 类型定义统一导出 /  | 文件头自述 | src/types/index.ts  | src/types/index.ts:1  |
| @description 钩子函数类型定义 /  | 文件头自述 | src/types/hooks.ts  | src/types/hooks.ts:1  |
| @description API 相关类型定义 /  | 文件头自述 | src/types/api.ts    | src/types/api.ts:1    |
| @description 枚举类型定义 /      | 文件头自述 | src/types/enums.ts  | src/types/enums.ts:1  |
| @description 输出相关类型定义 /  | 文件头自述 | src/types/output.ts | src/types/output.ts:1 |

### 文件结构

| 文件                  | 关键符号         |
| --------------------- | ---------------- |
| `src/types/api.ts`    | 未检出已索引符号 |
| `src/types/config.ts` | 未检出已索引符号 |
| `src/types/enums.ts`  | 未检出已索引符号 |
| `src/types/hooks.ts`  | 未检出已索引符号 |
| `src/types/index.ts`  | 未检出已索引符号 |
| `src/types/output.ts` | 未检出已索引符号 |

## validation

文件数：7

语言：ts × 7

关键导出：`computeOutputDir`（src/validation/validators/serviceDirs.ts:27）

依赖：`utils`

扇入/扇出：0 / 0

### 设计依据（意图证据）

| 证据                                                               | 类型       | 目标                               | 锚点                                 |
| ------------------------------------------------------------------ | ---------- | ---------------------------------- | ------------------------------------ |
| @description 基础类型验证器 验证配置中各个字段的基本类型和值 /     | 文件头自述 | src/validation/validators/basic.ts | src/validation/validators/basic.ts:1 |
| @description 验证错误类型定义 定义验证过程中使用的错误类型和接口 / | 文件头自述 | src/validation/errors.ts           | src/validation/errors.ts:1           |
| @description 配置验证系统入口 统一管理和调用所有验证规则 /         | 文件头自述 | src/validation/index.ts            | src/validation/index.ts:1            |
| @description URL 相关验证器 验证配置中 URL 字段的有效性 /          | 文件头自述 | src/validation/validators/url.ts   | src/validation/validators/url.ts:1   |
| @description 逻辑关系验证器 验证配置项之间的逻辑关系和一致性 /     | 文件头自述 | src/validation/validators/logic.ts | src/validation/validators/logic.ts:1 |
| @description 验证结果报告器 负责格式化并输出验证报告 /             | 文件头自述 | src/validation/reporter.ts         | src/validation/reporter.ts:1         |

### 文件结构

| 文件                                       | 关键符号                                                          |
| ------------------------------------------ | ----------------------------------------------------------------- |
| `src/validation/validators/serviceDirs.ts` | `computeOutputDir`（src/validation/validators/serviceDirs.ts:27） |
| `src/validation/errors.ts`                 | 未检出已索引符号                                                  |
| `src/validation/index.ts`                  | 未检出已索引符号                                                  |
| `src/validation/reporter.ts`               | 未检出已索引符号                                                  |
| `src/validation/validators/basic.ts`       | 未检出已索引符号                                                  |
| `src/validation/validators/logic.ts`       | 未检出已索引符号                                                  |
| `src/validation/validators/url.ts`         | 未检出已索引符号                                                  |

## errors

文件数：4

语言：ts × 4

关键导出：`constructor`（src/errors/errorClasses.ts:60）, `configInvalid`（src/errors/errorFactory.ts:51）, `configMissingRequired`（src/errors/errorFactory.ts:102）, `configNotFound`（src/errors/errorFactory.ts:19）, `configParseError`（src/errors/errorFactory.ts:70）

被依赖：`clients`, `config`

扇入/扇出：0 / 0

### 设计依据（意图证据）

| 证据                                                                 | 类型       | 目标                     | 锚点                         |
| -------------------------------------------------------------------- | ---------- | ------------------------ | ---------------------------- |
| @description 统一的错误处理系统 提供结构化的错误类型和解决方案建议 / | 文件头自述 | src/errors/index.ts      | src/errors/index.ts:1        |
| @description 错误代码枚举 定义项目中所有错误类型的唯一标识 /         | 文件头自述 | src/errors/errorCodes.ts | src/errors/errorCodes.ts:1   |
| 首次提交：feat: 统一错误处理                                         | 提交记录   | errors                   | commit:6f6dea17 (2026-01-07) |
| 高频提交主题：重构代码结构，拆分大文件并优化模块组织（×2）           | 高频主题   | errors                   | commit:f8e9f197 (2026-07-20) |

### 文件结构

| 文件                         | 关键符号                                                                                                                                                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/errors/errorClasses.ts` | `constructor`（src/errors/errorClasses.ts:60）, `constructor`（src/errors/errorClasses.ts:151）, `constructor`（src/errors/errorClasses.ts:179）, `constructor`（src/errors/errorClasses.ts:207）                   |
| `src/errors/errorFactory.ts` | `configInvalid`（src/errors/errorFactory.ts:51）, `configMissingRequired`（src/errors/errorFactory.ts:102）, `configNotFound`（src/errors/errorFactory.ts:19）, `configParseError`（src/errors/errorFactory.ts:70） |
| `src/errors/errorCodes.ts`   | 未检出已索引符号                                                                                                                                                                                                    |
| `src/errors/index.ts`        | 未检出已索引符号                                                                                                                                                                                                    |

## config

文件数：2

语言：ts × 2

关键导出：`clear`（src/config/loader.ts:75）, `ConfigCacheManager`（src/config/loader.ts:26）, `clearConfigCache`（src/config/loader.ts:230）

依赖：`errors`

扇入/扇出：0 / 0

### 设计依据（意图证据）

| 证据                                                 | 类型       | 目标                 | 锚点                         |
| ---------------------------------------------------- | ---------- | -------------------- | ---------------------------- |
| @description 配置文件加载器 支持配置缓存以提高性能 / | 文件头自述 | src/config/loader.ts | src/config/loader.ts:1       |
| @description 配置模块导出 /                          | 文件头自述 | src/config/index.ts  | src/config/index.ts:1        |
| 首次提交：refactor: 重组项目结构和代码架构           | 提交记录   | config               | commit:4388e7de (2025-09-29) |

### 文件结构

| 文件                   | 关键符号                                                                                                                            |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `src/config/loader.ts` | `clear`（src/config/loader.ts:75）, `ConfigCacheManager`（src/config/loader.ts:26）, `clearConfigCache`（src/config/loader.ts:230） |
| `src/config/index.ts`  | 未检出已索引符号                                                                                                                    |

## naming

文件数：3

语言：ts × 3

被依赖：`generator`

扇入/扇出：0 / 0

### 设计依据（意图证据）

| 证据                                                                                                    | 类型       | 目标                    | 锚点                         |
| ------------------------------------------------------------------------------------------------------- | ---------- | ----------------------- | ---------------------------- |
| @description 命名策略模块 提供灵活的命名策略接口和默认实现 用于统一管理接口、函数、类型名称的生成逻辑 / | 文件头自述 | src/naming/strategy.ts  | src/naming/strategy.ts:1     |
| @description 名称清理模块 提供标识符名称清理和规范化功能 确保生成的代码符合 TypeScript 标识符命名规则 / | 文件头自述 | src/naming/sanitizer.ts | src/naming/sanitizer.ts:1    |
| @description 命名策略模块 提供统一的命名策略和名称清理功能 /                                            | 文件头自述 | src/naming/index.ts     | src/naming/index.ts:1        |
| 首次提交：refactor: 重构客户端架构并拆分生成器模块                                                      | 提交记录   | naming                  | commit:f9369dc3 (2026-06-22) |
| 高频提交主题：重构客户端架构并拆分生成器模块（×2）                                                      | 高频主题   | naming                  | commit:db7ac47c (2026-10-09) |

### 文件结构

| 文件                      | 关键符号         |
| ------------------------- | ---------------- |
| `src/naming/index.ts`     | 未检出已索引符号 |
| `src/naming/sanitizer.ts` | 未检出已索引符号 |
| `src/naming/strategy.ts`  | 未检出已索引符号 |

## schema

文件数：3

语言：ts × 3

被依赖：`generator`, `processors`

扇入/扇出：0 / 0

### 设计依据（意图证据）

| 证据                                                                                                                                                                                                                                                                                                          | 类型       | 目标                    | 锚点                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------- | ---------------------------- |
| @description OpenAPI 操作内容（content）提取工具 从单个 OpenApiOperation 中按 content-type 优先级提取请求体/响应的 schema 及内容类型信息。纯函数、无副作用。 本模块属于中立层（src/schema/）：processors 与 generator 共用， 避免 processors → generator 的反向依赖。 /                                       | 文件头自述 | src/schema/operation.ts | src/schema/operation.ts:1    |
| @description Schema 中立层 提供与生成无关的 OpenAPI schema 分析/提取工具，供 processors 与 generator 共用， 避免两包相互依赖形成环。 /                                                                                                                                                                        | 文件头自述 | src/schema/index.ts     | src/schema/index.ts:1        |
| @description 自由格式对象（free-form）检测与 JsonValue 类型定义 Java Jackson 的动态类型（JsonNode / ObjectNode / ArrayNode 等）在 springdoc-openapi 导出时，因结构运行时才能确定，会产出 free-form schema（如 `{ type: 'object' }` 或 `{ additionalProperties: true }`）。本模块负责识别这类 schema，并为其生 | 文件头自述 | src/schema/freeForm.ts  | src/schema/freeForm.ts:1     |
| 首次提交：refactor: 拆解循环依赖并加固 watch 模式与多服务失败隔离                                                                                                                                                                                                                                             | 提交记录   | schema                  | commit:4465253d (2026-08-24) |

### 文件结构

| 文件                      | 关键符号         |
| ------------------------- | ---------------- |
| `src/schema/freeForm.ts`  | 未检出已索引符号 |
| `src/schema/index.ts`     | 未检出已索引符号 |
| `src/schema/operation.ts` | 未检出已索引符号 |

## processors

文件数：2

语言：ts × 2

关键导出：`collectSchemasFromPaths`（src/processors/openapi.ts:111）, `collectUsedTypesFromProperties`（src/processors/common.ts:72）, `containsFreeFormProperty`（src/processors/openapi.ts:68）, `applyTransformPath`（src/processors/openapi.ts:40）

依赖：`schema`, `utils`

被依赖：`generator`

扇入/扇出：0 / 0

### 设计依据（意图证据）

| 证据                                                                                                                                                             | 类型       | 目标                      | 锚点                         |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------- | ---------------------------- |
| @description OpenAPI 数据处理模块 处理 OpenAPI 格式的数据，提取接口、类型和类别信息 /                                                                            | 文件头自述 | src/processors/openapi.ts | src/processors/openapi.ts:1  |
| @description 公共处理模块 提供数据处理相关的公共函数 /                                                                                                           | 文件头自述 | src/processors/common.ts  | src/processors/common.ts:1   |
| 首次提交：refactor: 重组项目结构和代码架构                                                                                                                       | 提交记录   | processors                | commit:4388e7de (2025-09-29) |
| 高频提交主题：修复 pathprefix 正则注入、远端数据 dos、代码注入与路径遍历等安全问题（×2）、处理any类型（×2）、拆解循环依赖并加固 watch 模式与多服务失败隔离（×2） | 高频主题   | processors                | commit:cf83c605 (2026-09-02) |

### 文件结构

| 文件                        | 关键符号                                                                                                                                                                     |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/processors/openapi.ts` | `collectSchemasFromPaths`（src/processors/openapi.ts:111）, `containsFreeFormProperty`（src/processors/openapi.ts:68）, `applyTransformPath`（src/processors/openapi.ts:40） |
| `src/processors/common.ts`  | `collectUsedTypesFromProperties`（src/processors/common.ts:72）                                                                                                              |

## cli

文件数：8

语言：ts × 8

关键导出：`collectTypeScriptFiles`（src/cli/commands/verify.ts:47）, `buildCompilerOptions`（src/cli/commands/verify.ts:106）, `checkGeneratedFiles`（src/cli/commands/verify.ts:163）

扇入/扇出：0 / 0

### 设计依据（意图证据）

| 证据                                                                                                                                                                                                                                                                                                                           | 类型       | 目标                         | 锚点                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ---------------------------- | ------------------------------ |
| @description 产物类型检查命令 对生成的代码运行 TypeScript 类型检查（tsc --noEmit 语义）， 作为生成后的质量关卡：缺失 import、类型冲突等问题在此暴露， 弥补消费方 tsconfig 通常将生成目录排除在类型检查之外的盲区。 typescript 编译器优先复用消费方项目的依赖（process.cwd 向上解析）， 其次回退到本工具自身的 node_modules。 / | 文件头自述 | src/cli/commands/verify.ts   | src/cli/commands/verify.ts:1   |
| @description 代码生成命令 支持单次生成和监视模式 watch 模式设计： - 防抖：一次保存常触发多个文件系统事件，合并为一次重新生成 - 互斥：上一次生成未结束时只排队一次重跑，避免并发 cleanOutputDir 竞争 - 缓存清理：重新生成前清除配置加载缓存，确保拿到配置文件的新内容 /                                                         | 文件头自述 | src/cli/commands/generate.ts | src/cli/commands/generate.ts:1 |
| @description 诊断命令（dry-run 模式） 加载配置、获取 API 定义、处理数据并打印诊断报告，但不生成任何文件 与 generate 命令的区别：debug 命令在「处理数据」阶段后停止， 绝不调用 generateFiles，因此不会清空或写入输出目录 /                                                                                                      | 文件头自述 | src/cli/commands/debug.ts    | src/cli/commands/debug.ts:1    |
| @description 初始化命令 创建配置文件 /                                                                                                                                                                                                                                                                                         | 文件头自述 | src/cli/commands/init.ts     | src/cli/commands/init.ts:1     |
| @description CLI 程序入口，定义所有命令行命令 /                                                                                                                                                                                                                                                                                | 文件头自述 | src/cli/program.ts           | src/cli/program.ts:1           |
| @description CLI 常量定义 包含默认配置模板等常量 /                                                                                                                                                                                                                                                                             | 文件头自述 | src/cli/constants.ts         | src/cli/constants.ts:1         |

### 文件结构

| 文件                            | 关键符号                                                                                                                                                                     |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/cli/commands/verify.ts`    | `collectTypeScriptFiles`（src/cli/commands/verify.ts:47）, `buildCompilerOptions`（src/cli/commands/verify.ts:106）, `checkGeneratedFiles`（src/cli/commands/verify.ts:163） |
| `src/cli/commands/debug.ts`     | 未检出已索引符号                                                                                                                                                             |
| `src/cli/commands/generate.ts`  | 未检出已索引符号                                                                                                                                                             |
| `src/cli/commands/init.ts`      | 未检出已索引符号                                                                                                                                                             |
| `src/cli/commands/visualize.ts` | 未检出已索引符号                                                                                                                                                             |
| `src/cli/constants.ts`          | 未检出已索引符号                                                                                                                                                             |
| `src/cli/main.ts`               | 未检出已索引符号                                                                                                                                                             |
| `src/cli/program.ts`            | 未检出已索引符号                                                                                                                                                             |

## 本页确定知道的事实

- 详述模块 11 个
- 检出依赖关系的模块 9 个
- 检出意图证据（注释/提交/文档）的模块 11 个

## 未知项

- 3 个详述模块未检出图谱符号
- 2 个详述模块未检出模块间依赖证据

## Related

- 同目录：[architecture.md](architecture.md) · [workspaces.md](workspaces.md) · [package-boundaries.md](package-boundaries.md)
- 互补职责：[architecture.md](../02-architecture/architecture.md)
- 共享 13 个源文件、共享 22 个符号：[onboarding.md](../05-guides/onboarding.md)
- 共享 5 个源文件、共享 24 个符号：[constraints.md](../06-constraints/constraints.md)
- 共享 3 个源文件、共享 21 个符号：[overview.md](../01-overview/overview.md)
- 总入口：[README](../README.md)

<!-- wiki:source: fallback -->

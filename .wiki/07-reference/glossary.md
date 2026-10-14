<details>
<summary>Relevant source files</summary>

- src/generator/generators/hookGenerator.ts
- src/generator/requestBinding.ts
- src/generator/requestParameters.ts
- src/generator/template/formDataBody.ts
- src/generator/template/zod/recursive.ts
- tsconfig.json
- src/cli/commands/verify.ts
- src/clients/base/registry.ts
- src/config/loader.ts
- src/errors/errorFactory.ts
- src/generator/template/adapters/ahooksAdapter.ts
- src/generator/template/adapters/swrAdapter.ts
- src/generator/template/adapters/vueQueryAdapter.ts
- src/naming/sanitizer.ts
- src/naming/strategy.ts

</details>

## 关键概念：config / utils / naming / clients

本页按模块汇总 `config`、`utils`、`naming`、`clients` 四个目录下的关键类型与函数，覆盖配置缓存、运行时工具（钩子、进度、转义、循环引用防护）、命名处理选项以及客户端注册与选择等核心抽象。它们构成了配置加载、代码生成运行时支撑与客户端调度三条主线的公共基础设施，是理解项目整体骨架的入口。以下符号均基于各自所在文件的实际声明，锚点列给出精确定位。

### config：配置缓存

该组是配置层的缓存抽象，负责定义缓存条目的数据结构与缓存的生命周期管理，为配置的读取/命中/失效提供统一载体。

| 名称               | 类型      | 签名 | 说明           | 所属文件                |
| ------------------ | --------- | ---- | -------------- | ----------------------- |
| ConfigCacheEntry   | interface | —    | 配置缓存条目   | src/config/loader.ts:16 |
| ConfigCacheManager | class     | —    | 配置缓存管理器 | src/config/loader.ts:26 |

### utils：运行时工具

该组是跨模块复用的运行时工具集，涵盖钩子执行与错误处理、进度展示与步骤控制、循环引用防护以及参数访问表达式的生成，为生成器及上层流程提供通用的执行保障与安全输出能力。

| 名称                  | 类型     | 签名                                                         | 说明                                                                                                   | 所属文件                     |
| --------------------- | -------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ---------------------------- |
| HookManager           | class    | —                                                            | 钩子管理器类，负责执行用户定义的钩子函数，并提供统一的错误处理                                         | src/utils/hooks.ts:12        |
| SimpleProgressManager | class    | —                                                            | 简单的进度管理器（替代复杂的 ProgressManager）                                                         | src/utils/progress.ts:184    |
| begin                 | method   | `(schema: object): : boolean`                                | 标记 schema 开始处理；若该对象已在处理链中则返回 true（循环引用），调用方应跳过                        | src/utils/schemaSafety.ts:54 |
| buildParamAccess      | function | `(requestParamName: string, rawParamName: string): : string` | 生成参数访问表达式：合法标识符用点访问（`params.code`），非法标识符用方括号访问（`params['user-id']`） | src/utils/escape.ts:97       |
| completeCurrentStep   | method   | `(description?: string): : void`                             | 完成当前步骤                                                                                           | src/utils/progress.ts:41     |
| complete              | method   | `(message?: string): : void`                                 | 完成所有步骤                                                                                           | src/utils/progress.ts:72     |

> 说明：`begin` 属于循环引用防护逻辑，`completeCurrentStep` 与 `complete` 属于进度管理逻辑，二者均以方法形式挂在各自的类上。

### naming：命名与路径处理选项

该组定义命名/路径处理相关的数据结构，承载路径处理的结果形态以及标识符净化函数的配置项，是命名策略与净化逻辑之间的数据契约。

| 名称              | 类型      | 签名 | 说明                            | 所属文件                  |
| ----------------- | --------- | ---- | ------------------------------- | ------------------------- |
| ProcessedPathInfo | interface | —    | 路径处理结果接口                | src/naming/strategy.ts:15 |
| SanitizeOptions   | interface | —    | `sanitizeIdentifier` 的配置选项 | src/naming/sanitizer.ts:8 |

### clients：客户端注册与选择

该组是客户端注册表的核心抽象，定义已注册客户端的信息结构，并提供按配置自动选择客户端与清空注册表的能力，支撑多客户端场景下的动态调度。

| 名称             | 类型      | 签名                                | 说明                                               | 所属文件                         |
| ---------------- | --------- | ----------------------------------- | -------------------------------------------------- | -------------------------------- |
| RegisteredClient | interface | —                                   | 注册的客户端信息                                   | src/clients/base/registry.ts:23  |
| autoSelectClient | method    | `(config: ApiConfig): : BaseClient` | 根据配置自动选择合适的客户端，返回匹配的客户端实例 | src/clients/base/registry.ts:84  |
| clear            | method    | `(): : void`                        | 清除所有注册的客户端                               | src/clients/base/registry.ts:154 |

> 待确认：`autoSelectClient` 的返回类型标注为 `BaseClient`，但该类型未在本批数据中给出定义文件，其具体能力与匹配规则需查阅 `src/clients/base/` 下的对应实现。

## 关键概念：generator / processors / cli / validation / errors

### generator：代码生成与模板拼装

该组符号集中在 `src/generator` 下，承担从解析产物到最终生成代码的渲染职责：请求参数的提取与分组（`src/generator/requestParameters.ts`）、各框架 hook 的 import 组装（`src/generator/generators/hookGenerator.ts`）、模板层代码行拼装（`src/generator/template/formDataBody.ts`、`src/generator/template/zod/recursive.ts`）、各数据请求库适配器的 key/options 片段生成（`src/generator/template/adapters/*`），以及 raw binary 请求选项构造（`src/generator/requestBinding.ts`）。整体上，这一组是"输入接口元数据、输出可运行代码字符串"的纯函数集合。

| 名称                        | 类型      | 签名                                                                                                                                                    | 说明                                                                                                                                  | 所属文件                                              |
| --------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| RequestBodyInfo             | interface | —                                                                                                                                                       | 请求体提取结果；除属性列表外，保留 content-type 分类与 raw body 字段名，供模板层生成请求配置                                          | src/generator/requestParameters.ts:27                 |
| buildCommonImports          | function  | `(isJS: boolean, importedFunctions: Set<string>, importedTypes: Set<string>, importedSchemas: Set<string>, config: ApiConfig, dirPath: string): string` | 组装库无关的 import 段（API 函数 + 类型模块 + 响应校验 Schema）；`importedSchemas` 为 zod 校验开启时需要值导入的响应 Schema 名集合    | src/generator/generators/hookGenerator.ts:187         |
| buildMethodOptions          | function  | `(groups: RequestParameterGroups): { statement: string; expression: string }`                                                                           | 构造 raw binary 请求的 method-specific 选项，返回选项构造语句与调用表达式                                                             | src/generator/requestBinding.ts:100                   |
| buildAppendBranchLines      | function  | `(keyVar: string, valVar: string, formVar: string, indent = ''): string[]`                                                                              | 构建 FormData append 的分支逻辑代码行，作为 forEach 回调体；`indent` 为行首缩进（嵌套层级额外 +2 空格）                               | src/generator/template/formDataBody.ts:22             |
| buildRecursiveTypeInterface | function  | `(name: string, schema: OpenApiSchema): string`                                                                                                         | 为递归类型生成手写 interface（zod 官方递归模式）；interface 的属性自引用（如 `children: X[]`）在 TS 中合法，绕开 `z.infer` 的循环推导 | src/generator/template/zod/recursive.ts:108           |
| collectRefTypeNames         | function  | `(schema: OpenApiSchema, selfName: string): string[]`                                                                                                   | 收集 schema 树中引用的其他类型名（`$ref` 末段，过滤自身），用于递归类型 interface 的 `import type` 生成；返回去重后的类型名数组       | src/generator/template/zod/recursive.ts:62            |
| buildKeyItems               | function  | `(data: HookInterfaceData, includeParams: boolean): string`                                                                                             | 构建 SWR key 数组项字符串（query 含参数对象，mutation 仅前缀 + 函数名）；返回逗号分隔的数组项字符串                                   | src/generator/template/adapters/swrAdapter.ts:22      |
| buildOptionsArgument        | function  | `(data: HookInterfaceData): string`                                                                                                                     | 构建 `useRequest` 第二参数：有前缀时生成 `cacheKey`，否则直接透传 `options`                                                           | src/generator/template/adapters/ahooksAdapter.ts:28   |
| buildQueryKeyItems          | function  | `(data: HookInterfaceData): string`                                                                                                                     | 构建 `queryKey` 数组项字符串（前缀 + 函数名 + 参数对象）                                                                              | src/generator/template/adapters/vueQueryAdapter.ts:25 |

### processors：OpenAPI 文档处理

该组位于 `src/processor`s，负责对 OpenAPI 文档本身做预处理与归一化：路径转换函数的异常收敛，以及 schema 节点的收集预扫描。

| 名称                    | 类型     | 签名                                                          | 说明                                                                                                                            | 所属文件                      |
| ----------------------- | -------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| applyTransformPath      | function | `(transform: (path: string) => string, path: string): string` | 应用 `transformPath` 转换函数，处理异常和返回值校验；当函数抛错或返回非字符串时，归一为 E3005 `GenerateError`                   | src/processors/openapi.ts:40  |
| collectSchemasFromPaths | function | `(paths: NonNullable<OpenApiDocument['paths']>): unknown[]`   | 从 OpenAPI `paths` 中收集所有 `requestBody` / `response` 的 schema，用于预扫描是否含 free-form 属性；扁平化返回所有 schema 节点 | src/processors/openapi.ts:111 |

### cli：命令行校验命令

该组位于 `src/cli`，为命令行子命令提供支撑逻辑，当前数据中仅包含 `verify` 命令的编译选项构建。

| 名称                 | 类型     | 签名                                                                         | 说明                                                                                                                                                                                                                   | 所属文件                       |
| -------------------- | -------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| buildCompilerOptions | function | `(ts: TSModule, projectRoot: string, outputDirs: string[]): CompilerOptions` | 构建编译选项：复用消费方 `tsconfig.json` 的 `paths` 别名等配置（强制 `noEmit`）；无 tsconfig 时使用默认选项，并按生成代码的别名约定推导 `@/*`（`@` 等价于生成目录路径中第一个 `src/` 段，见 `pathUtils.getAliasPath`） | src/cli/commands/verify.ts:106 |

### validation：配置校验

该组位于 `src/validation`，负责对配置进行校验与派生计算，当前数据中仅包含输出目录的推导函数。

| 名称             | 类型     | 签名                                                  | 说明                                                                                                       | 所属文件                                    |
| ---------------- | -------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| computeOutputDir | function | `(svc: ServiceConfig, baseOutputDir: string): string` | 计算单个服务的 `outputDir`，即 `join(baseOutputDir, folder ?? name)`：服务未指定 `folder` 时回退使用服务名 | src/validation/validators/serviceDirs.ts:27 |

### errors：错误实例工厂

该组位于 `src/errors`，通过 `ErrorFactory` 集中构造带解决方案提示的错误实例；本节仅覆盖配置类错误（`ConfigError`）的四个构造入口，每个入口都接受定位信息并返回统一错误类型，便于上层统一捕获与展示修复步骤。

| 名称                  | 类型     | 签名                                                         | 说明                                 | 所属文件                       |
| --------------------- | -------- | ------------------------------------------------------------ | ------------------------------------ | ------------------------------ |
| configNotFound        | function | `(configPath: string): ConfigError`                          | 创建配置文件未找到错误               | src/errors/errorFactory.ts:19  |
| configInvalid         | function | `(message: string, solutions: ErrorSolution[]): ConfigError` | 创建配置无效错误，可传入解决方案列表 | src/errors/errorFactory.ts:51  |
| configParseError      | function | `(configPath: string, originalError: Error): ConfigError`    | 创建配置解析失败错误，保留原始错误   | src/errors/errorFactory.ts:70  |
| configMissingRequired | function | `(field: string): ConfigError`                               | 创建配置缺少必需字段错误             | src/errors/errorFactory.ts:102 |

## Related

- 同目录：[calls.md](calls.md) · [classes.md](classes.md)
- 互补职责：[calls.md](../07-reference/calls.md)
- 共享 4 个源文件、共享 17 个符号：[architecture.md](../02-architecture/architecture.md)
- 共享 8 个源文件、共享 8 个符号：[api.md](../03-interface/api.md)
- 共享 2 个源文件、共享 12 个符号：[modules.md](../02-architecture/modules.md)
- 总入口：[README](../README.md)

<!-- wiki:source: llm -->

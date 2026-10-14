# API 参考

<details>
<summary>Relevant source files</summary>

- scripts/analyze-deps.js
- tsconfig.json
- src/cli/commands/verify.ts
- src/clients/base/registry.ts
- src/clients/implementations/ApifoxClient.ts
- src/clients/implementations/SwaggerClient.ts
- src/clients/index.ts
- src/generator/generators/hookGenerator.ts
- src/generator/requestBinding.ts
- src/generator/template/adapters/swrAdapter.ts
- src/generator/template/formDataBody.ts
- src/generator/template/hookLibraryRegistry.ts
- src/naming/strategy.ts
- src/processors/openapi.ts
- src/utils/config.ts

</details>

本页汇总当前数据中可确认的模块级导出函数。从这些函数的分布看，代码库的对外接口以 TypeScript 函数为单元，覆盖四条主线：配置解析与命名策略（src/utils/config.ts:69、src/naming/strategy.ts:187）、路径与数据处理安全（src/utils/pathSafety.ts:45、src/utils/schemaSafety.ts:54）、客户端接入与选择（src/clients/base/registry.ts:84）、以及代码生成模板与 CLI 自检（src/generator/template/hookLibraryRegistry.ts:109、src/cli/commands/verify.ts:47）。

本次数据未包含 CLI 命令注册项，也未包含控制器/路由一类的框架节点，因此本页不设「CLI 命令」「框架节点」明细章节，相关内容以「待确认」形式列出。

## 函数分组总览

下表按所在目录与职责把 20 个导出函数归为 7 组，便于按模块定位入口。

| 分组                   | 涉及文件                                                                                                                | 函数数量 |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------- |
| 配置解析与命名策略     | src/utils/config.ts、src/naming/strategy.ts                                                                             | 3        |
| 路径与运行时安全       | src/utils/pathUtils.ts、src/utils/pathSafety.ts、src/utils/schemaSafety.ts                                              | 3        |
| OpenAPI 规范处理       | src/processors/openapi.ts                                                                                               | 1        |
| 客户端注册、选择与创建 | src/clients/base/registry.ts、src/clients/implementations/ApifoxClient.ts、src/clients/implementations/SwaggerClient.ts | 3        |
| 代码生成模板与请求绑定 | src/generator/template/…、src/generator/requestBinding.ts、src/generator/generators/hookGenerator.ts                    | 5        |
| CLI 校验命令内部实现   | src/cli/commands/verify.ts                                                                                              | 4        |
| 依赖分析脚本           | scripts/analyze-deps.js                                                                                                 | 1        |

## 配置解析与命名策略

这一组承担「把外部配置变成内部可用结构」和「把接口信息映射成命名」两件事：一部分做断言式校验与预设合并，一部分按上下文生成多套名称。它们通常是生成流程的入口侧函数。

| 函数名                | 签名                                                                                                                                                                                    | 说明                                              | 源文件:行号                |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | -------------------------- |
| `assertValidMethod`   | `(method: string): asserts method is keyof typeof HTTP_METHODS`                                                                                                                         | 断言式校验：把入参收窄为合法 HTTP 方法            | src/utils/config.ts:69     |
| `applyPreset`         | `(config: CommonServiceConfig): CommonServiceConfig`                                                                                                                                    | 输入输出同为通用服务配置                          | src/utils/config.ts:179    |
| `applyNamingStrategy` | `(ctx: NamingContext, customStrategy?: Partial<NamingStrategy>): { interfaceName: string; functionName: string; requestTypeName: string; responseTypeName: string; hookName: string; }` | 依据命名上下文与可选自定义策略，一次产出 5 个名称 | src/naming/strategy.ts:187 |

**assertValidMethod**（src/utils/config.ts:69）：使用 TypeScript 断言签名（`asserts method is keyof typeof HTTP_METHODS`），调用方在调用之后即可把 `string` 类型的 `method` 当作合法方法字面量使用；非法输入时由断言函数自身抛错，而非返回布尔值。

**applyPreset**（src/utils/config.ts:179）：接收并返回同一类型 `CommonServiceConfig`，从签名看属于对配置对象的加工/合并环节，不改变类型形状。

**applyNamingStrategy**（src/naming/strategy.ts:187）：命名策略的聚合点，一次返回接口名、函数名、请求类型名、响应类型名与 hook 名五项，第二个参数 `customStrategy` 为 `Partial<NamingStrategy>`，表示调用方可只覆盖部分命名规则。

## 路径与运行时安全

这一组提供三类防护：路径别名解析与工作目录边界断言、递归结构处理时的循环引用检测。它们的共同特征是「在生成/读取文件或遍历 schema 之前先做防御」。

| 函数名            | 签名                                        | 说明                               | 源文件:行号                  |
| ----------------- | ------------------------------------------- | ---------------------------------- | ---------------------------- |
| `aliasToRealPath` | `(aliasPath: string): string`               | 返回字符串路径                     | src/utils/pathUtils.ts:58    |
| `assertWithinCwd` | `(targetPath: string, label: string): void` | 断言式校验，无返回值               | src/utils/pathSafety.ts:45   |
| `begin`           | `(schema: object): boolean`                 | 标记 schema 开始处理，检测循环引用 | src/utils/schemaSafety.ts:54 |

**aliasToRealPath**（src/utils/pathUtils.ts:58）：签名为单个字符串入参、字符串出参；该函数无文档说明，据函数名与参数名 **推断** 其职责是把别名形式的路径转换为真实路径（推断依据：函数名 `aliasToRealPath`、参数名 `aliasPath`、所在模块 src/utils/pathUtils.ts）。

**assertWithinCwd**（src/utils/pathSafety.ts:45）：无返回值，靠抛错中断流程；除目标路径外还接收一个 `label` 参数，用于在报错信息中标识被校验对象。

**begin**（src/utils/schemaSafety.ts:54）：用于循环引用防护（`CircularRefGuard`）。文档给出的用法是：在处理 schema 前调用，返回 `true` 表示该对象已在处理链中（循环引用），调用方应跳过；处理完成后需配对调用 `end`。文档示例（src/utils/schemaSafety.ts:54）：

```typescript
const guard = new CircularRefGuard();
function processSchema(schema) {
  if (guard.begin(schema)) return null; // 循环引用，跳过
  const result = ...;
  guard.end(schema);
  return result;
}
```

## OpenAPI 规范处理

该组只有 1 个函数，位于 OpenAPI 文档的处理链路上，负责把用户自定义的路径转换函数安全地应用到具体路径上，并把异常归一为统一的生成错误码。

| 函数名               | 签名                                                          | 说明                                                     | 源文件:行号                  |
| -------------------- | ------------------------------------------------------------- | -------------------------------------------------------- | ---------------------------- |
| `applyTransformPath` | `(transform: (path: string) => string, path: string): string` | 应用 transformPath 转换函数，异常/非法返回值归一为 E3005 | src/processors/openapi.ts:40 |

**applyTransformPath**（src/processors/openapi.ts:40）：接收已规范化为函数的 `transform` 与原始路径 `path`，返回转换后的路径。当 `transform` 抛错或返回非字符串时，统一归一为 `GenerateError` 的 `E3005` 错误，使用方无需自行包裹 try/catch。文档示例：

```typescript
const newPath = applyTransformPath(config.transformPath, '/users');
```

## 客户端注册、选择与创建

该组负责后端数据源客户端：一个按配置自动选择客户端实例的入口，以及两个具体实现（Apifox、Swagger）的创建函数。生成流程只需面向 `autoSelectClient` 返回的 `BaseClient`，具体实现由注册表决定。

| 函数名                | 签名                              | 说明                                               | 源文件:行号                                      |
| --------------------- | --------------------------------- | -------------------------------------------------- | ------------------------------------------------ |
| `autoSelectClient`    | `(config: ApiConfig): BaseClient` | 根据配置自动选择合适的客户端，返回匹配的客户端实例 | src/clients/base/registry.ts:84                  |
| `createApifoxClient`  | 数据未提供                        | 数据未提供                                         | src/clients/implementations/ApifoxClient.ts:265  |
| `createSwaggerClient` | 数据未提供                        | 数据未提供                                         | src/clients/implementations/SwaggerClient.ts:103 |

**autoSelectClient**（src/clients/base/registry.ts:84）：文档明确其职责为「根据配置自动选择合适的客户端」，入参为 `ApiConfig`，返回 `BaseClient`。调用方拿到的是基类类型，不需要感知具体数据源实现。

**createApifoxClient**（src/clients/implementations/ApifoxClient.ts:265）与 **createSwaggerClient**（src/clients/implementations/SwaggerClient.ts:103）：数据中未提供签名与文档。据命名前缀 `create*` 与所在目录 **推断**，二者是分别针对 Apifox 与 Swagger 数据源的客户端工厂函数（推断依据：函数名前缀、文件位于 `clients/implementations` 目录）。

## 代码生成模板与请求绑定

这一组是生成器的核心拼装层：一部分按目标库（如 SWR）适配渲染产物，一部分构建请求体（FormData、raw binary）与 import 段。它们大多以「拼出代码字符串/代码行数组」为返回形态。

| 函数名                     | 签名                                                                                                                                                    | 说明                                        | 源文件:行号                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------- |
| `appendResponseValidation` | `(expression: string, data: HookInterfaceData): string`                                                                                                 | 返回字符串，入参含接口渲染数据              | src/generator/template/hookLibraryRegistry.ts:109 |
| `buildAppendBranchLines`   | `(keyVar: string, valVar: string, formVar: string, indent = ''): string[]`                                                                              | 构建 FormData append 的分支逻辑代码行       | src/generator/template/formDataBody.ts:22         |
| `buildKeyItems`            | `(data: HookInterfaceData, includeParams: boolean): string`                                                                                             | 构建 SWR key 数组项字符串                   | src/generator/template/adapters/swrAdapter.ts:22  |
| `buildCommonImports`       | `(isJS: boolean, importedFunctions: Set<string>, importedTypes: Set<string>, importedSchemas: Set<string>, config: ApiConfig, dirPath: string): string` | 组装库无关的 import 段                      | src/generator/generators/hookGenerator.ts:187     |
| `buildMethodOptions`       | `(groups: RequestParameterGroups): { statement: string; expression: string; }`                                                                          | 构造 raw binary 请求的 method-specific 选项 | src/generator/requestBinding.ts:100               |

**appendResponseValidation**（src/generator/template/hookLibraryRegistry.ts:109）：入参为表达式字符串与 `HookInterfaceData`（即生成时的接口渲染数据），返回拼装后的字符串；从模块路径看它属于 hook 模板库注册表的一部分，用于在生成结果中追加响应校验片段。

**buildAppendBranchLines**（src/generator/template/formDataBody.ts:22）：生成 FormData 的 `append` 分支逻辑代码行数组，作为 `forEach` 回调体使用。参数 `keyVar`/`valVar`/`formVar` 分别对应键名变量、值变量与 FormData 变量名，`indent` 控制行首缩进，嵌套层级会额外增加 2 个空格。

**buildKeyItems**（src/generator/template/adapters/swrAdapter.ts:22）：构建 SWR 缓存 key 的数组项字符串。`includeParams` 控制 key 是否包含参数对象——文档说明 query 场景传 `true`，mutation 场景传 `false`（此时 key 仅由前缀与函数名构成），返回值为逗号分隔的数组项字符串。

**buildCommonImports**（src/generator/generators/hookGenerator.ts:187）：把所有目标库都需要的 import 段拼成一个字符串，包括 API 函数、类型模块与响应校验 Schema。`isJS` 区分 JavaScript 目标，三个 `Set` 参数分别给出被引用的 API 函数名、类型名，以及需要值导入的响应 Schema 名（zod 校验开启时），`dirPath` 为标签目录路径。文档正文引用到的别名约定见 `pathUtils.getAliasPath`（src/generator/generators/hookGenerator.ts:187 文档描述）。

**buildMethodOptions**（src/generator/requestBinding.ts:100）：针对 raw binary 请求构造 method-specific 选项，返回 `statement`（选项构造语句）与 `expression`（调用表达式）两部分，调用方可将二者分别插入生成代码。

## CLI 校验命令内部实现

这一组函数位于 `verify` 命令实现文件内，围绕「收集待校验文件 → 检查生成产物 → 运行类型检查」构成自检能力。其中编译选项构建函数带完整文档，另外三个函数在本次数据中没有签名与说明。

| 函数名                   | 签名                                                                         | 说明         | 源文件:行号                    |
| ------------------------ | ---------------------------------------------------------------------------- | ------------ | ------------------------------ |
| `collectTypeScriptFiles` | 数据未提供                                                                   | 数据未提供   | src/cli/commands/verify.ts:47  |
| `buildCompilerOptions`   | `(ts: TSModule, projectRoot: string, outputDirs: string[]): CompilerOptions` | 构建编译选项 | src/cli/commands/verify.ts:106 |
| `checkGeneratedFiles`    | 数据未提供                                                                   | 数据未提供   | src/cli/commands/verify.ts:163 |
| `runTypeCheck`           | 数据未提供                                                                   | 数据未提供   | src/cli/commands/verify.ts:194 |

**buildCompilerOptions**（src/cli/commands/verify.ts:106）：复用消费方项目 `tsconfig.json` 的 `paths` 别名等配置，并强制 `noEmit`；当项目没有 tsconfig 时改用默认选项，并按生成代码的别名约定推导 `@/*`——文档说明 `@` 等价于生成目录路径中第一个 `src/` 段，指向 `pathUtils.getAliasPath`。参数中的 `outputDirs` 用于在缺少 tsconfig 时推导别名回退。

**collectTypeScriptFiles**（src/cli/commands/verify.ts:47）、**checkGeneratedFiles**（src/cli/commands/verify.ts:163）、**runTypeCheck**（src/cli/commands/verify.ts:194）：本次数据未提供签名与文档，无法给出参数与返回语义（见「待确认」）。

## 依赖分析脚本

该组是仓库脚本层的独立入口，与 `src/` 下的运行时代码分离。

| 函数名                | 签名 | 说明       | 源文件:行号                |
| --------------------- | ---- | ---------- | -------------------------- |
| `analyzeDependencies` | `()` | 数据未提供 | scripts/analyze-deps.js:60 |

**analyzeDependencies**（scripts/analyze-deps.js:60）：位于 `scripts/analyze-deps.js`，无参数列表与文档说明，本次数据无法给出其输入、输出与执行方式（见「待确认」）。

## 待确认

以下为影响使用决策的关键缺口，本次数据未提供对应证据：

- CLI 命令清单：数据中命令注册项为空，因此无法给出命令名、参数与使用方式；仅能从 src/cli/commands/verify.ts:47、src/cli/commands/verify.ts:106、src/cli/commands/verify.ts:163、src/cli/commands/verify.ts:194 判断存在一个校验类命令的实现文件，但缺少命令名与调用方式。
- 框架节点：数据中无 Controller、Router 一类框架节点，无法判断是否存在 Web 框架层入口。
- 函数间调用关系：本次数据未提供调用边，因此本页不给出调用链表格；各函数之间的实际依赖顺序无法确认。
- 部分函数缺签名与说明：`collectTypeScriptFiles`（src/cli/commands/verify.ts:47）、`checkGeneratedFiles`（src/cli/commands/verify.ts:163）、`runTypeCheck`（src/cli/commands/verify.ts:194）、`analyzeDependencies`（scripts/analyze-deps.js:60）、`createApifoxClient`（src/clients/implementations/ApifoxClient.ts:265）、`createSwaggerClient`（src/clients/implementations/SwaggerClient.ts:103）无参数与返回值信息。

## Related

- 共享 3 个源文件、共享 16 个符号：[architecture.md](../02-architecture/architecture.md)
- 共享 5 个源文件、共享 12 个符号：[modules.md](../02-architecture/modules.md)
- 共享 8 个源文件、共享 8 个符号：[glossary.md](../07-reference/glossary.md)
- 总入口：[README](../README.md)

<!-- wiki:source: llm -->

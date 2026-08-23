# 代码生成引擎（`src/generator/`）

一句话职责：将 `ProcessedApiData` 转化为 TypeScript/JavaScript 文件的生成引擎，采用协调器模式。

## 主流程（`index.ts` + `codegen.ts`）

```text
generateCode(configPath)                          src/generator/index.ts
  ├─ loadConfig(configPath) → ApiConfig[]          并发拉取前先加载多服务配置
  ├─ beforeGenerate 钩子（整体一次，取首个服务的 hooks）
  ├─ 阶段1：并发 fetchData 各服务（失败隔离：单服务失败仅跳过并报告）
  ├─ 阶段2：串行 processService（避免目录清理竞争）
  │    ├─ processOpenApiData(rawData, config)      src/processors/openapi.ts
  │    └─ generateFiles(processedData, config)     src/generator/codegen.ts
  ├─ afterGenerate 钩子（整体一次）
  └─ 若有失败服务：成功服务生成完毕后抛出聚合错误（进程非零退出）
```

`generateFiles()` 单服务生成顺序（`codegen.ts`）：

1. **清理输出目录**：`cleanOutputDir`，排除位于 outputDir 内的 `requestFunctionFilePath`（经 `aliasToRealPath` 规范化后比较，避免别名/相对路径不一致）
2. **接口文件**：`generateInterfaceFiles`（当 `generateApi || generateTypes`）
3. **请求函数文件**：`generateRequestFile`（当 `generateApi`）
4. **类型/Schema 文件**（当 `generateTypes && target !== 'javascript'`）：
   - `typesFormat: 'typescript'` → `generateTypeFiles`
   - `typesFormat: 'zod'` → `generateSchemaFiles`

## 目录结构

| 文件/目录                             | 职责                                                          |
| ------------------------------------- | ------------------------------------------------------------- |
| `index.ts`                            | `generateCode()` 主入口（多服务编排）                         |
| `codegen.ts`                          | `generateFiles()` 协调器                                      |
| `extractor.ts`                        | 从 OpenAPI 操作中提取请求/响应属性、路径参数名                |
| `fileGenerator.ts`                    | 生成步骤的门面（接口/请求/类型/Schema 文件生成）              |
| `fileWriter.ts`                       | 文件写入                                                      |
| `freeForm.ts`                         | 兼容 re-export（实现已下沉至中立层 `src/schema/freeForm.ts`） |
| `propertyType.ts`                     | 属性类型映射                                                  |
| `generators/interfaceGenerator.ts`    | 按标签生成接口文件                                            |
| `generators/rootIndexGenerator.ts`    | 生成根 `index.ts` 导出                                        |
| `generators/typeGenerator.ts`         | TypeScript 类型文件（`outputDir/types/`）                     |
| `generators/schemaGenerator.ts`       | Zod Schema 文件（`outputDir/schemas/`）                       |
| `generators/zodTypesOnlyGenerator.ts` | Zod 仅类型 Schema 生成                                        |
| `template/`                           | Handlebars 引擎（见下）                                       |

### `template/` 子目录

| 文件                                                 | 职责                                                       |
| ---------------------------------------------------- | ---------------------------------------------------------- |
| `compiler.ts`                                        | Handlebars 编译（行数豁免于 360 行限制，主要含模板字符串） |
| `templateCache.ts`                                   | Map 缓存                                                   |
| `templateHelpers.ts`                                 | 自定义辅助函数                                             |
| `templatePartials.ts`                                | 自定义分部模板                                             |
| `templateDefinitions.ts`                             | 模板字符串定义                                             |
| `interfaceFunctionGenerator.ts`                      | 接口函数代码生成                                           |
| `requestFileGenerator.ts`                            | `request.ts` 文件生成                                      |
| `jsonValueTemplates.ts`                              | JsonValue 递归类型模板                                     |
| `zod/interfaces.ts`、`zod/merged.ts`、`zod/types.ts` | Zod 模板（接口/合并/类型）                                 |

## 命名策略（`src/naming/`，顶层模块）

默认命名规则（`strategy.ts` 的 `defaultNamingStrategy`）：

| 类型               | 格式                               | 示例（`GET /api/users/{id}`） |
| ------------------ | ---------------------------------- | ----------------------------- |
| `interfaceName`    | Method + PascalCase(path) + By参数 | `GetApiUsersById`             |
| `functionName`     | camelCase 同上 + `Func` 后缀       | `getApiUsersByIdFunc`         |
| `requestTypeName`  | `{Interface}RequestType`           | `GetApiUsersByIdRequestType`  |
| `responseTypeName` | `{Interface}ResultType`            | `GetApiUsersByIdResultType`   |

- `applyNamingStrategy(ctx, customStrategy?)` 合并自定义与默认策略（自定义优先，支持部分覆盖）
- `sanitizer.ts`：`sanitizeTypeName` / `sanitizeInterfaceName` / `sanitizeParamName` / `sanitizePropertyName`
- 自定义入口：配置项 `namingStrategy`（接口定义见 `src/types/config.ts`）

## 路径参数插值

OpenAPI 路径中的 `{param}` 自动插值为模板字符串：

| OpenAPI 路径                     | 生成的 url 字符串                                      |
| -------------------------------- | ------------------------------------------------------ |
| `/api/users`                     | `'/api/users'`（无参数时保持单引号字面量）             |
| `/api/v1/stock/{code}`           | `` `/api/v1/stock/${params.code}` ``                   |
| `/users/{userId}/posts/{postId}` | `` `/users/${params.userId}/posts/${params.postId}` `` |

流程：`extractPathParameterNames()`（`in === 'path'` 参数）→ `interpolatePathParams()`（`src/utils/escape.ts`）→ 模板三花括号渲染。静态文本转义反引号/`${`/反斜杠；非法标识符参数名用方括号访问（如 `params['user-id']`）。path 参数仍保留在 `RequestType` 接口中用于类型校验。

## 输出目录结构（单服务视角）

```text
join(baseOutputDir, folder ?? name)/
├── [tag].ts               # 按标签分组的接口文件
├── index.ts               # 根导出
├── types/                 # typescript 格式
│   └── [typeName].ts
├── schemas/               # zod 格式
│   └── [schemaName].ts
└── request.ts             # 请求工具文件（位于 baseOutputDir 层共享）
```

> `src/service/` 是本仓库的开发示例输出（`backend` 服务，按拼音分目录），属于生成文件，不要手工修改。

## Related

- [高层架构 → 多服务数据流](../01-overview/architecture.md#多服务数据流)
- [OpenAPI 处理器](./processors.md)
- [ADR-001: Handlebars](../01-overview/decisions.md#adr-001选用-handlebars-作为模板引擎)、[ADR-004: 命名策略](../01-overview/decisions.md#adr-004可插拔命名策略)

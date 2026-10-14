# 类

<details>
<summary>Relevant source files</summary>

- src/clients/base/BaseClient.ts
- src/clients/base/registry.ts
- src/clients/implementations/ApifoxClient.ts
- src/clients/implementations/SwaggerClient.ts
- src/config/loader.ts
- src/errors/errorClasses.ts
- src/utils/hooks.ts
- src/utils/progress.ts
- src/utils/schemaSafety.ts
- src/validation/errors.ts

</details>

> ⚠️ **待确认**：MCP 知识图谱未提供继承关系（INHERITS 边），本页只列出类清单与成员方法，不含继承树；多态方法的子类实现（证据不足，禁止猜测；请人工补充后移除本标记）

## ConfigValidationError

源文件：`src/validation/errors.ts:123` 限定名：`Users-scx-Documents-code-scx-api-tool.src.validation.errors.ConfigValidationError`

| 方法        | 可见性 | 签名                                   | 说明 | 源文件:行号                  |
| ----------- | ------ | -------------------------------------- | ---- | ---------------------------- |
| constructor |        | `(validationReport: ValidationReport)` | —    | src/validation/errors.ts:126 |

## HookManager

源文件：`src/utils/hooks.ts:12` 限定名：`Users-scx-Documents-code-scx-api-tool.src.utils.hooks.HookManager`

| 方法                 | 可见性 | 签名                                 | 说明                                              | 源文件:行号                                                                                                                                                         |
| -------------------- | ------ | ------------------------------------ | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| executeHook          |        | `( hookFn?: (...args: any[]) => void | Promise<void>, ...args: any[] ): : Promise<void>` | @description 执行普通钩子函数（无返回值） @param hookFn 钩子函数（可选） @param args 传递给钩子函数的参数                                                           | src/utils/hooks.ts:24 |
| executeTransformHook |        | `( hookFn?: (...args: any[]) => T    | Promise<T>, ...args: any[] ): : Promise<T>`       | @description 执行转换钩子函数（有返回值） @param hookFn 钩子函数（可选） @param args 传递给钩子函数的参数 @returns 返回转换后的值，如果钩子未定义或失败则返回原始值 | src/utils/hooks.ts:57 |

## CircularRefGuard

源文件：`src/utils/schemaSafety.ts:35` 限定名：`Users-scx-Documents-code-scx-api-tool.src.utils.schemaSafety.CircularRefGuard`

| 方法  | 可见性 | 签名                          | 说明                                                                                                                                                             | 源文件:行号                  |
| ----- | ------ | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| begin |        | `(schema: object): : boolean` | @description 标记 schema 开始处理。若该对象已在处理链中，返回 true（循环引用） @param schema 待处理的 schema 对象 @returns true 表示检测到循环引用，调用方应跳过 | src/utils/schemaSafety.ts:54 |
| end   |        | `(schema: object): : void`    | @description 标记 schema 处理完成，从「正在处理」集合移除 @param schema 已处理的 schema 对象                                                                     | src/utils/schemaSafety.ts:64 |

## BaseClient

源文件：`src/clients/base/BaseClient.ts:51` 限定名：`Users-scx-Documents-code-scx-api-tool.src.clients.base.BaseClient.BaseClient`

| 方法             | 可见性 | 签名                                                           | 说明                                                                                                                      | 源文件:行号                        |
| ---------------- | ------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| constructor      |        | `(options: ClientOptions = {})`                                | —                                                                                                                         | src/clients/base/BaseClient.ts:55  |
| fetch            |        | `(config: ApiConfig): : Promise<FetchResult<OpenApiDocument>>` | @description 公共的数据获取接口 提供重试、超时、错误处理等通用功能 @param config API 配置 @returns Promise<FetchResult>   | src/clients/base/BaseClient.ts:100 |
| executeWithRetry |        | `(fn: () => Promise<T>): : Promise<T>`                         | @description 带重试机制的执行 @param fn 要执行的异步函数 @returns 执行结果                                                | src/clients/base/BaseClient.ts:137 |
| wrapError        |        | `(error: unknown, config: ApiConfig): : Error`                 | @description 包装客户端错误 @param error 原始错误 @param config API 配置 @returns 包装后的错误                            | src/clients/base/BaseClient.ts:164 |
| sleep            |        | `(ms: number): : Promise<void>`                                | @description 延迟函数 @param ms 延迟毫秒数                                                                                | src/clients/base/BaseClient.ts:182 |
| withTimeout      |        | `(promise: Promise<T>, timeoutMs: number): : Promise<T>`       | @description 创建带超时的 Promise @param promise 原始 Promise @param timeoutMs 超时时间（毫秒） @returns 带超时的 Promise | src/clients/base/BaseClient.ts:192 |
| matchUrlPatterns |        | `(url: string, patterns: RegExp[]): : boolean`                 | @description 验证 URL 是否匹配指定模式 @param url 要验证的 URL @param patterns URL 模式数组 @returns 是否匹配             | src/clients/base/BaseClient.ts:219 |

## SimpleProgress

源文件：`src/utils/progress.ts:11` 限定名：`Users-scx-Documents-code-scx-api-tool.src.utils.progress.SimpleProgress`

| 方法                | 可见性 | 签名                                                        | 说明             | 源文件:行号              |
| ------------------- | ------ | ----------------------------------------------------------- | ---------------- | ------------------------ |
| constructor         |        | `(private steps: Array<{ title: string; status: string }>)` | —                | src/utils/progress.ts:16 |
| startStep           |        | `(stepIndex: number): : void`                               | 开始执行指定步骤 | src/utils/progress.ts:24 |
| completeCurrentStep |        | `(description?: string): : void`                            | 完成当前步骤     | src/utils/progress.ts:41 |
| complete            |        | `(message?: string): : void`                                | 完成所有步骤     | src/utils/progress.ts:72 |
| failCurrentStep     |        | `(error: Error                                              | string): : void` | 当前步骤失败             | src/utils/progress.ts:81 |
| stop                |        | `(): : void`                                                | 停止进度显示     | src/utils/progress.ts:98 |

## SimpleProgressManager

源文件：`src/utils/progress.ts:184` 限定名：`Users-scx-Documents-code-scx-api-tool.src.utils.progress.SimpleProgressManager`

| 方法    | 可见性 | 签名                                            | 说明 | 源文件:行号               |
| ------- | ------ | ----------------------------------------------- | ---- | ------------------------- |
| info    |        | `(message: string, ...args: unknown[]): : void` | —    | src/utils/progress.ts:185 |
| success |        | `(message: string, ...args: unknown[]): : void` | —    | src/utils/progress.ts:189 |
| error   |        | `(message: string, ...args: unknown[]): : void` | —    | src/utils/progress.ts:193 |
| warn    |        | `(message: string, ...args: unknown[]): : void` | —    | src/utils/progress.ts:197 |

## ClientRegistry

源文件：`src/clients/base/registry.ts:35` 限定名：`Users-scx-Documents-code-scx-api-tool.src.clients.base.registry.ClientRegistry`

| 方法               | 可见性 | 签名                                                              | 说明                                                                                                          | 源文件:行号                                                                       |
| ------------------ | ------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| register           |        | `(type: string, factory: ClientFactory<T>, priority = 0): : void` | @description 注册客户端 @param type 客户端类型 @param factory 客户端工厂函数 @param priority 优先级（默认 0） | src/clients/base/registry.ts:44                                                   |
| unregister         |        | `(type: string): : void`                                          | @description 注销客户端 @param type 客户端类型                                                                | src/clients/base/registry.ts:56                                                   |
| getClient          |        | `(type: string): : T`                                             | @description 获取指定类型的客户端实例 @param type 客户端类型 @returns 客户端实例                              | src/clients/base/registry.ts:65                                                   |
| autoSelectClient   |        | `(config: ApiConfig): : BaseClient`                               | @description 根据配置自动选择合适的客户端 @param config API 配置 @returns 匹配的客户端实例                    | src/clients/base/registry.ts:84                                                   |
| getClientByType    |        | `(type: string): : BaseClient                                     | null`                                                                                                         | @description 根据类型获取客户端 @param type 客户端类型 @returns 客户端实例或 null | src/clients/base/registry.ts:119 |
| getAllClients      |        | `(): : BaseClient[]`                                              | @description 获取所有已注册的客户端实例 @returns 客户端实例数组                                               | src/clients/base/registry.ts:131                                                  |
| getRegisteredTypes |        | `(): : string[]`                                                  | @description 获取所有已注册的类型 @returns 类型数组                                                           | src/clients/base/registry.ts:139                                                  |
| getAllMetadata     |        | `(): : ClientMetadata[]`                                          | @description 获取所有客户端的元信息 @returns 客户端元信息数组                                                 | src/clients/base/registry.ts:147                                                  |
| clear              |        | `(): : void`                                                      | @description 清除所有注册的客户端                                                                             | src/clients/base/registry.ts:154                                                  |
| size               |        | `(): : number`                                                    | @description 获取已注册客户端数量                                                                             | src/clients/base/registry.ts:161                                                  |

## ApifoxClient

源文件：`src/clients/implementations/ApifoxClient.ts:23` 限定名：`Users-scx-Documents-code-scx-api-tool.src.clients.implementations.ApifoxClient.ApifoxClient`

| 方法                 | 可见性 | 签名                                                      | 说明                                                                                                                                                                      | 源文件:行号                                                                             |
| -------------------- | ------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| constructor          |        | `(options: ClientOptions = {})`                           | —                                                                                                                                                                         | src/clients/implementations/ApifoxClient.ts:24                                          |
| getMetadata          |        | `(): : ClientMetadata`                                    | @description 获取客户端元信息                                                                                                                                             | src/clients/implementations/ApifoxClient.ts:31                                          |
| supports             |        | `(config: ApiConfig): : boolean`                          | @description 检查配置是否适用于此客户端                                                                                                                                   | src/clients/implementations/ApifoxClient.ts:49                                          |
| normalize            |        | `(rawData: unknown): : OpenApiDocument`                   | @description 将 Apifox 原始数据标准化为标准 OpenAPI 文档 Apifox 导出的参数/响应/请求体字段不完整，需补全默认值并统一为标准格式。 @param rawData Apifox 原始数据 @returns… | src/clients/implementations/ApifoxClient.ts:66                                          |
| normalizeParameters  |        | `(parameters: unknown): : OpenApiOperation['parameters']` | @description 标准化 Apifox 参数（补全缺失的默认字段）                                                                                                                     | src/clients/implementations/ApifoxClient.ts:98                                          |
| normalizeResponses   |        | `(responses: unknown): : Record<string, OpenApiResponse>` | @description 标准化 Apifox 响应（统一为 content 包装格式）                                                                                                                | src/clients/implementations/ApifoxClient.ts:112                                         |
| normalizeRequestBody |        | `(requestBody: any): : OpenApiRequestBody                 | undefined`                                                                                                                                                                | @description 标准化 Apifox 请求体（保留所有 content-type，无 content 时用 schema 兜底） | src/clients/implementations/ApifoxClient.ts:131 |
| fetchDataInternal    |        | `(config: ApiConfig): : Promise<unknown>`                 | @description 内部数据获取实现                                                                                                                                             | src/clients/implementations/ApifoxClient.ts:160                                         |

## ConfigCacheManager

源文件：`src/config/loader.ts:26` 限定名：`Users-scx-Documents-code-scx-api-tool.src.config.loader.ConfigCacheManager`

| 方法   | 可见性 | 签名                                                                | 说明                                                               | 源文件:行号                                                                                            |
| ------ | ------ | ------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| get    |        | `(configPath: string, ttl: number = this.defaultTTL): : ApiConfig[] | null`                                                              | 获取缓存的配置 @param configPath 配置文件路径 @param ttl 缓存有效期（毫秒） @returns 缓存的配置或 null | src/config/loader.ts:36 |
| set    |        | `(configPath: string, config: ApiConfig[]): : void`                 | 设置配置缓存 @param configPath 配置文件路径 @param config 配置对象 | src/config/loader.ts:57                                                                                |
| delete |        | `(configPath: string): : void`                                      | 清除指定配置的缓存 @param configPath 配置文件路径                  | src/config/loader.ts:68                                                                                |
| clear  |        | `(): : void`                                                        | 清除所有缓存                                                       | src/config/loader.ts:75                                                                                |
| size   |        | `(): : number`                                                      | 获取缓存大小                                                       | src/config/loader.ts:82                                                                                |

## BaseError

源文件：`src/errors/errorClasses.ts:38` 限定名：`Users-scx-Documents-code-scx-api-tool.src.errors.errorClasses.BaseError`

| 方法        | 可见性 | 签名                                                                                    | 说明                                                                                                                  | 源文件:行号                    |
| ----------- | ------ | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| constructor |        | `(code: ErrorCode, message: string, solutions: ErrorSolution[], originalError?: Error)` | @param code 错误代码 @param message 错误消息 @param solutions 解决方案列表 @param originalError 原始错误（可选）      | src/errors/errorClasses.ts:60  |
| format      |        | `(verbose = false): : string`                                                           | @description 格式化错误输出为字符串 @param verbose 是否显示详细信息（堆栈跟踪、原始错误） @returns 格式化的错误字符串 | src/errors/errorClasses.ts:84  |
| print       |        | `(verbose = false): : void`                                                             | @description 输出错误到控制台 @param verbose 是否显示详细信息                                                         | src/errors/errorClasses.ts:128 |

## ConfigError

源文件：`src/errors/errorClasses.ts:144` 限定名：`Users-scx-Documents-code-scx-api-tool.src.errors.errorClasses.ConfigError`

| 方法        | 可见性 | 签名                                                                                                                  | 说明                                                                                                                                                   | 源文件:行号                    |
| ----------- | ------ | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| constructor |        | `( message: string, solutions: ErrorSolution[], originalError?: Error, code: ErrorCode = ErrorCode.CONFIG_INVALID, )` | @param message 错误消息 @param solutions 解决方案列表 @param originalError 原始错误（可选） @param code 错误码（默认 CONFIG_INVALID，推荐通过 ErrorFa… | src/errors/errorClasses.ts:151 |

## FetchError

源文件：`src/errors/errorClasses.ts:172` 限定名：`Users-scx-Documents-code-scx-api-tool.src.errors.errorClasses.FetchError`

| 方法        | 可见性 | 签名                                                                                                                        | 说明                                                                                                                                                   | 源文件:行号                    |
| ----------- | ------ | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| constructor |        | `( message: string, solutions: ErrorSolution[], originalError?: Error, code: ErrorCode = ErrorCode.FETCH_REQUEST_FAILED, )` | @param message 错误消息 @param solutions 解决方案列表 @param originalError 原始错误（可选） @param code 错误码（默认 FETCH_REQUEST_FAILED，推荐通过 E… | src/errors/errorClasses.ts:179 |

## GenerateError

源文件：`src/errors/errorClasses.ts:200` 限定名：`Users-scx-Documents-code-scx-api-tool.src.errors.errorClasses.GenerateError`

| 方法        | 可见性 | 签名                                                                                                                           | 说明                                                                                                                                                  | 源文件:行号                    |
| ----------- | ------ | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| constructor |        | `( message: string, solutions: ErrorSolution[], originalError?: Error, code: ErrorCode = ErrorCode.GENERATE_TEMPLATE_ERROR, )` | @param message 错误消息 @param solutions 解决方案列表 @param originalError 原始错误（可选） @param code 错误码（默认 GENERATE_TEMPLATE_ERROR，推荐通… | src/errors/errorClasses.ts:207 |

## SwaggerClient

源文件：`src/clients/implementations/SwaggerClient.ts:15` 限定名：`Users-scx-Documents-code-scx-api-tool.src.clients.implementations.SwaggerClient.SwaggerClient`

| 方法              | 可见性 | 签名                                      | 说明                                                                                                                                       | 源文件:行号                                     |
| ----------------- | ------ | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| constructor       |        | `(options: ClientOptions = {})`           | —                                                                                                                                          | src/clients/implementations/SwaggerClient.ts:16 |
| getMetadata       |        | `(): : ClientMetadata`                    | @description 获取客户端元信息                                                                                                              | src/clients/implementations/SwaggerClient.ts:23 |
| supports          |        | `(config: ApiConfig): : boolean`          | @description 检查配置是否适用于此客户端                                                                                                    | src/clients/implementations/SwaggerClient.ts:48 |
| normalize         |        | `(rawData: unknown): : OpenApiDocument`   | @description 标准化原始数据 Swagger/OpenAPI 端点返回的已是标准格式，原样返回即可 @param rawData 原始获取数据 @returns 标准 OpenApiDocument | src/clients/implementations/SwaggerClient.ts:65 |
| fetchDataInternal |        | `(config: ApiConfig): : Promise<unknown>` | @description 内部数据获取实现                                                                                                              | src/clients/implementations/SwaggerClient.ts:72 |

## 本页确定知道的事实

- 检出类 14 个，成员方法共 56 个
- 带 docstring 说明的方法 47 个

## 未知项

- 图谱无 INHERITS 边：继承树与多态实现未检出
- 9 个方法无 docstring，说明列为确定性摘要缺失（以签名与锚点为准）

## Related

- 同目录：[calls.md](calls.md) · [glossary.md](glossary.md)
- 共享 5 个源文件、共享 5 个符号：[topic:clients-errors-utils.md](../08-topics/clients-errors-utils.md)
- 共享 4 个源文件：[modules.md](../02-architecture/modules.md)
- 共享 3 个源文件：[api.md](../03-interface/api.md)
- 总入口：[README](../README.md)

<!-- wiki:source: fallback -->

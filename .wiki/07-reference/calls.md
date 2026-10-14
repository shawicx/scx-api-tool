# 调用关系

<details>
<summary>Relevant source files</summary>

- src/cli/commands/verify.ts
- src/clients/base/registry.ts
- src/clients/implementations/ApifoxClient.ts
- src/clients/implementations/SwaggerClient.ts
- src/config/loader.ts
- src/errors/errorClasses.ts
- src/errors/errorFactory.ts
- src/generator/template/compiler.ts
- src/utils/escape.ts
- src/utils/logger.ts
- src/utils/redact.ts
- src/validation/errors.ts
- src/clients/index.ts

</details>

调用关系边表（按入口/热点分组）。每条边可被 trace_path / CALLS 查询复现。

## 扇入（被调用次数）

| 符号                  | 文件                               | 扇入 |
| --------------------- | ---------------------------------- | ---- |
| debug                 | src/utils/logger.ts                | 26   |
| error                 | src/utils/logger.ts                | 18   |
| compileTemplate       | src/generator/template/compiler.ts | 16   |
| info                  | src/utils/logger.ts                | 15   |
| sanitizeTypeName      |                                    | 15   |
| createValidationError | src/validation/errors.ts           | 13   |
| success               |                                    | 12   |
| escapeJsDocComment    | src/utils/escape.ts                | 12   |
| warn                  |                                    | 11   |
| sanitizePropertyName  |                                    | 10   |

## collectTypeScriptFiles

入口文件：src/cli/commands/verify.ts

| 调用方                 | 被调用方 | 源文件:行号                   |
| ---------------------- | -------- | ----------------------------- |
| collectTypeScriptFiles | walk     | src/cli/commands/verify.ts:50 |

## checkGeneratedFiles

入口文件：src/cli/commands/verify.ts

| 调用方                 | 被调用方               | 源文件:行号                    |
| ---------------------- | ---------------------- | ------------------------------ |
| checkGeneratedFiles    | collectTypeScriptFiles | src/cli/commands/verify.ts:47  |
| checkGeneratedFiles    | resolveTypescriptPath  | src/cli/commands/verify.ts:82  |
| checkGeneratedFiles    | buildCompilerOptions   | src/cli/commands/verify.ts:106 |
| collectTypeScriptFiles | walk                   | src/cli/commands/verify.ts:50  |

## runTypeCheck

入口文件：src/cli/commands/verify.ts

| 调用方                 | 被调用方                                                                       | 源文件:行号                    |
| ---------------------- | ------------------------------------------------------------------------------ | ------------------------------ |
| runTypeCheck           | loadConfig                                                                     | src/config/loader.ts:173       |
| runTypeCheck           | checkGeneratedFiles                                                            | src/cli/commands/verify.ts:163 |
| checkGeneratedFiles    | collectTypeScriptFiles                                                         | src/cli/commands/verify.ts:47  |
| checkGeneratedFiles    | resolveTypescriptPath                                                          | src/cli/commands/verify.ts:82  |
| checkGeneratedFiles    | buildCompilerOptions                                                           | src/cli/commands/verify.ts:106 |
| loadConfig             | configNotFound                                                                 | src/errors/errorFactory.ts:19  |
| loadConfig             | Users-scx-Documents-code-scx-api-tool.src.config.loader.ConfigCacheManager.get | src/config/loader.ts:36        |
| loadConfig             | debug                                                                          | src/utils/logger.ts:73         |
| loadConfig             | loadConfigImpl                                                                 | src/config/loader.ts:126       |
| loadConfig             | Users-scx-Documents-code-scx-api-tool.src.config.loader.ConfigCacheManager.set | src/config/loader.ts:57        |
| loadConfig             | configParseError                                                               | src/errors/errorFactory.ts:70  |
| collectTypeScriptFiles | walk                                                                           | src/cli/commands/verify.ts:50  |
| configNotFound         | ConfigError                                                                    | src/errors/errorClasses.ts:144 |
| configParseError       | ConfigError                                                                    | src/errors/errorClasses.ts:144 |
| loadConfigImpl         | isProcessedConfig                                                              | src/config/loader.ts:108       |
| loadConfigImpl         | configParseError                                                               | src/errors/errorFactory.ts:70  |

## createApifoxClient

入口文件：src/clients/implementations/ApifoxClient.ts

| 调用方             | 被调用方     | 源文件:行号                                    |
| ------------------ | ------------ | ---------------------------------------------- |
| createApifoxClient | ApifoxClient | src/clients/implementations/ApifoxClient.ts:23 |

## createSwaggerClient

入口文件：src/clients/implementations/SwaggerClient.ts

| 调用方              | 被调用方      | 源文件:行号                                     |
| ------------------- | ------------- | ----------------------------------------------- |
| createSwaggerClient | SwaggerClient | src/clients/implementations/SwaggerClient.ts:15 |

## fetchData

入口文件：src/clients/index.ts

| 调用方           | 被调用方                                                                                          | 源文件:行号                      |
| ---------------- | ------------------------------------------------------------------------------------------------- | -------------------------------- |
| fetchData        | debug                                                                                             | src/utils/logger.ts:73           |
| fetchData        | redactConfig                                                                                      | src/utils/redact.ts:52           |
| fetchData        | Users-scx-Documents-code-scx-api-tool.src.clients.base.registry.ClientRegistry.autoSelectClient   | src/clients/base/registry.ts:84  |
| fetchData        | error                                                                                             | src/utils/logger.ts:107          |
| autoSelectClient | Users-scx-Documents-code-scx-api-tool.src.clients.base.registry.ClientRegistry.getClientByType    | src/clients/base/registry.ts:119 |
| autoSelectClient | configInvalid                                                                                     | src/errors/errorFactory.ts:51    |
| autoSelectClient | Users-scx-Documents-code-scx-api-tool.src.clients.base.registry.ClientRegistry.getRegisteredTypes | src/clients/base/registry.ts:139 |
| redactConfig     | redactToken                                                                                       | src/utils/redact.ts:35           |
| getClientByType  | Users-scx-Documents-code-scx-api-tool.src.clients.base.registry.ClientRegistry.getClient          | src/clients/base/registry.ts:65  |
| configInvalid    | ConfigError                                                                                       | src/errors/errorClasses.ts:144   |

## fetchSwaggerData

入口文件：src/clients/index.ts

| 调用方           | 被调用方                                                                                          | 源文件:行号                      |
| ---------------- | ------------------------------------------------------------------------------------------------- | -------------------------------- |
| fetchSwaggerData | Users-scx-Documents-code-scx-api-tool.src.clients.base.registry.ClientRegistry.getClient          | src/clients/base/registry.ts:65  |
| getClient        | configInvalid                                                                                     | src/errors/errorFactory.ts:51    |
| getClient        | Users-scx-Documents-code-scx-api-tool.src.clients.base.registry.ClientRegistry.getRegisteredTypes | src/clients/base/registry.ts:139 |
| configInvalid    | ConfigError                                                                                       | src/errors/errorClasses.ts:144   |

## fetchApifoxData

入口文件：src/clients/index.ts

| 调用方          | 被调用方                                                                                          | 源文件:行号                      |
| --------------- | ------------------------------------------------------------------------------------------------- | -------------------------------- |
| fetchApifoxData | Users-scx-Documents-code-scx-api-tool.src.clients.base.registry.ClientRegistry.getClient          | src/clients/base/registry.ts:65  |
| getClient       | configInvalid                                                                                     | src/errors/errorFactory.ts:51    |
| getClient       | Users-scx-Documents-code-scx-api-tool.src.clients.base.registry.ClientRegistry.getRegisteredTypes | src/clients/base/registry.ts:139 |
| configInvalid   | ConfigError                                                                                       | src/errors/errorClasses.ts:144   |

## 本页确定知道的事实

- 调用边分组 8 组（入口 8 / 热点锚定 0）
- 调用边共 41 条（每组内已去重）
- 扇入表条目 10 个

## Related

- 同目录：[classes.md](classes.md) · [glossary.md](glossary.md)
- 互补职责：[glossary.md](../07-reference/glossary.md)
- 共享 5 个源文件：[tech-stack.md](../01-overview/tech-stack.md)
- 共享 5 个源文件：[modules.md](../02-architecture/modules.md)
- 共享 5 个源文件：[api.md](../03-interface/api.md)
- 总入口：[README](../README.md)

<!-- wiki:source: fallback -->

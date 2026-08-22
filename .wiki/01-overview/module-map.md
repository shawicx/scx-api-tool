# 模块地图

一句话职责：`src/` 目录 → 职责速查表，用于快速定位代码位置。

## 目录速查

| 目录                        | 职责                                                | 关键文件                                                                                                                                                                                                                                                                                                                    |
| --------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/cli/`                  | CLI 命令与程序入口                                  | `main.ts`（bin 入口）、`program.ts`、`commands/{generate,init,debug,visualize}.ts`、`constants.ts`（默认配置模板）                                                                                                                                                                                                          |
| `src/clients/`              | 插件化 API 数据获取                                 | `base/registry.ts`（注册器）、`base/BaseClient.ts`、`implementations/{SwaggerClient,ApifoxClient}.ts`                                                                                                                                                                                                                       |
| `src/config/`               | 配置文件加载（动态 import + 5s TTL 缓存）           | `loader.ts`                                                                                                                                                                                                                                                                                                                 |
| `src/errors/`               | 分层错误系统                                        | `errorClasses.ts`、`errorCodes.ts`、`errorFactory.ts`                                                                                                                                                                                                                                                                       |
| `src/generator/`            | 代码生成引擎                                        | `index.ts`（`generateCode`）、`codegen.ts`（`generateFiles`）、`extractor.ts`、`fileGenerator.ts`、`fileWriter.ts`、`freeForm.ts`、`propertyType.ts`                                                                                                                                                                        |
| `src/generator/generators/` | 专用生成器                                          | `interfaceGenerator.ts`、`rootIndexGenerator.ts`、`typeGenerator.ts`、`schemaGenerator.ts`、`zodTypesOnlyGenerator.ts`                                                                                                                                                                                                      |
| `src/generator/template/`   | Handlebars 模板引擎                                 | `compiler.ts`、`templateCache.ts`、`templateHelpers.ts`、`templatePartials.ts`、`templateDefinitions.ts`、`interfaceFunctionGenerator.ts`、`requestFileGenerator.ts`、`jsonValueTemplates.ts`、`zod/{interfaces,merged,types}.ts`                                                                                           |
| `src/naming/`               | 命名策略与名称清理（顶层模块，非 generator 子目录） | `strategy.ts`（`defaultNamingStrategy`）、`sanitizer.ts`                                                                                                                                                                                                                                                                    |
| `src/processors/`           | OpenAPI 数据处理                                    | `openapi.ts`（`processOpenApiData`、`ProcessedApiData`）、`common.ts`（`groupInterfacesByTag` 等）                                                                                                                                                                                                                          |
| `src/service/`              | **生成文件的输出目录**（开发用示例，不要手工修改）  | `backend/`（按标签分组的接口文件与 `types/`）                                                                                                                                                                                                                                                                               |
| `src/types/`                | 中心类型系统                                        | `config.ts`（`MultiServiceConfig`/`ApiConfig`）、`api.ts`、`enums.ts`、`hooks.ts`、`output.ts`                                                                                                                                                                                                                              |
| `src/utils/`                | 公共工具                                            | `config.ts`（`defineConfig`/`applyPreset`/`parseSourceUrl`）、`multiService.ts`（`resolveServiceConfigs`）、`logger.ts`、`file.ts`、`escape.ts`、`path.ts`、`pathUtils.ts`、`pathSafety.ts`、`schemaSafety.ts`、`refResolver.ts`、`redact.ts`、`concurrency.ts`、`formatter.ts`、`progress.ts`、`hooks.ts`、`decorators.ts` |
| `src/validation/`           | 配置校验                                            | `index.ts`（`validateConfiguration`）、`validators/{basic,url,logic,serviceDirs}.ts`、`errors.ts`、`reporter.ts`                                                                                                                                                                                                            |
| `src/visualize/`            | `visualize` 命令的 HTML 界面                        | —                                                                                                                                                                                                                                                                                                                           |

## 关键入口点

| 入口            | 路径                        | 说明                                                  |
| --------------- | --------------------------- | ----------------------------------------------------- |
| CLI 入口（bin） | `src/cli/main.ts`           | 可执行入口，`program.parse()`（构建为 `dist/cli.js`） |
| 库入口          | `src/index.ts`              | 纯公共导出（`defineConfig` 等，无 CLI 副作用）        |
| CLI 程序        | `src/cli/program.ts`        | 命令注册                                              |
| 生成主入口      | `src/generator/index.ts`    | `generateCode(configPath)`                            |
| 生成协调器      | `src/generator/codegen.ts`  | `generateFiles(processedData, config)`                |
| OpenAPI 处理器  | `src/processors/openapi.ts` | `processOpenApiData(rawData, config)`                 |
| 配置解析        | `src/utils/multiService.ts` | `resolveServiceConfigs(MultiServiceConfig)`           |
| 数据获取        | `src/clients/index.ts`      | `fetchData(config)`                                   |

## 注意：容易误认的路径

- 模板**不在** `src/templates/`（旧版本位置），而在 `src/generator/template/`（以 TS 字符串常量内联存储，非 `.hbs` 文件）
- 命名策略**不在** `src/generator/naming/`（旧版本位置），而在顶层 `src/naming/`
- Swagger/Apifox 客户端**不是** `src/clients/swagger.ts` / `apifox.ts`（旧版本位置），而是 `implementations/` 下的类 + `base/` 注册器

## Related

- [高层架构](./architecture.md)
- [代码生成引擎](../03-codebase/generator.md)

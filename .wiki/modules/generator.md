# 代码生成引擎 (`src/generator/`)

## 概述

将 `ProcessedApiData` 转化为 TypeScript/JavaScript 文件的代码生成引擎。采用协调器模式，按顺序调度各专用生成器。

## 文件结构

| 文件               | 职责                                                   |
| ------------------ | ------------------------------------------------------ |
| `index.ts`         | `generateCode()` 主入口：加载配置 → 获取 → 处理 → 生成 |
| `codegen.ts`       | `generateFiles()` 协调器，调度各生成器                 |
| `extractor.ts`     | 从 OpenAPI 操作中提取请求/响应属性                     |
| `fileGenerator.ts` | `generateRequestFile()` + 重导出                       |
| `pathUtils.ts`     | 路径工具：别名解析、相对导入路径计算                   |
| `naming.ts`        | 向后兼容重导出（已弃用）                               |

### `generators/` 子目录

| 文件                    | 生成目标                                       |
| ----------------------- | ---------------------------------------------- |
| `interfaceGenerator.ts` | 按标签生成接口文件 + root `index.ts`           |
| `typeGenerator.ts`      | 生成 TypeScript 类型文件（`outputDir/types/`） |
| `schemaGenerator.ts`    | 生成 Zod Schema 文件（`outputDir/schemas/`）   |

### `naming/` 子目录

| 文件           | 职责                                                              |
| -------------- | ----------------------------------------------------------------- |
| `strategy.ts`  | `defaultNamingStrategy` + `applyNamingStrategy()`                 |
| `sanitizer.ts` | 名称清理：`sanitizeTypeName/InterfaceName/ParamName/PropertyName` |
| `index.ts`     | 重导出                                                            |

### `template/` 子目录

| 文件                            | 职责                       |
| ------------------------------- | -------------------------- |
| `compiler.ts`                   | Handlebars 编译 + 缓存     |
| `templateCache.ts`              | Map 缓存                   |
| `templateHelpers.ts`            | 自定义 Handlebars 辅助函数 |
| `templatePartials.ts`           | 自定义 Handlebars 分部模板 |
| `templateDefinitions.ts`        | 所有模板字符串定义         |
| `interfaceFunctionGenerator.ts` | 接口函数代码生成           |
| `requestFileGenerator.ts`       | `request.ts` 文件生成      |

## 生成流程

```
generateCode(configPath)
  ├── loadConfig(configPath)
  ├── beforeGenerate hook
  ├── fetchData(config)
  ├── processOpenApiData(rawData, config)
  ├── generateFiles(processedData, config)
  │     ├── cleanOutputDir()           # 清理输出目录
  │     ├── generateInterfaceFiles()   # 按标签生成接口
  │     ├── generateRequestFile()      # 请求工具文件
  │     └── generateTypeOrSchema()     # 类型 或 Schema
  └── afterGenerate hook
```

## 输出文件生成顺序

1. 清理输出目录（保留 `requestFunctionFilePath`）
2. 接口文件（当 `generateApi` 或 `generateTypes` 为 true）
3. 请求函数文件（当 `generateApi` 为 true）
4. 类型/Schema 文件（当 `generateTypes` 为 true 且 `target !== 'javascript'`）
   - `typesFormat: 'typescript'` → `typeGenerator.ts`
   - `typesFormat: 'zod'` → `schemaGenerator.ts`

## 命名策略

默认命名规则：

| 类型               | 格式                      | 示例                               |
| ------------------ | ------------------------- | ---------------------------------- |
| `interfaceName`    | PascalCase(method + path) | `GET /users/{id}` → `GetUsersById` |
| `functionName`     | camelCase + `Func` 后缀   | `getUsersByIdFunc`                 |
| `requestTypeName`  | `{Interface}RequestType`  | `GetUsersByIdRequestType`          |
| `responseTypeName` | `{Interface}Result`       | `GetUsersByIdResult`               |

可通过 `NamingStrategy` 配置自定义。

## 相关文档

- [架构 → 生成层](../architecture.md#第五层生成-srcgenerator)
- [ADR-001: Handlebars](../decisions.md#adr-001选用-handlebars-作为模板引擎)
- [ADR-004: 可插拔命名策略](../decisions.md#adr-004可插拔命名策略)

# 业务术语表

## 核心概念

### Source（数据源）

提供 API 定义的远程 URL。支持两种类型：

- **Swagger/OpenAPI 3.0**：标准 OpenAPI JSON 端点（如 `https://petstore.swagger.io/v2/swagger.json`）。服务类型自动检测。
- **Apifox**：Apifox 的导出端点（如 `https://api.apifox.com/v1/projects/{id}/export-openapi`）。需要 API Token（`APS-...` 格式）。

服务类型检测在 `src/clients/index.ts` 中通过 URL 模式匹配实现。

### ServerType（服务类型）

```typescript
enum ServerType {
  Apifox = 'apifox',
  Swagger = 'swagger',
}
```

决定使用哪个客户端实现来获取 API 数据。`apifox` 类型对参数标准化和响应结构有特殊处理。

### ProcessedApiData（处理后数据）

由处理层生成的标准化内部数据结构。包含：

- `interfaces`：`Record<string, ApiInterface[]>` —— 按标签名分组的 API 端点
- `types`：`ApiTypeDefinition[]` —— 从 `components.schemas` 提取的类型定义
- `categories`：`ApiCategory[]` —— 标签/分类元数据

这是生成层消费的核心数据结构。

### ApiInterface（API 接口）

表示单个 API 端点，以 `path + method` 为唯一标识：

- `path`：URL 路径（如 `/api/users/{id}`）
- `method`：HTTP 方法（GET、POST、PUT、DELETE 等）
- `operation`：原始 `OpenApiOperation`，包含参数、请求体、响应、标签、摘要

### ApiTypeDefinition（类型定义）

从 OpenAPI `components.schemas` 中提取的命名类型：

- `name`：经过清理的类型名（符合 TypeScript 标识符规范）
- `originalName`：规范中的原始名称
- `schema`：描述类型结构的 `OpenApiSchema`

### Tag / Category（标签/分类）

OpenAPI 标签用于将相关 API 端点分组。每个标签会生成：

- 生成代码中的一个独立输出文件
- 代码库中的逻辑分组（如 `user.ts`、`order.ts`）

## 配置概念

### Preset（预设）

三种预定义的配置级别：

| 预设       | generateApi | generateTypes | typesFormat | comment         | requestMethodStyle |
| ---------- | ----------- | ------------- | ----------- | --------------- | ------------------ |
| `minimal`  | false       | true          | typescript  | false           | CONFIG             |
| `standard` | true        | true          | typescript  | true            | CONFIG             |
| `verbose`  | true        | true          | typescript  | true（缩进: 4） | BOTH               |

合并顺序：`默认值 < 预设值 < 用户配置`。

### TypesFormat（类型格式）

控制生成何种类型定义：

- **`typescript`**：编译时 TypeScript 类型定义（`interface`、`type`）。由 `generators/typeGenerator.ts` 输出。
- **`zod`**：运行时 Zod 验证 Schema。由 `generators/schemaGenerator.ts` 输出。支持运行时输入/输出验证。

### Target（目标语言）

- **`typescript`**（默认）：生成 `.ts` 文件，包含完整类型注解。
- **`javascript`**：生成 `.js` 文件。无论 `typesFormat` 设置如何，所有 TypeScript 专属输出（类型、Zod Schema）均被跳过。

### RequestMethodStyle（请求方法风格）

控制生成请求函数的调用风格：

- **`CONFIG`**：标准 `request(config)` 风格 —— 单一函数，所有参数在 config 对象中。
- **`METHOD_SPECIFIC`**：方法特定风格，如 `request.get(url, config)`、`request.post(url, data, config)`。
- **`BOTH`**：同时生成两种风格，由用户选择使用方式。

### NamingStrategy（命名策略）

一个可插拔接口，允许用户完全覆盖默认命名逻辑：

```typescript
interface NamingStrategy {
  interfaceName?: (ctx: NamingContext) => string;
  functionName?: (ctx: NamingContext) => string;
  requestTypeName?: (ctx: NamingContext) => string;
  responseTypeName?: (ctx: NamingContext) => string;
}
```

`NamingContext` 提供：`path`、`method`、`summary`、`description`、`operationId`、`tags`、`config`。

默认命名策略位于 `src/generator/naming/strategy.ts`，名称清理逻辑在 `sanitizer.ts` 中。

### Hooks（钩子）

用于自定义生成过程的生命周期钩子：

| 钩子              | 签名                            | 用途                    |
| ----------------- | ------------------------------- | ----------------------- |
| `beforeGenerate`  | `() => void`                    | 所有文件生成前执行      |
| `afterGenerate`   | `() => void`                    | 所有文件生成后执行      |
| `beforeWriteFile` | `(filePath, content) => string` | 写入前拦截/修改文件内容 |
| `afterWriteFile`  | `(filePath) => void`            | 单个文件写入后的回调    |

## 生成概念

### 接口文件（Interface File）

按标签生成。包含该标签分组下所有 API 的请求函数及其类型注解。模板：`src/templates/interface.ts`。

### 请求函数文件（Request Function File）

一个工具文件（默认：`request.ts`），提供基础请求基础设施。包含请求函数和方法特定的别名。模板：`src/templates/request.ts`。

### 类型文件（Type File）

从 `components.schemas` 提取的独立 TypeScript 类型定义。仅在 `target: 'typescript'` 且 `typesFormat: 'typescript'` 时生成。模板：`src/templates/type.ts`。

### Schema 文件（Schema File）

Zod 验证 Schema。仅在 `target: 'typescript'` 且 `typesFormat: 'zod'` 时生成。模板：`src/templates/schema-zod/`。

## OpenAPI 处理概念

### $ref 引用解析

OpenAPI 规范使用 `$ref`（如 `#/components/schemas/User`）引用共享 Schema。处理器会解析这些引用，将实际类型定义内联展开。

### 参数标准化

来自不同来源（Apifox vs 标准 OpenAPI）的参数被标准化为统一格式：

- 路径参数：`in: 'path'`
- 查询参数：`in: 'query'`
- 请求头参数：`in: 'header'`
- 请求体：从 `requestBody.content` 中提取

### 响应提取

200/201 响应的 Schema 被提取为主要响应类型。支持：

- 直接 Schema 定义
- 指向 components 的 `$ref` 引用
- 数组包装
- 嵌套对象

### pathPrefix（路径前缀）

一个可配置的前缀，在生成时添加到所有 API 路径。当前端使用的路径与 API 定义不同时非常有用。

## 错误系统

### 错误码体系

错误码按模块分段，格式为 `Exxxx`：

| 范围  | 类              | 说明                                     |
| ----- | --------------- | ---------------------------------------- |
| E1xxx | `ConfigError`   | 配置加载、解析、验证错误                 |
| E2xxx | `FetchError`    | API 数据获取错误（认证、超时、网络）     |
| E3xxx | `GenerateError` | 代码生成错误（模板、写入、类型、Schema） |

### ErrorFactory

工厂模式创建错误实例。所有模块应通过 `ErrorFactory` 方法（如 `configNotFound()`、`unauthorized()`、`templateError()`）创建错误，而非直接 `throw new Error()`。

每个错误附带 `solutions` 数组，提供可操作的修复建议。

## 工具概念

### chineseToPinyinCamelCase（中文拼音转换）

将中文字符串转为拼音驼峰格式。用于将中文 OpenAPI 标签（如"用户管理"）转为有效的目录名（`YongHuGuanLi`）。基于 `pinyin-pro` 库。

## 输出目录结构

```
outputDir/
├── [tag1].ts          # tag1 的接口文件
├── [tag2].ts          # tag2 的接口文件
├── request.ts         # 请求工具文件
├── types/
│   └── index.ts       # 类型定义（typescript 格式）
│   └── [typeName].ts  # 单独的类型文件
├── schemas/
│   └── index.ts       # Zod Schema（zod 格式）
│   └── [schemaName].ts # 单独的 Schema 文件
```

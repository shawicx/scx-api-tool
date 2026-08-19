# 术语表

一句话职责：本项目核心概念与词汇速查，标注代码出处。

## 配置概念

### MultiServiceConfig（多服务用户配置）

用户在 `api-power.config.ts` 中提供给 `defineConfig()` 的配置类型：顶层为公共配置（`CommonServiceConfig`）+ `baseOutputDir?` + `services: ServiceConfig[]`。定义于 `src/types/config.ts`。

### ServiceConfig（单服务配置）

`extends CommonServiceConfig`：必填 `name`（全局唯一）、`source`；可选 `token`、`folder`（相对 `baseOutputDir` 的子目录，默认取 `name`，支持多段如 `'trade/order'`）。其余字段可覆盖公共默认值。

### baseOutputDir（公共根输出目录）

所有服务输出的公共根目录，默认 `'src/service'`。单服务的实际输出目录 = `join(baseOutputDir, folder ?? name)`。取代旧版顶层 `outputDir`。

### CommonServiceConfig（公共配置）

既可出现在顶层（所有服务的默认值），也可出现在单个 service 中（覆盖默认值）的字段集合：`preset`、`generateApi`、`generateTypes`、`typesFormat`、`target`、`transformPath`、`indentSize`、`comment`、`requestFunctionFilePath`、`requestMethodStyle`、`namingStrategy`、`concurrency`、`hooks` 等。不含 `source`/`token`（服务级专属）。

### ApiConfig（单服务运行时配置）

`defineConfig` / `resolveServiceConfigs` 展开后的完整单服务配置：公共字段全部填充默认值 + `serverUrl`/`serverType`/`apifoxProjectId`（从 source 解析）+ `outputDir`（计算得出）+ `transformPath`（规范化为函数）。`ApiConfig[]` 是 CLI 各阶段的操作单元。

### resolveServiceConfigs（多服务解析）

`src/utils/multiService.ts` 的核心函数：校验 → 公共配置应用 preset → 逐服务浅合并并计算 outputDir → 返回 `ApiConfig[]`。`defineConfig()` 即它的别名封装。

### Preset（预设）

三种预定义配置级别（`PRESETS`，`src/types/config.ts`）：`minimal`（仅类型）、`standard`（接口+类型+注释）、`verbose`（全量+缩进 4+BOTH 风格）。合并顺序 `默认值 < 预设值 < 用户配置`；**仅作用于公共配置层**。

### TypesFormat（类型格式）

`'typescript'`（编译时类型，`typeGenerator`）或 `'zod'`（运行时验证 Schema，`schemaGenerator`）。

### Target（目标语言）

`'typescript'`（默认）或 `'javascript'`（全部输出 `.js`，跳过类型与 Zod，`getFileExtension()` 切换扩展名）。

### RequestMethodStyle（请求方法风格）

`CONFIG`（单一 `request(config)`）、`METHOD_SPECIFIC`（`request.get/post(...)`）、`BOTH`。

### NamingStrategy（命名策略）

可插拔命名接口：`interfaceName` / `functionName` / `requestTypeName` / `responseTypeName`，接收 `NamingContext`（path/method/tags/operationId/config）。默认策略见 `src/naming/strategy.ts`。

### Hooks（钩子）

`CliHooks`（`src/types/hooks.ts`）：`beforeGenerate` / `afterGenerate`（整体一次，多服务取首个服务的 hooks）、`beforeWriteFile`（可修改内容）/ `afterWriteFile`（逐文件）。

## 数据概念

### Source（数据源）

提供 API 定义的远程 URL。主机名含 `apifox.com` → Apifox（需 `APS-...` Token，路径含项目 ID）；否则 → Swagger/OpenAPI。检测逻辑 `parseSourceUrl()`（`src/utils/config.ts`）。

### ServerType（服务类型）

枚举（`src/types/enums.ts`）：`Apifox = 'apifox'`、`Swagger = 'swagger'`。决定客户端选择。

### ProcessedApiData（处理后数据）

`processOpenApiData()` 的输出（`src/processors/openapi.ts`）：`interfaces: ApiInterface[]`（平铺数组，**非**按标签的 Record）、`types: ApiTypeDefinition[]`、`categories: ApiCategory[]`。生成层消费的核心结构。

### ApiInterface（API 接口）

单个 API 端点（`path + method` 唯一标识），携带原始 `OpenApiOperation`（参数、请求体、响应、标签、摘要）。

### ApiTypeDefinition（类型定义）

从 `components.schemas` 提取的命名类型：`name`（清理后）、`originalName`、`schema`。

### Tag / Category（标签/分类）

OpenAPI 标签用于端点分组，每个标签生成一个独立接口文件；中文标签经 `chineseToPinyinCamelCase()`（`src/utils/path.ts`）转为拼音驼峰目录名（如"用户管理" → `YongHuGuanLi`）。

### 路径参数插值（Path Parameter Interpolation）

OpenAPI 路径 `{param}` → 模板字符串（`/api/v1/stock/{code}` → `` `/api/v1/stock/${params.code}` ``）；无参数时保持单引号字面量。实现：`extractor.ts` 的 `extractPathParameterNames` + `utils/escape.ts` 的 `interpolatePathParams`。path 参数仍保留在 `RequestType` 接口中。

### transformPath（路径转换函数）

`(path: string) => string`，默认恒等。用于前后端路径不一致时改写（如去 `/api` 前缀）。字符串形式自 0.6.0 起硬移除；函数抛错/返回非字符串 → `E3005`。

### JsonValue（递归自由格式类型）

对 `additionalProperties: true` / Jackson 动态类型（如 `JsonNode`）的 schema 生成的递归类型，替代 `any`。检测与生成在 `src/generator/freeForm.ts`。

## 架构概念

### clientRegistry（客户端注册器）

`src/clients/base/registry.ts`：按优先级注册客户端工厂（swagger=10、apifox=5），`autoSelectClient(config)` 自动路由，`fetchData()` 是统一入口。外部可注册自定义客户端。

### ProcessedConfig 约定

配置文件约定 `export default defineConfig({...})`，导出值已是 `ApiConfig[]`；`loadConfig()` 用 `isProcessedConfig` 类型守卫校验，不合规抛 `E1003`。

### 错误码体系

`Exxxx`：E1xxx 配置（ConfigError）/ E2xxx 获取（FetchError）/ E3xxx 生成（GenerateError）。详见 [错误系统与日志](../03-codebase/errors-and-logging.md)。

## Related

- [配置体系](../02-getting-started/configuration.md)
- [项目总览](../01-overview/project-overview.md)

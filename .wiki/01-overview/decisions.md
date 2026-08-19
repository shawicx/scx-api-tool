# 架构决策记录 (ADR)

一句话职责：记录重大技术选型的背景、决策与影响。ADR-001 ~ ADR-010 延续自历史版本，ADR-011 为多服务配置重构（0.6.x 破坏式变更）。

## ADR-001：选用 Handlebars 作为模板引擎

**状态**：已采纳

**背景**：代码生成器需要产出包含动态内容（接口名、类型、请求函数）的 TypeScript/JavaScript 文件，需要支持分部模板、辅助函数和缓存。

**决策**：使用 Handlebars.js，配合自定义缓存层。

**理由**：语法成熟通用；Partials 支持跨模板复用；自定义辅助函数支持领域特定转换；`templateCache.ts` 避免 watch 模式下重复编译；模板以 TS 字符串常量内联（`src/generator/template/templateDefinitions.ts` 等），保持构建简单。

**影响**：新增模板功能需在 `templateHelpers.ts` 注册辅助函数；模板调试比文件式模板略难。

---

## ADR-002：选用 tsdown (rolldown) 作为构建工具

**状态**：已采纳

**决策**：使用 tsdown（基于 Rust 的 rolldown）构建，ESM 优先输出，自动生成 `.d.ts`。

**影响**：构建输出仅支持 ESM；配置见 `tsdown.config.ts`。

---

## ADR-003：双客户端架构（Swagger + Apifox）

**状态**：已采纳（已演进为插件化注册器）

**背景**：需同时支持标准 OpenAPI/Swagger 端点与 Apifox 私有 API 格式（APS Token 认证、非标准响应结构）。

**决策**：最初为调度器模式（独立 `swagger.ts`/`apifox.ts`）；现已演进为**插件化注册器**：`src/clients/base/registry.ts` 的 `clientRegistry.register(type, factory, priority)` 按优先级注册（swagger=10、apifox=5），`fetchData()` 经 `autoSelectClient()` 自动路由。

**理由**：新增数据源只需实现 BaseClient 并注册，无需修改调度逻辑；`clientRegistry` 已从 `src/clients/index.ts` 导出，允许外部注册自定义客户端。

**影响**：`fetchSwaggerData` / `fetchApifoxData` 旧 API 标记 `@deprecated`，仅为向后兼容保留。

---

## ADR-004：可插拔命名策略

**状态**：已采纳

**决策**：`NamingStrategy` 接口提供 4 个可覆盖方法：`interfaceName`、`functionName`、`requestTypeName`、`responseTypeName`；`NamingContext` 提供 path/method/tags/operationId/config 等上下文；未覆盖部分回落到 `defaultNamingStrategy`。

**影响**：命名模块位于顶层 `src/naming/`（非 generator 子目录），processors 与 generator 共用。默认命名规则见 [代码生成引擎 → 命名策略](../03-codebase/generator.md#命名策略)。

---

## ADR-005：分层合并的配置预设

**状态**：已采纳（多服务化后 preset 仅作用于公共配置层）

**决策**：3 种预设（`minimal` / `standard` / `verbose`），合并顺序 `默认值 < 预设值 < 用户配置`。`PRESETS` 定义于 `src/types/config.ts`。

**影响**：多服务模型下 preset 在公共配置层应用后被各 service 浅合并覆盖（service 不可单独指定 preset）；`defineConfig()` 提供类型检查与 IDE 补全。

---

## ADR-006：仅支持 ESM，要求 Node.js >= 20

**状态**：已采纳

**决策**：`"type": "module"`，Node.js >= 20.0.0。

**影响**：用户必须 `import`；配置文件支持 `.ts` / `.js` / `.mjs`（loader 经 `pathToFileURL` 动态 import）。

---

## ADR-007：文件生成的并发控制

**状态**：已采纳

**决策**：`concurrency` 配置项（默认 50）限制并行文件写入，实现位于 `src/utils/concurrency.ts`（`executeWithConcurrency`）。默认配置模板中示例值为 5。

---

## ADR-008：JavaScript 目标模式

**状态**：已采纳

**决策**：`target: 'javascript'` 时所有输出扩展名变为 `.js`（`getFileExtension()`），跳过 TS 类型与 Zod Schema，`requestFunctionFilePath` 默认值自动从 `.ts` 调整为 `.js`。`typesFormat` 在该模式下被忽略。

---

## ADR-009：中文标签拼音化目录命名

**状态**：已采纳

**决策**：`pinyin-pro` 将中文标签转为拼音驼峰目录名（如"用户管理" → `YongHuGuanLi`），实现于 `src/utils/path.ts` 的 `chineseToPinyinCamelCase()`。非中文字符保持原样。

---

## ADR-010：分层错误系统

**状态**：已采纳

**决策**：`BaseError` + 三大子类（`ConfigError` E1xxx / `FetchError` E2xxx / `GenerateError` E3xxx）+ `ErrorFactory` 工厂；每个错误附带 `solutions` 修复建议。详见 [错误系统与日志](../03-codebase/errors-and-logging.md)。

---

## ADR-011：多服务（microservice）配置模型

**状态**：已采纳（0.6.x，**破坏式、不向后兼容**）

**背景**：此前一份配置只能描述一个数据源（顶层 `source`/`token`/`outputDir`），微服务场景需要维护多份配置文件、多次执行生成。

**决策**：`defineConfig` 改为接收 `MultiServiceConfig`：顶层为公共配置（`CommonServiceConfig`）+ `baseOutputDir`（默认 `'src/service'`）+ `services: ServiceConfig[]`；`source`/`token` 下沉到每个服务（必填 `name`，可选 `folder`，默认取 `name`，支持多段如 `'trade/order'`）。`defineConfig` 返回 `ApiConfig[]`（单源即数组长度 1）。

**理由**：

- 一份配置、一条命令管理多个后端服务
- `resolveServiceConfigs()`（`src/utils/multiService.ts`）统一校验并展开为 `ApiConfig[]`：校验服务名唯一、各服务 `outputDir` 不相同不嵌套（`validators/serviceDirs.ts`，否则抛校验错误）
- `generateCode()` 并发拉取各服务数据（`Promise.all`）、串行逐服务生成（避免 `cleanOutputDir` 相互清理）
- 共享 `requestFunctionFilePath` 语义调整：位于 `baseOutputDir` 层级，各服务输出至 `join(baseOutputDir, folder ?? name)`

**影响**：

- 顶层 `outputDir` 改名 `baseOutputDir`，`source`/`token` 移入 `services[]`（旧配置报校验错误）
- `loadConfig()` 返回 `ApiConfig[]`；配置文件必须 `export default defineConfig({...})`，loader 以类型守卫校验导出格式
- 单源场景使用 `services: [{ name: 'main', folder: '.', source, token }]`，输出直接落在 `baseOutputDir`
- 迁移指南见 `docs/guides/migration.md`

## Related

- [配置体系](../02-getting-started/configuration.md)
- [配置加载与校验](../03-codebase/config-and-validation.md)

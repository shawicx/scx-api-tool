# 架构决策记录 (ADR)

## ADR-001：选用 Handlebars 作为模板引擎

**状态**：已采纳

**背景**：代码生成器需要产出包含动态内容（接口名、类型、请求函数）的 TypeScript/JavaScript 文件。我们需要一个支持分部模板、辅助函数和缓存的模板系统。

**决策**：使用 Handlebars.js 作为模板引擎，并配合自定义缓存层。

**理由**：

- Handlebars 提供成熟、广泛理解的模板语法
- Partials 支持跨模板的代码复用（函数体、导入语句）
- 自定义辅助函数支持领域特定的转换（字符串大小写、类型映射）
- 模板缓存（`templateCache.ts`）避免 watch 模式下的重复编译开销
- 模板以 TypeScript 字符串常量存储（而非外部文件），保持构建简单

**影响**：

- 模板定义以 TS 文件形式内联在 `src/templates/` 中，而非 `.hbs` 文件
- 添加新模板功能需要在 `templateHelpers.ts` 中注册新辅助函数
- 模板调试比文件式模板略难

---

## ADR-002：选用 tsdown (rolldown) 作为构建工具

**状态**：已采纳

**背景**：项目需要将 TypeScript 源码打包为可分发的 Node.js CLI 工具。可选方案包括 tsup、tsdown、unbuild 和原生 tsc。

**决策**：使用 tsdown（基于 rolldown）作为构建工具。

**理由**：

- tsdown 是 tsup 的现代继任者，基于 Rust 实现的 rolldown 打包器
- 原生 Rust 性能带来极速构建
- ESM 优先输出，支持 TypeScript 声明文件生成
- 通过 `tsdown.config.ts` 进行简洁配置
- 积极开发中，与 rolldown 生态系统保持一致

**影响**：

- 构建输出仅支持 ESM
- 声明文件（`.d.ts`）自动生成
- 模板文件在构建时复制到 `dist/`

---

## ADR-003：双客户端架构（Swagger + Apifox）

**状态**：已采纳

**背景**：工具需要支持从标准 OpenAPI/Swagger 端点和 Apifox 私有 API 格式获取 API 定义。Apifox 有非标准的扩展和响应结构。

**决策**：采用调度器模式实现独立的客户端模块。

**理由**：

- 关注点分离：每个客户端处理自己的 API 格式
- 通过 URL 模式自动检测服务类型，无需手动配置
- Apifox 客户端可处理其特定的认证（APS Token）和格式差异
- `clients/index.ts` 中的调度器提供统一的 `fetchData()` 接口
- 未来易于添加新数据源（如 GraphQL、Postman）

**影响**：

- 新增客户端时需要维护 `ServerType` 枚举
- 处理层需要处理不同客户端间的格式差异

---

## ADR-004：可插拔命名策略

**状态**：已采纳

**背景**：不同团队对生成代码有不同的命名约定。默认命名可能不适合所有项目（如有的偏好 camelCase，有的偏好带特定前缀的 PascalCase）。

**决策**：实现 `NamingStrategy` 接口，允许用户覆盖任意命名函数。

**理由**：

- `NamingStrategy` 提供 4 个可覆盖的方法：`interfaceName`、`functionName`、`requestTypeName`、`responseTypeName`
- `NamingContext` 提供所有必要信息（path、method、tags、operationId 等）
- 未提供自定义策略时使用默认策略
- 策略模式支持部分覆盖 —— 用户可以只覆盖需要的部分

**影响**：

- 默认命名策略需要充分文档化，方便需要覆盖的用户参考
- 命名策略接收完整配置，支持上下文感知命名

---

## ADR-005：分层合并的配置预设

**状态**：已采纳

**背景**：用户有不同需求 —— 有的只需要最少输出（仅类型），有的需要全部功能。逐项管理配置容易出错。

**决策**：实现 3 种预设（`minimal`、`standard`、`verbose`），配合分层配置合并。

**理由**：

- 预设覆盖常见用例，用户无需理解所有选项
- 分层合并：`默认值 < 预设值 < 用户配置`，确保用户覆盖始终优先
- `defineConfig()` 辅助函数提供类型检查和 IDE 自动补全
- 验证层捕获冲突或无效配置

**影响**：

- 新增配置选项需要同步更新默认值、预设和验证逻辑
- 合并逻辑需要正确处理 `undefined` 与显式 `false` 的区别

---

## ADR-006：仅支持 ESM，要求 Node.js >= 20

**状态**：已采纳

**背景**：项目需要在 CommonJS 和 ESM 模块系统间做出选择，并设定最低 Node.js 版本。

**决策**：仅使用 ESM（`"type": "module"`），要求 Node.js >= 20.0.0。

**理由**：

- 现代 Node.js 已全面支持 ESM
- ESM 支持 tree-shaking 和更好的静态分析
- package.json 中的 `exports` 字段提供清晰的导入路径
- Node.js 20 LTS 确保可使用现代 API（如 `fetch`、稳定的测试运行器）
- 无需维护 CJS/ESM 双重兼容

**影响**：

- 用户必须使用 `import` 语法，不能使用 `require()`
- 配置文件必须是 `.ts`、`.mts` 或 `.mjs`（不支持 `.cjs`）
- 部分旧工具可能存在兼容性问题

---

## ADR-007：文件生成的并发控制

**状态**：已采纳

**背景**：同时生成大量文件可能导致文件系统过载，在某些平台上引发问题。

**决策**：通过 `concurrency` 配置项实现可配置的并发控制。

**理由**：

- `concurrency` 设置（默认值：5）限制并行文件写入数量
- 防止 API 端点较多的项目出现文件系统抖动
- 用户可根据系统能力自行调整
- 实现位于 `src/utils/concurrency.ts`

**影响**：

- 默认值 5 在不同环境下可能需要调优
- 并发数过低会导致大型 API 规范的生成速度变慢

---

## ADR-008：JavaScript 目标模式

**状态**：已采纳

**背景**：并非所有生成代码的消费者都使用 TypeScript。部分项目需要纯 JavaScript 输出。

**决策**：支持 `target: 'javascript'`，生成 `.js` 文件并跳过所有 TypeScript 专属输出。

**理由**：

- `getFileExtension()` 辅助函数根据 target 在 `.ts` 和 `.js` 之间切换
- JavaScript 模式完全跳过类型定义和 Zod Schema
- `requestFunctionFilePath` 默认值自动从 `.ts` 调整为 `.js`
- 为非 TypeScript 项目提供干净的退出路径

**影响**：

- `target: 'javascript'` 时 `typesFormat` 设置被忽略
- 生成的 JavaScript 没有类型安全或运行时验证

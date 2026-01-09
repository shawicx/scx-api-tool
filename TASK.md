# @scxfe/api-tool 优化迭代路线图

> **项目定位**: Node.js CLI 工具，从 Swagger/OpenAPI 3.0 和 Apifox 平台生成 TypeScript/JavaScript 代码

> **最后更新**: 2026-01-09

---

## 📋 目录

- [迭代策略](#迭代策略)
- [Phase 1: 性能优化](#phase-1-性能优化)
  - [1.1 并发文件写入](#11-并发文件写入)
  - [1.2 模板编译缓存](#12-模板编译缓存)
  - [1.3 流式生成（可选）](#13-流式生成可选)
  - [1.4 构建产物优化（可选）](#14-构建产物优化可选)
- [Phase 2: 开发体验](#phase-2-开发体验)
- [Phase 3: 高级特性](#phase-3-高级特性)
- [Phase 4: 生态扩展](#phase-4-生态扩展)

---

## 🎯 迭代策略

### 核心原则

1. **简单优先** - 用最小复杂度获得最大收益
2. **向后兼容** - 所有新功能通过配置开关控制，默认关闭
3. **渐进增强** - 每个阶段独立可验收，不依赖后续阶段
4. **性能导向** - 优先优化影响最频繁的路径（生成代码）

### 技术约束

- ✅ **可自行实现**: HTTP 客户端、多环境配置（用户可在 request 函数中处理）
- ❌ **暂不实现**: 数据缓存（API 变更导致频繁失效）、增量构建（复杂度高收益低）
- ❌ **暂不实现**: 变更日志（数据量大时性能问题）、复杂插件系统

---

## Phase 1: 性能优化 🚀

**目标**: 将生成时间从 10s+ 降至 5s 以内（针对 500+ 接口项目）

**核心理念**: 用 2-3 天工作量获得 60-70% 性能提升，而非 6-9 天获得 80-90% 提升

**已完成优化**（2026-01-02）：

- ✅ **并发文件写入**（Phase 1.1）- 已实现并测试完成
- ✅ **模板编译缓存**（Phase 1.2）- 已实现并测试完成

### 1.3 流式生成（可选，仅在需要时实现）

**问题**: 大型项目（1000+ 接口）需要等待全部数据拉取完才开始生成

**解决方案**: 拉取数据时边解析边生成，提升用户体验

#### 实现要点

```typescript
// 当前流程（串行）
fetch data → parse all → generate all

// 优化后（流式）
fetch data → parse chunk → generate chunk → repeat
```

#### Task List

- [ ] **1.3.1** 评估是否需要实现
  - [ ] 完成 1.1 和 1.2 后测试性能
  - [ ] 如果大型项目（1000+ 接口）生成时间 < 8s，则跳过
  - [ ] 否则考虑实现

- [ ] **1.3.2** 流式生成实现（如需要）
  - [ ] 修改 `src/clients/` 支持流式解析
  - [ ] 修改 `src/processors/` 支持增量处理
  - [ ] 修改 `src/generator/` 支持分批生成
  - [ ] 测试验证

**预期收益**:

- 用户体验提升（开始输出更早）
- 超大型项目（1000+ 接口）效果明显

**工作量估算**: 1 天

**技术风险**: 中（需要重构数据流程）

**实施条件**: 仅在 1.1 + 1.2 优化后仍不满足性能需求时实现

---

### 1.4 构建产物优化（可选）

**问题**: 构建产物存在优化空间，主要是模板字符串占用体积较大

**当前状态分析** (2026-01-01):

```
构建产物总大小: 640KB
  - JavaScript: 111.54 KB
  - TypeScript 声明文件: ~500KB
  - 其他：~30KB

压缩后总大小（gzip）: ~30KB
```

#### 最大的 5 个文件

| 文件                          | 大小   | 占比 | 内容                      |
| ----------------------------- | ------ | ---- | ------------------------- |
| `template-BF79NszS.js`        | 10.3KB | 9.2% | **Handlebars 模板字符串** |
| `fileGenerator-DUwkwEko.js`   | 5.1KB  | 4.6% | 文件生成逻辑              |
| `basic-CmTRZ1v1.js`           | 4.7KB  | 4.2% | **验证逻辑和错误消息**    |
| `NetworkProgress-CT7IXXlw.js` | 3.5KB  | 3.1% | 网络进度组件              |
| `FileProgress-BhejM7o5.js`    | 2.8KB  | 2.5% | 文件进度组件              |

#### 识别的问题

1. **模板字符串占用空间大** (优先级：⭐⭐⭐⭐⭐)
   - 每次运行都需要重新编译模板
   - 增加构建产物体积 ~9%
   - 浪费 CPU 时间和内存

2. **错误消息冗长** (优先级：⭐⭐⭐)
   - 详细错误消息占用 ~4.2% 体积
   - 大部分用户永远看不到所有错误

3. **依赖项未完全优化** (优先级：⭐⭐)
   - `handlebars` (4.7KB) 可考虑替换为更轻量的 `eta` (2.5KB)

#### 可选优化方案

- [ ] **1.4.1** 模板外部化（推荐在 Phase 3.3 实现）
  - [ ] 将模板字符串移到独立的 `.hbs` 文件
  - [ ] 支持自定义模板
  - [ ] 减少构建产物体积 ~8KB

  **预期收益**: 体积减少 8KB + 可扩展性
  **工作量**: 1-2 天
  **优先级**: ⭐⭐⭐⭐

- [ ] **1.4.2** 简化错误消息
  - [ ] 重构 `validation/validators/basic.ts`
  - [ ] 使用错误代码 + 文档链接的方式
  - [ ] 保留关键错误信息，移除冗余示例

  **预期收益**: 体积减少 2-3KB
  **工作量**: 1 天
  **优先级**: ⭐⭐⭐

- [ ] **1.4.3** 替换模板引擎
  - [ ] 评估 `eta` 作为 `handlebars` 的替代品
  - [ ] 测试兼容性和性能
  - [ ] 迁移现有模板

  **预期收益**: 体积减少 2KB + 性能提升 5-10%
  **工作量**: 2 天
  **优先级**: ⭐⭐

#### 优化潜力总结

| 优化方案         | 体积减少 | 性能提升 | 工作量 | 优先级     |
| ---------------- | -------- | -------- | ------ | ---------- |
| **模板编译缓存** | 0%       | 10-20%   | 0.5天  | ⭐⭐⭐⭐⭐ |
| **模板外部化**   | ~8KB     | 0%       | 1-2天  | ⭐⭐⭐⭐   |
| **简化错误消息** | ~3KB     | 0%       | 1天    | ⭐⭐⭐     |
| **替换模板引擎** | ~2KB     | 5-10%    | 2天    | ⭐⭐       |

**建议**: 模板外部化和简化错误消息建议在 Phase 3（高级特性）中实施，作为"自定义模板系统"的一部分。

---

## Phase 2: 开发体验 🛠️

**目标**: 提升易用性和可维护性

**已完成功能**（2026-01-02 至 2026-01-08）：

- ✅ **自动清理输出目录**（Phase 2.0）- 已实现并测试完成
- ✅ **自定义命名策略**（Phase 2.1）- 已实现并测试完成

### 2.2 配置可视化工具

**问题**: 修改配置需要编辑文件，不够直观

**解决方案**: 轻量级 Web Server（单文件 HTML）

#### 技术方案

- 使用原生 Node.js `http` 模块（零依赖）
- 返回单页应用 SPA
- 提供：
  - 配置编辑器
  - API Schema 浏览器
  - 代码生成预览

#### Task List

- [x] **2.2.1** 创建可视化服务器
  - [x] 创建 `src/cli/commands/visualize.ts`
  - [x] 实现基础 HTTP server
  - [x] 添加 `/` 路由（返回 HTML）
  - [x] 添加 `/api/config` 路由（返回当前配置）
  - [x] 添加 `/api/schema` 路由（返回 OpenAPI 数据）

**实现状态**: ✅ 已完成（2026-01-03）

**实现方式**:

- 使用原生 Node.js `http` 模块创建服务器（零依赖）
- 支持自定义端口和主机配置
- HTML 文件通过构建配置自动复制到 dist 目录
- 提供完整的错误处理和调试日志

**实际收益**:

- 提供友好的 Web 界面查看配置和 API Schema
- 支持实时预览生成的代码
- 降低配置门槛

**工作量估算**: 1 天（实际已完成）

- [x] **2.2.2** 创建前端界面
  - [x] 创建 `src/visualize/index.html`
  - [x] 实现配置表单（基于 JSON Schema）
  - [x] 实现 API 列表视图（表格展示）
  - [x] 实现代码预览（语法高亮）
  - [x] 添加"生成代码"按钮（调用后端 API）

**实现状态**: ✅ 已完成（2026-01-03）

**实现方式**:

- 单页应用（SPA），使用原生 JavaScript
- 三个标签页：配置信息、API Schema、代码预览
- 实时从后端 API 加载数据
- 响应式设计，支持移动端

- [ ] **2.2.3** 集成和测试
  - [ ] 添加自动打开浏览器功能
  - [ ] 添加热重载（配置变更时刷新）
  - [ ] 测试不同配置的显示效果

- [ ] **2.2.4** 文档
  - [ ] 在 README.md 添加可视化工具说明
  - [ ] 添加截图/GIF 演示

**预期收益**: 降低配置门槛，减少配置错误

**工作量估算**: 4-5 天

---

### 2.3 智能合并冲突处理

**问题**: 用户修改生成的文件后，重新生成会被覆盖

**解决方案**: 用户代码保护区域

#### 实现要点

- [ ] 识别用户自定义代码区域（使用标记注释）
- [ ] 生成时保留用户代码
- [ ] 支持三种策略：保留 / 覆盖 / 询问

```typescript
interface MergeStrategy {
  userCodeRegions: {
    enabled: boolean;
    startMarker: string; // 默认: // @user-code-start
    endMarker: string; // 默认: // @user-code-end
  };
  onConflict: 'preserve' | 'overwrite' | 'ask';
}
```

#### Task List

- [ ] **2.3.1** 实现用户代码检测
  - [ ] 创建 `src/utils/merge.ts`
  - [ ] 实现 `extractUserCodeRegions()` 方法
  - [ ] 实现 `mergeWithUserCode()` 方法
  - [ ] 支持多个保护区域

- [ ] **2.3.2** 集成到文件生成
  - [ ] 修改 `src/generator/fileGenerator.ts`
  - [ ] 在写入前检查是否存在用户代码
  - [ ] 应用合并策略
  - [ ] 添加日志：`Preserved user code in xxx.ts`

- [ ] **2.3.3** 测试和文档
  - [ ] 测试不同合并策略
  - [ ] 测试冲突场景（用户代码和生成代码重叠）
  - [ ] 在 README.md 添加使用说明和示例

**预期收益**: 用户可以安全地在生成文件中添加自定义逻辑

**工作量估算**: 3-4 天

---

## Phase 3: 高级特性 ✨

**目标**: 扩展工具能力边界

### 3.1 类型增强生成

**问题**: 生成的类型较为基础，缺乏高级特性

**解决方案**: 可选的类型增强功能

#### 3.1.1 运行时验证 Schema

生成 Zod 用于运行时验证

```typescript
interface ValidationConfig {
  enabled: boolean;
  library: 'zod';
  outputDir: string; // 默认: src/service/schemas
}
```

**实现状态**: ✅ 已完成（2026-01-08）

**实现方式**:

- 创建了完整的 Zod Schema 模板系统（`src/templates/schema-zod.ts`）
- 实现了 TypeScript 类型到 Zod Schema 的自动转换
- 支持生成 Request/Response/Type 三种 Schema
- 集成到主生成流程中，通过配置开关控制
- 默认输出到 `src/service/schemas` 目录

**后续优化**（2026-01-09）:

- ✅ **配置系统重构**
  - 移除 `generationType` 枚举，改用细粒度配置：`generateApi`、`generateTypes`、`typesFormat`
  - 支持灵活的组合模式：
    - 仅生成 API：`generateApi: true, generateTypes: false`
    - 仅生成类型：`generateApi: false, generateTypes: true, typesFormat: 'typescript' | 'zod'`
    - API + TypeScript 类型：`generateApi: true, generateTypes: true, typesFormat: 'typescript'`
    - API + Zod Schema：`generateApi: true, generateTypes: true, typesFormat: 'zod'`
  - Schema 生成被定义为类型的另一种格式（不是独立功能）

- ✅ **移除所有兼容代码**
  - 从 `ApiConfig` 和 `UserConfig` 接口中移除 `typesOnly` 和 `apiOnly`
  - 从 `defineConfig()` 中移除兼容逻辑
  - 更新所有代码引用，使用新的配置字段
  - 修复所有 TypeScript 编译错误

- ✅ **修复接口文件生成逻辑**
  - 修改 `generateInterfaceFunction()` 模板选择逻辑
  - 当 `typesFormat: 'zod'` 时，接口文件只生成 API 函数，不生成 TypeScript 接口
  - 当 `typesFormat: 'typescript'` 时，接口文件同时生成 API 函数和 TypeScript 接口
  - 修复类型导入逻辑，只在 `typesFormat: 'typescript'` 时导入 TypeScript 类型

**配置示例**:

```typescript
export default defineConfig({
  // ...其他配置
  validation: {
    enabled: true, // 启用 Schema 生成
    library: 'zod', // 只支持 Zod
    outputDir: 'src/service/schemas', // Schema 输出目录
    generateRequestSchemas: true, // 生成请求参数 Schema
    generateResponseSchemas: true, // 生成响应数据 Schema
    generateTypeSchemas: true, // 生成类型 Schema
  },
});
```

**实际收益**:

- 自动生成运行时验证 Schema，无需手动编写
- 支持 Zod 生态，类型安全 + 运行时验证双重保障
- 与现有代码生成无缝集成
- 可配置控制生成哪些类型的 Schema

#### Task List

- [x] **3.1.1.1** 创建 Schema 模板
  - [x] 创建 `src/templates/schema-zod.ts`
  - [x] 实现类型到 Schema 的转换逻辑
  - [x] 支持 Request/Response/Type 三种 Schema

- [x] **3.1.1.2** 集成 Schema 生成
  - [x] 修改 `src/generator/fileGenerator.ts`
  - [x] 添加 `generateSchemaFiles()` 方法
  - [x] 在配置中添加 `validation` 选项
  - [x] 集成到主生成流程（`src/generator/codegen.ts`）

- [x] **3.1.1.3** 测试和验证
  - [x] TypeScript 编译通过
  - [x] 构建成功无错误

---

#### 3.1.2 React Query Hooks

自动生成 React Query hooks

```typescript
interface ReactQueryConfig {
  enabled: boolean;
  outputDir: string; // 默认: src/service/hooks
  hookNaming: 'camelCase' | 'kebab-case';
}
```

#### Task List

- [ ] **3.1.2.1** 创建 Hooks 模板
  - [ ] 创建 `src/templates/hooks-react-query.ts`
  - [ ] 实现基于 API 的 hook 生成
  - [ ] 支持自定义 query key

- [ ] **3.1.2.2** 集成 Hooks 生成
  - [ ] 添加 `generateHookFiles()` 方法
  - [ ] 支持条件生成（只在需要时生成）

- [ ] **3.1.2.3** 文档和示例
  - [ ] 添加 React 集成示例
  - [ ] 添加 TypeScript 类型推导示例

**预期收益**: 减少 80% 的 API 调用代码编写工作

**工作量估算**: 5-6 天（完整实现所有增强）

---

### 3.2 Mock 数据生成

**问题**: 前端开发时缺少 Mock 数据

**解决方案**: 基于 Schema 自动生成 Mock 数据

#### Task List

- [ ] **3.2.1** 集成 Mock 库
  - [ ] 选择方案：MSW / Faker / 自定义
  - [ ] 添加依赖：`@faker-js/faker`
  - [ ] 创建 `src/generator/mock.ts`

- [ ] **3.2.2** 实现 Mock 生成逻辑
  - [ ] 根据类型生成对应的 Mock 数据
  - [ ] 支持复杂类型（嵌套对象、数组）
  - [ ] 支持自定义 Mock 规则

- [ ] **3.2.3** 输出 Mock handlers
  - [ ] 生成 MSW handlers
  - [ ] 生成 JSON Server db
  - [ ] 添加配置选项

**预期收益**: 前端可独立开发，不依赖后端

**工作量估算**: 4-5 天

---

### 3.3 自定义模板系统

**问题**: 模板硬编码在源码中，无法自定义

**解决方案**: 支持从项目目录加载自定义模板

```typescript
interface TemplateConfig {
  customDir?: string; // 自定义模板目录
  templatePackage?: string; // npm 模板包
}
```

#### Task List

- [ ] **3.3.1** 实现模板加载器
  - [ ] 创建 `src/template/loader.ts`
  - [ ] 实现从文件系统加载模板
  - [ ] 实现从 npm 包加载模板
  - [ ] 支持模板热重载

- [ ] **3.3.2** 模板变量系统
  - [ ] 定义标准模板变量
  - [ ] 支持自定义变量
  - [ ] 添加变量验证

- [ ] **3.3.3** 文档和示例
  - [ ] 创建模板开发指南
  - [ ] 提供示例模板包
  - [ ] 添加模板发布流程

**预期收益**: 用户可以定制生成代码风格，形成模板生态

**工作量估算**: 6-7 天

---

## Phase 4: 生态扩展 🌍

**目标**: 构建可扩展的插件生态

### 4.1 插件系统

**问题**: 难以扩展工具功能

**解决方案**: 定义生命周期钩子

```typescript
interface Plugin {
  name: string;
  version: string;
  hooks: {
    beforeLoadConfig?: () => void | Promise<void>;
    afterFetchData?: (data: OpenAPI) => OpenAPI;
    beforeGenerate?: (context: GenContext) => void;
    afterGenerate?: (files: GeneratedFile[]) => GeneratedFile[];
    transformTemplate?: (template: string) => string;
  };
}
```

#### Task List

- [ ] **4.1.1** 定义插件系统
  - [ ] 创建 `src/plugin/types.ts`
  - [ ] 定义插件接口
  - [ ] 定义钩子上下文

- [ ] **4.1.2** 实现插件管理器
  - [ ] 创建 `src/plugin/manager.ts`
  - [ ] 实现插件加载逻辑
  - [ ] 实现钩子调用

- [ ] **4.1.3** 插件 CLI
  - [ ] 添加 `plugin add <name>` 命令
  - [ ] 添加 `plugin remove <name>` 命令
  - [ ] 添加 `plugin list` 命令

- [ ] **4.1.4** 示例插件
  - [ ] 创建示例：添加时间戳插件
  - [ ] 创建示例：代码格式化插件
  - [ ] 创建示例：自定义命名插件

**预期收益**: 社区可以贡献插件，扩展工具能力

**工作量估算**: 7-8 天

---

### 4.2 多平台支持

**问题**: 只支持 Apifox 和 Swagger

**解决方案**: 支持更多 API 定义平台

#### Task List

- [ ] **4.2.1** Postman 支持
  - [ ] 创建 `src/clients/postman.ts`
  - [ ] 实现 Postman Collection 解析
  - [ ] 转换为标准 OpenAPI 格式

- [ ] **4.2.2** GraphQL 支持
  - [ ] 创建 `src/clients/graphql.ts`
  - [ ] 实现 GraphQL Schema 解析
  - [ ] 生成 Query/Mutation 类型

- [ ] **4.2.3** REST API 自动发现
  - [ ] 实现从代码注释生成 API
  - [ ] 支持 JSDoc/Swagger 注解

**预期收益**: 覆盖更多使用场景

**工作量估算**: 每个平台 4-5 天

---

## 📊 优先级矩阵

### 中优先级（近期规划）

| 功能         | 收益   | 工作量 | ROI   | 状态      |
| ------------ | ------ | ------ | ----- | --------- |
| **智能合并** | ⭐⭐⭐ | 3-4 天 | ⚡ 中 | ⏸️ 待开始 |

### 低优先级（长期规划）

| 功能           | 收益     | 工作量      | 依赖       |
| -------------- | -------- | ----------- | ---------- |
| **类型增强**   | ⭐⭐⭐⭐ | 5-6 天      | -          |
| **Mock 数据**  | ⭐⭐⭐   | 4-5 天      | 类型增强   |
| **自定义模板** | ⭐⭐⭐⭐ | 6-7 天      | -          |
| **插件系统**   | ⭐⭐⭐⭐ | 7-8 天      | 自定义模板 |
| **多平台支持** | ⭐⭐⭐   | 4-5 天/平台 | -          |

---

## 🗓️ 实施计划

### Q1 2026: 性能与开发体验优化 ✅ 已完成

**目标**: 生成速度提升 60-70%，提升易用性

**已完成**（2026-01-02 至 2026-01-08）：

**性能优化**（Phase 1）：

- ✅ **并发文件写入优化**（Phase 1.1）
  - 修改 `src/generator/fileGenerator.ts`
  - 实现 `executeWithConcurrency()` 函数
  - 测试不同并发数，确定最佳配置（默认：50）
  - 验证小型、中型、大型项目的性能提升

- ✅ **模板编译缓存**（Phase 1.2）
  - 在 `src/generator/template.ts` 添加缓存
  - 测试验证内存占用
  - 最终性能测试和调优

**开发体验**（Phase 2）：

- ✅ **自动清理输出目录**（Phase 2.0）
  - 实现清理函数，支持排除指定文件
  - 集成到生成流程
  - 确保代码与 API 定义完全同步

- ✅ **配置可视化工具**（Phase 2.2 部分完成）
  - 创建可视化服务器和前端界面
  - 提供配置编辑器和 API Schema 浏览器

- ✅ **增强错误提示**（Phase 2.4）
  - 创建统一错误处理系统
  - 为所有常见错误配置解决方案
  - 添加 verbose 模式支持

- ✅ **自定义命名策略**（Phase 2.1）
  - 实现完整的命名策略自定义功能
  - 支持接口名称、函数名称、类型名称的自定义逻辑
  - 保持向后兼容性

**当前性能表现**：

- 小型项目（< 100 接口）: 2-3s ✅
- 中型项目（100-500 接口）: 5-7s
- 大型项目（500+ 接口）: 6-8s

### Q2 2026: 开发体验（续）

**目标**: 继续降低使用门槛

- Week 9-11: 智能合并冲突处理（Phase 2.3）
- Week 12: 测试和文档完善

### Q3-Q4 2026: 高级特性

**目标**: 扩展工具能力

- 类型增强生成
- Mock 数据生成
- 自定义模板系统

### 2027: 生态扩展

**目标**: 构建社区和生态

- 插件系统
- 多平台支持
- 模板市场

---

## 🤝 不实现的清单

基于以下原则，以下功能**不纳入计划**：

### 1. 数据缓存系统

**原因**:

- API 迭代是持续的，任何接口变更都会导致缓存 key 改变
- 缓存只在"无任何 API 变化的重复生成"场景有效，实际使用频率极低
- 2-5s 的数据拉取成本相对可接受
- 增加系统复杂度和维护成本

**替代方案**:

- 用户可在本地搭建 API Spec 服务器（内网访问更快）
- 通过并发文件写入获得 60-70% 性能提升

---

### 2. 增量构建系统

**原因**:

- 复杂度极高（3-4 天开发 + 持续维护）
- 边界情况多（类型依赖、删除检测、首次生成等）
- 调试困难（用户报告问题难以复现）
- 并发写入后收益不明显（10s → 3s，增量再优化到 2s，投入产出比不合理）

**替代方案**:

- 依赖并发文件写入提供 60-70% 性能提升
- 如果仍有性能问题，考虑流式生成

---

### 3. 多 HTTP 客户端支持

**原因**: 用户可以在 `request.ts` 中自行实现

**替代方案**: 提供多种 `request.ts` 模板示例

---

### 4. 多环境配置

**原因**: 用户可以在 request 函数中通过参数传入环境

**替代方案**: 在文档中提供多环境配置最佳实践

---

### 5. 变更日志和文档生成

**原因**:

- 数据量大时性能问题
- 实际需求不明确
- 可以通过 Git 历史实现

**替代方案**:

- 使用 Git 对比 API schema JSON
- 使用 `api-power debug` 查看差异

---

### 6. 复杂的插件系统

**原因**: 过度设计，当前需求不明确

**替代方案**: 先实现自定义模板，按需演进

---

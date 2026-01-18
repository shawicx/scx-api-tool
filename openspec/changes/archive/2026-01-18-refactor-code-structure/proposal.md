# 重构代码结构与优化

## 概述

对项目进行全面代码重构，优化文件结构与代码结构，提高代码可维护性与健壮性。将超过 360 行的文件拆分为更小的模块，提取公共逻辑，统一代码风格和注释规范。

## 背景

当前项目存在以下问题：

1. **文件过大**：多个文件超过 360 行，难以维护
   - `src/generator/fileGenerator.ts` (909 行)
   - `src/generator/template.ts` (646 行)
   - `src/templates/schema-zod.ts` (626 行)
   - `src/errors/index.ts` (416 行)

2. **代码重复**：生成 TypeScript 类型和生成 Zod Schema 时都处理 OpenAPI 数据，存在重复逻辑

3. **公共逻辑未抽离**：`namingStrategy` 配置相关的处理逻辑在多处重复

4. **注释风格不统一**：部分文件缺少 `@example`、`@param`、`@returns` 等标准 JSDoc 标签

## 目标

1. **文件拆分**：将超过 360 行的文件拆分为更小、更聚焦的模块
2. **公共逻辑抽离**：提取 TS 类型和 Zod Schema 生成的公共逻辑
3. **统一注释风格**：所有函数使用统一的 JSDoc 格式（`@description`、`@example`、`@param`、`@returns`）
4. **代码风格统一**：确保所有代码遵循项目约定
5. **提高可维护性**：通过模块化、清晰的职责分离提高代码可维护性

## 范围

### 文件拆分

1. **`src/generator/fileGenerator.ts`** (909 → <300 行)
   - 拆分为：
     - `interfaceGenerator.ts`：接口文件生成
     - `typeGenerator.ts`：类型文件生成
     - `schemaGenerator.ts`：Schema 文件生成（Zod）
     - `fileGenerator.ts`：主协调器

2. **`src/generator/template.ts`** (646 → <300 行)
   - 拆分为：
     - `templateHelpers.ts`：Handlebars 辅助函数
     - `templatePartials.ts`：Handlebars partials
     - `templateCache.ts`：模板缓存管理
     - `template.ts`：模板编译和注册

3. **`src/templates/schema-zod.ts`** (626 → <300 行)
   - 拆分为：
     - `schema-zod/types.ts`：类型模板
     - `schema-zod/interfaces.ts`：接口模板
     - `schema-zod/requests.ts`：请求模板
     - `schema-zod/index.ts`：导出

4. **`src/errors/index.ts`** (416 → <300 行)
   - 拆分为：
     - `errorCodes.ts`：错误代码枚举
     - `errorClasses.ts`：错误类定义
     - `errorFactory.ts`：错误工厂
     - `index.ts`：导出

### 公共逻辑抽离

1. **`namingStrategy` 处理逻辑**：
   - 创建 `src/generator/naming/strategy.ts`
   - 包含默认命名策略实现
   - 同时用于 TS 类型生成和 Zod Schema 生成

2. **OpenAPI 数据处理公共逻辑**：
   - 创建 `src/processors/common.ts`
   - 提取路径处理、标签处理等公共逻辑

### 注释风格统一

所有函数遵循统一格式：

```typescript
/**
 * @description 将中文转换为拼音-大驼峰格式
 * @example 例如: "角色管理" -> "JiaoSeGuanli", "AI 服务" -> "AIFuwu"
 * @param chinese 中文字符串
 * @returns 拼音-大驼峰格式字符串
 */
```

## 影响范围

- 核心生成器模块：`src/generator/`
- 模板模块：`src/templates/`
- 错误处理模块：`src/errors/`
- 处理器模块：`src/processors/`

## 风险与缓解

1. **重构风险**：大规模重构可能引入新的 bug
   - **缓解**：分阶段进行，每个阶段完成后进行充分测试

2. **向后兼容性**：重构后 API 接口保持不变
   - **缓解**：导出接口保持一致，只重构内部实现

3. **测试验证**：项目没有单元测试
   - **缓解**：通过运行代码生成并检查输出来验证

## 验收标准

1. 所有文件行数不超过 360 行
2. 代码生成结果与重构前一致
3. 所有函数都有统一的 JSDoc 注释
4. 通过 `pnpm run lint:fix` 以及 `npx tsc --noEmit` 检查
5. 命名策略逻辑在 TS 类型和 Zod Schema 生成中复用

## 时间估算

- 文件拆分：4-6 小时
- 公共逻辑抽离：2-3 小时
- 注释统一：2-3 小时
- 测试和验证：2-3 小时
- **总计**：10-15 小时

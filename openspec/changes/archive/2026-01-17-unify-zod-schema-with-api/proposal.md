# Proposal: Unify Zod Schema with Type Exports

**Change ID**: `unify-zod-schema-with-api`
**Status**: Draft
**Created**: 2025-01-16

## Why

当前代码生成工具在类型定义和 Schema 生成方面存在配置复杂度和文件结构混乱的问题。`typesFormat` 和 `validation` 两个配置项控制类型生成，容易造成混淆。此外，Schema 文件、Type 文件和 API 文件分散在多个目录中，导入路径复杂，维护成本高。

根据 ZOD.md 方案设计文档，应将 Schema 和其推导的类型放在同一个文件中导出，移除独立的 `types` 目录和 `validation` 配置，简化配置项并提高类型一致性。

## What Changes

1. **移除 `validation` 配置项**：系统不再支持独立的 `validation` 配置，所有类型生成逻辑统一由 `typesFormat` 控制
2. **简化文件结构**：
   - **Zod 模式**：接口级 Schema 和类型放在同一个 `schema.ts` 文件中，类型 Schema 放在 `schemas/` 目录中
   - **TypeScript 模式**：类型文件放在接口文件同级目录
3. **统一导出方式**：每个 Schema 文件同时导出 Zod Schema 定义和推导的 TypeScript 类型

## Summary

简化代码生成配置和输出结构，统一 Zod Schema 与 TypeScript 类型的导出方式。将 Schema 和其推导的类型放在同一个文件中导出，移除独立的 `types` 目录和 `validation` 配置，简化配置项并提高类型一致性。

## Motivation

当前实现存在以下问题：

1. **配置复杂**：`typesFormat` 和 `validation.enabled` 两个配置项控制类型生成，容易混淆
2. **文件分散**：Schema、Type、API 函数分散在多个文件中，导入路径复杂
3. **维护成本高**：Schema 和 Type 分离，容易产生不一致
4. **不符合文档方案**：ZOD.md 提出的单文件导出方案未完全实现

## Goals

### 非功能性目标

1. 简化配置，移除 `validation` 配置项
2. 统一文件输出结构：Schema 和推导类型在同一文件中
3. 移除独立的 `types` 目录
4. 保持 API 函数文件结构不变

### 功能性目标

1. **Zod 模式**：
   - 接口级 Schema（Request/Response）：每个接口的 Request/Response Schema 和推导类型在同一个文件中
   - 类型 Schema（如 UserSchema）：每个类型的 Schema 和推导类型在同一个文件中
   - API 文件从 schema 文件导入类型

2. **TypeScript 模式**：
   - 每个类型在单独的文件中定义
   - 直接导出 TypeScript 类型，不使用 Zod
   - API 文件从类型文件导入类型

## Non-Goals

1. 不改变 API 函数的文件结构和实现逻辑
2. 不改变请求函数（request）的生成逻辑
3. 不添加新的验证功能
4. 不提供向后兼容性

## Proposed Solution

### 配置变更

移除以下配置项：

- `validation` 及其所有子字段

简化后的配置：

```typescript
interface ApiConfig {
  // ... 其他配置项
  typesFormat: 'typescript' | 'zod';
  // 移除 validation 配置
}
```

### Zod 模式输出结构

#### 接口级 Schema 文件

位置：`src/service/<Tag>/<InterfaceName>Schema.ts`

注意：`<Tag>` 使用 PascalCase 格式（如 `AIFuwu`）

内容：

```typescript
import { z } from 'zod';

/**
 * @description <接口描述>
 */
export const <RequestTypeName>Schema = z.object({
  // 请求字段
});

/**
 * @description <接口描述>
 */
export const <ResponseTypeName>Schema = z.object({
  // 响应字段
});

// 推导类型
export type <RequestTypeName> = z.infer<typeof <RequestTypeName>Schema>;
export type <ResponseTypeName> = z.infer<typeof <ResponseTypeName>Schema>;
```

#### 类型 Schema 文件

位置：`src/service/schemas/<TypeName>Schema.ts`

注意：类型 Schema 统一放在 `schemas` 目录中

内容：

```typescript
import { z } from 'zod';

/**
 * @description <类型描述>
 */
export const <TypeName>Schema = z.object({
  // 类型字段
});

// 推导类型
export type <TypeName> = z.infer<typeof <TypeName>Schema>;
```

#### API 文件

位置：`src/service/<Tag>/index.ts`

内容：

```typescript
import { <RequestTypeName>Schema, <ResponseTypeName>Schema } from './<InterfaceName>Schema';
import type { <RequestTypeName>, <ResponseTypeName> } from './<InterfaceName>Schema';

export async function <functionName>(
  params: <RequestTypeName>
): Promise<<ResponseTypeName>> {
  // 实现逻辑
}
```

### TypeScript 模式输出结构

#### 类型文件

位置：`src/service/<Tag>/<TypeName>.ts`

注意：`<Tag>` 使用 PascalCase 格式（如 `AIFuwu`）

注意：`<Tag>` 使用 PascalCase 格式（如 `AIFuwu`）

内容：

```typescript
/**
 * @description <类型描述>
 */
export interface <TypeName> {
  // 类型字段
}
```

#### API 文件

位置：`src/service/<Tag>/index.ts`

内容：

```typescript
import type { <TypeName> } from './<TypeName>';

export async function <functionName>(
  params: <TypeName>
): Promise<<ResponseTypeName>> {
  // 实现逻辑
}
```

## Impacts

### 向后兼容性

**破坏性变更**：此提案不提供向后兼容性。

- 配置文件需要更新：移除 `validation` 配置项
- 导入路径需要调整：从 types 目录改为从 schema 文件或类型文件导入

### 性能影响

- 减少 I/O 操作：不生成独立的 types 目录
- 减少文件数量：合并 Schema 和 Type 导出

### 安全影响

无安全影响。

## Alternatives Considered

### Alternative 1: 保持当前配置结构

保留 `validation` 配置，仅调整生成逻辑。

**优点**：

- 最小化配置变更

**缺点**：

- 配置仍然复杂
- 容易混淆 `typesFormat` 和 `validation` 的作用

### Alternative 2: 完全移除 Zod 模式

仅支持 TypeScript 类型生成。

**优点**：

- 配置更简单

**缺点**：

- 失去运行时验证能力
- 不符合 ZOD.md 方案

## Risks and Mitigations

### Risk 1: 大规模改动影响现有用户

**影响**：高
**缓解措施**：

- 提供详细的迁移指南
- 在文档中明确标注破坏性变更
- 考虑提供迁移工具（可选）

### Risk 2: 类型 Schema 的单文件导出可能遗漏某些用例

**影响**：中
**缓解措施**：

- 完善测试用例
- 人工验证生成的代码
- 在提案阶段充分讨论

### Risk 3: 删除 types 目录可能影响依赖该目录的项目

**影响**：中
**缓解措施**：

- 在迁移指南中说明如何调整导入路径
- 提供过渡期建议（可选）

## Success Criteria

1. 配置文件成功移除 `validation` 配置项
2. Zod 模式下：
   - 每个接口生成一个 schema 文件，包含 Request/Response Schema 和推导类型
   - 每个 OpenAPI 类型生成一个 schema 文件，包含 Schema 和推导类型
   - API 文件从 schema 文件导入类型
   - 不生成独立的 types 目录
3. TypeScript 模式下：
   - 每个 OpenAPI 类型生成一个独立的类型文件
   - API 文件从类型文件导入类型
   - 不生成独立的 types 目录
4. 所有生成的代码能够正常编译
5. API 函数功能正常

## Open Questions

1. 是否需要提供配置迁移工具？
2. schemas 目录的结构是否需要调整（当前在 src/service/schemas）？
3. 是否需要在根索引文件中导出所有 Schema 和类型？

## Dependencies

- 无外部依赖
- 依赖 ZOD.md 方案的设计文档

## Timeline

- Proposal Review: 1-2 天
- Implementation: 3-5 天
- Testing and Validation: 2-3 天

## References

- ZOD.md 方案设计文档
- 现有代码库实现

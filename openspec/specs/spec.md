# Spec Delta: Type Export

**Capability**: `type-export`
**Change ID**: `unify-zod-schema-with-api`

## ADDED Requirements

### Requirement: Unified Zod Schema and Type Export

**Description**: 在 Zod 模式下，每个 Schema 文件应同时导出 Zod Schema 和推导的 TypeScript 类型。

**Rationale**: 确保类型一致性，简化导入路径。

**Requirement**: 系统 SHALL 在每个 Schema 文件中同时导出 Zod Schema 和推导的 TypeScript 类型。

#### Scenario: Type schema exports both schema and inferred type

**Given** OpenAPI 文档包含类型 `User`
**And** 配置 `typesFormat: 'zod'`
**When** 系统生成代码
**Then** 生成的文件 SHALL 导出 `export const UserSchema`
**And** 生成的文件 SHALL 导出 `export type User`
**And** `User` 类型 SHALL 为 `z.infer<typeof UserSchema>`

#### Scenario: Interface schema exports both schemas and inferred types

**Given** OpenAPI 文档包含接口 `POST /ai/completion`
**And** 配置 `typesFormat: 'zod'`
**When** 系统生成代码
**Then** 生成的文件 SHALL 导出 `export const PostAiCompletionRequestSchema`
**And** 生成的文件 SHALL 导出 `export type PostAiCompletionRequest`
**And** 生成的文件 SHALL 导出 `export const PostAiCompletionResponseSchema`
**And** 生成的文件 SHALL 导出 `export type PostAiCompletionResponse`

### Requirement: Schema File Location

**Description**: Schema 文件应根据其类型（接口级或类型级）放置在适当的位置。

**Rationale**: 明确文件结构，便于组织和管理。

**Requirement**: 系统 SHALL 根据 Schema 类型（接口级或类型级）将 Schema 文件放置在适当的位置。

#### Scenario: Type schema files are in schemas directory

**Given** OpenAPI 文档包含类型 `User`
**And** 配置 `typesFormat: 'zod'`
**When** 系统生成代码
**Then** `UserSchema` 文件 SHALL 生成在 `src/service/schemas/UserSchema.ts`
**And** 不 SHALL 在其他位置生成该文件

#### Scenario: Interface schema files are in tag directory

**Given** OpenAPI 文档包含接口 `POST /ai/completion`（tag: `AI 服务`）
**And** 配置 `typesFormat: 'zod'`
**When** 系统生成代码
**Then** 接口 Schema 文件 SHALL 生成在 `src/service/AIFuWu/PostAiCompletionSchema.ts`
**And** 不 SHALL 在其他位置生成该文件

### Requirement: Type File Location (TypeScript Mode)

**Description**: 在 TypeScript 模式下，类型文件应放置在接口文件同级目录。

**Rationale**: 简化文件结构，将类型文件与接口文件放在同一目录。

**Requirement**: 系统 SHALL 将 TypeScript 类型文件放置在接口文件同级目录。

#### Scenario: Type files are in tag directory

**Given** OpenAPI 文档包含类型 `User`（在 `user` tag 相关的接口中使用）
**And** 配置 `typesFormat: 'typescript'`
**When** 系统生成代码
**Then** `User.ts` 文件 SHALL 生成在 `src/service/User/User.ts`
**And** 目录名 SHALL 使用 PascalCase 格式（如 `User` 而非 `user`）
**And** 不 SHALL 在 `src/service/types/` 目录生成该文件

## MODIFIED Requirements

### Requirement: Type Import Paths (Zod Mode)

**Description**: 在 Zod 模式下，接口文件应从同级的 Schema 文件导入类型。

**Before**:

- 导入路径可能是 `../types/User` 或 `../schemas/UserSchema`

**After**:

- 类型 Schema 导入路径：`../schemas/UserSchema`
- 接口 Schema 导入路径：`./<InterfaceName>Schema`

**Rationale**: 统一导入路径，简化文件结构。

**Requirement**: 在 Zod 模式下，系统 SHALL 从适当的 Schema 文件导入类型。

#### Scenario: Import type schema from schemas directory

**Given** 接口需要使用 `User` 类型
**And** 配置 `typesFormat: 'zod'`
**When** 系统生成接口文件 `src/service/user/index.ts`
**Then** 文件 SHALL 包含 `import type { User } from '../schemas/UserSchema'`

#### Scenario: Import interface schema from same directory

**Given** 接口需要使用 `PostAiCompletionRequest` 类型（tag: `AI 服务`）
**And** 配置 `typesFormat: 'zod'`
**When** 系统生成接口文件 `src/service/AIFuWu/index.ts`
**Then** 文件 SHALL 包含 `import type { PostAiCompletionRequest } from './PostAiCompletionSchema'`

### Requirement: Type Import Paths (TypeScript Mode)

**Description**: 在 TypeScript 模式下，接口文件应从同级的类型文件导入类型。

**Before**:

- 导入路径是 `../types/User`

**After**:

- 导入路径是 `./User`

**Rationale**: 简化导入路径，将类型文件与接口文件放在同一目录。

**Requirement**: 在 TypeScript 模式下，系统 SHALL 从同级的类型文件导入类型。

#### Scenario: Import type from same directory

**Given** 接口需要使用 `User` 类型（tag: `user`）
**And** 配置 `typesFormat: 'typescript'`
**When** 系统生成接口文件 `src/service/User/index.ts`
**Then** 文件 SHALL 包含 `import type { User } from './User'`

## REMOVED Requirements

### Requirement: Types Directory Export

**Description**: 类型文件应统一导出到 `types` 目录，并通过 `types/index.ts` 聚合导出。

**Rationale**: 类型文件现在放置在接口文件同级目录，不需要独立的 `types` 目录。

#### Scenario: (已移除) Export all types from types/index

**Given** OpenAPI 文档包含多个类型
**When** 系统生成代码
**Then** 应生成 `src/service/types/index.ts`
**And** 文件应导出所有类型定义

**此需求已被移除，因为不再生成独立的 types 目录。**

### Requirement: Schema File Output Based on Validation Config

**Description**: Schema 文件的输出位置应根据 `validation.enabled` 和 `validation.outputDir` 配置决定。

**Rationale**: Schema 文件的输出位置现在由 schema 类型（接口级或类型级）和文件结构决定，不需要单独配置。

#### Scenario: (已移除) Schema files in independent directory when validation enabled

**Given** 配置 `validation.enabled: true`
**And** 配置 `validation.outputDir: 'src/service/schemas'`
**When** 系统生成代码
**Then** 接口级 Schema 文件应生成到 `src/service/schemas/<Tag>/<InterfaceName>Schema.ts`

**此需求已被移除，因为不再支持独立的 validation 配置。**

#### Scenario: (已移除) Schema files in same directory when validation disabled

**Given** 配置 `validation.enabled: false`
**And** 配置 `typesFormat: 'zod'`
**When** 系统生成代码
**Then** 接口级 Schema 文件应生成到接口文件同级目录

**此需求已被移除，因为不再支持独立的 validation 配置，schema 文件的位置现在由其类型决定。**

## Cross-References

- Related to `config-management` capability: 配置变更影响类型导出结构
- Related to `code-generation` capability: 代码生成逻辑影响类型导出位置

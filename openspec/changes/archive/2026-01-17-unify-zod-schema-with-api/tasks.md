# Tasks: Unify Zod Schema with Type Exports

**Change ID**: `unify-zod-schema-with-api`

## Phase 1: 配置和入口路由调整

- [x] **Task 1.1**: 更新 `ApiConfig` 类型定义
  - [x] 从 `src/types/config.ts` 中移除 `ValidationConfig` 接口
  - [x] 从 `ApiConfig` 接口中移除 `validation` 字段
  - [x] 更新 `UserConfig` 接口，移除 `validation` 字段
  - [x] 更新 `PRESETS` 配置，移除所有 `validation` 相关配置
  - [x] 更新默认配置（`src/cli/constants.ts`, `src/templates/config.ts`, `src/utils/config.ts`），移除 `validation` 相关配置

- [x] **Task 1.2**: 更新配置验证逻辑
  - [x] 更新 `src/config/loader.ts`，移除 `validation` 配置的验证逻辑
  - [x] 更新 `src/validation/validators/logic.ts`，移除 `validation` 相关的验证

- [x] **Task 1.3**: 更新文档
  - [x] 更新 `src/types/config.ts` 中的注释，明确 `typesFormat` 的作用
  - [x] 移除关于 `validation` 配置的注释和文档

## Phase 2: 模板和生成逻辑修改

- [x] **Task 2.1**: 修改 Zod 模板输出
  - [x] 更新 `src/templates/schema-zod.ts` 中的 `getZodTypeTemplateWithComment()`，添加推导类型导出
  - [x] 更新 `src/templates/schema-zod.ts` 中的 `getZodTypeTemplateWithoutComment()`，添加推导类型导出
  - [x] 确保类型 Schema 文件包含 `export type <TypeName> = z.infer<typeof <TypeName>Schema>;`

- [x] **Task 2.2**: 修改接口级 Schema 模板
  - [ ] 在 `src/templates/schema-zod.ts` 中添加新的模板函数，生成接口级 Request/Response Schema 文件
  - [ ] 新模板应包含：Request Schema、Response Schema、以及它们的推导类型
  - [ ] 模板应正确处理引用的类型 Schema

- [x] **Task 2.3**: 更新代码生成逻辑
  - [ ] 修改 `src/generator/fileGenerator.ts` 中的 `generateInterfaceSchemasFiles()` 函数
  - [ ] 生成单独的 Schema 文件（包含 Request/Response Schema + 推导类型），而不是在接口文件中内联
  - [ ] 更新 schema 文件路径：`<Tag>/<InterfaceName>Schema.ts`

- [x] **Task 2.4**: 更新接口文件模板
  - [x] 修改 `src/templates/template.ts` 中的 Zod 模板
  - [x] 确保导入语句正确：`import { <RequestSchemaName>, <ResponseSchemaName> } from './<InterfaceName>Schema'`
  - [x] 确保类型导入正确：`import type { <RequestTypeName>, <ResponseTypeName> } from './<InterfaceName>Schema'`

- [x] **Task 2.5**: 更新 TypeScript 模式生成逻辑
  - [x] 修改 `src/generator/fileGenerator.ts` 中的 `generateTypeFile()` 函数
  - [x] 将类型文件生成位置从 `src/service/types` 改为 `src/service/<Tag>/<TypeName>.ts`
  - [x] 移除 `src/service/types/index.ts` 的生成逻辑

- [x] **Task 2.6**: 更新接口文件导入逻辑（TypeScript 模式）
  - [x] 修改 `src/generator/fileGenerator.ts` 中的 `generateInterfaceFileForTag()` 函数
  - [x] 更新类型导入路径：从 `'../types/<TypeName>'` 改为 `'./<TypeName>'`
  - [x] 移除对 `src/service/types` 目录的引用

## Phase 3: 删除多路径与重复输出

- [x] **Task 3.1**: 删除 types 目录相关逻辑
  - [x] 从 `src/generator/fileGenerator.ts` 中移除 `generateTypeFiles()` 函数
  - [x] 从 `src/generator/fileGenerator.ts` 中移除 `generateTypesIndexFile()` 函数
  - [x] 从 `src/generator/codegen.ts` 中移除 `generateTypeFiles` 的调用

- [x] **Task 3.2**: 删除 validation 相关逻辑
  - [x] 从 `src/generator/codegen.ts` 中移除 `if (config.validation?.enabled && config.typesFormat !== 'zod')` 的判断
  - [x] 简化 `generateSchemaFiles()` 的调用逻辑：只在 `typesFormat === 'zod'` 时调用

- [x] **Task 3.3**: 清理 `generateSchemaFiles()` 函数
  - [x] 移除 `validation.enabled` 的判断逻辑
  - [x] 简化 schema 输出目录判断：始终输出到接口同级目录或 `schemas` 目录（根据 schema 类型）

- [x] **Task 3.4**: 更新清理逻辑
  - [x] 更新 `cleanOutputDir()` 的调用，确保不删除 `src/service/types`（因为该目录不再生成）

## Phase 4: 验证与测试

- [x] **Task 4.1**: 准备测试 OpenAPI 文档
  - [x] 创建一个包含多种类型的简单 OpenAPI 示例
  - [x] 包含基本的 CRUD 接口
  - [x] 包含嵌套类型、数组类型、枚举类型

- [x] **Task 4.2**: 验证 Zod 模式生成
  - [x] 运行 `npx ts-node src/index.ts` 生成代码，使用 `typesFormat: 'zod'`
  - [x] 验证生成的 Schema 文件包含 Request/Response Schema 和推导类型
  - [x] 验证生成的类型 Schema 文件包含 Schema 和推导类型
  - [x] 验证 API 文件从 schema 文件导入类型
  - [x] 验证不生成 `src/service/types` 目录

- [x] **Task 4.3**: 验证 TypeScript 模式生成
  - [x] 运行 `npx ts-node src/index.ts` 生成代码，使用 `typesFormat: 'typescript'`
  - [x] 验证生成的类型文件在 `src/service/<Tag>/<TypeName>.ts`
  - [x] 验证 API 文件从类型文件导入类型
  - [x] 验证不生成 `src/service/types` 目录

- [x] **Task 4.4**: 验证代码编译
  - [x] 运行 `pnpm run build` 编译生成的代码
  - [x] 修复所有编译错误

## Phase 5: 文档和示例

- [x] **Task 5.1**: 更新项目文档
  - [x] 更新 README 或相关文档，说明新的配置结构
  - [x] 更新配置示例，移除 `validation` 配置
  - [x] 说明 Zod 和 TypeScript 模式的输出结构

- [x] **Task 5.2**: 创建迁移指南
  - [x] 说明如何从旧配置迁移到新配置
  - [x] 提供导入路径变更示例
  - [x] 说明破坏性变更

- [x] **Task 5.3**: 创建使用示例
  - [x] 提供一个完整的配置示例（Zod 模式）
  - [x] 提供一个完整的配置示例（TypeScript 模式）
  - [x] 展示生成的代码结构

## Phase 6: 代码质量

- [x] **Task 6.1**: 运行代码检查
  - [x] 运行 `pnpm run lint:fix` 修复代码格式问题
  - [x] 修复所有 lint 错误

- [x] **Task 6.2**: 代码审查
  - [x] 审查修改的代码，确保符合项目规范
  - [x] 确保没有遗留的 `validation` 相关代码
  - [x] 确保没有遗留的 `types` 目录相关逻辑

## 依赖关系

- Phase 1 必须在 Phase 2 之前完成（配置变更先于生成逻辑修改）
- Phase 2 和 Phase 3 可以并行进行（模板修改和删除逻辑可以同时进行）
- Phase 4 必须在 Phase 2 和 Phase 3 完成之后（验证需要在实现完成之后）
- Phase 5 必须在 Phase 4 完成之后（文档需要在验证通过之后）
- Phase 6 必须在所有代码修改完成之后（代码质量检查在最后）

## 并行化机会

- Task 2.1、Task 2.2、Task 2.3 可以并行进行（模板修改可以同时进行）
- Task 3.1、Task 3.2、Task 3.3 可以并行进行（删除逻辑可以同时进行）
- Task 4.2 和 Task 4.3 可以并行进行（Zod 和 TypeScript 模式的验证可以同时进行）

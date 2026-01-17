# 任务清单

## 阶段 1：准备阶段（不涉及代码修改）

- [x] 1.1 验证当前代码生成流程
  - 运行 `npx ts-node src/index.ts` 生成代码
  - 记录生成输出作为基准

- [x] 1.2 统计当前文件行数
  - 运行 `find src -name "*.ts" -exec wc -l {} +`
  - 记录所有超过 360 行的文件

- [x] 1.3 创建新的目录结构
  - 创建 `src/generator/generators/`
  - 创建 `src/generator/naming/`
  - 创建 `src/generator/template/`
  - 创建 `src/templates/schema-zod/`

- [ ] 1.4 准备检查脚本
  - 在 `package.json` 中添加 `check:linesize` 脚本
  - 测试脚本是否正确识别超过 360 行的文件

## 阶段 2：错误处理模块拆分

- [x] 2.1 创建 `src/errors/errorCodes.ts`
  - 从 `errors/index.ts` 提取 `ErrorCode` 枚举
  - 添加文件头注释
  - 为每个错误代码添加描述注释

- [x] 2.2 创建 `src/errors/errorClasses.ts`
  - 从 `errors/index.ts` 提取错误类定义
  - 添加类级注释
  - 为类方法添加 JSDoc 注释

- [x] 2.3 创建 `src/errors/errorFactory.ts`
  - 从 `errors/index.ts` 提取 `ErrorFactory` 对象
  - 添加 `@description` 注释
  - 为每个工厂方法添加 `@param` 和 `@returns`

- [x] 2.4 重构 `src/errors/index.ts`
  - 修改为统一导出模块
  - 保持向后兼容的导出接口
  - 添加文件头注释

- [x] 2.5 验证错误模块拆分
  - 运行代码生成，验证错误处理功能正常
  - 检查文件行数是否 <360
  - 运行 `pnpm run lint:fix`

## 阶段 3：模板模块拆分

- [x] 3.1 创建 `src/generator/template/templateCache.ts`
  - 从 `template.ts` 提取模板缓存逻辑
  - 添加 `getTemplateCacheStats()` 和 `clearTemplateCache()` 注释
  - 验证缓存功能正常

- [x] 3.2 创建 `src/generator/template/templateHelpers.ts`
  - 从 `template.ts` 提取 `registerTemplateHelpers()` 函数
  - 为每个辅助函数添加 JSDoc 注释
  - 验证辅助函数注册正常

- [x] 3.3 创建 `src/generator/template/templatePartials.ts`
  - 从 `template.ts` 提取 `registerTemplatePartials()` 函数
  - 为 partial 模板添加注释
  - 验证 partial 注册正常

- [x] 3.4 创建 `src/generator/template/compiler.ts`
  - 从 `template.ts` 提取模板编译逻辑
  - 为 `compileTemplate()` 添加完整注释
  - 验证模板编译功能正常

- [x] 3.5 重构 `src/generator/template/index.ts`
  - 修改为统一导出模块
  - 保持向后兼容的导出接口
  - 添加文件头注释

- [x] 3.6 删除原 `src/generator/template.ts` 并移除旧代码

- [x] 3.7 验证模板模块拆分
  - 运行代码生成，验证模板功能正常
  - 检查所有模板文件行数 <360
  - 运行 `pnpm run lint:fix`

## 阶段 4：Zod Schema 模板拆分

- [x] 4.1 创建 `src/templates/schema-zod/types.ts`
  - 从 `schema-zod.ts` 提取类型相关模板
  - 为 `getZodTypeTemplate()` 添加 JSDoc 注释
  - 为 `generateZodTypeSchema()` 添加完整注释

- [x] 4.2 创建 `src/templates/schema-zod/interfaces.ts`
  - 从 `schema-zod.ts` 提取接口相关模板
  - 为接口模板函数添加 JSDoc 注释
  - 验证接口模板功能正常

- [x] 4.3 创建 `src/templates/schema-zod/requests.ts`
  - 从 `schema-zod.ts` 提取请求相关模板
  - 为请求模板函数添加 JSDoc 注释
  - 验证请求模板功能正常

- [x] 4.4 重构 `src/templates/schema-zod/index.ts`
  - 修改为统一导出模块
  - 保持向后兼容的导出接口
  - 添加文件头注释

- [x] 4.5 删除原 `src/templates/schema-zod.ts` 并移除旧代码

- [x] 4.6 验证 Zod Schema 模板拆分
  - 运行代码生成（使用 Zod 格式）
  - 验证生成的 Zod Schema 正确
  - 检查所有文件行数 <360

## 阶段 5：命名策略模块创建

- [x] 5.1 创建 `src/generator/naming/strategy.ts`
  - 定义 `NamingContext` 接口
  - 定义 `NamingStrategy` 接口
  - 实现 `defaultNamingStrategy` 默认策略
  - 为所有接口和函数添加完整 JSDoc 注释

- [x] 5.2 创建 `src/generator/naming/sanitizer.ts`
  - 从 `generator/naming.ts` 提取名称清理函数
  - 为 `sanitizeTypeName()`、`sanitizeInterfaceName()` 等添加 `@example` 标签
  - 移除测试函数（testSanitizeTypeName）

- [x] 5.3 创建 `src/generator/naming/index.ts`
  - 统一导出命名策略模块
  - 添加文件头注释

- [x] 5.4 实现 `applyNamingStrategy()` 函数
  - 在 `strategy.ts` 中实现策略合并逻辑
  - 添加完整 JSDoc 注释，包括示例
  - 验证自定义策略和默认策略合并逻辑

- [x] 5.5 更新 `src/generator/naming.ts`
  - 重构为只导出 `strategy.ts` 和 `sanitizer.ts`
  - 添加文件头注释
  - 或者考虑删除此文件，完全使用新的命名模块

## 阶段 6：生成器模块拆分

- [x] 6.1 创建 `src/generator/generators/interfaceGenerator.ts`
  - 从 `fileGenerator.ts` 提取 `generateInterfaceFiles()` 函数
  - 重构为使用新的命名策略模块
  - 为所有函数添加完整 JSDoc 注释
  - 验证接口文件生成功能

- [x] 6.2 创建 `src/generator/generators/typeGenerator.ts`
  - 从 `fileGenerator.ts` 提取类型文件生成逻辑
  - 重构为使用新的命名策略模块
  - 为所有函数添加完整 JSDoc 注释
  - 验证类型文件生成功能

- [x] 6.3 创建 `src/generator/generators/schemaGenerator.ts`
  - 从 `fileGenerator.ts` 提取 Schema 文件生成逻辑
  - 重构为使用新的命名策略模块
  - 为所有函数添加完整 JSDoc 注释
  - 验证 Schema 文件生成功能

- [x] 6.4 重构 `src/generator/fileGenerator.ts`
  - 修改为协调器模块（<250 行）
  - 导入并调用各个生成器
  - 保持向后兼容的导出接口
  - 添加文件头注释

- [x] 6.5 删除文件中的重复代码
  - 删除 `InterfaceNamingInfo` 本地定义（使用类型导入）
  - 确保所有生成器使用统一的命名策略

- [x] 6.6 验证生成器模块拆分
  - 运行完整代码生成流程
  - 验证所有文件生成正确
  - 检查所有文件行数 <360
  - 运行 `pnpm run lint:fix`

## 阶段 7：公共逻辑抽离

- [ ] 7.1 创建 `src/processors/common.ts`
  - 识别 TypeScript 类型和 Zod Schema 生成的公共逻辑
  - 提取路径处理逻辑
  - 提取标签处理逻辑
  - 为所有函数添加 JSDoc 注释

- [ ] 7.2 更新 `src/processors/openapi.ts`
  - 重构为使用 `common.ts` 中的公共逻辑
  - 添加文件头注释
  - 验证 OpenAPI 数据处理功能正常

## 阶段 8：注释风格统一（所有文件）

- [ ] 8.1 更新文件头注释
  - 遍历所有 `src/` 下的 `.ts` 文件
  - 确保每个文件有 `@description` 文件头注释
  - 使用中文描述文件用途

- [ ] 8.2 添加核心函数的 `@example` 标签
  - 识别关键函数（命名策略、类型清理、生成器等）
  - 为每个函数添加 `@example` 标签和示例代码

- [ ] 8.3 补充 `@param` 和 `@returns` 标签
  - 遍历所有函数
  - 确保每个参数有 `@param` 注释
  - 确保有返回值的函数有 `@returns` 注释

- [ ] 8.4 验证注释完整性
  - 运行 `grep -r "@description" src/` 检查覆盖情况
  - 运行 `grep -r "@param" src/` 检查参数注释
  - 运行 `grep -r "@returns" src/` 检查返回值注释
  - 运行 `grep -r "@example" src/` 检查示例注释

## 阶段 9：最终验证和测试

- [ ] 9.1 运行完整代码生成
  - 使用 TypeScript 格式生成代码
  - 使用 Zod 格式生成代码
  - 检查输出与重构前是否一致

- [ ] 9.2 验证文件行数约束
  - 运行 `find src -name "*.ts" -exec wc -l {} +`
  - 确认所有文件行数 <360
  - 运行 `pnpm run check:linesize`（如果已配置）

- [ ] 9.3 运行代码质量检查
  - 运行 `pnpm run lint:fix`
  - 检查是否有 ESLint 错误
  - 修复所有 Lint 错误

- [ ] 9.4 构建项目
  - 运行 `pnpm run build`
  - 确认构建成功
  - 检查 `dist/` 目录输出

- [ ] 9.5 功能测试
  - 测试 `npx api-power init` 初始化命令
  - 测试 `npx api-power generate --config xxx` 生成命令
  - 测试 `npx api-power debug` 调试命令

- [ ] 9.6 代码对比验证
  - 对比重构前后生成的代码
  - 确认功能完全一致
  - 确认生成的代码风格符合规范

## 阶段 10：文档更新和清理

- [ ] 10.1 更新 `AGENTS.md`
  - 记录新的目录结构
  - 更新代码生成流程说明
  - 更新代码风格指南

- [ ] 10.2 清理临时文件
  - 删除备份文件
  - 删除测试输出
  - 清理 `.DS_Store` 等

- [ ] 10.3 Git 提交
  - 使用 `git add` 暂存所有更改
  - 创建规范的提交信息
  - 验证提交前钩子

## 并行任务

以下任务可以并行进行（不相互依赖）：

- **并行组 A**：阶段 2（错误模块拆分）
- **并行组 B**：阶段 3（模板模块拆分）
- **并行组 C**：阶段 4（Zod Schema 模板拆分）
- **并行组 D**：阶段 8 中的子任务（文件头注释、示例标签等）

## 验证标准

每个阶段完成后必须满足：

1. ✅ 所有新文件行数 <360
2. ✅ 所有函数有 JSDoc 注释
3. ✅ 通过 `pnpm run lint:fix`
4. ✅ 代码生成功能正常
5. ✅ 保持向后兼容性

## 预估时间

| 阶段                        | 预估时间    |
| --------------------------- | ----------- |
| 阶段 1：准备                | 0.5 小时    |
| 阶段 2：错误模块拆分        | 1.5 小时    |
| 阶段 3：模板模块拆分        | 2 小时      |
| 阶段 4：Zod Schema 模板拆分 | 1.5 小时    |
| 阶段 5：命名策略模块创建    | 2 小时      |
| 阶段 6：生成器模块拆分      | 3 小时      |
| 阶段 7：公共逻辑抽离        | 1 小时      |
| 阶段 8：注释风格统一        | 2 小时      |
| 阶段 9：最终验证和测试      | 1.5 小时    |
| 阶段 10：文档更新和清理     | 0.5 小时    |
| **总计**                    | **16 小时** |

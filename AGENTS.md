# AGENTS.md

本文件为代理编码助手在该仓库中工作时提供指导。

## 构建命令

```bash
pnpm install && pnpm run build       # 安装依赖并构建项目
pnpm run lint:fix                    # 格式化并修复代码
pnpm run dev                         # 开发模式（使用配置文件生成代码）
npx api-power generate --config xxx  # 使用配置生成代码
pnpm test                            # 运行单元测试
pnpm test:watch                      # 监听模式运行测试
pnpm test:coverage                   # 运行测试并生成覆盖率报告
```

**重要**: 修改代码后务必运行 `pnpm test` 确保所有测试通过。测试框架为 Vitest，测试文件位于各模块的 `__tests__/` 目录下，共享夹具在 `tests/fixtures/mockData.ts`。

## 规则

1. **禁止提交代码** — 不要执行 `git commit`、`git push` 等提交操作，由用户自行提交
2. **删除文件前必须告知用户并取得同意** — 不能未经确认删除任何文件
3. **Superpowers spec/plan 文件位置** — 仅存放在 `superpowers/spec/` 和 `superpowers/plan/` 下。这两个目录已在 `.gitignore` 中，禁止从 `.gitignore` 中删除 `superpowers/` 条目，禁止将 spec/plan 文件放到其他文件夹
4. 执行任务之前必须阅读 `.wiki/` 中的项目概述和文档结构，了解项目的整体架构和设计原则。
5. 在处理代码时，必须遵循项目的编码规范和提交规范，确保代码质量和一致性。
6. 在修改或添加功能时，必须更新相关文档，确保文档与代码保持一致。
7. 在生成代码时，必须遵循项目的代码生成模式和文件结构。

## 代码风格指南

### 导入顺序

1. 外部库/包导入
2. 内部模块导入（使用 @ 别名）
3. 类型导入（使用 `import type`）

```typescript
import consola from 'consola';
import { ServerType } from '@/types';
import type { ApiConfig } from '@/types';
```

### 格式化

- 格式化使用 **prettier-config-ali**（Ali 配置标准）；代码检查使用 **OxLint**（配置见 `.oxlintrc.json`，规则类别 correctness + suspicious）
- 换行符：LF
- 运行 `pnpm run lint:fix` 自动格式化

### 类型定义

- TypeScript 严格模式启用（`noImplicitAny: false`）
- 使用 `interface` 定义对象类型，`enum` 定义常量集合
- 优先使用 `export type` 导出纯类型
- 类型路径别名：`@/*` 映射到 `./src/*`

### 命名约定

| 类型      | 约定                    | 示例                                               |
| --------- | ----------------------- | -------------------------------------------------- |
| 文件      | camelCase 或 kebab-case | `apifox.ts`, `openapi.ts`, `interfaceGenerator.ts` |
| 函数      | camelCase               | `fetchData`, `processOpenApiData`                  |
| 类        | PascalCase              | `SimpleProgress`, `BaseError`                      |
| 常量/工厂 | PascalCase              | `ErrorFactory`, `PRESETS`                          |
| 接口/类型 | PascalCase              | `ApiConfig`, `ProcessedApiData`                    |

**目录组织原则**：

- `generators/`：使用 `{type}Generator.ts` 命名（如 `interfaceGenerator.ts`）
- `naming/`：按职责命名（如 `strategy.ts`, `sanitizer.ts`）
- `template/`：按功能命名（如 `compiler.ts`, `templateCache.ts`）

### 错误处理

使用自定义错误系统（src/errors/）：

- `errorCodes.ts`：错误代码枚举（`E1xxx` 配置、`E2xxx` 网络、`E3xxx` 生成）
- `errorFactory.ts`：工厂方法创建结构化错误
- `index.ts`：统一导出模块

```typescript
try {
  // 业务逻辑
} catch (error: any) {
  if (error.code && error.code.startsWith('E2')) throw error;
  throw ErrorFactory.fetchFailed(url, statusCode, error);
}
```

### 注释规范

使用 JSDoc 风格注释，文件头使用中文描述：

````typescript
/**
 * @description 从 Apifox 平台获取 OpenAPI 数据
 * @param config API 配置对象
 * @returns Promise<ApiData> API 数据
 *
 * @example
 * ```typescript
 * const data = await fetchApifoxData({ source: '...', token: '...' });
 * console.log(data);
 * ```
 */
export async function fetchApifoxData(config: ApiConfig): Promise<any> {
  // ...
}
````

**注释要求**：

1. 每个文件必须有 `@description` 文件头注释（中文）
2. 每个函数必须有 `@description` 注释
3. 有参数的函数必须有 `@param` 注释
4. 有返回值的函数必须有 `@returns` 注释
5. 核心函数（命名策略、类型清理、生成器等）需要 `@example` 标签

### 日志输出

使用统一日志模块（`@/utils/logger`）进行日志输出，该模块基于 consola 封装：

```typescript
import { logger } from '@/utils/logger';

// 普通日志，始终输出
logger.info('处理开始');
logger.success('处理完成');
logger.warn('警告信息');
logger.error('错误信息');

// debug 日志，仅 setDebugEnabled(true) 后输出（debug 命令自动启用）
logger.debug('调试信息:', data);
```

**设计要点**：不要使用 `if (process.env.DEBUG)` 手动守卫——logger 模块内部已通过运行时开关控制 debug 日志输出。`debug` 命令会调用 `setDebugEnabled(true)` 激活 debug 日志。

## 核心配置

`defineConfig` 采用**多服务（microservice）配置**：顶层是所有服务共享的公共配置，`services: ServiceConfig[]` 数组声明每个服务独立的数据源与输出位置。`defineConfig` 返回 `ApiConfig[]`（单源即数组长度 1）。关键变化（破坏式、不向后兼容）：

- 顶层 `outputDir` → `baseOutputDir`（公共根输出目录）
- `source` / `token` 下沉到 `services[]` 每个服务级（必填 `name`，可选 `folder`，默认取 `name`，可多段如 `'trade/order'`）
- 共享 `request.ts` 位于 `baseOutputDir` 层级；各服务输出至 `join(baseOutputDir, folder ?? name)`
- 校验：`name` 唯一、各服务计算后的 `outputDir` 不相同/不嵌套，否则抛 `E1002`
- 单源场景用 `services: [{ name: 'main', folder: '.', source, token }]`，输出直接落在 `baseOutputDir`

### typesFormat 配置

控制类型生成格式，影响文件结构和导入路径：

- **TypeScript 模式**：生成 TypeScript 类型定义（编译时类型检查）
- **Zod 模式**：生成 Zod Schema（运行时验证 + 类型推导）

```typescript
export default defineConfig({
  baseOutputDir: 'src/service',
  typesFormat: 'zod', // 或 'typescript'
  services: [{ name: 'main', folder: '.', source: 'YOUR_API_SOURCE', token: 'YOUR_TOKEN' }],
});
```

### target 配置

`target: 'javascript'` 时：

- 所有输出文件扩展名变为 `.js`（通过 `getFileExtension()` 辅助函数）
- 不论 `typesFormat` 值如何，均不生成 TS 类型和 Zod 内容
- `requestFunctionFilePath` 默认值自动从 `.ts` 调整为 `.js`

## 代码生成约束

**文件行数限制**：

- 所有源代码文件应保持在 360 行以下
- 例外：`src/generator/template/compiler.ts`（主要包含模板字符串）

**禁止使用**：

- `delete` 关键字
- `eval` 语法
- 过度使用闭包

**生成文件**：

- `src/service/` 目录包含生成的文件
- 不要在未获得许可的情况下修改生成的文件

## 环境要求

- Node.js >= 22.18.0（开发工具链要求；发布产物 `engines` 为 >= 22.12.0）
- 使用 pnpm 作为包管理器
- 输出目录：`dist/`（由 tsdown 构建）
- Husky + lint-staged 用于提交前钩子

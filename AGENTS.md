<!-- OPENSPEC:START -->

# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:

- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:

- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# AGENTS.md

本文件为代理编码助手在该仓库中工作时提供指导。

## 构建命令

```bash
pnpm install && pnpm run build       # 构建项目
pnpm run lint:fix                    # 格式化并修复代码
pnpm run dev                         # 开发模式（使用配置文件生成代码）
npx ts-node src/index.ts             # 验证代码生成
npx api-power generate --config xxx  # 使用配置生成代码
```

**重要**: 本项目没有单元测试，通过运行生成代码并检查 `src/service/` 输出来验证更改。

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

- 使用 **prettier-config-ali** 和 **eslint-config-ali**（Ali 配置标准）
- 换行符：LF
- 运行 `pnpm run lint:fix` 自动格式化

### 类型定义

- TypeScript 严格模式启用（`noImplicitAny: false`）
- 使用 `interface` 定义对象类型，`enum` 定义常量集合
- 优先使用 `export type` 导出纯类型
- 类型路径别名：`@/*` 映射到 `./src/*`

### 命名约定

| 类型      | 约定                    | 示例                              |
| --------- | ----------------------- | --------------------------------- |
| 文件      | camelCase 或 kebab-case | `apifox.ts`, `openapi.ts`         |
| 函数      | camelCase               | `fetchData`, `processOpenApiData` |
| 类        | PascalCase              | `SimpleProgress`, `BaseError`     |
| 常量/工厂 | PascalCase              | `ErrorFactory`, `PRESETS`         |
| 接口/类型 | PascalCase              | `ApiConfig`, `ProcessedApiData`   |

### 错误处理

使用自定义错误系统（src/errors/index.ts）：

- 错误代码枚举：`E1xxx`（配置）、`E2xxx`（网络）、`E3xxx`（生成）
- 使用 `ErrorFactory` 方法创建结构化错误

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

```typescript
/**
 * @description 从 Apifox 平台获取 OpenAPI 数据
 */
export async function fetchApifoxData(config: ApiConfig): Promise<any> {
  // ...
}
```

### 日志输出

使用 **consola** 库进行日志输出：

```typescript
if (process.env.DEBUG) {
  consola.debug('调试信息:', data);
}
```

## 核心配置

### typesFormat 配置

控制类型生成格式，影响文件结构和导入路径：

- **TypeScript 模式**：生成 TypeScript 类型定义（编译时类型检查）
- **Zod 模式**：生成 Zod Schema（运行时验证 + 类型推导）

```typescript
export default defineConfig({
  typesFormat: 'zod', // 或 'typescript'
});
```

## 代码生成约束

**禁止使用**：

- `delete` 关键字
- `eval` 语法
- 过度使用闭包

**生成文件**：

- `src/service/` 目录包含生成的文件
- 不要在未获得许可的情况下修改生成的文件

## 项目架构

- **CLI 层**（src/cli/）：Commander.js 命令行界面
- **Client 层**（src/clients/）：API 数据获取器（Apifox/Swagger）
- **Generator 层**（src/generator/）：代码生成管道
- **Processors**（src/processors/）：数据转换
- **Templates**（src/templates/）：Handlebars 模板

## 提交规范

使用 **Commitlint** 约定式提交：

- 类型：`feat`、`fix`、`docs`、`style`、`test`、`refactor`、`chore`、`revert`
- 格式：`type(scope): description`

```bash
pnpm run versioning    # 生成版本和 CHANGELOG
pnpm run release       # 完整发布流程
```

## 环境要求

- Node.js >= 20.0.0
- 使用 pnpm 作为包管理器
- 输出目录：`dist/`（由 tsdown 构建）
- Husky + lint-staged 用于提交前钩子

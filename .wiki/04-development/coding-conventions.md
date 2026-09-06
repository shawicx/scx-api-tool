# 编码规范

一句话职责：本仓库的代码风格、注释、命名与结构性约束摘要。权威来源为 [AGENTS.md](../../AGENTS.md) 与 OxLint/Prettier 配置。

## 导入顺序

1. 外部库/包导入
2. 内部模块导入（`@/` 别名）
3. 类型导入（`import type`）

```typescript
import consola from 'consola';
import { ServerType } from '@/types';
import type { ApiConfig } from '@/types';
```

## 格式化

- Lint：OxLint（`.oxlintrc.json`）；Prettier：`prettier-config-ali`
- 换行符 LF；运行 `pnpm run lint:fix` 自动修复
- TypeScript 严格模式（`noImplicitAny: false`）
- 对象类型用 `interface`，常量集合用 `enum`，纯类型导出用 `export type`

## 命名约定

| 类型      | 约定                   | 示例                                 |
| --------- | ---------------------- | ------------------------------------ |
| 文件      | camelCase / kebab-case | `apifox.ts`、`serviceDirs.ts`        |
| 函数      | camelCase              | `fetchData`、`resolveServiceConfigs` |
| 类        | PascalCase             | `ConfigCacheManager`、`BaseError`    |
| 常量/工厂 | PascalCase             | `ErrorFactory`、`PRESETS`            |
| 接口/类型 | PascalCase             | `ApiConfig`、`MultiServiceConfig`    |

目录组织：`generators/` 用 `{type}Generator.ts`；`naming/` 按职责（`strategy.ts`、`sanitizer.ts`）；`template/` 按功能（`compiler.ts`、`templateCache.ts`）。

## 注释规范（JSDoc，中文）

1. 每个文件必须有 `@description` 文件头注释
2. 每个函数必须有 `@description`
3. 有参数必须 `@param`，有返回值必须 `@returns`
4. 核心函数（命名策略、类型清理、生成器等）需要 `@example`

## 结构性约束

- **文件行数 ≤ 360 行**，唯一例外 `src/generator/template/compiler.ts`；用 `pnpm run check:linesize` 检查
- **禁止**：`delete` 关键字、`eval` 语法、过度使用闭包
- `src/service/` 为生成文件，未经许可不要修改
- 修改代码后必须运行 `pnpm test`
- 提交遵循 commitlint conventional 规范（允许类型见 `package.json` 的 `commitlint` 配置；`RELEASING` 为大写例外）；代理不执行 `git commit` / `git push`

## 日志规范

统一使用 `@/utils/logger`（`logger.info/success/warn/error/debug`），不要手写 `process.env.DEBUG` 守卫。

## Related

- [AGENTS.md](../../AGENTS.md)（权威版本）
- [本地开发](../02-getting-started/local-development.md)
- [测试体系](./testing.md)

# 本地开发

一句话职责：如何在本地搭建环境、运行与调试本项目。

## 前置要求

| 要求    | 版本      | 说明                |
| ------- | --------- | ------------------- |
| Node.js | >= 20.0.0 | ESM 和现代 API 所需 |
| pnpm    | 最新版    | 包管理器            |
| Git     | 任意版本  | 版本控制            |

## 环境搭建

```bash
git clone https://github.com/shawicx/scx-api-tool.git
cd scx-api-tool
pnpm install
pnpm run build        # 生产构建（输出 dist/）
pnpm run dev          # 开发模式生成（需要根目录 api-power.config.ts）
```

> `pnpm run dev` 实际执行 `tsx src/index.ts generate --config api-power.config.ts`。仓库不含真实 token，需自建配置文件（参考 [配置体系](./configuration.md)）。

## 脚本命令

| 脚本             | 命令                                                     | 说明                         |
| ---------------- | -------------------------------------------------------- | ---------------------------- |
| `dev`            | `tsx src/index.ts generate --config api-power.config.ts` | 直接运行生成（无需构建）     |
| `build`          | `NODE_ENV=production tsdown`                             | 生产构建到 `dist/`           |
| `test`           | `vitest run`                                             | 运行单元测试                 |
| `test:watch`     | `vitest --watch`                                         | 监听模式                     |
| `test:coverage`  | `vitest run --coverage`                                  | 覆盖率报告（v8，阈值 ≥ 75%） |
| `lint`           | `eslint .`                                               | 代码检查                     |
| `lint:fix`       | `prettier --write . && eslint --fix .`                   | 自动格式化与修复             |
| `check:linesize` | `find src -name '*.ts' -exec wc -l {} + \| awk ...`      | 检查超过 360 行的文件        |
| `docs:dev`       | `vitepress dev`                                          | 文档站开发服务器             |
| `release`        | 构建 → `standard-version` → push → `pnpm publish`        | 完整发布流程                 |
| `analyze:deps`   | `node scripts/analyze-deps.js`                           | 依赖结构分析                 |

完整脚本见 `package.json`。

## 关键入口点

| 入口           | 路径                        | 用途                                         |
| -------------- | --------------------------- | -------------------------------------------- |
| CLI 入口       | `src/index.ts`              | 程序启动 + 公共导出                          |
| CLI 程序       | `src/cli/program.ts`        | 命令注册                                     |
| 生成主入口     | `src/generator/index.ts`    | `generateCode()`：并发拉取 + 串行生成        |
| 生成协调器     | `src/generator/codegen.ts`  | `generateFiles()`                            |
| OpenAPI 处理器 | `src/processors/openapi.ts` | `processOpenApiData()`                       |
| 配置解析       | `src/utils/multiService.ts` | `resolveServiceConfigs()`                    |
| 配置类型       | `src/types/config.ts`       | `MultiServiceConfig`、`ApiConfig`、`PRESETS` |

## 调试技巧

1. **`--verbose`**：`api-power generate --verbose` 输出详细错误与堆栈
2. **`debug` 命令**：dry-run 诊断，检查 API 定义但不生成/清空输出目录
3. **debug 日志**：`src/utils/logger.ts` 的 `logger.debug()` 仅在 `setDebugEnabled(true)` 后输出（`debug` 命令自动启用）；不要手写 `if (process.env.DEBUG)` 守卫
4. **钩子打点**：在 `beforeWriteFile` 钩子中打印文件路径与内容
5. **测试**：修改代码后务必运行 `pnpm test`

## Related

- [配置体系](./configuration.md)
- [编码规范](../04-development/coding-conventions.md)
- [测试体系](../04-development/testing.md)
- [故障排除](../99-reference/troubleshooting.md)

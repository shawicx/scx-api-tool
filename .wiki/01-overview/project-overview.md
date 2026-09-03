# 项目总览

一句话职责：`@scxfe/api-tool` 是一个 Node.js CLI 工具（CLI 名 `api-power`），从 Swagger/OpenAPI 3.0 与 Apifox 的接口定义自动生成 TypeScript/JavaScript 的请求函数与类型代码。

## 核心能力

- **多服务配置（microservice）**：一份配置声明多个后端服务，公共配置顶层共享，各服务独立数据源与输出目录；数据**并发拉取**（单服务失败自动隔离，不影响其他服务）、代码**串行生成**（见 [架构](./architecture.md)）
- **多数据源**：Swagger/OpenAPI 3.0 与 Apifox，基于 URL 主机名自动检测服务类型，客户端插件化可扩展
- **多输出格式**：TypeScript 类型定义、Zod 运行时验证 Schema、JavaScript 纯代码（`target: 'javascript'`）
- **路径参数插值**：OpenAPI 路径中的 `{param}` 自动插值为模板字符串（如 `` `/api/stock/${params.code}` ``），支持多参数与安全转义
- **可配置预设**：`minimal` / `standard` / `verbose` 三种预设，分层配置合并
- **可插拔命名**：通过 `NamingStrategy` 接口自定义所有生成代码的命名
- **生命周期钩子**：`beforeGenerate` / `afterGenerate` / `beforeWriteFile` / `afterWriteFile`
- **中文标签支持**：自动将中文标签转为拼音目录名（`pinyin-pro`）
- **Watch 模式**：配置变更时自动重新生成

## CLI 命令

入口：`src/cli/main.ts`（bin 可执行入口，构建为 `dist/cli.js`）→ `src/cli/program.ts`（Commander.js）。库入口为 `src/index.ts`（纯公共导出，与 CLI 分离，import 无副作用）。

| 命令        | 别名  | 说明                                      | 实现                            |
| ----------- | ----- | ----------------------------------------- | ------------------------------- |
| `generate`  | —     | 获取 API 定义并生成代码（支持 `--watch`） | `src/cli/commands/generate.ts`  |
| `init`      | —     | 生成默认 `api-power.config.ts`            | `src/cli/commands/init.ts`      |
| `verify`    | —     | 对生成产物运行 TypeScript 类型检查        | `src/cli/commands/verify.ts`    |
| `debug`     | —     | 诊断模式：检查 API 定义（不生成代码）     | `src/cli/commands/debug.ts`     |
| `visualize` | `viz` | 启动 HTTP 服务器，可视化查看 API 结构     | `src/cli/commands/visualize.ts` |

全局选项：`-v, --verbose` 显示详细错误信息和堆栈跟踪。`init` 生成的默认配置模板位于 `src/cli/constants.ts` 的 `DEFAULT_CONFIG`。

`verify` 作为生成后的质量关卡：复用消费方 `tsconfig.json` 的 paths 别名（强制 `noEmit`，忽略其 include/exclude），对配置中所有服务的产物目录递归跑 tsc 诊断；typescript 编译器优先解析消费方依赖、回退到工具自身。生成目录通常被 tsconfig exclude，此命令补上这道检查盲区。

## 版本与运行环境

| 项       | 值                              |
| -------- | ------------------------------- |
| 版本     | 0.6.2（见 `package.json`）      |
| 模块系统 | ESM only（`"type": "module"`）  |
| Node.js  | >= 20.0.0                       |
| 构建     | tsdown（基于 rolldown）         |
| 测试     | Vitest（覆盖率 v8，阈值 ≥ 75%） |

## 使用者文档

详细的安装、配置示例与迁移指南在 `docs/`（VitePress 站点）：`docs/getting-started/`、`docs/guides/configuration.md`、`docs/guides/examples.md`、`docs/guides/migration.md`。

## Related

- [高层架构](./architecture.md)
- [配置体系](../02-getting-started/configuration.md)
- [仓库 README](../../README.md)

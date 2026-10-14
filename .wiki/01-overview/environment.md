# 环境与运行（@scxfe/api-tool）

<details>
<summary>Relevant source files</summary>

- api-power.config.ts
- scripts/analyze-deps.js
- src/cli/main.ts
- src/utils/logger.ts
- tsdown.config.ts

</details>

本页说明 `@scxfe/api-tool` 的运行时约束、包管理器约定、全部脚本命令的行为与产出，以及源码中被读取的环境变量，供读者据此准备环境并正确执行命令。

## 项目信息

| 项            | 值                |
| ------------- | ----------------- |
| 包名          | `@scxfe/api-tool` |
| 版本          | `0.6.9`           |
| 模块运行时    | ESM               |
| Node 版本要求 | `>=22.12.0`       |
| 包管理器      | pnpm              |

**运行时与包管理器的实际影响：**

项目以 ESM 作为模块运行时，源码与配置一律按 ESM 语义书写：模块导出必须使用 `export`，导入必须使用 `import ... from`，不能使用 `require` / `module.exports`（待确认）；同时 Node 版本下限为 `>=22.12.0`，低于该版本的 Node 不具备项目依赖的运行时能力。包管理器为 pnpm：依赖安装使用 `pnpm install`（不要用 `npm install` / `yarn`（待确认）），执行脚本使用 `pnpm run <script>`，且项目包含 `prepare: husky` 钩子，因此首次 `pnpm install` 会顺带初始化 Git hooks；`release` 流程中的 `pnpm publish`、`prepublish` 串联也依赖 pnpm 的命令语义。

## 脚本命令

| 命令             | 脚本内容                                                                                  | 行为与预期产出                                                                                                                                                              |
| ---------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dev`            | `tsx src/cli/main.ts generate --config api-power.config.ts`                               | 用 tsx 直接（免编译）运行 TypeScript 入口 `src/cli/main.ts`，以 `generate` 子命令启动，配置文件指向 `api-power.config.ts`。属于本地开发态执行路径，产出即该子命令的运行结果 |
| `build`          | `NODE_ENV=production tsdown`                                                              | 以 `NODE_ENV=production` 注入环境后调用 tsdown 打包，产出发布用构建产物；该注入的变量由构建配置 `tsdown.config.ts` 读取                                                     |
| `analyze:deps`   | `node scripts/analyze-deps.js`                                                            | 直接以 Node 执行依赖分析脚本 `scripts/analyze-deps.js`，产出依赖分析结果（结果落点由该脚本决定）                                                                            |
| `ci:lint`        | `oxlint src -f json > ./.ci/oxlint.json`                                                  | 以 JSON 格式检查 `src` 目录，报告重定向写入 `./.ci/oxlint.json`，供 CI 消费；需保证 `./.ci` 目录存在                                                                        |
| `docs:build`     | `vitepress build`                                                                         | 用 VitePress 构建文档站点，产出可部署的静态站点产物                                                                                                                         |
| `docs:dev`       | `vitepress dev`                                                                           | 启动 VitePress 本地文档开发服务，供编写/预览文档使用                                                                                                                        |
| `docs:preview`   | `vitepress preview`                                                                       | 本地预览已构建的文档站点产物                                                                                                                                                |
| `lint`           | `oxlint .`                                                                                | 对全仓库执行 oxlint 静态检查，输出问题清单                                                                                                                                  |
| `lint:fix`       | `prettier --write . && oxlint --fix .`                                                    | 先用 Prettier 全量格式化写入，再用 oxlint 自动修复可修问题，串行两步                                                                                                        |
| `check:linesize` | `find src -name '*.ts' -exec wc -l {} + \| awk '$1 > 360 { print $2 " (" $1 " lines)" }'` | 统计 `src` 下所有 `.ts` 文件行数，列出超过 360 行的文件及其行数，用于控制单文件体量                                                                                         |
| `test`           | `vitest run`                                                                              | 单次运行全部测试并退出，产出测试结果                                                                                                                                        |
| `test:watch`     | `vitest --watch`                                                                          | 以监听模式运行测试，文件变更时自动重跑                                                                                                                                      |
| `test:coverage`  | `vitest run --coverage`                                                                   | 单次运行测试并生成覆盖率报告                                                                                                                                                |
| `prepare`        | `husky`                                                                                   | 安装期钩子，初始化 husky 的 Git hooks（由 pnpm 安装流程自动触发）                                                                                                           |
| `prepublish`     | `pnpm run build`                                                                          | 发布前置步骤，先执行构建，确保产物为最新                                                                                                                                    |
| `versioning`     | `standard-version`                                                                        | 依据提交历史完成版本号提升与变更日志生成                                                                                                                                    |
| `postaction`     | `git push origin main --tags && git push origin main --tags`                              | 推送 `main` 分支与标签到远端；注意脚本中该条推送命令写了两遍，会执行两次                                                                                                    |
| `release`        | `pnpm run prepublish && pnpm run versioning && pnpm run postaction && pnpm publish`       | 完整发布链路：构建 → 版本与日志 → 推送分支与标签 → 发布到 registry，任一步失败即中断                                                                                        |
| `analyze:deps`   | 见上                                                                                      | —                                                                                                                                                                           |

> `test` / `test:watch` / `test:coverage` 三条命令用于驱动测试运行器，其覆盖范围由测试文件决定，本页不对测试内容做功能描述。

**常用命令速览：** 本地开发 `pnpm run dev`；构建 `pnpm run build`；全量检查 `pnpm run lint`；自动修复 `pnpm run lint:fix`；测试 `pnpm run test`；发布 `pnpm run release`。

## 环境变量

| 变量名     | 敏感 | 生产引用              | 用途说明                                                                                                               |
| ---------- | ---- | --------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `DEBUG`    | 否   | `src/utils/logger.ts` | 见生产引用。依据变量名与其在日志模块中的引用位置，可判断其影响日志的调试输出行为，具体判定逻辑见 `src/utils/logger.ts` |
| `NODE_ENV` | 否   | `tsdown.config.ts`    | 由 `build` 脚本以 `NODE_ENV=production` 注入，构建配置 `tsdown.config.ts` 读取该变量以区分构建模式                     |

两个变量均非敏感项，无需以密钥方式管理；但 `NODE_ENV` 会影响构建配置的分支选择，本地手动执行 tsdown 时若不注入该变量，其取值将与 `build` 脚本路径不同。

## Related

- 同目录：[overview.md](overview.md) · [tech-stack.md](tech-stack.md)
- 共享 2 个源文件、共享 33 个符号：[onboarding.md](../05-guides/onboarding.md)
- 共享 1 个源文件、共享 28 个符号：[troubleshooting.md](../05-guides/troubleshooting.md)
- 共享 1 个源文件、共享 2 个符号：[modules.md](../02-architecture/modules.md)
- 总入口：[README](../README.md)

<!-- wiki:source: llm -->

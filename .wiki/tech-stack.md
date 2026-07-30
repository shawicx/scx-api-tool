# 技术栈

## 运行时依赖

| 包名             | 版本     | 用途                                 |
| ---------------- | -------- | ------------------------------------ |
| `commander`      | ^14.0.2  | CLI 命令定义与解析                   |
| `axios`          | ^1.13.2  | 从远程服务器获取 API 定义            |
| `handlebars`     | ^4.7.8   | 代码生成模板引擎                     |
| `consola`        | ^3.4.2   | 结构化日志输出                       |
| `pinyin-pro`     | ^3.27.0  | 中文标签 → 拼音目录名                |
| `dayjs`          | ^1.11.19 | 日期处理（当前未使用）               |
| `@clack/prompts` | ^0.11.0  | 交互式提示（当前仅作为潜在依赖保留） |

## 开发依赖

| 包名                               | 版本              | 用途                             |
| ---------------------------------- | ----------------- | -------------------------------- |
| `typescript`                       | ^5.9.3            | 类型检查与编译                   |
| `@types/node`                      | ^25.0.3           | Node.js 类型定义                 |
| `tsdown`                           | ^0.13.5           | 构建打包（基于 rolldown）        |
| `tsx`                              | ^4.21.0           | 开发模式直接运行 TS              |
| `eslint` + `eslint-config-ali`     | ^9.39.2 / ^16.6.0 | 代码检查（阿里规则）             |
| `eslint-config-prettier`           | ^10.1.8           | 关闭与 Prettier 冲突的规则       |
| `eslint-plugin-prettier`           | ^5.5.4            | 将 Prettier 作为 ESLint 规则运行 |
| `prettier` + `prettier-config-ali` | ^3.7.4 / ^1.5.0   | 代码格式化                       |
| `standard-version`                 | ^9.5.0            | 语义化版本 + 变更日志            |
| `husky` + `lint-staged`            | ^9.1.7 / ^16.2.7  | Git 提交前质量检查               |
| `vitest`                           | ^4.1.2            | 单元测试框架                     |
| `@vitest/coverage-v8`              | ^4.1.2            | 测试覆盖率（v8 引擎）            |
| `vitepress`                        | 2.0.0-alpha.15    | 文档网站                         |
| `@commitlint/cli`                  | ^19.8.1           | Commit 消息规范检查              |

## 运行环境

| 要求     | 版本      |
| -------- | --------- |
| Node.js  | >= 20.0.0 |
| 包管理器 | pnpm      |
| 模块系统 | ESM only  |

## 构建配置

- **tsdown**（`tsdown.config.ts`）：基于 rolldown 的打包器
  - ESM 优先输出
  - 自动生成 `.d.ts` 声明文件
  - 模板文件在构建时复制到 `dist/`
- **TypeScript**（`tsconfig.json`）：
  - strict 模式（`noImplicitAny: false`）
  - ESNext target
  - bundler 模块解析
  - 路径别名：`@/*` → `src/*`

## 相关文档

- [架构决策记录](./decisions.md) — 各技术选型的决策原因
- [开发者上手指南](./onboarding.md) — 脚本命令和编码规范

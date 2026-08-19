# @scxfe/api-tool 项目 Wiki

> 从 Swagger/OpenAPI 3.0 和 Apifox 接口定义生成 TypeScript/JavaScript 请求代码的 CLI 工具。本 Wiki 面向 AI 助手与新加入的开发者，基于仓库真实代码整理。

## 推荐阅读路径

| 顺序 | 文档                                                  | 回答的问题                 |
| ---- | ----------------------------------------------------- | -------------------------- |
| 1    | [项目总览](./01-overview/project-overview.md)         | 这个项目是什么、能做什么   |
| 2    | [高层架构](./01-overview/architecture.md)             | 代码如何分层、数据如何流动 |
| 3    | [模块地图](./01-overview/module-map.md)               | src/ 下每个目录是干什么的  |
| 4    | [本地开发](./02-getting-started/local-development.md) | 怎么跑起来、有哪些脚本     |
| 5    | [配置体系](./02-getting-started/configuration.md)     | 多服务配置怎么写、如何解析 |

## 全部文档

### 01-overview（总览）

- [项目总览](./01-overview/project-overview.md) — 核心能力、CLI 命令、版本信息
- [高层架构](./01-overview/architecture.md) — 五层架构、多服务数据流、模块依赖图
- [模块地图](./01-overview/module-map.md) — src/ 目录 → 职责速查表
- [架构决策记录 (ADR)](./01-overview/decisions.md) — 重大技术选型原因（ADR-001 ~ ADR-011）

### 02-getting-started（上手）

- [本地开发](./02-getting-started/local-development.md) — 环境搭建、脚本命令、关键入口
- [配置体系](./02-getting-started/configuration.md) — 多服务（microservice）配置模型与解析管线

### 03-codebase（代码详解）

- [代码生成引擎](./03-codebase/generator.md) — 生成流程、生成器、模板、命名策略
- [客户端层](./03-codebase/clients.md) — 插件化客户端注册器（Swagger/Apifox）
- [OpenAPI 处理器](./03-codebase/processors.md) — 数据标准化、路径转换、自由格式类型
- [配置加载与校验](./03-codebase/config-and-validation.md) — defineConfig 解析管线、多层校验
- [错误系统与日志](./03-codebase/errors-and-logging.md) — 分层错误类、ErrorFactory、logger

### 04-development（开发规范）

- [编码规范](./04-development/coding-conventions.md) — 导入顺序、JSDoc、命名、行数限制
- [测试体系](./04-development/testing.md) — Vitest 结构、覆盖率、夹具

### 99-reference（参考）

- [术语表](./99-reference/glossary.md) — 核心概念与词汇
- [故障排除](./99-reference/troubleshooting.md) — 常见问题与调试方法

## 与其他文档的关系

| 文档                 | 职责                                | 与 Wiki 的分工                            |
| -------------------- | ----------------------------------- | ----------------------------------------- |
| `README.md`          | 面向使用者的安装与配置示例          | Wiki 面向维护者，覆盖架构与代码 internals |
| `docs/`（VitePress） | 用户文档：配置指南、CLI、示例、迁移 | Wiki 做导航与摘要，不复制全文             |
| `AGENTS.md`          | 代理编码助手工作规范                | 编码规范的权威来源，Wiki 摘要并链接       |

## 快速开始

```bash
pnpm install
pnpm run dev    # 开发模式（需要 api-power.config.ts）
pnpm run build  # 生产构建
pnpm test       # 运行单元测试
```

## 当前版本

- **包名**：`@scxfe/api-tool`（CLI 名 `api-power`）
- **Node.js**：>= 20.0.0（仅 ESM）
- **包管理器**：pnpm
- **许可证**：MIT

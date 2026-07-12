# @scxfe/api-tool 项目 Wiki

> 从 Swagger/OpenAPI 3.0 和 Apifox 接口定义生成 TypeScript/JavaScript 请求代码的 CLI 工具。

## 核心能力

- **多数据源**：支持 Swagger/OpenAPI 3.0 和 Apifox，通过 URL 自动检测服务类型
- **多输出格式**：TypeScript 类型定义、Zod 运行时验证 Schema、JavaScript 纯代码
- **可配置预设**：`minimal` / `standard` / `verbose` 三种预设，配合分层配置合并
- **可插拔命名**：通过 `NamingStrategy` 接口自定义所有生成代码的命名
- **生命周期钩子**：`beforeGenerate` / `afterGenerate` / `beforeWriteFile` / `afterWriteFile`
- **中文标签支持**：自动将中文标签转为拼音目录名
- **Watch 模式**：配置变更时自动重新生成

## CLI 命令

| 命令        | 别名  | 说明                                  |
| ----------- | ----- | ------------------------------------- |
| `generate`  | `gen` | 获取 API 定义并生成代码               |
| `init`      | —     | 生成默认 `api-power.config.ts`        |
| `debug`     | —     | 诊断模式：检查 API 定义（不生成代码） |
| `visualize` | `viz` | 启动 HTTP 服务器，可视化查看 API 结构 |

## 文档索引

| 文档                                 | 说明                                        |
| ------------------------------------ | ------------------------------------------- |
| [高层架构](./architecture.md)        | 项目分层、技术栈以及模块间依赖关系          |
| [技术栈](./tech-stack.md)            | 运行时/开发依赖和构建配置                   |
| [业务术语表](./glossary.md)          | 核心业务词汇及其背后的逻辑                  |
| [开发者上手指南](./onboarding.md)    | 本地环境配置、脚本命令和编码规范            |
| [架构决策记录 (ADR)](./decisions.md) | 重大技术选型的决策原因（ADR-001 ~ ADR-010） |
| [故障排除](./troubleshooting.md)     | 常见问题与调试方法                          |

### 模块详解

| 文档                                    | 说明                      |
| --------------------------------------- | ------------------------- |
| [代码生成引擎](./modules/generator.md)  | 生成器、模板、命名策略    |
| [客户端层](./modules/clients.md)        | Swagger/Apifox 数据获取   |
| [错误系统](./modules/errors.md)         | 错误类体系和 ErrorFactory |
| [配置验证系统](./modules/validation.md) | 多层验证器                |

## 快速开始

```bash
pnpm install
pnpm run dev    # 开发模式（需要 api-power.config.ts）
pnpm run build  # 生产构建
```

## 当前版本

- **包名**: `@scxfe/api-tool@0.5.2`
- **Node.js**: >= 20.0.0
- **许可证**: MIT

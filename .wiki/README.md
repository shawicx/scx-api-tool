# @scxfe/api-tool

<details>
<summary>Relevant source files</summary>

- AGENTS.md
- README.md

</details>

> 本 Wiki 基于 commit `09fe50d`（2026-10-11）生成；代码演进后请重新构建以保证内容与实现一致。

根据 Swagger/OpenAPI 3.0 和 Apifox 的接口定义生成 TypeScript/JavaScript 的接口类型及其请求函数代码。

| 项     | 值    |
| ------ | ----- |
| 版本   | 0.6.9 |
| 许可证 | MIT   |
| 运行时 | ESM   |

## 阅读路径

- 新人上手：overview → tech-stack → onboarding
- 理解结构：architecture → modules；调用关系查 calls
- 日常开发：conventions → constraints；排障看 troubleshooting
- 查证细节：calls → classes → glossary

## 01-overview/

| 文档                                                     | 层级       | 回答的问题                           |
| -------------------------------------------------------- | ---------- | ------------------------------------ |
| [01-overview/overview.md](01-overview/overview.md)       | structure  | 项目是什么、解决什么问题             |
| [01-overview/tech-stack.md](01-overview/tech-stack.md)   | operations | 技术栈与依赖说明（含声明未用，R3）   |
| [01-overview/environment.md](01-overview/environment.md) | operations | 运行时、包管理器、env 变量、脚本命令 |

## 02-architecture/

| 文档                                                                           | 层级      | 回答的问题                    |
| ------------------------------------------------------------------------------ | --------- | ----------------------------- |
| [02-architecture/architecture.md](02-architecture/architecture.md)             | structure | 分层结构、模块依赖、扇入扇出  |
| [02-architecture/modules.md](02-architecture/modules.md)                       | structure | 每个模块的文件、符号、职责    |
| [02-architecture/workspaces.md](02-architecture/workspaces.md)                 | surface   | monorepo 工作区包清单与依赖图 |
| [02-architecture/package-boundaries.md](02-architecture/package-boundaries.md) | surface   | 包间依赖边界与未声明依赖违规  |

## 03-interface/

| 文档                                       | 层级      | 回答的问题                          |
| ------------------------------------------ | --------- | ----------------------------------- |
| [03-interface/api.md](03-interface/api.md) | structure | 导出函数与 CLI 命令（带 file:line） |

## 04-design/

| 文档                                             | 层级      | 回答的问题                                    |
| ------------------------------------------------ | --------- | --------------------------------------------- |
| [04-design/decisions.md](04-design/decisions.md) | structure | 设计决策与演进依据（git 提交 + 文档证据锚定） |

## 05-guides/

| 文档                                                         | 层级       | 回答的问题                               |
| ------------------------------------------------------------ | ---------- | ---------------------------------------- |
| [05-guides/onboarding.md](05-guides/onboarding.md)           | operations | 上手指南：环境准备、安装、首次运行、脚本 |
| [05-guides/testing.md](05-guides/testing.md)                 | operations | 框架、测试目录、覆盖率、夹具             |
| [05-guides/troubleshooting.md](05-guides/troubleshooting.md) | operations | 排障手册：错误分类、诊断步骤、常见陷阱   |

## 06-constraints/

| 文档                                                           | 层级       | 回答的问题                     |
| -------------------------------------------------------------- | ---------- | ------------------------------ |
| [06-constraints/conventions.md](06-constraints/conventions.md) | operations | 命名、导入、注释规范与禁止项   |
| [06-constraints/constraints.md](06-constraints/constraints.md) | operations | 性能预算、复杂度上限、已知限制 |

## 07-reference/

| 文档                                                 | 层级      | 回答的问题                               |
| ---------------------------------------------------- | --------- | ---------------------------------------- |
| [07-reference/calls.md](07-reference/calls.md)       | structure | 调用关系边表（按入口分组，带 file:line） |
| [07-reference/classes.md](07-reference/classes.md)   | structure | 类清单与成员方法（继承树待 MCP 支持）    |
| [07-reference/glossary.md](07-reference/glossary.md) | structure | 类型/枚举字典（含成员值）                |

## 08-topics/

| 文档                                                                               | 层级      | 回答的问题                   |
| ---------------------------------------------------------------------------------- | --------- | ---------------------------- |
| [08-topics/generator-utils.md](08-topics/generator-utils.md)                       | structure | 仓库专属主题（图谱聚类推导） |
| [08-topics/clients-errors-utils.md](08-topics/clients-errors-utils.md)             | structure | 仓库专属主题（图谱聚类推导） |
| [08-topics/utils-generator-docs.md](08-topics/utils-generator-docs.md)             | structure | 仓库专属主题（图谱聚类推导） |
| [08-topics/utils-validation-generator.md](08-topics/utils-validation-generator.md) | structure | 仓库专属主题（图谱聚类推导） |

## 09-chapters/request-binding/

| 文档                                                                                                                   | 层级      | 回答的问题                   |
| ---------------------------------------------------------------------------------------------------------------------- | --------- | ---------------------------- |
| [09-chapters/request-binding/request-binding-parameters.md](09-chapters/request-binding/request-binding-parameters.md) | structure | 参数分组与请求绑定           |
| [09-chapters/request-binding/path-param-interpolation.md](09-chapters/request-binding/path-param-interpolation.md)     | structure | 路径参数插值与参数访问表达式 |

## 09-chapters/naming-strategy/

| 文档                                                                                                           | 层级      | 回答的问题             |
| -------------------------------------------------------------------------------------------------------------- | --------- | ---------------------- |
| [09-chapters/naming-strategy/path-info-and-strategy.md](09-chapters/naming-strategy/path-info-and-strategy.md) | structure | 路径解析与命名策略应用 |
| [09-chapters/naming-strategy/identifier-sanitizing.md](09-chapters/naming-strategy/identifier-sanitizing.md)   | structure | 标识符净化与类型名提取 |

## 09-chapters/zod-schema-generation/

| 文档                                                                                                                         | 层级      | 回答的问题                 |
| ---------------------------------------------------------------------------------------------------------------------------- | --------- | -------------------------- |
| [09-chapters/zod-schema-generation/schema-walk-and-mapping.md](09-chapters/zod-schema-generation/schema-walk-and-mapping.md) | structure | Schema 遍历与 Zod 类型映射 |
| [09-chapters/zod-schema-generation/recursive-and-freeform.md](09-chapters/zod-schema-generation/recursive-and-freeform.md)   | structure | 递归类型与自由形态 Schema  |

## 09-chapters/output-pipeline/

| 文档                                                                                                           | 层级      | 回答的问题         |
| -------------------------------------------------------------------------------------------------------------- | --------- | ------------------ |
| [09-chapters/output-pipeline/generate-orchestration.md](09-chapters/output-pipeline/generate-orchestration.md) | structure | 生成编排与目录清理 |
| [09-chapters/output-pipeline/write-and-format.md](09-chapters/output-pipeline/write-and-format.md)             | structure | 格式化写入         |
| [09-chapters/output-pipeline/templates-and-index.md](09-chapters/output-pipeline/templates-and-index.md)       | structure | 模板装配与入口聚合 |

## 09-chapters/config-validation/

| 文档                                                                                                                   | 层级      | 回答的问题               |
| ---------------------------------------------------------------------------------------------------------------------- | --------- | ------------------------ |
| [09-chapters/config-validation/config-loading-cache.md](09-chapters/config-validation/config-loading-cache.md)         | structure | 配置加载与缓存           |
| [09-chapters/config-validation/multi-service-resolution.md](09-chapters/config-validation/multi-service-resolution.md) | structure | 多服务解析与输出目录计算 |
| [09-chapters/config-validation/validation-rules-report.md](09-chapters/config-validation/validation-rules-report.md)   | structure | 校验规则与报告呈现       |

## 相关文档（仓库）

Wiki 之外的既有文档，链接为仓库相对路径

| 文档                      | 标题          |
| ------------------------- | ------------- |
| [README.md](../README.md) | @scx/api-tool |
| [AGENTS.md](../AGENTS.md) | AGENTS.md     |

<!-- wiki:source: fallback -->

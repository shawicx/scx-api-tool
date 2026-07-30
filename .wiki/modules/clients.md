# 客户端层 (`src/clients/`)

## 概述

数据获取层，根据配置中的 `ServerType` 调度到对应的 API 客户端，获取原始 OpenAPI 文档。

## 文件结构

| 文件         | 职责                                         |
| ------------ | -------------------------------------------- |
| `index.ts`   | 调度器：`fetchData(config)` 路由到对应客户端 |
| `swagger.ts` | Swagger/OpenAPI 客户端：GET 请求获取 JSON    |
| `apifox.ts`  | Apifox 客户端：POST + Bearer Token           |

## 服务类型检测

通过 URL **主机名**匹配：主机名包含 `apifox.com` → `ServerType.Apifox`，否则 → `ServerType.Swagger`。

对于 Apifox 源，`parseSourceUrl()` 还会从 URL 路径中通过正则 `/v1/projects/(\d+)/export-openapi` 提取 `apifoxProjectId`，用于 Apifox 客户端的导出请求。

由 `src/utils/config.ts` 中的 `parseSourceUrl()` 执行。

## Swagger 客户端

- 简单 HTTP GET 请求
- 支持进度追踪（`makeRequestWithProgress`）
- 返回原始 JSON 文档

## Apifox 客户端

- HTTP POST 请求，请求体包含 OAS 3.1 导出选项
- Bearer Token 认证（`APS-...` 格式）
- 支持 `apifoxProjectId` 从 URL 中提取
- 完善的错误处理：
  - 401 → `ErrorFactory.unauthorized()`
  - 超时 → `ErrorFactory.timeout()`
  - 网络错误 → `ErrorFactory.networkError()`
- 进度追踪

## 相关文档

- [ADR-003: 双客户端架构](../decisions.md#adr-003双客户端架构swagger--apifox)
- [术语表 → Source / ServerType](../glossary.md#source数据源)

# 错误系统与日志（`src/errors/` + `src/utils/logger.ts`）

一句话职责：分层错误类体系（含错误码与修复建议）+ 统一 logger 封装。

## 错误层级（`errorClasses.ts`）

```text
BaseError (abstract)
  ├── ConfigError   (E1xxx) — 配置加载、解析、验证
  ├── FetchError    (E2xxx) — 数据获取（认证、超时、网络）
  └── GenerateError (E3xxx) — 代码生成（模板、写入、类型、Schema、路径转换）
```

`BaseError` 特性：`code`（错误码）、`message`、`solutions`（可操作修复建议数组）、`originalError`（原始错误）、`format()` / `print()`。

## 错误码表（`errorCodes.ts`）

| 码    | 常量                          | 场景                               |
| ----- | ----------------------------- | ---------------------------------- |
| E1001 | CONFIG_FILE_NOT_FOUND         | 配置文件未找到                     |
| E1002 | CONFIG_INVALID                | 配置无效（非法值或不满足验证规则） |
| E1003 | CONFIG_PARSE_ERROR            | 配置文件解析失败 / 导出格式无效    |
| E1004 | CONFIG_MISSING_REQUIRED       | 缺少必需字段                       |
| E1005 | CONFIG_INVALID_URL            | URL 格式无效                       |
| E2001 | FETCH_REQUEST_FAILED          | 请求失败（含状态码）               |
| E2002 | FETCH_UNAUTHORIZED            | 认证失败（401）                    |
| E2003 | FETCH_TIMEOUT                 | 请求超时                           |
| E2004 | FETCH_INVALID_RESPONSE        | 响应格式无效（非预期 OpenAPI）     |
| E2005 | FETCH_NETWORK_ERROR           | 网络错误（连接中断/DNS 失败）      |
| E3001 | GENERATE_TEMPLATE_ERROR       | 模板编译错误                       |
| E3002 | GENERATE_WRITE_ERROR          | 文件写入错误                       |
| E3003 | GENERATE_TYPE_ERROR           | 类型生成错误                       |
| E3004 | GENERATE_SCHEMA_ERROR         | Schema 生成错误                    |
| E3005 | GENERATE_PATH_TRANSFORM_ERROR | transformPath 抛错或返回非字符串   |

> 多服务的 `DUPLICATE_SERVICE_NAME` / `OUTPUT_DIR_CONFLICT` 属于校验系统（`validation/errors.ts`），经 `ConfigValidationError` + `ValidationReport` 呈现，归入 E1002 语义范畴。

## ErrorFactory（`errorFactory.ts`）

所有模块通过工厂方法创建错误（不要直接 `throw new Error()`）：`configNotFound()`、`configInvalid()`、`configParseError()`、`unauthorized()`、`timeout()`、`networkError()`、`templateError()`、`writeError()`、`pathTransformError()` 等。`index.ts` 另导出 `handleError()` / `withErrorHandling()` 统一处理入口。

推荐模式（错误透传）：

```typescript
try {
  // 业务逻辑
} catch (error: any) {
  if (error.code && error.code.startsWith('E2')) throw error; // 已是结构化错误则透传
  throw ErrorFactory.fetchFailed(url, statusCode, error);
}
```

## 日志（`src/utils/logger.ts`）

基于 consola 封装的统一 logger：

| 方法                                         | 说明                                                      |
| -------------------------------------------- | --------------------------------------------------------- |
| `logger.info` / `success` / `warn` / `error` | 始终输出                                                  |
| `logger.debug`                               | 仅 `setDebugEnabled(true)` 后输出（`debug` 命令自动启用） |

**设计要点**：不要手写 `if (process.env.DEBUG)` 守卫——debug 开关由 logger 模块内部运行时控制。

其他横切工具：

- `utils/redact.ts`：`redactConfig()` 日志脱敏（token 等）
- `utils/progress.ts`：基于 consola 的进度管理器（`getProgressManager()`）
- `utils/hooks.ts`：钩子管理器（`getHookManager().executeHook()`）

## Related

- [故障排除](../99-reference/troubleshooting.md)
- [ADR-010：分层错误系统](../01-overview/decisions.md#adr-010分层错误系统)
- [配置加载与校验](./config-and-validation.md)

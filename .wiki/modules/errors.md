# 错误系统 (`src/errors/`)

## 概述

分层错误类体系，为 CLI 工具提供统一的错误处理、格式化和解决方案建议。

## 文件结构

| 文件              | 职责                                                      |
| ----------------- | --------------------------------------------------------- |
| `index.ts`        | 导出 + `handleError()` + `withErrorHandling()`            |
| `errorClasses.ts` | `BaseError`、`ConfigError`、`FetchError`、`GenerateError` |
| `errorCodes.ts`   | `ErrorCode` 枚举（E1xxx ~ E3xxx）                         |
| `errorFactory.ts` | `ErrorFactory` 工厂类，语义化错误创建                     |

## 错误层级

```
BaseError (abstract)
  ├── ConfigError   (E1xxx) — 配置相关
  ├── FetchError    (E2xxx) — 数据获取相关
  └── GenerateError (E3xxx) — 代码生成相关
```

## 错误码分段

| 范围  | 类            | 典型场景                                         |
| ----- | ------------- | ------------------------------------------------ |
| E1001 | ConfigError   | 配置文件未找到                                   |
| E1002 | ConfigError   | 配置无效（非法值或不满足验证规则）               |
| E1003 | ConfigError   | 配置文件解析失败（TS 编译失败）                  |
| E1004 | ConfigError   | 缺少必需字段                                     |
| E1005 | ConfigError   | URL 格式无效                                     |
| E2001 | FetchError    | 请求失败                                         |
| E2002 | FetchError    | 认证失败（401）                                  |
| E2003 | FetchError    | 请求超时                                         |
| E2004 | FetchError    | 响应格式无效（非预期 OpenAPI）                   |
| E2005 | FetchError    | 网络错误（连接中断/DNS 失败）                    |
| E3001 | GenerateError | 模板编译错误                                     |
| E3002 | GenerateError | 文件写入错误                                     |
| E3003 | GenerateError | 类型生成错误                                     |
| E3004 | GenerateError | Schema 生成错误                                  |
| E3005 | GenerateError | 路径转换失败（transformPath 抛错或返回非字符串） |

## 使用模式

```typescript
// 创建错误
const error = ErrorFactory.configNotFound(configPath);
throw error;

// 统一处理
withErrorHandling(() => {
  // 业务逻辑
});
```

## BaseError 特性

- `code`：错误码
- `message`：错误描述
- `solutions`：修复建议数组
- `originalError`：原始错误（可选）
- `format()`：格式化输出
- `print()`：打印到控制台

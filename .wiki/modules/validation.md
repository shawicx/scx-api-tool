# 配置验证系统 (`src/validation/`)

## 概述

多层配置验证，在配置加载后执行，确保用户配置的完整性和一致性。

## 文件结构

| 文件                  | 职责                                                                  |
| --------------------- | --------------------------------------------------------------------- |
| `index.ts`            | `validateConfiguration()` 编排所有验证器                              |
| `errors.ts`           | `ValidationError`、`ValidationReport`、`ConfigValidationError`        |
| `reporter.ts`         | `displayValidationResults()`、`shouldContinue()`、`getErrorSummary()` |
| `validators/`         | 各类验证器                                                            |
| `validators/basic.ts` | 必填字段、枚举值、字符串/布尔/数字/数组类型检查                       |
| `validators/url.ts`   | URL 格式验证 + 服务类型检测                                           |
| `validators/logic.ts` | 跨字段逻辑一致性校验                                                  |

## 验证流程

```
validateConfiguration(userConfig)
  ├── validateRequiredFields()     # 必填字段检查
  ├── validateEnumValues()         # 枚举值合法性
  ├── validateStringFields()       # 字符串类型检查
  ├── validateBooleanFields()      # 布尔类型检查
  ├── validateNumberFields()       # 数字类型检查
  ├── validateArrayFields()        # 数组类型检查
  ├── validateSourceUrl()          # URL 格式 + serverType 检测
  └── validateConfigLogic()        # 跨字段逻辑校验
```

## 输出

- 验证通过：返回 `void`
- 验证失败：抛出 `ConfigValidationError`，附带 `ValidationReport`（包含所有错误和警告）
- `reporter.ts` 负责格式化展示验证结果，并在交互模式下询问用户是否继续

## 相关文档

- [架构 → 配置层](../architecture.md#第二层配置-srcconfig--srcutilsconfigts--srcvalidation)
- [ADR-005: 分层合并的配置预设](../decisions.md#adr-005分层合并的配置预设)

# 校验规则与报告呈现

<details>
<summary>Relevant source files</summary>

- src/validation/errors.ts
- src/validation/reporter.ts
- src/validation/validators/basic.ts
- src/validation/validators/logic.ts
- src/validation/validators/url.ts

</details>

本页属于「配置解析与校验管线」章节，聚焦校验规则按文件分组的组织方式（基础类型、逻辑关系、URL）与校验结果的分级报告输出（错误、警告、建议与摘要）。以下内容均以 `src/validation/validators/basic.ts`、`src/validation/validators/logic.ts`、`src/validation/validators/url.ts`、`src/validation/reporter.ts`、`src/validation/errors.ts` 中可定位的注释、符号与调用边为依据。

## 覆盖文件与自述职责

| 文件                                 | 职责（注释原文）                                     | 锚点                                   |
| ------------------------------------ | ---------------------------------------------------- | -------------------------------------- |
| `src/validation/validators/basic.ts` | 基础类型验证器；验证配置中各个字段的基本类型和值     | `src/validation/validators/basic.ts:1` |
| `src/validation/validators/logic.ts` | 逻辑关系验证器；验证配置项之间的逻辑关系和一致性     | `src/validation/validators/logic.ts:1` |
| `src/validation/validators/url.ts`   | URL 相关验证器；验证配置中 URL 字段的有效性          | `src/validation/validators/url.ts:1`   |
| `src/validation/reporter.ts`         | 验证结果报告器；负责格式化并输出验证报告             | `src/validation/reporter.ts:1`         |
| `src/validation/errors.ts`           | 验证错误类型定义；定义验证过程中使用的错误类型和接口 | `src/validation/errors.ts:1`           |

## 校验规则分组

### 基础类型验证

- 文件自述为“基础类型验证器 验证配置中各个字段的基本类型和值”（`src/validation/validators/basic.ts:1`）。
- 符号 `validateArrayFields` 在 `src/validation/validators/basic.ts:400` 有注释锚点，但所给片段仅显示 `errors = []`，未展开其规则签名、参数与判定条件。
- 该验证器内部完整的规则清单、各字段类型约束在本次可定位材料中不可见。

### 逻辑关系验证

- 文件自述为“逻辑关系验证器 验证配置项之间的逻辑关系和一致性”（`src/validation/validators/logic.ts:1`）。
- 具体校验哪些配置项之间、何种一致性关系，缺少符号级锚点，无法列出规则明细。

### URL 验证

- 文件自述为“URL 相关验证器 验证配置中 URL 字段的有效性”（`src/validation/validators/url.ts:1`）。
- 该文件内可见三个符号及其注释中的错误对象示例：

| 符号                 | 锚点                                   | 注释中的错误对象示例（节选）                                           |
| -------------------- | -------------------------------------- | ---------------------------------------------------------------------- |
| `validateUrlFormat`  | `src/validation/validators/url.ts:25`  | `error2 = { field: 'source', code: 'INVALID_URL', ... }`               |
| `validateApifoxUrl`  | `src/validation/validators/url.ts:145` | `error2 = { field: 'source', code: 'INVALID_APIFOX_URL_FORMAT', ... }` |
| `validateSwaggerUrl` | `src/validation/validators/url.ts:206` | `error2 = { field: 'source', code: 'INVALID_SWAGGER_URL_PATH', ... }`  |

- 由上述注释片段可见，URL 校验失败时会构造带字段名与错误码的错误对象（证据同上）。
- 具体触发条件、URL 解析方式或匹配逻辑在本次可定位材料中没有展开。

## 错误类型与错误构造

- `src/validation/errors.ts:1` 自述为“验证错误类型定义 定义验证过程中使用的错误类型和接口”。
- `createValidationError` 在 `src/validation/errors.ts:66` 有注释锚点，但片段仅显示示例闭合 `);`。从名称与所在文件推断，它是用于创建验证错误的工厂函数（推断，依据：符号名 `createValidationError` 位于错误类型定义文件，且报告函数签名引用 `ValidationError` 类型）。其签名、参数与返回值缺少可定位锚点。
- `ConfigValidationError` 在 `src/validation/errors.ts:123` 的注释为“配置验证异常类”。
- 报告函数 `displayError`、`displayWarning`、`displayInfo` 的参数类型为 `ValidationError`，`displaySummary` 的参数类型为 `ValidationReport`（锚点见下节）；这两个类型的字段结构在本次可定位材料中未提供。

## 报告呈现

### 函数、签名与用途

| 函数             | 签名                                        | 用途（注释摘要）           | 锚点                             |
| ---------------- | ------------------------------------------- | -------------------------- | -------------------------------- |
| `displaySummary` | `(report: ValidationReport)`                | 显示验证报告的摘要统计信息 | `src/validation/reporter.ts:61`  |
| `displayError`   | `(error: ValidationError, index: number)`   | 格式化并输出单个错误信息   | `src/validation/reporter.ts:87`  |
| `displayWarning` | `(warning: ValidationError, index: number)` | 格式化并输出单个警告信息   | `src/validation/reporter.ts:116` |
| `displayInfo`    | `(info: ValidationError, index: number)`    | 格式化并输出单个信息条目   | `src/validation/reporter.ts:145` |

签名代码块：

```typescript
// src/validation/reporter.ts:61
displaySummary(report: ValidationReport)

// src/validation/reporter.ts:87
displayError(error: ValidationError, index: number)

// src/validation/reporter.ts:116
displayWarning(warning: ValidationError, index: number)

// src/validation/reporter.ts:145
displayInfo(info: ValidationError, index: number)
```

### 输出示例与级别对应

| 级别      | 呈现函数         | 注释中的输出示例                              | 锚点                             |
| --------- | ---------------- | --------------------------------------------- | -------------------------------- |
| 错误      | `displayError`   | `1. source: source 是必需的`                  | `src/validation/reporter.ts:87`  |
| 警告      | `displayWarning` | `1. source: 配置项不应该以 / 开头`            | `src/validation/reporter.ts:116` |
| 建议/信息 | `displayInfo`    | `1. requestMethodStyle: 建议使用默认值`       | `src/validation/reporter.ts:145` |
| 摘要      | `displaySummary` | `验证完成：发现 3 个错误，5 个警告，2 个建议` | `src/validation/reporter.ts:61`  |

### 调度入口与调用关系

- `displayValidationResults` 在 `src/validation/reporter.ts:20` 的注释为“输出验证结果，包括错误、警告和建议”。
- 调用边只表明 `displayValidationResults` 会分别调用四个分级输出函数，不包含条件分支、调用顺序或等待语义；这些细节在本次可定位材料中没有锚点。

| 调用方                     | 被调用方         | 调用边证据（被调用方定义行）     |
| -------------------------- | ---------------- | -------------------------------- |
| `displayValidationResults` | `displaySummary` | `src/validation/reporter.ts:61`  |
| `displayValidationResults` | `displayError`   | `src/validation/reporter.ts:87`  |
| `displayValidationResults` | `displayWarning` | `src/validation/reporter.ts:116` |
| `displayValidationResults` | `displayInfo`    | `src/validation/reporter.ts:145` |

## 校验规则到报告输出的对应关系

基于各函数注释中的输出示例，可建立如下对应形态：

| 校验结果类别 | 报告函数 |
| --- | --- | --- |
| 错误（`ValidationError`） | `displayError(error, index)` 逐条按序号输出 | `src/validation/reporter.ts:87` |
| 警告（`ValidationError`） | `displayWarning(warning, index)` 逐条按序号输出 | `src/validation/reporter.ts:116` |
| 建议/信息（`ValidationError`） | `displayInfo(info, index)` 逐条按序号输出 | `src/validation/reporter.ts:145` |
| 整体统计 | `displaySummary(report)` 输出错误/警告/建议计数 | `src/validation/reporter.ts:61` |

说明：三种分级输出函数均以 `(ValidationError, index)` 为签名，说明同一 `ValidationError` 类型同时承载错误、警告与信息三种级别，级别由报告阶段区分而非由类型区分（依据：`displayError`/`displayWarning`/`displayInfo` 的签名均为 `ValidationError`，锚点 `src/validation/reporter.ts:87`、`src/validation/reporter.ts:116`、`src/validation/reporter.ts:145`）。

同一条校验信息的字段名会在输出中作为前缀出现，例如 `source: source 是必需的`（`src/validation/reporter.ts:87`）与 `requestMethodStyle: 建议使用默认值`（`src/validation/reporter.ts:145`），可见 `ValidationError` 至少承载了字段名与提示文本两项信息（依据：上述两处注释示例）。

## 校验规则与错误码的对应

URL 校验组在注释示例中直接给出了错误码，说明错误码是错误对象的一部分而非纯展示文本：

| 校验点           | 错误码示例                  | 关联字段 | 锚点                                   |
| ---------------- | --------------------------- | -------- | -------------------------------------- |
| URL 格式         | `INVALID_URL`               | `source` | `src/validation/validators/url.ts:25`  |
| Apifox URL 格式  | `INVALID_APIFOX_URL_FORMAT` | `source` | `src/validation/validators/url.ts:145` |
| Swagger URL 路径 | `INVALID_SWAGGER_URL_PATH`  | `source` | `src/validation/validators/url.ts:206` |

三个错误码均挂在 `source` 字段上，说明 URL 校验的主要对象是 `source` 配置项（依据：三处注释示例中的 `field: 'source'`，锚点同上）。

## 模块边界

校验模块对外调用集中在工具模块上：校验模块到工具模块存在 12 次调用（边界记录 `validation` → `utils`）。这说明校验规则与报告在实现上依赖通用工具函数完成具体判定与格式化，但各次调用对应的具体函数在本次可定位材料中没有逐一列出。

## 与其他校验函数的关系

写作简报中提及的 `validateConfiguration`、`validateRequiredFields`、`validateSourceUrl` 三个符号未在本次提供的符号清单中出现，因此无法给出其签名、规则内容或调用边。它们与上述分组验证器（`basic.ts`、`logic.ts`、`url.ts`）之间的调用关系在本次数据中没有锚点，不做推断。

- 待确认：`validateConfiguration`、`validateRequiredFields`、`validateSourceUrl` 的定义位置、签名与各自负责的规则范围，缺少符号级或调用边锚点。
- 待确认：`ValidationError` 与 `ValidationReport` 的字段结构（除注释示例中出现的 `field`、`code` 与文本外），缺少定义锚点。
- 待确认：`displayValidationResults` 调用四个分级输出函数时的组织方式（是否遍历同一列表按级别筛选、输出顺序、是否在无结果时静默），数据中仅有调用边，无条件或顺序证据。
- 待确认：`basic.ts:400` 处 `validateArrayFields` 的完整签名、参数与判定逻辑，注释片段仅给出 `errors = []`。
- 待确认：校验模块到工具模块 12 次调用的具体目标函数，缺少逐条调用点锚点。

## 事实来源索引

| 事实                                             | 锚点                                                   |
| ------------------------------------------------ | ------------------------------------------------------ |
| 基础类型验证器职责                               | `src/validation/validators/basic.ts:1`                 |
| 逻辑关系验证器职责                               | `src/validation/validators/logic.ts:1`                 |
| URL 验证器职责                                   | `src/validation/validators/url.ts:1`                   |
| `validateUrlFormat` 错误码示例                   | `src/validation/validators/url.ts:25`                  |
| `validateApifoxUrl` 错误码示例                   | `src/validation/validators/url.ts:145`                 |
| `validateSwaggerUrl` 错误码示例                  | `src/validation/validators/url.ts:206`                 |
| 报告器职责                                       | `src/validation/reporter.ts:1`                         |
| `displayValidationResults` 自述                  | `src/validation/reporter.ts:20`                        |
| `displaySummary` 定义与示例                      | `src/validation/reporter.ts:61`                        |
| `displayError` 定义与示例                        | `src/validation/reporter.ts:87`                        |
| `displayWarning` 定义与示例                      | `src/validation/reporter.ts:116`                       |
| `displayInfo` 定义与示例                         | `src/validation/reporter.ts:145`                       |
| 错误类型定义文件职责                             | `src/validation/errors.ts:1`                           |
| `createValidationError` 注释锚点                 | `src/validation/errors.ts:66`                          |
| `ConfigValidationError` 注释                     | `src/validation/errors.ts:123`                         |
| 调用边 `displayValidationResults` → 四个输出函数 | `src/validation/reporter.ts:61`、`:87`、`:116`、`:145` |

## 小结

校验规则按关注点分为基础类型、逻辑关系与 URL 三组，分别落在 `validators/basic.ts`、`validators/logic.ts`、`validators/url.ts`（各自文件头自述，锚点见上表）。报告侧由 `displayValidationResults` 统一调度，按错误、警告、建议三个级别逐条格式化输出，并以 `displaySummary` 给出计数摘要（调用边锚点 `src/validation/reporter.ts:61`、`:87`、`:116`、`:145`）。错误对象层面，`errors.ts` 定义了类型与异常类，并由 `createValidationError` 承担错误构造（锚点 `src/validation/errors.ts:1`、`:66`、`:123`）。规则明细与报告条件分支的完整逻辑，受本次可定位材料限制，以上述「待确认」项为准。

## Related

- 同目录：[config-loading-cache.md](config-loading-cache.md) · [multi-service-resolution.md](multi-service-resolution.md)
- 共享 1 个源文件、共享 14 个符号：[topic:utils-validation-generator.md](../08-topics/utils-validation-generator.md)
- 共享 7 个符号：[modules.md](../02-architecture/modules.md)
- 共享 4 个符号：[topic:clients-errors-utils.md](../08-topics/clients-errors-utils.md)
- 总入口：[README](../README.md)

<!-- wiki:source: llm -->

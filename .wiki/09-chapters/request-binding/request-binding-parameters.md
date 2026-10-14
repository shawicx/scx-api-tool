# 参数分组与请求绑定

<details>
<summary>Relevant source files</summary>

- src/generator/requestBinding.ts
- src/generator/requestParameters.ts
- src/types/api.ts

</details>

本页聚焦「请求绑定与参数装配」章节中的参数分组与请求绑定实现，覆盖 `src/generator/requestBinding.ts`、`src/generator/requestParameters.ts` 与 `src/types/api.ts` 三个文件，说明生成的请求函数在参数分组、解构拆分与请求体绑定上的职责划分。

---

## 一、模块与文件职责

### 1.1 三个文件的分工

| 文件                                 | 自述职责（原文锚点）                                                                                                                                                                                                                                                  | 本页涉及的符号                                                                                                     |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `src/generator/requestParameters.ts` | 「请求参数提取模块 从 OpenAPI 操作中提取请求体属性与 query/path 参数，支持按来源分组（body/query/path）供模板生成解构拆分，以及 @ParameterObject 风格 `param.schema.$ref` 的 DTO 展开。从 extractor.ts 抽出以控制文件行数。」（src/generator/requestParameters.ts:1） | `extractBodyProperties`、`extractRequestParameterGroups`、`resolveParameterProperties`、`extractRequestProperties` |
| `src/generator/requestBinding.ts`    | 「请求绑定生成模块 根据 OpenAPI 参数来源生成函数内解构、Axios data/params 与请求选项代码片段」（src/generator/requestBinding.ts:1）                                                                                                                                   | `buildRequestBinding`、`createBindingEntries`、`joinEntries`、`getRestVariableName`、`buildMethodOptions`          |
| `src/types/api.ts`                   | 「API 相关类型定义」（src/types/api.ts:1）                                                                                                                                                                                                                            | `OpenApiSchema`、`OpenApiParameter`、`OpenApiMediaType`                                                            |

两个生成器文件的职责边界可以概括为：`requestParameters.ts` 负责**从 OpenAPI 操作中把参数「取出来并分组」**，`requestBinding.ts` 负责**把分组后的参数「装配成可生成的代码片段」**（函数内解构、Axios `data`/`params`、请求选项）。这一划分分别由两文件的头部自述锚定（src/generator/requestParameters.ts:1、src/generator/requestBinding.ts:1）。

### 1.2 数据来源与类型支撑

`src/generator/requestParameters.ts` 中的提取函数接收 OpenAPI 操作对象与「处理后的 API 数据」，其入参类型 `OpenApiOperation`、`ProcessedApiData` 的底层结构由 `src/types/api.ts` 提供，该文件定义了：

| 类型               | 说明（原文锚点）                                                                             |
| ------------------ | -------------------------------------------------------------------------------------------- |
| `OpenApiSchema`    | 「OpenAPI Schema 对象 描述 OpenAPI 中组件/参数/响应等的 Schema 结构」（src/types/api.ts:13） |
| `OpenApiParameter` | 「OpenAPI 操作参数」（src/types/api.ts:53）                                                  |
| `OpenApiMediaType` | 「OpenAPI 请求体媒体类型」（src/types/api.ts:71）                                            |

---

## 二、请求参数分组：`requestParameters.ts`

### 2.1 分组口径

分组维度由文件自述给出：**按来源分组（body / query / path）**，目的是「供模板生成解构拆分」（src/generator/requestParameters.ts:1）。其中 query 分组的存在可由 `createBindingEntries` 的入参类型直接佐证——它接收 `RequestParameterGroups['queryProperties']`（src/generator/requestBinding.ts:50），说明分组结果对象上带有 query 属性集合。

### 2.2 符号明细

| 符号                            | 定义位置                                           | 签名         | 自述职责                                                                                                                    |
| ------------------------------- | -------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `extractBodyProperties`         | src/generator/requestParameters.ts:40              | 见下方代码块 | 「提取请求体属性（$ref 展开 / 内联 / allOf 展平）」，返回请求体属性数组（src/generator/requestParameters.ts:40）            |
| `resolveParameterProperties`    | src/generator/requestParameters.ts:120             | 信息不足     | 「@param processedData 处理后的 API 数据 @returns 属性数组（$ref 展开时为多个）」（src/generator/requestParameters.ts:120） |
| `extractRequestParameterGroups` | 数据中未单独给出该符号的定义位置，仅通过调用边锚定 | 信息不足     | 数据中无符号级自述                                                                                                          |
| `extractRequestProperties`      | 数据中未单独给出该符号的定义位置，仅通过调用边锚定 | 信息不足     | 数据中无符号级自述                                                                                                          |

```ts
function extractBodyProperties(
  operation: OpenApiOperation,
  processedData: ProcessedApiData,
  reservedNames: ReadonlySet<string> = new Set(),
  includeSchema = false,
);
```

`extractBodyProperties` 是数据中圈复杂度最高的符号之一（复杂度 8）。`reservedNames` 与 `includeSchema` 的含义未在注释中说明；依据命名可**推断**：`reservedNames` 用于在提取属性时避让已被占用的名字，`includeSchema` 控制是否把 schema 一并带出——该推断仅基于参数命名，缺少调用点注释佐证。

### 2.3 请求体提取的三种形态

`extractBodyProperties` 的自述明确了请求体属性提取覆盖三类结构（src/generator/requestParameters.ts:40）：

- `$ref` 展开
- 内联（inline）schema
- `allOf` 展平

此外，请求体提取结果结构 `RequestBodyInfo` 的自述补充了除属性列表之外还保留的内容：「除属性列表外，保留 content-type 分类与 raw body 字段名，供模板层生成请求配置」（src/generator/requestParameters.ts:27）。这说明请求体的 content-type 分类与 raw body 字段名是在此阶段确定、并在模板层被消费的。

### 2.4 参数属性解析与 DTO 展开

`resolveParameterProperties` 的自述指出其返回「属性数组（$ref 展开时为多个）」（src/generator/requestParameters.ts:120），而 `param.schema.$ref`的 DTO 展开能力由文件自述给出（src/generator/requestParameters.ts:1），即支持`@ParameterObject` 风格的参数对象展开。

---

## 三、请求绑定装配：`requestBinding.ts`

### 3.1 符号明细

| 符号                   | 定义位置                            | 签名                                                      | 自述职责                                                                                                                 |
| ---------------------- | ----------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `createBindingEntries` | src/generator/requestBinding.ts:50  | `(properties: RequestParameterGroups['queryProperties'])` | 「创建参数解构与对象字面量条目」，返回「含原始键名、合法别名与解构片段的条目列表」（src/generator/requestBinding.ts:50） |
| `joinEntries`          | src/generator/requestBinding.ts:79  | `(entries: Array<{ key: string; alias: string }>)`        | 「拼接 Axios params 对象字面量内容」，返回「对象字面量内部字符串」（src/generator/requestBinding.ts:79）                 |
| `getRestVariableName`  | src/generator/requestBinding.ts:90  | `(entries: Array<{ alias: string }>)`                     | 「选择不与非 body 参数别名冲突的 rest 变量名」（src/generator/requestBinding.ts:90）                                     |
| `buildMethodOptions`   | src/generator/requestBinding.ts:100 | `(groups: RequestParameterGroups)`                        | 「构造 raw binary 请求的 method-specific 选项」，返回「选项构造语句与调用表达式」（src/generator/requestBinding.ts:100） |
| `buildRequestBinding`  | src/generator/requestBinding.ts:141 | `(input: RequestBindingInput)`                            | 无符号自述；由下游调用边锚定其装配入口角色                                                                               |

配套的输入/输出结构在文件头部有注释：

| 结构                  | 注释原文                                                   | 锚点                               |
| --------------------- | ---------------------------------------------------------- | ---------------------------------- |
| `RequestBindingInput` | 「请求绑定生成输入」（src/generator/requestBinding.ts:10） | src/generator/requestBinding.ts:10 |
| `RequestBinding`      | 「请求绑定生成结果」（src/generator/requestBinding.ts:22） | src/generator/requestBinding.ts:22 |

### 3.2 各符号职责展开

**`createBindingEntries`（src/generator/requestBinding.ts:50）** —— 接收 query 分组的属性列表，产出「原始键名 / 合法别名 / 解构片段」三要素的条目列表。它是 query 参数从「分组属性」到「可生成代码」的转换环节，并在内部调用 `parsePropertyName`（边锚点：src/generator/requestBinding.ts:41）。`parsePropertyName` 的注释说明其职责为「@param name 属性名 @returns 原始属性名」（src/generator/requestBinding.ts:41），即把属性名还原为原始键名。

**`joinEntries`（src/generator/requestBinding.ts:79）** —— 接收带 `key` 与 `alias` 的条目，输出 Axios `params` 对象字面量的内部字符串。它只负责字面量内部内容的拼接，不负责外层包裹。

**`getRestVariableName`（src/generator/requestBinding.ts:90）** —— 依据已有参数别名集合选择 rest 变量名，约束是「不与非 body 参数别名冲突」。这说明生成的请求函数会把非 body 参数收拢为一个 rest 形参，而 body 参数单独绑定；此为函数注释的直接陈述（src/generator/requestBinding.ts:90）。

**`buildMethodOptions`（src/generator/requestBinding.ts:100）** —— 面向 **raw binary 请求**构造 method-specific 选项，返回两部分：「选项构造语句」与「调用表达式」（src/generator/requestBinding.ts:100）。该符号圈复杂度为 1，说明选项构造逻辑本身是直给的、分支很少。

**`buildRequestBinding`（src/generator/requestBinding.ts:141）** —— 数据中无符号自述。依据命名与其 4 条下游调用边（分别调用 `createBindingEntries`、`getRestVariableName`、`joinEntries`、`buildMethodOptions`），可**推断**它是绑定装配的总入口：组合条目创建、rest 变量命名、params 字面量拼接与 method-specific 选项构造（推断依据：函数名 `build*` + 四条出边，见第四节表）。其圈复杂度为 7，是本页涉及的绑定类符号中最高的。

### 3.3 生成的绑定片段构成

依据文件自述，`requestBinding.ts` 生成四类代码片段（src/generator/requestBinding.ts:1）：

| 片段类别       | 用途                                                   |
| -------------- | ------------------------------------------------------ |
| 函数内解构     | 把参数按来源拆解为函数形参/局部变量                    |
| Axios `data`   | 请求体绑定（对应 body 分组）                           |
| Axios `params` | 查询参数绑定（对应 query 分组，由 `joinEntries` 拼接） |
| 请求选项       | method-specific 选项，由 `buildMethodOptions` 构造     |

---

## 四、调用关系

下表列出本页涉及的全部调用边（R2：以表格表达静态可达性）：

| 调用方                          | 被调用方                        | 记录位置                               |
| ------------------------------- | ------------------------------- | -------------------------------------- |
| `buildRequestBinding`           | `createBindingEntries`          | src/generator/requestBinding.ts:50     |
| `buildRequestBinding`           | `getRestVariableName`           | src/generator/requestBinding.ts:90     |
| `buildRequestBinding`           | `joinEntries`                   | src/generator/requestBinding.ts:79     |
| `buildRequestBinding`           | `buildMethodOptions`            | src/generator/requestBinding.ts:100    |
| `createBindingEntries`          | `parsePropertyName`             | src/generator/requestBinding.ts:41     |
| `extractRequestParameterGroups` | `resolveParameterProperties`    | src/generator/requestParameters.ts:120 |
| `extractRequestParameterGroups` | `extractBodyProperties`         | src/generator/requestParameters.ts:40  |
| `extractRequestProperties`      | `extractRequestParameterGroups` | src/generator/requestParameters.ts:184 |

从表中可见两条组装链：

1. **参数提取链**：`extractRequestProperties` → `extractRequestParameterGroups` → { `resolveParameterProperties`, `extractBodyProperties` }。即分组函数 `extractRequestParameterGroups` 同时向下调用参数属性解析与请求体属性提取，分别对应当前分组的 query/path 侧与 body 侧。
2. **绑定生成链**：`buildRequestBinding` → { `createBindingEntries` → `parsePropertyName`, `joinEntries`, `getRestVariableName`, `buildMethodOptions` }。

两条链之间没有直接的函数调用边记录；它们通过「分组结果对象」（如 `RequestParameterGroups`）衔接，该对象由提取链产出、被 `createBindingEntries`（src/generator/requestBinding.ts:50）与 `buildMethodOptions`（src/generator/requestBinding.ts:100）消费。

---

## 五、类型定义：`src/types/api.ts`

`src/types/api.ts` 以「API 相关类型定义」为自述（src/types/api.ts:1），本页关注其中三个被请求参数提取直接使用的结构：

| 类型               | 定义位置            | 自述职责                                                              |
| ------------------ | ------------------- | --------------------------------------------------------------------- |
| `OpenApiSchema`    | src/types/api.ts:13 | 「OpenAPI Schema 对象 描述 OpenAPI 中组件/参数/响应等的 Schema 结构」 |
| `OpenApiParameter` | src/types/api.ts:53 | 「OpenAPI 操作参数」                                                  |
| `OpenApiMediaType` | src/types/api.ts:71 | 「OpenAPI 请求体媒体类型」                                            |

这三个类型分别对应请求装配链上的三个关注点：`OpenApiParameter` 承载 query/path 等来源参数的描述，`OpenApiSchema` 承载参数与请求体外层结构（`$ref` / 内联 / `allOf` 均建立在其上），`OpenApiMediaType` 承载请求体的媒体类型信息，与 `RequestBodyInfo` 自述中的「content-type 分类」对应（src/generator/requestParameters.ts:27）。

---

## 六、演进与动机证据

本页涉及的两个生成器文件均有明确的首次提交记录，可用于锚定其设计动机：

| 目标文件                             | 提交信息                                                      | 提交锚点                     |
| ------------------------------------ | ------------------------------------------------------------- | ---------------------------- |
| `src/generator/requestBinding.ts`    | 「feat: 支持二进制上传请求生成与请求配置透传」                | commit:b8ccc34c (2026-09-29) |
| `src/generator/requestParameters.ts` | 「feat: 支持 body/query 参数分离与 ParameterObject DTO 展开」 | commit:593422be (2026-09-04) |

据此可以确定两条能力线的引入动机（均为提交信息原文所述，非推断）：

1. **`requestBinding.ts`** 的引入动机是「二进制上传请求生成」与「请求配置透传」两件事。这与该文件的符号分布一致：`buildMethodOptions` 明确面向「raw binary 请求的 method-specific 选项」（src/generator/requestBinding.ts:100），是二进制上传路径的直接落点；而「请求配置透传」对应文件自述中的「请求选项代码片段」（src/generator/requestBinding.ts:1）。
2. **`requestParameters.ts`** 的引入动机是「body/query 参数分离」与「ParameterObject DTO 展开」。这两点分别对应文件自述中的「按来源分组（body/query/path）供模板生成解构拆分」与「@ParameterObject 风格 `param.schema.$ref` 的 DTO 展开」（src/generator/requestParameters.ts:1）。

此外，`requestParameters.ts` 的文件自述还交代了一处结构性动因：「从 extractor.ts 抽出以控制文件行数」（src/generator/requestParameters.ts:1）。这说明该模块并非一开始独立存在，而是从 `extractor.ts` 中拆分而来，拆分标准是控制单文件行数——这是数据中唯一关于文件边界成因的直接陈述。

---

## 七、依赖边界

在生成器层的对外依赖方向上，数据给出如下跨层调用量：

| 来源层    | 目标层     | 调用次数 |
| --------- | ---------- | -------- |
| generator | utils      | 78       |
| generator | naming     | 24       |
| generator | schema     | 12       |
| generator | processors | 6        |

`generator` → `utils` 的调用量（78）显著高于其它方向，说明生成器层的多数公共处理被下沉到 `utils`；`naming`（24）次之，与请求绑定链中「别名 / rest 变量名 / 原始键名」这类命名相关工作相呼应——`createBindingEntries` 产出合法别名（src/generator/requestBinding.ts:50）、`getRestVariableName` 选择不与别名冲突的 rest 变量名（src/generator/requestBinding.ts:90）、`parsePropertyName` 还原原始属性名（src/generator/requestBinding.ts:41）。上述对应关系为**推断**，依据是命名类调用量与这些符号的命名语义一致，数据中未记录具体调用了 `naming` 层哪些函数。

---

## 八、关键缺口（待确认）

1. **`extractRequestParameterGroups` 的分组结果结构**：`RequestParameterGroups` 类型本身定义在何处、包含哪些属性集合，数据中只出现其 `queryProperties` 成员的引用（src/generator/requestBinding.ts:50），完整字段构成待确认。
2. **`extractRequestParameterGroups` 与 `extractRequestProperties` 的定义位置与签名**：两者仅有调用边记录（src/generator/requestParameters.ts:120、src/generator/requestParameters.ts:184），无符号级定义锚点与参数说明。
3. **`buildRequestBinding` 的输入输出契约**：仅有 `RequestBindingInput`（src/generator/requestBinding.ts:10）与 `RequestBinding`（src/generator/requestBinding.ts:22）两条一句话注释，字段级结构待确认。
4. **`reservedNames` 与 `includeSchema` 的语义**：`extractBodyProperties` 的两个可选参数在注释中未被解释（src/generator/requestParameters.ts:40），当前仅有基于命名的推断，缺调用点证据。
5. **path 参数的绑定路径**：文件自述声明分组覆盖 body/query/path（src/generator/requestParameters.ts:1），但本页数据中的绑定类符号只显式触及 query（`joinEntries` 拼接 Axios params）与 body（Axios data），path 占位符插值的具体承载符号待确认。

## Related

- 同目录：[path-param-interpolation.md](path-param-interpolation.md)
- 共享 9 个符号：[architecture.md](../02-architecture/architecture.md)
- 共享 2 个源文件、共享 5 个符号：[glossary.md](../07-reference/glossary.md)
- 共享 6 个符号：[modules.md](../02-architecture/modules.md)
- 总入口：[README](../README.md)

<!-- wiki:source: llm -->

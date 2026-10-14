# 约束与复杂度边界

<details>
<summary>Relevant source files</summary>

- scripts/analyze-deps.js
- src/cli/commands/debug.ts
- src/cli/commands/verify.ts
- src/clients/base/BaseClient.ts
- src/clients/base/registry.ts
- src/clients/implementations/ApifoxClient.ts
- src/generator/extractor.ts
- src/generator/generators/hookGenerator.ts
- src/generator/requestBinding.ts
- src/generator/requestParameters.ts
- src/generator/template/requestFileGenerator.ts
- src/generator/template/zod/compose.ts
- src/generator/template/zod/recursive.ts
- src/processors/common.ts
- src/processors/openapi.ts

</details>

本页汇总项目中可被源码锚定的**硬性限制常量**与**复杂度热点函数**，用于回答两个问题：系统在哪些地方被显式设了上限，以及哪些函数的改动代价最高。

> 本页所有事实均来自源码锚点；凡标注「推断」的内容均为依据命名/结构特征的分析，非源码直证。

---

## 一、限制常量总览

| 常量               | 值                                                    | 源文件:行号                                          |
| ------------------ | ----------------------------------------------------- | ---------------------------------------------------- |
| `SUMMARY_LIMIT`    | `5`                                                   | `src/cli/commands/debug.ts:17`                       |
| `TIMEOUT`          | `${formatTimeout(config.requestTimeout ?? 5 * 1000)}` | `src/generator/template/requestFileGenerator.ts:170` |
| `MIN_TOKEN_LENGTH` | `8`                                                   | `src/utils/redact.ts:10`                             |
| `MAX_SCHEMA_DEPTH` | `20`                                                  | `src/utils/schemaSafety.ts:12`                       |

---

## 二、逐个常量解读

### 2.1 `SUMMARY_LIMIT = 5`（有作者注释）

作者在源码中写明了该常量的用途，原文引用：

> 「诊断报告中展示的摘要条目数量上限」 —— `src/cli/commands/debug.ts:17`

这是本页唯一一处由作者亲笔给出动机的常量，含义可直接确定：

- **限制对象**：诊断报告（debug 命令输出）中摘要条目的展示数量。
- **上限值**：5 条。
- **防的是什么**：报告摘要条目随输入规模线性膨胀。若不设上限，摘要区的长度将由被诊断对象的数量决定，而非由报告的可读性决定。
- **锚点**：`src/cli/commands/debug.ts:17`

### 2.2 其余三个常量：可确认事实

以下三项在本次数据中**没有**携带作者注释，因此只陈述可由值与位置确认的事实，不对动机做补齐：

| 常量               | 可确认事实                                                                                                                                               | 锚点                                                 |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `TIMEOUT`          | 值不是字面量，而是一个模板表达式，由 `formatTimeout(config.requestTimeout ?? 5 * 1000)` 求值：优先取配置项 `requestTimeout`，缺省回退 `5 * 1000`（毫秒） | `src/generator/template/requestFileGenerator.ts:170` |
| `MIN_TOKEN_LENGTH` | 值为整数 `8`，定义在脱敏工具模块中                                                                                                                       | `src/utils/redact.ts:10`                             |
| `MAX_SCHEMA_DEPTH` | 值为整数 `20`，定义在 schema 安全模块中                                                                                                                  | `src/utils/schemaSafety.ts:12`                       |

### 2.3 推断：无注释常量的可能约束面

> **推断（依据：常量命名 + 所在文件命名 + 值形态）**，非源码直证：
>
> - `MIN_TOKEN_LENGTH`：命名形态是「某物的最小长度」，所在文件为脱敏工具（`src/utils/redact.ts:10`），据此推断它是脱敏判定中的长度阈值，即对短于该值的片段不作同等处理。具体判定分支、比较运算方向与生效范围，数据未给出。
> - `MAX_SCHEMA_DEPTH`：命名形态是「最大深度」，所在文件为 schema 安全模块（`src/utils/schemaSafety.ts:12`），据此推断它是遍历 schema 时防止无限递归/超深结构的深度上限。达到上限后的行为（截断、报错还是降级）数据未给出。
> - `TIMEOUT`：位于模板文件生成器目录（`src/generator/template/requestFileGenerator.ts:170`），且值本身就是模板表达式，据此推断其最终文本会进入生成产物，而回退值 `5 * 1000` 是生成产物未显式配置超时时的默认时长。生成产物中该值的最终落点，数据未给出。
>
> 上述推断均**不得**作为项目行为的确定描述使用，需回源码核对。

---

## 三、复杂度热点（全量）

排序规则：复杂度降序；同复杂度按循环深度降序。锚点采用 `文件#函数名`（行号见第四节说明）。

| 函数                        | 源文件                                        | 复杂度 | 循环深度 |
| --------------------------- | --------------------------------------------- | ------ | -------- |
| `extractTypesFromSchema`    | `src/processors/common.ts`                    | 13     | 2        |
| `collectSchemasFromPaths`   | `src/processors/openapi.ts`                   | 12     | 4        |
| `containsFreeFormProperty`  | `src/processors/openapi.ts`                   | 11     | 2        |
| `fetchDataInternal`         | `src/clients/implementations/ApifoxClient.ts` | 11     | 0        |
| `extractResponseProperties` | `src/generator/extractor.ts`                  | 10     | 1        |
| `collectTypeScriptFiles`    | `src/cli/commands/verify.ts`                  | 9      | 1        |
| `analyzeDependencies`       | `scripts/analyze-deps.js`                     | 8      | 1        |
| `extractBodyProperties`     | `src/generator/requestParameters.ts`          | 8      | 1        |
| `buildRequestBinding`       | `src/generator/requestBinding.ts`             | 7      | 0        |
| `cleanOutputDir`            | `src/utils/file.ts`                           | 7      | 1        |
| `extractUsedTypeNames`      | `src/processors/common.ts`                    | 7      | 2        |
| `collectRefTypeNames`       | `src/generator/template/zod/recursive.ts`     | 5      | 1        |
| `autoSelectClient`          | `src/clients/base/registry.ts`                | 4      | 1        |
| `buildCommonImports`        | `src/generator/generators/hookGenerator.ts`   | 4      | 0        |
| `composeObject`             | `src/generator/template/zod/compose.ts`       | 4      | 0        |
| `displayValidationResults`  | `src/validation/reporter.ts`                  | 4      | 0        |
| `executeHook`               | `src/utils/hooks.ts`                          | 4      | 0        |
| `executeWithConcurrency`    | `src/utils/concurrency.ts`                    | 4      | 1        |
| `executeWithRetry`          | `src/clients/base/BaseClient.ts`              | 4      | 1        |
| `extractTypeProperties`     | `src/generator/extractor.ts`                  | 4      | 1        |

**分布事实**（由上表直接得出）：

- 复杂度区间为 4–13，最高值 13，仅 `extractTypesFromSchema` 一项达到。
- 复杂度 ≥ 10 的函数共 5 个，分布在 4 个文件：`src/processors/common.ts`、`src/processors/openapi.ts`（2 个）、`src/clients/implementations/ApifoxClient.ts`、`src/generator/extractor.ts`。
- 循环深度最大值为 4，仅出现在 `collectSchemasFromPaths`（`src/processors/openapi.ts`）。
- 循环深度为 0 但复杂度不低的函数有 `fetchDataInternal`（复杂度 11、循环深度 0）与 `buildRequestBinding`（复杂度 7、循环深度 0）——即其复杂度来自分支数量而非嵌套循环。
- 复杂度最低档（4）共 8 个函数，是本页的热点下限，未被更低值覆盖。

---

## 四、高复杂度函数分析

> **推断（依据：函数命名 + 复杂度/循环深度结构指标）**：下文的「风险」「重构方向」是基于结构指标的分析判断，不包含对函数内部具体实现分支的描述；内部实现细节未在数据中提供。

### 4.1 `extractTypesFromSchema`（复杂度 13 / 循环深度 2）

- 锚点：`src/processors/common.ts#extractTypesFromSchema`
- 结构特征：全表最高复杂度，同时存在 2 层循环嵌套。高分支密度 + 嵌套循环的组合，意味着分支判定很可能在循环体内展开，同一处修改需要同时验证「循环内 / 循环外」两条路径。
- 风险：单函数覆盖了过多判定维度，测试路径难以穷举；修改任一分支时，回归面取决于测试对该函数所有分支的覆盖情况，而非其调用方的覆盖情况。
- 重构方向：按判定维度拆分为若干**无嵌套**的纯函数，由外层负责编排循环；只要拆分后的每个纯函数都不含循环，其测试就能退化为「输入 → 输出」的表驱动用例。

### 4.2 `collectSchemasFromPaths`（复杂度 12 / 循环深度 4）

- 锚点：`src/processors/openapi.ts#collectSchemasFromPaths`
- 结构特征：全表唯一循环深度达到 4 的函数，复杂度次高。这是本页最深的嵌套结构。
- 风险：四层嵌套使「当前处于第几层、在遍历什么」成为理解成本的主要来源；嵌套越深，越容易在某一层遗漏边界（空集合、单元素、重复项），且这类缺陷只在特定输入形状下暴露。此外，深嵌套结构对早退/中断条件的语义最敏感——在不同层跳出，语义可能完全不同。
- 重构方向：优先降深度而非降分支数。把内两层抽成独立函数是收益最高的一步（循环深度 4 → 2）；抽取后的中间层以「集合 → 集合」为契约，可独立验证。

### 4.3 `containsFreeFormProperty`（复杂度 11 / 循环深度 2）

- 锚点：`src/processors/openapi.ts#containsFreeFormProperty`
- 结构特征：与 `collectSchemasFromPaths` 同文件（`src/processors/openapi.ts`），是该文件两个 ≥10 复杂度的函数之一。
- 风险：该文件的复杂度高度集中在此二者上，意味着该文件是「单文件改动高风险区」——两者若共享中间数据结构或遍历约定，修改其一会牵动另一个。
- 重构方向：先确认两者是否可共用同一套遍历原语；若可，把遍历抽为独立模块，两个函数各自只保留判定逻辑，可将该文件的复杂度从「两点集中」变为「一点遍历 + 两个薄判定」。

### 4.4 `fetchDataInternal`（复杂度 11 / 循环深度 0）

- 锚点：`src/clients/implementations/ApifoxClient.ts#fetchDataInternal`
- 结构特征：复杂度 11 但**循环深度为 0**，是表中「高分支、无嵌套循环」的典型样本。其复杂度全部来自条件分支。
- 风险：无循环意味着没有天然的迭代边界，分支是平铺的；平铺分支的风险不是"看不懂"，而是"改漏"——新增一种情形时需要回到全部既有分支上确认互斥性与优先级。
- 关联：同目录下 `src/clients/base/BaseClient.ts#executeWithRetry`（复杂度 4 / 循环深度 1）与 `src/clients/base/registry.ts#autoSelectClient`（复杂度 4 / 循环深度 1）复杂度均较低，客户端层的复杂度重心明显落在具体实现（`ApifoxClient`）而非基类与注册表。数据中未提供这三者之间的调用关系。
- 重构方向：把平铺分支改为「分支 → 处理器」的映射表或分派结构，使新增情形只增加一个条目而非新增一条分支。

### 4.5 `extractResponseProperties`（复杂度 10 / 循环深度 1）

- 锚点：`src/generator/extractor.ts#extractResponseProperties`
- 结构特征：同文件另含 `extractTypeProperties`（复杂度 4 / 循环深度 1，`src/generator/extractor.ts#extractTypeProperties`）。同文件内复杂度落差达 6。
- 风险：同一文件内 10 与 4 的落差，通常意味着高复杂度函数承担了「特殊情形聚合」的角色；这类函数在新增 API 形态时是默认的修改落点，因而会持续变复杂。
- 重构方向：识别 `extractResponseProperties` 中可复用的判定，下沉到与 `extractTypeProperties` 同层的公共函数，避免其在每次新增形态时独自膨胀。

### 4.6 其余高复杂度函数（简表）

| 函数                                                              | 锚点                                                                                 | 结构提示                                                           |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `collectTypeScriptFiles`                                          | `src/cli/commands/verify.ts`                                                         | 复杂度 9 / 循环深度 1，是该命令文件中唯一进入全表的热点            |
| `analyzeDependencies`                                             | `scripts/analyze-deps.js`                                                            | 复杂度 8 / 循环深度 1，是全表唯一的脚本文件（非 `src/` 产物）      |
| `extractBodyProperties`                                           | `src/generator/requestParameters.ts`                                                 | 复杂度 8 / 循环深度 1                                              |
| `buildRequestBinding` / `cleanOutputDir` / `extractUsedTypeNames` | `src/generator/requestBinding.ts` / `src/utils/file.ts` / `src/processors/common.ts` | 复杂度均为 7；其中 `cleanOutputDir` 的操作对象是输出目录（按命名） |

---

## 五、已知边界

以下边界均由上述锚定数据直接推出：

1. **常量侧的边界是「点状」而非「体系化」的。** 本次数据仅覆盖 4 个常量，分别落在诊断输出（`src/cli/commands/debug.ts:17`）、生成产物超时（`src/generator/template/requestFileGenerator.ts:170`）、脱敏（`src/utils/redact.ts:10`）、schema 深度（`src/utils/schemaSafety.ts:12`）四个互不相同的领域。它们不构成一套统一的可调参数面板。
2. **唯一被作者解释过的硬限制是报告摘要条数（5 条）。** 其余三个限制的动机与生效行为，在本次数据中无源码注释、无提交信息、无文档小节支撑。这意味着改动它们时，缺少「为什么是这个值」的书面依据——这是维护成本中最高的一块。
3. **超时上限实际是「可配置 + 有缺省」而非硬编码。** `src/generator/template/requestFileGenerator.ts:170` 的值取自 `config.requestTimeout`，`5 * 1000` 只是回退。因此该 "限制" 的真正可控点不在源码常量，而在配置来源——而配置来源未在本次数据中给出。
4. **最深嵌套集中在 openapi 处理器。** 循环深度 4 的唯一出现点（`src/processors/openapi.ts#collectSchemasFromPaths`）与全表次高复杂度同属一个文件，该文件是结构性风险最高的单点。
5. **最高复杂度不在 CLI 层也不在模板层，而在处理器层。** 复杂度 ≥10 的 5 个函数中，2 个在 `src/processors/`；CLI 层最高为 9（`src/cli/commands/verify.ts#collectTypeScriptFiles`），模板层最高为 5（`src/generator/template/zod/recursive.ts#collectRefTypeNames`）。改动代价的重心在 `src/processors/` 与 `src/generator/extractor.ts`。
6. **「限制」与「复杂度」两类数据没有出现交集。** 4 个常量所在文件与 20 个热点函数所在文件无一重合，即本次数据未显示任何一个限制常量被定义在高复杂度函数所在的同一文件中。常量不构成这些函数复杂度的来源。

---

## 六、未检测到 / 待确认

**未检测到的限制类别**（本次数据中不存在对应常量，因此不给出任何数值）：

- 内存/缓冲上限类常量：未检测到
- 重试次数类常量：未检测到（`src/clients/base/BaseClient.ts#executeWithRetry` 为重试相关函数，但其次数上限未在数据中给出）
- 并发度上限类常量：未检测到（`src/utils/concurrency.ts#executeWithConcurrency` 为并发相关函数，但其并发上限未在数据中给出）
- 请求体/响应体体积上限类常量：未检测到
- 缓存容量类常量：未检测到

**待确认（需补充证据的具体缺口）**：

1. 热点函数**行号**未提供，本页锚点采用 `文件#函数名`；要定位到具体实现行需回源码检索。
2. `TIMEOUT` 的配置来源（`config.requestTimeout` 由何处定义、默认值是否覆盖生成产物）无数据支撑，无法判断该限制的实际可达范围。
3. `MIN_TOKEN_LENGTH` 与 `MAX_SCHEMA_DEPTH` 达到阈值后的行为（截断 / 报错 / 跳过）无源码或文档证据，无法判定其为「保护性上限」还是「语义性阈值」。

## Related

- 同目录：[conventions.md](conventions.md)
- 共享 5 个源文件、共享 24 个符号：[modules.md](../02-architecture/modules.md)
- 共享 4 个源文件、共享 14 个符号：[troubleshooting.md](../05-guides/troubleshooting.md)
- 共享 4 个源文件、共享 12 个符号：[architecture.md](../02-architecture/architecture.md)
- 总入口：[README](../README.md)

<!-- wiki:source: llm -->

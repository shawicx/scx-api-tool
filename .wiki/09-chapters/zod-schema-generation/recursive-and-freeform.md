# 递归类型与自由形态 Schema

<details>
<summary>Relevant source files</summary>

- src/generator/freeForm.ts
- src/generator/generators/schemaGenerator.ts
- src/processors/common.ts
- src/schema/freeForm.ts

</details>

本页聚焦 Zod Schema 生成链路中的两类特殊处理：**递归类型需要手写 interface（JsonValue 递归类型）** 与 **additionalProperties 自由形态（free-form）检测**。所属章节为「Zod Schema 生成与类型映射」。

> 说明：本页所依赖的符号数据中未包含 `buildRecursiveTypeInterface`、`containsFreeFormProperty`、`collectSchemasFromPaths` 三个符号的定义体与签名，相关部分见文末「待确认」。

---

## 一、参与文件与职责

| 文件                                          | 数据中可见的职责描述                                                                                                                                                                                  | 锚点                                            |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `src/schema/freeForm.ts`                      | 自由格式对象（free-form）检测与 `JsonValue` 类型定义；识别 springdoc-openapi 导出的 free-form schema（如 `{ type: 'object' }` 或 `{ additionalProperties: true }`）                                   | `src/schema/freeForm.ts:1`                      |
| `src/generator/freeForm.ts`                   | 自由格式检测与 `JsonValue` 类型定义（**已下沉至中立层 `@/schema/freeForm`**），此处重新导出以保持 `from '../generator/freeForm'` / `from './freeForm'` 的导入兼容性；新代码建议直接从 `@/schema` 导入 | `src/generator/freeForm.ts:1`                   |
| `src/generator/generators/schemaGenerator.ts` | Schema 文件生成器，负责生成 Zod Schema 验证文件                                                                                                                                                       | `src/generator/generators/schemaGenerator.ts:1` |
| `src/processors/common.ts`                    | 公共处理模块，提供数据处理相关的公共函数                                                                                                                                                              | `src/processors/common.ts:1`                    |

**"下沉 + 兼容再导出"的结构**已由文件头注释直接说明（`src/generator/freeForm.ts:1`）：原实现位于 `src/generator/freeForm.ts`，现实际实现位于 `src/schema/freeForm.ts`，旧路径保留为再导出层。

---

## 二、自由形态（free-form）Schema 的识别

### 2.1 问题来源

`src/schema/freeForm.ts:1` 的文件头注释给出了明确的动机原文：

> Java Jackson 的动态类型（JsonNode / ObjectNode / ArrayNode 等）在 springdoc-openapi 导出时，因结构运行时才能确定，会产出 free-form schema（如 `{ type: 'object' }` 或 `{ additionalProperties: true }`）。本模块负责识别这类 schema……

即：**结构在运行时才确定的 Jackson 动态类型，导出后无法得到有限字段列表**，必须单独识别并降级处理。

### 2.2 数据中可确认的符号

| 符号                         | 类型 | 锚点                        | 数据中给出的说明                                                                                                          |
| ---------------------------- | ---- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `JACKSON_DYNAMIC_TYPE_NAMES` | 常量 | `src/schema/freeForm.ts:19` | 「Jackson 动态类型的已知命名（sanitize 后保持原样，无碰撞风险）；这些类型在运行时才能确定结构，应映射为 `JsonValue` / …」 |
| `isFreeFormSchema`           | 函数 | `src/schema/freeForm.ts:50` | 注释中给出了判定用例：`isFreeFormSchema({ additionalProperties: { $ref: '...' } }); // false（是真正的 map）`             |
| `isJacksonDynamicType`       | 函数 | `src/schema/freeForm.ts:73` | `@param name 已 sanitize 的类型名` / `@returns 是否为 Jackson 动态类型`                                                   |

### 2.3 判定边界（来自注释用例）

`src/schema/freeForm.ts:50` 处保留的行为用例说明了一个关键边界：

```ts
isFreeFormSchema({ additionalProperties: { $ref: '...' } }); // false（是真正的 map）
```

即 **`additionalProperties` 指向 `$ref` 时不算自由形态，而是真正的 map 类型**；只有无法确定结构的形态才归入 free-form。

> 「待确认」：`isFreeFormSchema` 与 `isJacksonDynamicType` 的完整签名与判定分支在本次数据中只到行级注释锚点，未提供函数体或签名。

---

## 三、递归类型：JsonValue 与手写 interface

### 3.1 动机证据

| 证据类型 | 原文                                                      | 锚点                                                                 |
| -------- | --------------------------------------------------------- | -------------------------------------------------------------------- |
| 首次提交 | `feat: 为 JsonNode 等自由格式类型生成递归 JsonValue 类型` | `commit:229166e7 (2026-07-28)`，目标文件 `src/generator/freeForm.ts` |

该提交信息直接说明：**JsonNode 等自由格式类型在生成产物中需要落到一个递归的 `JsonValue` 类型上**，而不是为每个动态类型生成常规的字段化 interface。

### 3.2 与类型名映射的关系

`src/schema/freeForm.ts:19` 的符号注释指出，Jackson 动态类型的**已知命名在 sanitize 后保持原样且无碰撞风险**，这些名字「应映射为 `JsonValue`」。因此 `JACKSON_DYNAMIC_TYPE_NAMES` 是「类型名 → `JsonValue`」这条路的分流依据，与常规命名/类型名生成路径并列存在。

> 「待确认」：数据中未提供 `buildRecursiveTypeInterface` 的定义位置、签名与生成产物模板，因此「递归 JsonValue 类型的具体 interface 文本如何产出」在本页无法给出锚点佐证。

---

## 四、Schema 遍历与自定义类型提取

### 4.1 符号概览

| 符号                             | 锚点                           | 签名       | 文档要点                                                                                                                                         |
| -------------------------------- | ------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `extractTypesFromSchema`         | `src/processors/common.ts:151` | 见下       | 「递归解析 Schema 提取所有引用的自定义类型」；`depth` 为当前递归深度（内部使用，防 DoS）；`guard` 为循环引用检测器（内部使用）；返回类型名称数组 |
| `extractUsedTypeNames`           | `src/processors/common.ts:103` | 见下       | 注释示例：`usedTypes = Set(['User', 'Product', 'Order'])`                                                                                        |
| `isCustomType`                   | `src/processors/common.ts:226` | 见下       | 检查是否为自定义类型                                                                                                                             |
| `collectUsedTypesFromProperties` | `src/processors/common.ts:72`  | 数据未提供 | 注释示例：`used = Set(['UserPreferences'])`                                                                                                      |

```ts
// src/processors/common.ts:151
extractTypesFromSchema(
  schema: any,
  processedData: ProcessedApiData,
  depth = 0,
  guard: CircularRefGuard = new CircularRefGuard(),
)

// src/processors/common.ts:103
extractUsedTypeNames(
  interfaces: ApiInterface[],
  processedData: ProcessedApiData,
)

// src/processors/common.ts:226
isCustomType(typeName: string, processedData: ProcessedApiData)
```

### 4.2 递归遍历的两道防护

`extractTypesFromSchema` 的签名与文档注释（`src/processors/common.ts:151`）显式暴露了两个内部防护参数：

- `depth`：当前递归深度，文档注明用途为「防 DoS」，并有默认值 `0`；
- `guard: CircularRefGuard`：循环引用检测器，默认构造 `new CircularRefGuard()`。

即：**Schema 遍历是递归的，且同时受深度上限与循环引用两重约束**。该函数本身圈复杂度为 13，是本章所列符号中最高。

### 4.3 调用关系（静态可达性）

| 调用方                          | 被调用方                        | 锚点                                              |
| ------------------------------- | ------------------------------- | ------------------------------------------------- |
| `extractTypesFromSchema`        | `isCustomType`                  | `src/processors/common.ts:226`                    |
| `extractUsedTypeNames`          | `isCustomType`                  | `src/processors/common.ts:226`                    |
| `extractUsedTypeNames`          | `extractTypesFromSchema`        | `src/processors/common.ts:151`                    |
| `generateInterfaceSchemasFiles` | `groupInterfacesByTag`          | `src/processors/common.ts:31`                     |
| `generateSchemaFiles`           | `generateTypeSchemasFiles`      | `src/generator/generators/schemaGenerator.ts:79`  |
| `generateSchemaFiles`           | `generateInterfaceSchemasFiles` | `src/generator/generators/schemaGenerator.ts:123` |
| `generateSchemaFiles`           | `generateSchemaIndexFile`       | `src/generator/generators/schemaGenerator.ts:167` |
| `getRequestTypeName`            | `getTypeName`                   | `src/generator/generators/schemaGenerator.ts:189` |
| `getResponseTypeName`           | `getTypeName`                   | `src/generator/generators/schemaGenerator.ts:189` |

由表可见：`extractUsedTypeNames` 是「接口集合 → 实际使用到的类型名集合」的聚合入口，其下再逐 Schema 调用 `extractTypesFromSchema`，两者最终都以 `isCustomType` 作为类型归属判定。

---

## 五、Schema 生成器与产物

### 5.1 生成入口的三路分发

`src/generator/generators/schemaGenerator.ts` 中，`generateSchemaFiles`（符号注释锚点 `src/generator/generators/schemaGenerator.ts:41`，注释中保留了产物形态示例 `tag2/schema.ts`）向下分发三个子任务：

| 被调用方                        | 锚点                                              | 文档描述                                                                                                  |
| ------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `generateTypeSchemasFiles`      | `src/generator/generators/schemaGenerator.ts:79`  | 为每个 OpenAPI 类型定义生成对应的 Zod Schema；`generatedSchemas` 为「已生成的 Schema 名称数组（会追加）」 |
| `generateInterfaceSchemasFiles` | `src/generator/generators/schemaGenerator.ts:123` | 为每个接口生成请求和响应的 Zod Schema                                                                     |
| `generateSchemaIndexFile`       | `src/generator/generators/schemaGenerator.ts:167` | 导出所有 Schema 定义                                                                                      |

```ts
// src/generator/generators/schemaGenerator.ts:79
generateTypeSchemasFiles(
  processedData: ProcessedApiData,
  config: ApiConfig,
  schemasDir: string,
  generatedSchemas: string[],
  hooks?: CliHooks,
)

// src/generator/generators/schemaGenerator.ts:123
generateInterfaceSchemasFiles(
  processedData: ProcessedApiData,
  config: ApiConfig,
  schemasDir: string,
  generatedSchemas: string[],
  hooks?: CliHooks,
)

// src/generator/generators/schemaGenerator.ts:167
generateSchemaIndexFile(
  schemasDir: string,
  generatedSchemas: string[],
  hooks?: CliHooks,
)
```

三个函数共享 `generatedSchemas` 与 `hooks` 参数，其中 `generateTypeSchemasFiles` 的注释明确标注该数组「会追加」——即 Schema 名称集合在三路生成过程中被逐步累积，最终供索引文件统一导出。

### 5.2 类型名解析

| 符号                  | 锚点                                              | 说明                                                                                 |
| --------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `getTypeName`         | `src/generator/generators/schemaGenerator.ts:189` | 获取命名结果中的指定类型名称，`field` 取 `'requestTypeName'` 或 `'responseTypeName'` |
| `getRequestTypeName`  | `src/generator/generators/schemaGenerator.ts:209` | 获取请求类型名称；委托给 `getTypeName`                                               |
| `getResponseTypeName` | `src/generator/generators/schemaGenerator.ts:219` | 获取响应类型名称；委托给 `getTypeName`                                               |

```ts
// src/generator/generators/schemaGenerator.ts:189
getTypeName(
  path: string,
  method: string,
  operation: OpenApiOperation,
  config: ApiConfig,
  field: 'requestTypeName' | 'responseTypeName',
)
```

---

## 六、模块边界视角

数据提供的跨模块调用统计（生成器与会话中其余模块之间）：

| 调用方模块 | 被调用模块 | 调用次数 |
| ---------- | ---------- | -------- |
| generator  | utils      | 78       |
| generator  | naming     | 24       |
| generator  | schema     | 12       |
| generator  | processors | 6        |
| processors | schema     | 6        |

其中 **generator → schema（12 次）** 与 **processors → schema（6 次）** 两条边，与 `src/schema/freeForm.ts` 作为「中立层」被上层复用的定位一致（`src/generator/freeForm.ts:1` 明确「已下沉至中立层 @/schema/freeForm」，且 `src/generator/freeForm.ts:1` 注明该层同时被 `processors` 侧引用）。

---

## 七、待确认

| #   | 缺口                                                                  | 缺少的证据                                                                                       |
| --- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 1   | `buildRecursiveTypeInterface` 的定义位置、签名与生成的 interface 模板 | 本次数据未提供该符号的任何条目；「递归类型需手写 interface」的具体书写形式无法给出锚点           |
| 2   | `containsFreeFormProperty` 的实现位置与判定规则                       | 本次数据未提供该符号条目；`additionalProperties` 自由形态检测在 Schema 树中的遍历方式未知        |
| 3   | `collectSchemasFromPaths` 的实现位置与调用方                          | 本次数据未提供该符号条目，也未出现在调用边中                                                     |
| 4   | `isFreeFormSchema` / `isJacksonDynamicType` 的完整签名与分支          | 仅有行级注释锚点（`src/schema/freeForm.ts:50`、`src/schema/freeForm.ts:73`），无函数体或参数签名 |

## Related

- 同目录：[schema-walk-and-mapping.md](schema-walk-and-mapping.md)
- 共享 2 个源文件、共享 13 个符号：[architecture.md](../02-architecture/architecture.md)
- 共享 1 个源文件、共享 8 个符号：[chapter:naming-strategy/identifier-sanitizing.md](../09-chapters/naming-strategy/identifier-sanitizing.md)
- 共享 8 个符号：[modules.md](../02-architecture/modules.md)
- 总入口：[README](../README.md)

<!-- wiki:source: llm -->

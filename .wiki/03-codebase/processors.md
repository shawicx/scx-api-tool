# OpenAPI 处理器（`src/processors/`）

一句话职责：将客户端拉取的原始 OpenAPI 文档标准化为生成层消费的 `ProcessedApiData`。

## 输出数据结构

`ProcessedApiData`（定义于 `src/processors/openapi.ts`）：

```typescript
export interface ProcessedApiData {
  interfaces: ApiInterface[]; // 全部 API 端点（以 path + method 标识），按标签分组用 groupInterfacesByTag
  types: ApiTypeDefinition[]; // 从 components.schemas 提取的类型定义
  categories: ApiCategory[]; // 标签/分类元数据
}
```

> 注意：`interfaces` 是**平铺数组**而非按标签的 Record（旧版文档曾描述为 Record，已过时）。分组由 `common.ts` 的 `groupInterfacesByTag()` 完成。

## 文件结构

| 文件         | 职责                                                                                                                                   |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `openapi.ts` | 主处理器 `processOpenApiData(rawData, config)`：解析路径、提取 Schema、解析 `$ref`、标准化响应、应用 `transformPath`、检测自由格式类型 |
| `common.ts`  | `groupInterfacesByTag()` 按标签分组、`extractUsedTypeNames()` 提取被引用类型                                                           |

## 关键逻辑

### transformPath 应用（E3005 防护）

`applyTransformPath()`（`openapi.ts` 内部函数）对每条路径应用用户配置的 `transformPath` 函数；函数抛错或返回非字符串时统一归为 `E3005 GenerateError`（`ErrorFactory.pathTransformError`）。`transformPath` 在配置解析阶段已规范化为函数形式（字符串形式自 0.6.0 起硬移除）。

### 自由格式类型（free-form → JsonValue）

`src/generator/freeForm.ts` 提供检测与生成：

- `isFreeFormSchema()`：检测 `additionalProperties: true / {}` 的自由格式对象
- `isJacksonDynamicType()`：检测 Jackson 动态类型（如 `JsonNode`）
- `createJsonValueDefinition()`：为这类 schema 生成**递归 JsonValue 类型**，替代宽泛的 `any`

由处理器在提取类型阶段调用，影响 `types` 中的定义。

### 参数与响应标准化

来自 Apifox 与标准 OpenAPI 的差异被归一：

- 参数按 `in`（path/query/header）标准化，请求体从 `requestBody.content` 提取
- 200/201 响应 Schema 提取为主要响应类型（支持 `$ref`、数组包装、嵌套对象）
- `$ref`（`#/components/schemas/...`）解析见 `src/utils/refResolver.ts`
- schema 安全处理见 `src/utils/schemaSafety.ts`

## Related

- [代码生成引擎](./generator.md)（消费方）
- [客户端层](./clients.md)（数据来源）
- [术语表 → ProcessedApiData](../99-reference/glossary.md#processedapidata处理后数据)

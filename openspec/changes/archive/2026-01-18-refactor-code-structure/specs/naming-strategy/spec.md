# 命名策略公共逻辑规格

## ADDED Requirements

### Requirement: 命名策略公共模块

系统 SHALL 创建统一的命名策略模块，供 TS 类型生成和 Zod Schema 生成共同使用。

#### Scenario: 命名策略模块结构

**Given** 当前命名策略逻辑在多处重复

**When** 开发者创建 `src/generator/naming/` 目录和以下文件：

- `src/generator/naming/strategy.ts` (命名策略定义和默认实现)
- `src/generator/naming/sanitizer.ts` (名称清理函数)
- `src/generator/naming/index.ts` (统一导出)

**Then** 系统 MUST 确保命名策略逻辑集中管理，避免重复

---

### Requirement: 命名策略接口定义

系统 SHALL 定义清晰的命名策略接口和上下文。

#### Scenario: 命名策略接口

**Given** 需要支持自定义命名策略

**When** 开发者定义以下接口：

```typescript
export interface NamingContext {
  /** 接口命名信息 */
  info: InterfaceNamingInfo;
  /** 配置对象 */
  config: ApiConfig;
}

export interface NamingStrategy {
  /** 生成接口名称 */
  interfaceName(ctx: NamingContext): string;
  /** 生成函数名称 */
  functionName(ctx: NamingContext): string;
  /** 生成请求类型名称 */
  requestTypeName(ctx: NamingContext): string;
  /** 生成响应类型名称 */
  responseTypeName(ctx: NamingContext): string;
}
```

**Then** 系统 MUST 确保接口清晰定义了命名策略的契约

#### Scenario: 默认命名策略实现

**Given** 需要提供开箱即用的命名策略

**When** 开发者实现默认命名策略：

```typescript
export const defaultNamingStrategy: NamingStrategy = {
  interfaceName: (ctx) => {
    const { info } = ctx;
    const { method, summary, path } = info;
    // 默认实现逻辑
    return generateInterfaceName(method, summary, path);
  },
  functionName: (ctx) => {
    /* ... */
  },
  requestTypeName: (ctx) => {
    /* ... */
  },
  responseTypeName: (ctx) => {
    /* ... */
  },
};
```

**Then** 默认策略 MUST 生成符合项目约定的名称

---

### Requirement: 命名策略应用函数

系统 SHALL 提供统一的应用命名策略的函数。

#### Scenario: 应用命名策略

**Given** 用户可能提供自定义命名策略

**When** 开发者使用 `applyNamingStrategy` 函数：

```typescript
export function applyNamingStrategy(
  ctx: NamingContext,
  customStrategy?: Partial<NamingStrategy>,
): Required<NamingContext>;
```

**Then** 函数 MUST 会合并默认策略和自定义策略，返回完整的命名结果

#### Scenario: 完整命名策略覆盖

**Given** 用户提供完整的自定义命名策略

**When** 调用 `applyNamingStrategy(ctx, customStrategy)`

**Then** 系统 MUST 完全使用自定义策略，忽略默认实现

#### Scenario: 部分命名策略覆盖

**Given** 用户提供部分自定义命名策略（例如只覆盖 `interfaceName`）

**When** 调用 `applyNamingStrategy(ctx, { interfaceName: customFn })`

**Then** 系统 MUST 确保 `interfaceName` 使用自定义函数，其他使用默认实现

---

### Requirement: TS 类型生成器集成

系统 SHALL 确保 TS 类型生成器使用统一的命名策略模块。

#### Scenario: 生成器使用命名策略

**Given** 接口生成器需要生成各种名称

**When** 开发者在 `interfaceGenerator.ts` 中使用：

```typescript
import { applyNamingStrategy, type NamingContext } from '@/generator/naming';

const ctx: NamingContext = { info, config };
const naming = applyNamingStrategy(ctx, config.namingStrategy);

const interfaceName = naming.interfaceName;
const functionName = naming.functionName;
// ...
```

**Then** 生成器 MUST 使用统一的命名逻辑

---

### Requirement: Zod Schema 生成器集成

系统 SHALL 确保 Zod Schema 生成器使用统一的命名策略模块。

#### Scenario: Schema 生成器使用命名策略

**Given** Schema 生成器需要生成类型和函数名称

**When** 开发者在 `schemaGenerator.ts` 中使用：

```typescript
import { applyNamingStrategy, type NamingContext } from '@/generator/naming';

const ctx: NamingContext = { info, config };
const naming = applyNamingStrategy(ctx, config.namingStrategy);

const requestTypeName = naming.requestTypeName;
const responseTypeName = naming.responseTypeName;
// ...
```

**Then** Schema 生成器 MUST 使用统一的命名逻辑

---

### Requirement: 命名一致性验证

系统 MUST 确保 TS 类型生成和 Zod Schema 生成使用相同的命名策略时，应生成一致的名称。

#### Scenario: 相同输入相同输出

**Given** 相同的 `InterfaceNamingInfo` 和 `ApiConfig`

**When** TS 类型生成器和 Zod Schema 生成器都调用 `applyNamingStrategy`

**Then** 系统 MUST 确保两者生成的名称完全一致

#### Scenario: 自定义策略同时生效

**Given** 配置了自定义命名策略

**When** TS 类型生成器和 Zod Schema 生成器都使用该配置

**Then** 系统 MUST 确保两者都应用相同的自定义命名规则

---

## MODIFIED Requirements

### Requirement: 配置类型扩展

系统 SHALL 扩展 `ApiConfig` 中的 `namingStrategy` 配置类型。

#### Scenario: 配置类型使用新接口

**Given** `types/config.ts` 中定义了 `NamingStrategy` 接口

**When** 重构后使用新的统一命名策略接口

**Then** 系统 MUST 确保配置类型与命名策略模块保持一致

---

## REMOVED Requirements

### Requirement: 移除重复的命名逻辑

移除在不同生成器中重复的命名处理逻辑。

#### Scenario: 删除重复代码

**Given** 当前 `fileGenerator.ts` 和 `schema-zod.ts` 中有重复的命名逻辑

**When** 重构为使用统一的命名策略模块

**Then** 重复逻辑被删除，代码更加简洁

---

## Cross-References

- 与 `file-split` 规格关联：命名策略模块的创建依赖于文件拆分
- 与 `comment-style` 规格关联：命名策略函数需要统一的 JSDoc 注释

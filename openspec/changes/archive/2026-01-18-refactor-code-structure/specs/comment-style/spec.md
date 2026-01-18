# 注释风格统一规格

## ADDED Requirements

### Requirement: 统一 JSDoc 格式

系统 MUST 确保所有函数和方法使用统一的 JSDoc 注释格式。

#### Scenario: 标准 JSDoc 格式

**Given** 需要定义函数或方法

**When** 开发者使用以下标准格式：

```typescript
/**
 * @description 将中文转换为拼音-大驼峰格式
 * @example 例如: "角色管理" -> "JiaoSeGuanli", "AI 服务" -> "AIFuwu"
 * @param chinese 中文字符串
 * @returns 拼音-大驼峰格式字符串
 */
export function chineseToPinyinCamelCase(chinese: string): string {
  // 实现
}
```

**Then** 系统 MUST 确保注释包含 `@description`、`@example`、`@param`、`@returns` 标签

#### Scenario: 可选标签

**Given** 函数可能抛出错误或有其他特殊情况

**When** 开发者根据需要添加可选标签：

- `@throws`：描述可能抛出的错误
- `@see`：参考相关文档
- `@deprecated`：标记为已废弃
- `@since`：版本信息
- `@author`：作者信息

**Then** 系统 MUST 确保可选标签根据实际需要添加，不强制要求

---

### Requirement: 文件头注释规范

系统 MUST 确保每个源文件包含文件级描述注释。

#### Scenario: 文件头注释

**Given** 新建或修改源文件

**When** 开发者在文件开头添加以下格式：

```typescript
/**
 * @description 命名处理工具
 * 用于清理和规范化生成的代码中的标识符名称
 */
```

**Then** 系统 MUST 确保文件头使用中文描述文件用途

#### Scenario: 模块导出文件

**Given** 模块导出文件（如 `index.ts`）

**When** 文件头注释描述模块导出内容：

```typescript
/**
 * @description 命名策略模块导出
 * 提供统一的命名策略接口和默认实现
 */
```

**Then** 系统 MUST 确保导出文件清晰说明模块内容

---

### Requirement: 类和接口注释规范

系统 MUST 确保类和接口有清晰的描述注释。

#### Scenario: 类注释

**Given** 定义类

**When** 开发者添加以下格式：

```typescript
/**
 * @description 基础错误类
 * 提供统一的错误格式和解决方案展示
 */
export class BaseError extends Error {
  // 实现
}
```

**Then** 系统 MUST 确保类注释描述类的职责和用途

#### Scenario: 接口注释

**Given** 定义接口

**When** 开发者添加以下格式：

```typescript
/**
 * @description 接口命名信息，用于自定义命名策略
 * 包含生成名称所需的所有上下文信息
 */
export interface InterfaceNamingInfo {
  /** API 路径 */
  path: string;
  /** HTTP 方法 */
  method: string;
  // ...
}
```

**Then** 系统 MUST 确保接口注释描述接口用途，每个属性有简短说明

---

### Requirement: 参数和返回值类型注释

系统 MUST 确保所有 `@param` 和 `@returns` 准确描述类型和含义。

#### Scenario: 参数类型注释

**Given** 函数有参数

**When** `@param` 注释包含参数名和类型说明：

```typescript
/**
 * @description 清理并语义化类型名称
 * @param typeName 原始类型名称字符串
 * @returns 清理后的类型名称（PascalCase 格式）
 */
export function sanitizeTypeName(typeName: string): string {
  // 实现
}
```

**Then** 系统 MUST 确保参数注释明确参数类型和用途

#### Scenario: 可选参数注释

**Given** 函数有可选参数

**When** 在 `@param` 注释中标记 `[optional]`：

```typescript
/**
 * @description 应用命名策略
 * @param ctx 命名上下文
 * @param customStrategy [可选] 自定义命名策略部分覆盖
 * @returns 应用策略后的完整命名结果
 */
export function applyNamingStrategy(
  ctx: NamingContext,
  customStrategy?: Partial<NamingStrategy>,
): Required<NamingContext> {
  // 实现
}
```

**Then** 系统 MUST 确保可选参数清晰标记

---

### Requirement: 示例代码注释

系统 MUST 确保关键函数包含使用示例。

#### Scenario: 带示例的函数

**Given** 函数有多个使用场景或复杂用法

**When** 开发者在 `@example` 中提供示例：

```typescript
/**
 * @description 清理类型名称
 * @example 例如:
 * - "Class?" -> "ClassOptional"
 * - "Type<something>" -> "Typesomething"
 * - "123Type" -> "_123Type"
 * @param typeName 原始类型名称
 * @returns 清理后的类型名称
 */
export function sanitizeTypeName(typeName: string): string {
  // 实现
}
```

**Then** 系统 MUST 确保示例代码清晰展示函数行为

---

### Requirement: 复杂逻辑注释

系统 MUST 确保复杂逻辑块添加行内注释。

#### Scenario: 复杂算法

**Given** 函数包含复杂算法或多步处理

**When** 开发者在关键步骤添加注释：

```typescript
export function sanitizeTypeName(typeName: string): string {
  // 1. 解码 URL 编码字符
  try {
    cleaned = decodeURIComponent(cleaned);
  } catch {
    // 如果解码失败，继续使用原名称
  }

  // 2. 检查是否有问号（可选类型标记）
  if (cleaned.includes('?')) {
    hasOptionalMarker = true;
    cleaned = cleaned.replace(/\?/g, '');
  }

  // 3. 移除非法字符并将后续字母大写
  cleaned = cleaned.replace(/([<>{}[\],;'"\\|/.])([a-z])/g /* ... */);
  // ...
}
```

**Then** 系统 MUST 确保注释解释算法步骤和意图

---

## MODIFIED Requirements

### Requirement: 现有注释迁移

系统 MUST 将现有代码的注释迁移到统一格式。

#### Scenario: 迁移文件头注释

**Given** 现有文件有 `@description` 文件头注释

**When** 确保格式符合规范

**Then** 系统 MUST 确保所有文件头注释统一格式

#### Scenario: 添加缺失的 @example 标签

**Given** 现有函数缺少 `@example` 标签

**When** 为关键函数添加示例

**Then** 系统 MUST 确保所有核心函数都有使用示例

#### Scenario: 补充 @param 和 @returns

**Given** 现有函数有 `@description` 但缺少 `@param` 或 `@returns`

**When** 补充完整的参数和返回值描述

**Then** 系统 MUST 确保所有函数注释完整

---

### Requirement: 验证脚本

系统 MUST 提供自动验证注释规范的脚本。

#### Scenario: ESLint 规则

**Given** 需要 Lint 检查注释规范

**When** 在 `.eslintrc` 中配置规则：

```json
{
  "rules": {
    "jsdoc/require-description": "error",
    "jsdoc/require-param-description": "error",
    "jsdoc/require-returns-description": "error",
    "jsdoc/require-example": "warn"
  }
}
```

**Then** 系统 MUST 确保ESLint 可以检查注释规范

#### Scenario: 手动检查命令

**Given** 需要手动验证关键函数

**When** 运行检查脚本：

```bash
# 检查所有 TypeScript 文件的 JSDoc 注释
grep -r "@description" src/
grep -r "@param" src/
grep -r "@returns" src/
```

**Then** 系统 MUST 确保可以快速查看注释覆盖情况

---

## REMOVED Requirements

无

---

## Cross-References

- 与 `file-split` 规格关联：拆分后的新文件需要遵循统一注释规范
- 与 `naming-strategy` 规格关联：命名策略函数需要完整的 JSDoc 注释

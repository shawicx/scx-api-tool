# 文件拆分重构规格

## ADDED Requirements

### Requirement: 生成器文件拆分

系统 SHALL 重构 `src/generator/fileGenerator.ts` (909 行) 为多个职责单一的模块。

#### Scenario: 拆分后的生成器模块

**Given** 当前 `fileGenerator.ts` 包含 909 行代码，职责混杂

**When** 开发者将其拆分为以下文件：

- `src/generator/fileGenerator.ts` (主协调器，<250 行)
- `src/generator/generators/interfaceGenerator.ts`
- `src/generator/generators/typeGenerator.ts`
- `src/generator/generators/schemaGenerator.ts`

**Then** 系统 MUST 确保每个文件职责单一且行数不超过 360 行，导出接口保持不变

#### Scenario: 保持向后兼容性

**Given** 现有代码通过以下方式导入生成器：

```typescript
import { generateInterfaceFiles, generateTypeFiles } from '@/generator/fileGenerator';
```

**When** 重构后保持相同的导出接口

**Then** 现有代码 MUST 无需修改即可正常工作

---

### Requirement: 模板文件拆分

系统 SHALL 重构 `src/generator/template.ts` (646 行) 为多个职责单一的模块。

#### Scenario: 拆分后的模板模块

**Given** 当前 `template.ts` 包含 646 行代码，混合了缓存、辅助函数、partials

**When** 开发者将其拆分为以下文件：

- `src/generator/template/templateCache.ts`
- `src/generator/template/templateHelpers.ts`
- `src/generator/template/templatePartials.ts`
- `src/generator/template/compiler.ts`
- `src/generator/template/index.ts`

**Then** 系统 MUST 确保每个文件职责单一且行数不超过 360 行

#### Scenario: 模板缓存保持高效

**Given** 模板缓存对于性能至关重要

**When** 重构模板模块

**Then** 系统 MUST 确保模板缓存机制保持不变，缓存命中率与重构前一致

---

### Requirement: Zod Schema 模板拆分

系统 SHALL 重构 `src/templates/schema-zod.ts` (626 行) 为多个模块。

#### Scenario: 按模板类型拆分

**Given** 当前 `schema-zod.ts` 包含 626 行代码，包含所有 Zod 模板

**When** 开发者将其拆分为以下文件：

- `src/templates/schema-zod/types.ts`
- `src/templates/schema-zod/interfaces.ts`
- `src/templates/schema-zod/requests.ts`
- `src/templates/schema-zod/index.ts`

**Then** 系统 MUST 确保每个文件专注于一种模板类型且行数不超过 200 行

#### Scenario: 导出接口保持一致

**Given** 现有代码从 `schema-zod.ts` 导出：

```typescript
import { generateZodTypeSchema } from '@/templates/schema-zod';
```

**When** 重构后

**Then** 导出接口 MUST 保持不变，内部实现重构

---

### Requirement: 错误处理模块拆分

系统 SHALL 重构 `src/errors/index.ts` (416 行) 为多个模块。

#### Scenario: 按职责拆分错误模块

**Given** 当前 `errors/index.ts` 包含 416 行代码

**When** 开发者将其拆分为以下文件：

- `src/errors/errorCodes.ts` (错误代码枚举)
- `src/errors/errorClasses.ts` (错误类定义)
- `src/errors/errorFactory.ts` (错误工厂)
- `src/errors/index.ts` (统一导出)

**Then** 系统 MUST 确保每个文件职责单一且行数不超过 360 行

#### Scenario: 错误系统功能保持完整

**Given** 错误系统提供错误代码、错误类、错误工厂等功能

**When** 重构错误模块

**Then** 系统 MUST 确保所有现有错误功能保持不变，包括：

- 错误代码枚举
- 错误类（ConfigError、FetchError、GenerateError）
- ErrorFactory 方法
- 错误格式化和解决方案

---

## MODIFIED Requirements

### Requirement: 文件行数约束

系统 MUST 确保所有源代码文件行数不超过 360 行。

#### Scenario: 验证重构后文件行数

**Given** 重构完成后的代码库

**When** 开发者运行 `find src -name "*.ts" -exec wc -l {} +`

**Then** 系统 MUST 确保所有文件的行数不超过 360 行

#### Scenario: 自动检查脚本

**Given** 项目需要持续维护文件大小

**When** 开发者在 `package.json` 中添加检查脚本：

```json
{
  "scripts": {
    "check:linesize": "find src -name '*.ts' -exec sh -c 'lines=$(wc -l < \"{}\"); if [ $lines -gt 360 ]; then echo \"{}: $lines lines\"; fi' \\;"
  }
}
```

**Then** 开发者 MUST 能够通过 `pnpm run check:linesize` 验证文件大小约束

---

## REMOVED Requirements

无

---

## Cross-References

- 与 `naming-strategy` 规格关联：命名策略模块将独立于文件拆分
- 与 `comment-style` 规格关联：拆分后的文件需要统一注释风格

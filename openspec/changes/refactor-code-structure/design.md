# 设计文档：代码结构重构

## 架构设计

### 当前问题

```
src/generator/
├── fileGenerator.ts (909 行)  🔴 过大
├── template.ts (646 行)        🔴 过大
├── naming.ts (257 行)
├── extractor.ts (213 行)
├── pathUtils.ts (155 行)
└── index.ts

src/templates/
├── schema-zod.ts (626 行)      🔴 过大
├── config.ts (73 行)
├── interface.ts (72 行)
└── ...

src/errors/
└── index.ts (416 行)          🔴 过大
```

### 重构后结构

```
src/generator/
├── fileGenerator.ts (200-250 行)  主协调器
├── generators/
│   ├── interfaceGenerator.ts       接口文件生成
│   ├── typeGenerator.ts            类型文件生成
│   └── schemaGenerator.ts          Schema 文件生成
├── naming/
│   ├── strategy.ts                 命名策略（公共逻辑）
│   ├── sanitizer.ts               名称清理
│   └── index.ts
├── template/
│   ├── templateCache.ts            模板缓存
│   ├── templateHelpers.ts         Handlebars 辅助函数
│   ├── templatePartials.ts        Handlebars partials
│   ├── compiler.ts                模板编译器
│   └── index.ts
└── index.ts

src/templates/
├── schema-zod/
│   ├── types.ts                   类型模板
│   ├── interfaces.ts              接口模板
│   ├── requests.ts                请求模板
│   └── index.ts
├── config.ts (73 行)
└── ...

src/errors/
├── errorCodes.ts                 错误代码枚举
├── errorClasses.ts               错误类定义
├── errorFactory.ts               错误工厂
└── index.ts

src/processors/
├── openapi.ts
├── common.ts                     公共处理逻辑
└── index.ts
```

## 核心设计决策

### 1. 生成器模块拆分

**问题**：`fileGenerator.ts` 包含多种生成逻辑，职责不清

**解决方案**：按生成目标拆分为独立生成器

```typescript
// src/generator/generators/interfaceGenerator.ts
export async function generateInterfaceFiles(
  processedData: ProcessedApiData,
  config: ApiConfig,
): Promise<void>;

// src/generator/generators/typeGenerator.ts
export async function generateTypeFiles(
  processedData: ProcessedApiData,
  config: ApiConfig,
): Promise<void>;

// src/generator/generators/schemaGenerator.ts
export async function generateSchemaFiles(
  processedData: ProcessedApiData,
  config: ApiConfig,
): Promise<void>;
```

**优势**：

- 每个生成器职责单一
- 易于单独测试和维护
- 支持按需生成

### 2. 命名策略公共逻辑

**问题**：TS 类型和 Zod Schema 生成都使用命名策略，逻辑重复

**解决方案**：提取公共命名策略模块

```typescript
// src/generator/naming/strategy.ts
export interface NamingContext {
  info: InterfaceNamingInfo;
  config: ApiConfig;
}

export interface NamingStrategy {
  interfaceName(ctx: NamingContext): string;
  functionName(ctx: NamingContext): string;
  requestTypeName(ctx: NamingContext): string;
  responseTypeName(ctx: NamingContext): string;
}

// 默认实现
export const defaultNamingStrategy: NamingStrategy = {
  interfaceName: (ctx) => {
    /* ... */
  },
  functionName: (ctx) => {
    /* ... */
  },
  // ...
};

export function applyNamingStrategy(
  ctx: NamingContext,
  customStrategy?: Partial<NamingStrategy>,
): Required<NamingContext>;
```

**使用示例**：

```typescript
// 在 interfaceGenerator.ts 中
const naming = applyNamingStrategy({ info, config });

// 在 schemaGenerator.ts 中
const naming = applyNamingStrategy({ info, config });
```

**优势**：

- 避免代码重复
- 命名逻辑统一
- 易于扩展自定义策略

### 3. 模板系统重构

**问题**：`template.ts` 混合了模板缓存、辅助函数、partials 和编译逻辑

**解决方案**：按职责拆分

```typescript
// src/generator/template/templateCache.ts
const templateCache = new Map<string, HandlebarsTemplateDelegate>();
export function getTemplate(key: string);
export function setTemplate(key: string, template: HandlebarsTemplateDelegate);
export function clearTemplateCache();

// src/generator/template/templateHelpers.ts
export function registerTemplateHelpers();

// src/generator/template/templatePartials.ts
export function registerTemplatePartials();

// src/generator/template/compiler.ts
export function compileTemplate(template: string, key: string): HandlebarsTemplateDelegate;
```

**优势**：

- 每个模块职责清晰
- 易于测试和调试
- 缓存逻辑集中管理

### 4. Zod Schema 模板拆分

**问题**：`schema-zod.ts` (626 行) 包含所有 Zod 相关模板

**解决方案**：按模板类型拆分为子模块

```typescript
// src/templates/schema-zod/types.ts
export function getZodTypeTemplate(comment: boolean): string;
export function generateZodTypeSchema(data, config): string;

// src/templates/schema-zod/interfaces.ts
export function getZodInterfaceTemplate(comment: boolean): string;
export function generateZodInterfaceSchema(data, config): string;

// src/templates/schema-zod/requests.ts
export function getZodRequestTemplate(comment: boolean): string;
export function generateZodRequestSchema(data, config): string;
```

**优势**：

- 每个文件 <200 行
- 易于定位特定模板
- 支持独立测试

### 5. 错误处理模块拆分

**问题**：`errors/index.ts` (416 行) 包含错误代码、错误类和错误工厂

**解决方案**：按职责拆分

```typescript
// src/errors/errorCodes.ts
export enum ErrorCode {
  // E1xxx: 配置错误
  CONFIG_FILE_NOT_FOUND = 'E1001',
  // ...
}

// src/errors/errorClasses.ts
export class BaseError extends Error {
  /* ... */
}
export class ConfigError extends BaseError {
  /* ... */
}
export class FetchError extends BaseError {
  /* ... */
}
export class GenerateError extends BaseError {
  /* ... */
}

// src/errors/errorFactory.ts
export const ErrorFactory = {
  configNotFound: (path: string) => {
    /* ... */
  },
  fetchFailed: (url: string, statusCode: number, error?: Error) => {
    /* ... */
  },
  // ...
};
```

**优势**：

- 错误定义集中管理
- 错误类易于扩展
- 工厂方法统一创建

## 数据流设计

### 生成流程

```
OpenAPI 数据
    ↓
processOpenApiData (processors/common.ts)
    ↓
ProcessedApiData
    ↓
┌─────────────────────────────────┐
│  fileGenerator.ts (协调器)       │
├─────────────────────────────────┤
│  - generateRequestFile()         │
│  - generateInterfaceFiles()      │
│  - generateTypeFiles()           │
│  - generateSchemaFiles()         │
└─────────────────────────────────┘
    ↓                    ↓                    ↓
接口生成器          类型生成器           Schema 生成器
(使用命名策略)      (使用命名策略)       (使用命名策略)
```

### 命名策略应用

```
InterfaceNamingInfo
    ↓
NamingContext { info, config }
    ↓
applyNamingStrategy()
    ↓
检查 customNamingStrategy
    ↓
应用默认策略或自定义策略
    ↓
返回统一命名结果
```

## 接口兼容性

### 保持向后兼容

重构后，所有公共导出接口保持不变：

```typescript
// src/generator/fileGenerator.ts (重构后)
export { generateRequestFile };
export { generateInterfaceFiles };
export { generateTypeFiles };
export { generateSchemaFiles };

// src/generator/template.ts (重构后)
export { compileTemplate };
export { registerTemplateHelpers };
export { registerTemplatePartials };
export { clearTemplateCache };

// src/templates/schema-zod.ts (重构后)
export { generateZodTypeSchema };
export { generateZodSchemaIndex };
export { generateMergedSchemaFile };

// src/errors/index.ts (重构后)
export { ErrorCode };
export { ConfigError, FetchError, GenerateError };
export { ErrorFactory };
```

内部实现重构，但外部调用无需修改。

## 性能考虑

### 模板缓存

模板缓存保持不变，确保性能：

```typescript
// templateCache.ts
const templateCache = new Map<string, HandlebarsTemplateDelegate>();
```

### 并发控制

文件生成的并发控制保持不变：

```typescript
// 使用 config.concurrency 控制并发
const chunks = chunkArray(files, config.concurrency);
await Promise.all(chunks.map((chunk) => Promise.all(chunk)));
```

## 测试策略

### 手动测试流程

1. 运行 `npx ts-node src/index.ts` 生成代码
2. 检查 `src/service/` 目录输出
3. 验证生成的代码符合预期
4. 检查 TypeScript 编译无错误

### 对比测试

重构前后生成结果应该完全一致：

```bash
# 重构前
pnpm run build
npx ts-node src/index.ts > output-before.txt

# 重构后
pnpm run build
npx ts-node src/index.ts > output-after.txt

# 对比
diff output-before.txt output-after.txt
```

## 迁移计划

### 阶段 1：准备（不影响功能）

1. 创建新的目录结构
2. 准备新的导出文件
3. 运行测试确保现有功能正常

### 阶段 2：拆分文件（逐步迁移）

1. 先拆分 `src/errors/index.ts`
2. 测试错误处理功能
3. 再拆分 `src/generator/template.ts`
4. 测试模板功能
5. 再拆分 `src/templates/schema-zod.ts`
6. 测试 Zod 生成
7. 最后拆分 `src/generator/fileGenerator.ts`
8. 测试完整生成流程

### 阶段 3：公共逻辑抽离

1. 创建命名策略模块
2. 迁移类型生成器使用新模块
3. 迁移 Schema 生成器使用新模块
4. 测试命名一致性

### 阶段 4：注释统一

1. 逐个文件更新注释
2. 确保 JSDoc 格式统一
3. 运行 lint 检查

### 阶段 5：验证和清理

1. 完整测试生成流程
2. 检查所有文件行数 <360
3. 清理临时文件
4. 更新文档

## 风险缓解

| 风险                 | 缓解措施                           |
| -------------------- | ---------------------------------- |
| 重构引入 bug         | 分阶段进行，每阶段充分测试         |
| 向后兼容性破坏       | 保持导出接口不变，只重构内部实现   |
| 文件拆分导致循环依赖 | 使用清晰的依赖方向，避免循环导入   |
| 测试覆盖不足         | 手动测试每个阶段，对比重构前后输出 |

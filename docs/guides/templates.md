# 生成模板说明

`@scx/api-tool` 的代码产物由**内置的 Handlebars 模板系统**渲染（编译、缓存、helper 与 partials 管理，位于工具包内部 `src/generator/template/`），**不提供用户可替换的模板目录**。生成结果通过配置项定制，而不是改写模板文件。

本页说明模板体系如何工作，以及你可以用哪些**真实存在的配置扩展点**定制产物形态。

## 模板系统如何工作

一次生成经过的渲染管线：

```
OpenAPI 文档
  → 数据处理（接口/类型/分类提取）
  → 命名策略（namingStrategy 或默认规则）
  → Handlebars 模板渲染（接口文件 / 类型文件 / request 文件 / hooks 文件 / barrel）
  → Prettier 格式化
  → 写入输出目录
```

各产物的模板分支：

| 产物        | 模板分支                                      | 影响的配置                                               |
| ----------- | --------------------------------------------- | -------------------------------------------------------- |
| 接口文件    | 接口模板（RequestType/ResultType + 请求函数） | `generateApi`、`generateTypes`、`comment`、`typesFormat` |
| 类型文件    | TypeScript 类型模板 / Zod Schema 模板         | `typesFormat`、`generateTypes`                           |
| 请求文件    | 请求文件生成器                                | `requestMode`、`requestTimeout`、`requestMethodStyle` 等 |
| Hooks 文件  | 各客户端库适配器模板                          | `generateHooks`、`hooksLibrary`、`queryKeyPrefix`        |
| 入口 barrel | 索引模板                                      | —（自动聚合）                                            |

## 定制产物的真实扩展点

### 1. `namingStrategy` — 控制所有标识符

接口名、函数名、Hook 名、请求/响应类型名都可以用函数完全接管：

```typescript
export default defineConfig({
  namingStrategy: {
    functionName: (ctx) =>
      `${ctx.method.toLowerCase()}${ctx.path.split('/').filter(Boolean).join('_')}`,
    requestTypeName: (ctx) => `${ctx.operationId ?? 'Api'}RequestType`,
  },
  services: [/* ... */],
});
```

`NamingContext` 的字段（`path` / `method` / `summary` / `operationId` / `tags` 等）见[配置参考 - 命名策略](./config-reference.md#命名策略namingstrategy)。

### 2. `hooks` — 逐文件改写产物内容

`beforeWriteFile` 接收即将写入的文件路径与内容，**返回修改后的内容**：

```typescript
export default defineConfig({
  hooks: {
    beforeWriteFile: (filePath, content) => {
      if (filePath.endsWith('index.ts')) {
        return `/* eslint-disable */\n${content}`;
      }
      return content;
    },
  },
  services: [/* ... */],
});
```

钩子的按服务执行语义见[高级用法 - 钩子系统](./advanced.md#钩子系统)。

### 3. `customizeAxios` — 定制请求基础设施

`request.ts` 仅首次生成、之后不再覆盖。文件内置 `customizeAxios` 扩展点（模块加载时调用一次），把项目级请求定制（拦截器、Token 注入、响应解包、baseURL）直接写在生成文件里，长期保留：

```typescript
// src/service/request.ts（生成文件，可直接编辑）
export function customizeAxios(instance: typeof axios): void {
  instance.defaults.baseURL = '/api';
  instance.interceptors.request.use((config) => {
    config.headers.Authorization = `Bearer ${getToken()}`;
    return config;
  });
}
```

详见[高级用法 - customizeAxios 扩展点](./advanced.md#customizeaxios-扩展点)。

### 4. `transformPath` — 改写请求路径

```typescript
export default defineConfig({
  transformPath: (p) => (p.startsWith('/api') ? p.slice(4) : p),
  services: [/* ... */],
});
```

注意 path 参与函数命名，改写 path 会连带改变生成的函数名。详见[配置参考 - 路径转换](./config-reference.md#路径转换)。

### 5. `requestMode: 'isolated'` — 独立请求实例

为单个服务生成独立 request 文件与 `axios.create` 私有实例（烘焙 `requestBaseURL` / `requestTimeout`），互不影响。见[配置参考 - 请求函数](./config-reference.md#请求函数)。

## 相关页面

- [配置参考](./config-reference.md) — 全部配置字段
- [使用示例](./examples.md) — 各模式真实产物
- [架构说明](../development/architecture.md) — 模板系统的内部结构

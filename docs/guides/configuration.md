# 配置指南

本页介绍如何创建和组织 `api-power.config.ts`。**全部字段的类型、默认值与含义见[配置参考](./config-reference.md)**，本页不再重复展开。

## 创建配置文件

```bash
npx api-power init        # 在当前目录创建 api-power.config.ts
npx api-power init --force # 覆盖已有配置文件
```

`init` 生成的模板自带常用配置与注释，把 `services` 里的 `source` / `token` 换成你自己的即可。

也支持手动创建 `api-power.config.js`。查找顺序：`--config` 指定的路径 → 当前目录的 `api-power.config.ts` → 当前目录的 `api-power.config.js`。

## 最小配置

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  baseOutputDir: 'src/service',
  services: [
    {
      name: 'main',
      folder: '.', // 输出直接落在 baseOutputDir（单源常用写法）
      source: 'https://api.apifox.com/v1/projects/YOUR_PROJECT_ID/export-openapi',
      token: 'APS-YourAccessTokenHere', // Apifox 必填，Swagger 可省
    },
  ],
});
```

## 核心概念：多服务配置

`defineConfig` 统一采用**多服务（microservice）**配置形态：

- 顶层是**公共配置**，所有服务共享继承（如 `typesFormat`、`generateApi`、`transformPath`、`hooks`）；
- `services` 数组声明每个服务独立的**数据源**（`source` / `token`）与**输出位置**（`folder`，默认取 `name`）；
- 服务级可写任意公共字段，**浅合并覆盖**公共配置，实现「公共默认 + 服务级个性化」；
- 合并优先级：内置默认值 < `preset` 预设 < 顶层公共配置 < 服务级字段；
- `defineConfig` 返回 `ApiConfig[]`，单源即数组长度为 1。

每个服务的输出目录 = `join(baseOutputDir, folder ?? name)`，共享的 `request.ts` 生成在 `baseOutputDir` 层级（仅首次生成，之后不覆盖）。

### 多服务示例

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  baseOutputDir: 'src/service', // 共享 request.ts 生成于此层级
  typesFormat: 'typescript',

  services: [
    {
      name: 'user', // folder 省略 → 输出 src/service/user
      source: 'https://user-svc.example.com/v3/api-docs',
      token: 'APS-user-token',
    },
    {
      name: 'order',
      source: 'https://order-svc.example.com/swagger.json',
      folder: 'trade/order', // 多段 folder → 输出 src/service/trade/order
      transformPath: (p) => '/order' + p, // 服务级覆盖公共配置
    },
  ],
});
```

校验在 `defineConfig` 内完成：`name` 唯一、各服务 `outputDir` 不相同/不嵌套、目录不得逃逸出项目根、`transformPath` 必须为函数等，违反即抛 `E1002`。完整规则见[配置参考 - 校验规则](./config-reference.md#校验规则)。

## 常用配置片段

详细字段说明一律参考[配置参考](./config-reference.md)，此处仅给出最常用的几个片段。

### 只生成类型（不生成请求函数）

```typescript
export default defineConfig({
  baseOutputDir: 'src/service',
  generateApi: false,
  services: [{ name: 'main', folder: '.', source: '...', token: '...' }],
});
```

### Zod 模式（运行时验证）

```typescript
export default defineConfig({
  baseOutputDir: 'src/service',
  typesFormat: 'zod',
  services: [{ name: 'main', folder: '.', source: '...', token: '...' }],
});
```

### 生成 React Query Hooks

```typescript
export default defineConfig({
  baseOutputDir: 'src/service',
  generateHooks: true, // 依赖 generateApi: true；需自行安装 @tanstack/react-query@^5
  queryKeyPrefix: ['main'],
  services: [{ name: 'main', folder: '.', source: '...', token: '...' }],
});
```

### 敏感信息用环境变量

```typescript
export default defineConfig({
  baseOutputDir: 'src/service',
  services: [
    {
      name: 'main',
      folder: '.',
      source: process.env.API_SOURCE!,
      token: process.env.API_TOKEN!,
    },
  ],
});
```

> 配置文件是一段普通的 TypeScript，可以任意使用 `process.env`、条件展开等语言能力。建议将含真实 token 的配置排除在版本控制之外，或仅提交环境变量形式。

## 故障排除

### 配置文件找不到

- 确认文件名为 `api-power.config.ts` 或 `api-power.config.js`，且位于运行目录；
- 或用 `api-power generate --config <path>` 显式指定。

### E1002 配置无效

- 检查 `services` 每项是否有 `name` / `source`；
- 检查服务 `name` 是否重复、输出目录是否相同或嵌套；
- `transformPath` 必须是函数（字符串形式已在 0.6.0 废弃）。

### 想看配置解析结果

```bash
npx api-power debug # 诊断模式：加载配置 + 拉取数据 + 打印报告，不生成文件
```

## 下一步

- [配置参考](./config-reference.md) — 全部字段的类型、默认值与校验规则
- [CLI 命令参考](./cli.md) — 所有可用命令
- [使用示例](./examples.md) — 各模式的真实生成产物

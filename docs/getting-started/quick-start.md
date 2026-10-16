# 快速开始示例

本教程从零开始，用 `@scx/api-tool` 从一个 OpenAPI 数据源生成 TypeScript 类型与请求函数。文中所有生成产物截图均来自真实生成结果。

## 准备工作

### 1. 准备 API 数据源

你需要一个可访问的接口定义地址：

- **Apifox**：项目 → 导出 → OpenAPI，得到形如 `https://api.apifox.com/v1/projects/<PROJECT_ID>/export-openapi` 的地址，并在个人设置中创建访问令牌（格式 `APS-xxx`）；
- **Swagger/OpenAPI 3.0**：任何返回 OpenAPI JSON 的 URL（如 `https://petstore.swagger.io/v2/swagger.json`），无需 token。

### 2. 初始化项目

```bash
mkdir my-api-project && cd my-api-project
npm init -y
npm install @scxfe/api-tool --save-dev
```

## 步骤 1: 创建配置文件

```bash
npx api-power init
```

这会在当前目录创建一个带注释的 `api-power.config.ts` 模板。

## 步骤 2: 配置数据源

编辑 `api-power.config.ts`，把服务换成你自己的数据源（单源场景用 `folder: '.'` 让输出直接落在 `baseOutputDir`）：

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  baseOutputDir: 'src/service',
  typesFormat: 'typescript',

  services: [
    {
      name: 'main',
      folder: '.',
      source: 'https://api.apifox.com/v1/projects/YOUR_PROJECT_ID/export-openapi',
      token: 'APS-YourAccessTokenHere',
    },
  ],
});
```

> 完整字段说明见[配置参考](../guides/config-reference.md)。

## 步骤 3: 生成代码

```bash
npx api-power generate
```

真实运行输出（本文档构建时实际执行 `api-power generate` 的终端输出）：

```
ℹ 使用配置开始代码生成 .tmp-e2e/docs-demo/config.ts
✔ 配置验证通过
ℹ 检测到 1 个服务
ℹ 并发获取各服务 API 数据...
✔ 请求完成: GET http://127.0.0.1:8792/v3/api-docs (25ms)
ℹ 处理服务 (1/1): http://127.0.0.1:8792/v3/api-docs
ℹ 数据处理完成: 5 个接口, 6 个类型, 0 个分类
ℹ 生成接口文件
✔ 生成接口文件：成功完成 1 个项目
ℹ 生成 API 请求方法
ℹ 创建请求函数文件: .tmp-e2e/docs-demo/out/request.ts
ℹ 生成 TypeScript 类型定义
✔ 生成类型文件：成功完成 6 个项目
ℹ 输出目录: .tmp-e2e/docs-demo/out/pet
✔ 代码生成成功完成！(共 1 个服务，耗时: 149ms)
```

## 步骤 4: 查看生成的代码

以下是本仓库真实多服务配置（4 个服务）生成的 `src/service/` 目录结构：

![多服务输出结构](../assets/gen-structure.png)

每个接口在所属 tag 目录（中文分组名自动转拼音）的 `index.ts` 中生成三件套：`XxxRequestType` 请求类型、`XxxResultType` 响应类型、`xxxFunc` 请求函数：

![生成的接口文件](../assets/gen-interface.png)

要点：

- **path 参数**只用于 URL 插值（`url: \`/permissions/${params.menuId}/buttons\``）；
- **query 参数**进入 Axios `params`，**请求体**进入 Axios `data`，按来源自动分离；
- 每个函数都有可选的第二参数 `options`，可透传 `timeout`、`signal`、`onUploadProgress`、`headers`、`baseURL` 等 Axios 配置（`url`/`method`/`data`/`params` 由生成器固定写入，不可覆盖）。

`components/schemas` 中的类型生成在 `types/` 目录，一个类型一个文件：

![生成的类型文件](../assets/gen-types.png)

共享的 `request.ts` 生成在 `baseOutputDir` 层级，仅首次生成、之后不再覆盖，内置 `customizeAxios` 扩展点：

![生成的 request.ts](../assets/gen-request.png)

## 步骤 5: 在项目中使用

```typescript
import { getPermissionsTreeFunc } from '@/service/rbac/QuanXianGuanLi';
import type { GetPermissionsTreeResultType } from '@/service/rbac/QuanXianGuanLi';

// GET（无参数接口也要求传入空对象，保持签名一致）
const tree: GetPermissionsTreeResultType = await getPermissionsTreeFunc({});

// 带参数的接口：参数结构与 RequestType 一一对应
import { getPermissionsSearchFunc } from '@/service/rbac/QuanXianGuanLi';
const result = await getPermissionsSearchFunc({ keyword: 'user', limit: '10' });

// 透传单次请求级 Axios 配置
await getPermissionsTreeFunc({}, { timeout: 10_000 });
```

### React 示例

```tsx
import { useEffect, useState } from 'react';
import { getPermissionsTreeFunc } from '@/service/rbac/QuanXuanGuanLi';
import type { PermissionTreeResponseDto } from '@/service/rbac/types';

function PermissionTree() {
  const [tree, setTree] = useState<PermissionTreeResponseDto[] | null>(null);

  useEffect(() => {
    getPermissionsTreeFunc({}).then((res) => setTree(res.data));
  }, []);

  if (!tree) return <div>加载中...</div>;
  return (
    <ul>
      {tree.map((node) => (
        <li key={node.id}>{node.name}</li>
      ))}
    </ul>
  );
}
```

> 需要请求缓存、自动重新请求等能力时，可开启 [`generateHooks`](../guides/config-reference.md#hooks-生成) 直接生成 React Query / SWR / ahooks 风格的 Hook。

## 实用技巧

### 1. 使用脚本

在 `package.json` 中添加：

```json
{
  "scripts": {
    "api:gen": "api-power generate",
    "api:init": "api-power init",
    "api:debug": "api-power debug",
    "api:watch": "api-power generate --watch"
  }
}
```

### 2. 版本控制

将 `api-power.config.ts` 加入版本控制，生成目录按团队约定决定是否提交：

```gitignore
# 如不提交生成产物
src/service/
```

### 3. 生成后做类型检查

```bash
npx api-power verify
# 类型检查通过：N 个生成文件，0 个错误
```

`verify` 命令对配置中所有服务的产物目录运行 TypeScript `noEmit` 类型检查，弥补消费方 `tsconfig` 通常把生成目录排除在检查之外的盲区。

## 下一步

- [配置指南](../guides/configuration.md) - 配置文件的组织方式
- [配置参考](../guides/config-reference.md) - 全部字段的类型与默认值
- [CLI 命令参考](../guides/cli.md) - 所有可用命令
- [使用示例](../guides/examples.md) - TypeScript / Zod / Hooks / 多服务各模式的真实产物

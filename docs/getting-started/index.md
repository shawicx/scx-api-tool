# 快速开始

欢迎使用 `@scx/api-tool`！这是一个 CLI 工具，帮助你从 OpenAPI 3.0 / Swagger 和 Apifox 的接口定义自动生成 TypeScript/JavaScript 的类型与请求函数代码。

## 🚀 5 分钟上手

### 1. 安装工具

```bash
# 项目本地安装（推荐）
npm install @scxfe/api-tool --save-dev

# 或者全局安装
npm install -g @scxfe/api-tool
```

### 2. 初始化配置

```bash
npx api-power init
```

这将创建一个 `api-power.config.ts` 配置文件。

### 3. 配置 API 源

编辑配置文件，设置你的 API 平台信息：

```typescript
// api-power.config.ts
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  // 公共根输出目录
  baseOutputDir: 'src/service',
  // 类型生成格式：'typescript' | 'zod'
  typesFormat: 'typescript',

  // 服务声明（单服务：数组长度为 1）
  services: [
    {
      name: 'main',
      folder: '.', // 输出直接落在 baseOutputDir
      source: 'https://api.apifox.com/v1/projects/YOUR_PROJECT_ID/export-openapi',
      token: 'APS-YourAccessTokenHere',
    },
  ],
});
```

### 4. 生成代码

```bash
npx api-power generate
# 或简写
npx api-power gen
```

工具将自动生成：

- TypeScript 类型定义（接口三件套：请求类型 / 响应类型 / 请求函数）
- 共享的 `request.ts` 请求文件
- 按 API 分组（tag）组织的目录结构与入口 barrel

### 5. 监视模式

如果希望在配置文件更改时自动重新生成代码：

```bash
npx api-power generate --watch
# 或简写
npx api-power gen -w
```

## 📁 生成的文件结构

以仓库自身的真实多服务配置（4 个服务）为例：

![多服务输出结构](../assets/gen-structure.png)

单服务（`folder: '.'`）时输出直接落在 `baseOutputDir`：

```
src/service/
├── request.ts              # 共享请求文件（仅首次生成）
├── index.ts                # 主入口（barrel）
├── QuanXianGuanLi/         # 分组目录（中文 tag 自动转拼音）
│   └── index.ts            # 接口三件套 + 请求函数
└── types/                  # 类型定义目录
    ├── RoleResponseDto.ts
    └── index.ts
```

`typesFormat: 'zod'` 时类型部分改为 Zod Schema（`schemas/` 目录 + 各分组的 `schema.ts`），API 请求函数照常生成。

## 🛠️ CLI 命令

| 命令                  | 别名  | 说明                                      |
| --------------------- | ----- | ----------------------------------------- |
| `api-power init`      | —     | 初始化配置文件                            |
| `api-power generate`  | `gen` | 生成代码（核心命令）                      |
| `api-power verify`    | —     | 对生成产物运行 TypeScript 类型检查        |
| `api-power debug`     | —     | 诊断模式：检查配置与 API 定义，不生成文件 |
| `api-power visualize` | `viz` | 启动可视化配置服务器                      |

> 注意：`api-power` 没有默认子命令，直接运行只会显示帮助；生成代码必须使用 `generate`（或 `gen`）。

完整命令与选项见 [CLI 命令参考](../guides/cli.md)。

## ⚙️ 常用配置选项

| 选项            | 类型                           | 默认值          | 描述                                           |
| --------------- | ------------------------------ | --------------- | ---------------------------------------------- |
| `baseOutputDir` | `string`                       | `'src/service'` | 公共根输出目录                                 |
| `services`      | `ServiceConfig[]`              | —（必填）       | 服务声明数组（name / source / token / folder） |
| `generateApi`   | `boolean`                      | `true`          | 是否生成 API 请求方法                          |
| `generateTypes` | `boolean`                      | `true`          | 是否生成类型定义                               |
| `typesFormat`   | `'typescript' \| 'zod'`        | `'typescript'`  | 类型生成格式                                   |
| `target`        | `'javascript' \| 'typescript'` | `'typescript'`  | 目标语言                                       |

> 全部字段（含请求、Hooks、命名策略、钩子等）的类型、默认值与校验规则，统一见[配置参考](../guides/config-reference.md)。

## 🔥 支持的平台

| 平台                | 支持状态 | 说明                                         |
| ------------------- | -------- | -------------------------------------------- |
| Apifox              | ✅       | 需要 OpenAPI 导出地址与访问令牌（`APS-xxx`） |
| Swagger/OpenAPI 3.0 | ✅       | 任何返回 OpenAPI JSON 的 URL，无需 token     |

## 💡 常见用例

```typescript
import { getPermissionsTreeFunc } from '@/service/rbac/QuanXianGuanLi';
import type { GetPermissionsTreeResultType } from '@/service/rbac/QuanXianGuanLi';

// 参数与返回值都有完整的类型约束
const tree: GetPermissionsTreeResultType = await getPermissionsTreeFunc({});
```

## 🎯 下一步

- [安装指南](./installation) - 详细的安装说明
- [快速开始示例](./quick-start) - 完整的实战教程（含真实产物截图）
- [配置指南](../guides/configuration) - 配置文件的组织方式
- [配置参考](../guides/config-reference) - 全部配置字段
- [CLI 命令参考](../guides/cli) - 所有命令的详细说明

# @scx/api-tool

一个强大的 Node.js CLI 工具，专门用于从各种 API 管理平台（如 Swagger/OpenAPI 3.0、Apifox）自动生成 TypeScript/JavaScript 代码。

## ✨ 主要特性

- 🚀 **多平台支持**: 支持 Swagger、Apifox 等主流 API 管理平台
- 📝 **类型生成**: 自动生成完整的 TypeScript 类型定义
- 🔧 **代码生成**: 自动生成 HTTP 请求函数和接口代码
- 🎨 **模板定制**: 支持自定义代码生成模板
- ⚙️ **配置灵活**: 丰富的配置选项和钩子函数
- 📦 **多格式输出**: 支持 TypeScript 和 JavaScript

## 🚀 快速开始

### 安装

```bash
# 全局安装（推荐）
pnpm install -g @scxfe/api-tool

# 或项目本地安装
pnpm install --save-dev @scxfe/api-tool

# 或使用 npx
npx @scxfe/api-tool
```

### 基本使用

```bash
# 1. 初始化配置文件
npx api-power init

# 2. 编辑配置文件 api-power.config.ts / api-power.config.js

# 3. 生成代码
npx api-power
```

## features

[x] 请求方法与数据类型分离
[x]

## 📖 文档

- [CLI 工具介绍](./docs/cli/introduction.md) - 工具介绍和安装说明
- [CLI 使用说明](./docs/cli/usage.md) - 详细的使用方法和命令说明
- [配置说明](./docs/cli/configuration.md) - 完整的配置项说明和示例

## 🔧 配置示例

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig([
  {
    serverUrl: 'https://api.apifox.com',
    serverType: 'apifox',
    apifoxProjectId: 'your-project-id',
    typesOnly: false,
    target: 'typescript',
    outputDir: 'src/service',
    projects: [
      {
        token: 'your-project-token',
        categories: [{ id: 0 }],
      },
    ],
  },
]);
```

## 📁 项目结构

```
project/
├── api-power.config.ts          # 配置文件
├── src/
│   └── service/               # 生成的代码目录
│       ├── types.ts           # 类型定义
│       ├── request.ts         # 请求函数
│       └── index.ts           # 导出文件
└── package.json
```

## 🛠️ 开发

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm run docs:dev

# 构建文档
pnpm run docs:build

# 预览构建结果
pnpm run docs:preview
```

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 联系方式

- 作者: shawicx
- 邮箱: d35f3153@proton.me
- GitHub: [@shawicx](https://github.com/shawicx)

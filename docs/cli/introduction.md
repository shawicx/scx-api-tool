# CLI 工具介绍

## 什么是 @scx/api-tool

`@scx/api-tool` 是一个强大的 Node.js CLI 工具，专门用于从各种 API 管理平台（如 Swagger/OpenAPI 3.0、Apifox）自动生成 TypeScript/JavaScript 代码。

## 主要特性

- 🚀 **多平台支持**: 支持 Swagger/OpenAPI 3.0、Apifox 等主流 API 管理平台
- 📝 **类型生成**: 自动生成完整的 TypeScript 类型定义
- 🔧 **代码生成**: 自动生成 HTTP 请求函数和接口代码
- 🎨 **模板定制**: 支持自定义代码生成模板
- ⚙️ **配置灵活**: 丰富的配置选项和钩子函数
- 📦 **多格式输出**: 支持 TypeScript 和 JavaScript

## 安装

### 全局安装

```bash
npm install -g @scxfe/api-tool
```

### 项目本地安装

```bash
npm install --save-dev @scxfe/api-tool
```

### 使用 npx（推荐）

```bash
npx @scxfe/api-tool
```

## 快速开始

### 1. 初始化配置

```bash
npx apiPower init
```

这将创建一个 `apiPower.config.ts` 配置文件，包含所有必要的配置选项。

### 2. 配置 API 平台

编辑 `apiPower.config.ts` 文件，配置你的 API 平台信息：

```typescript
export default defineConfig([
  {
    serverUrl: 'https://api.apifox.com',
    serverType: 'apifox',
    apifoxProjectId: 'your-project-id',
    typesOnly: false,
    target: 'typescript',
    outputDir: 'src/service',
    // ... 其他配置
  },
]);
```

### 3. 生成代码

```bash
npx apiPower
```

工具将自动从配置的 API 平台获取接口定义，并生成相应的代码文件。

## 支持的命令

- `apiPower init` - 初始化配置文件
- `apiPower` - 生成代码（默认命令）
- `apiPower help` - 显示帮助信息

## 工作流程

1. **配置**: 通过 `apiPower init` 创建配置文件
2. **连接**: 连接到指定的 API 管理平台
3. **获取**: 自动获取接口定义和数据结构
4. **生成**: 根据配置生成 TypeScript 类型和请求函数
5. **输出**: 将生成的代码写入指定目录

## 适用场景

- 🏗️ **前端项目**: 为 React、Vue、Angular 等项目生成 API 类型
- 📱 **移动端**: 为 React Native、Flutter 等生成类型定义
- 🔧 **工具库**: 为 Node.js 工具库生成 API 客户端
- 📊 **数据接口**: 为数据分析项目生成类型安全的 API 调用

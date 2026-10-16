---
layout: home
hero:
  name: '@scx/api-tool'
  text: 'API 代码生成工具'
  tagline: 从 Swagger/OpenAPI 3.0 和 Apifox 平台自动生成类型安全的 TypeScript/JavaScript 代码
  actions:
    - theme: brand
      text: 快速开始
      link: /getting-started/
    - theme: alt
      text: 安装指南
      link: /getting-started/installation

features:
  - title: 多平台支持
    details: 支持 Swagger/OpenAPI 3.0 与 Apifox，URL 自动识别数据源类型
    icon: 🚀
  - title: 类型安全
    details: 支持 TypeScript 与 Zod 两种模式，请求参数、响应数据全量类型推导
    icon: 🛡️
  - title: 多服务配置
    details: 一个配置声明多个后端服务，各自独立输出目录，共享 request 基础设施
    icon: 🧩
  - title: Hooks 生成
    details: 在请求函数之上生成 react-query / vue-query / swr / ahooks 风格的 Hook
    icon: ⚛️
  - title: 产物可信
    details: verify 命令对生成产物运行 tsc 类型检查，E2E 测试验证生成结果本身
    icon: ✅
  - title: 灵活扩展
    details: 自定义命名策略、transformPath、生命周期钩子、customizeAxios 请求扩展点
    icon: 🔧
---

## 生成预览

以下截图均为真实生成产物（多服务示例来自仓库自身的 `src/service/`）。

### 多服务输出结构

![多服务输出结构](./assets/gen-structure.png)

### 接口文件（请求类型 + 响应类型 + 请求函数）

![生成的接口文件](./assets/gen-interface.png)

### 类型定义文件

![生成的类型文件](./assets/gen-types.png)

### 共享请求文件 request.ts

![生成的 request.ts](./assets/gen-request.png)

### Zod 模式（运行时验证）

![生成的类型 Schema](./assets/gen-zod-type-schema.png)

### Hooks 生成（react-query）

![生成的 hooks.ts](./assets/gen-hooks.png)

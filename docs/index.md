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
    details: 支持 Swagger/OpenAPI 3.0 和 Apifox
    icon: 🚀
  - title: 类型安全
    details: 支持 TypeScript 和 Zod 两种模式
    icon: 🛡️
  - title: 灵活输出
    details: 支持自定义输出目录、代码风格、请求函数名、命名策略等
    icon: 🔧
  - title: 钩子系统
    details: 支持在代码生成过程的不同阶段执行自定义操作
    icon: ⚙️
---

## 生成预览

1. 标准生成

![生成预览](./assets/api-tool-types.png)

2. 无注释生成

![生成预览](./assets/api-tool-ncmment.png)

3. 只生成Api请求方法

![生成预览](./assets/api-tool-apiOnly.png)

3. 只生成接口请求参数与返回数据类型

![生成预览](./assets/api-tool-typesOnly.png)

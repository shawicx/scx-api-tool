---
toc: menu
order: 1
---

# 介绍

`YApi to TypeScript`（简称 `ytt`） 是一个代码生成工具，其可根据 [YApi](https://github.com/YMFE/yapi) 或 [Swagger](https://swagger.io/) 的接口定义生成 TypeScript 或 JavaScript 的接口类型及其请求函数代码。

## 特性

- 支持多服务器、多项目、多分类
- 支持预处理接口信息
- 可自定义类型或函数名称
- 完整的注释
- 支持生成 React Hooks 的请求代码
- 支持参数路径
- 支持上传文件
- 支持生成 JavaScript 代码
- 支持 Swagger

## 环境要求

首先得有 [Node.js](https://nodejs.org/en/)，并确保其版本 `>= 10.19.0`。同时：

- 对于基于 YApi 的项目，要求 YApi 的版本必须 `>= 1.5.12`。
- 对于基于 Swagger 的项目，仅支持 `Swagger 2` 和 `OpenAPI 3`。

## 安装

选择你常用的包管理器将 `cis-api-tool` 加入项目依赖即可：

```bash
# npm
npm i cis-api-tool

# yarn
yarn add cis-api-tool

# pnpm
pnpm add cis-api-tool
```

## 许可

[MIT](https://github.com/x011223/cis-api-tool.git/blob/master/LICENSE) © [x011223](https://github.com/x011223)

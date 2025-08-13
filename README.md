<!--
 * @Author: shawicx d35f3153@proton.me
 * @Date: 2025-08-07 22:13:56
 * @LastEditors: shawicx d35f3153@proton.me
 * @LastEditTime: 2025-08-09 00:30:04
 * @Description:
-->

# scx-api-tool

`scx-api-tool` 是一个代码生成工具，其可根据 [YApi](https://github.com/YMFE/yapi) 、[Swagger](https://swagger.io/) 或者 [Apifox](https://apifox.com) 的接口定义生成 TypeScript 或 JavaScript 的接口类型及其请求函数代码。

此仓库来源于 yapi-to-typescript，经过了功能改造、文件结构调整、ts以及eslint报错解决等工作，形成了一个新的分支。在此特别感谢原作者的工作与付出。

## 与原版的区别

1. 解决了项目TS报错，支持 TS 4.9.5
2. 移除了 `vtils` 、`haoma`依赖
3. serviceType 支持 apifox 项目。有两种配置方式
   1. 可写死 `https://api.apifox.com` ，然后配置 `apifoxProjectId`
   2. 使用全路径，`https://api.apifox.com/v1/projects/{apifoxProjectId}/export-openapi` ，此时可以不设置 `apifoxProjectId`，代码会从URL中自动提取。

4. 采用按模块生成 request 方法以及 interface 类型，随后在 `index.ts` 中导出，因此 `outputFilePath` 不再起作用，目前生成目录写死的 `src/service` ，后续改成配置。

## 许可

[MIT](https://github.com/x011223/cis-api-tool.git/blob/master/LICENSE) © [x011223](https://github.com/x011223)

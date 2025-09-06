import { defineConfig } from '@scxfe/api-tool';

export default defineConfig([
  {
    // 方式1：使用基础URL + apifoxProjectId配置
    serverUrl: 'https://api.apifox.com',
    serverType: 'apifox',
    apifoxProjectId: '6997172', // 新增：Apifox项目ID配置
    // 方式2：也可以直接在serverUrl中包含项目ID（向后兼容）
    // serverUrl: 'https://api.apifox.com/v1/projects/6720131/export-openapi',
    // serverType: 'apifox',
    // 此时可以不设置apifoxProjectId，代码会自动从URL中提取
    typesOnly: false,
    target: 'javascript',
    // 统一去掉接口路径的某部分，例如 '/api'
    pathPrefix: '',
    // 输出目录配置
    outputDir: 'src/service',
    // 代码缩进配置
    indentSize: 2,
    reactHooks: {
      enabled: false,
    },
    prodEnvName: 'production',
    requestFunctionFilePath: 'src/service/request.ts',
    // 移除 dataKey 配置，让工具直接使用完整的响应数据
    // dataKey: 'data',
    projects: [
      {
        token: 'APS-UqOdFQhnaBMU2A2q9EbuXUuDf3aqS93t', // Swagger项目不需要token
        categories: [
          {
            id: 0,
            // getRequestFunctionName(interfaceInfo, changeCase) {
            //   以接口全路径生成请求函数名
            //   return changeCase.camelCase(interfaceInfo.path)
            //   若生成的请求函数名存在语法关键词报错、或想通过某个关键词触发 IDE 自动引入提示，可考虑加前缀，如:
            //   return changeCase.camelCase(`api_${interfaceInfo.path}`)
            //   若生成的请求函数名有重复报错，可考虑将接口请求方式纳入生成条件，如:
            //   return changeCase.camelCase(`${interfaceInfo.method}_${interfaceInfo.path}`)
            // },
          },
        ],
      },
    ],
  },
]);

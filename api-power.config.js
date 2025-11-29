import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
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
  dataKey: 'data',
  project: {
    token: 'APS-bEl8yPD58wfRzsXXkx4psEekqm4k2YhD',
    categories: [
      {
        id: 0,
      },
    ],
  },
});

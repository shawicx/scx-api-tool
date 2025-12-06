import { defineConfig, ServerType, RequestMethodStyle } from '@scxfe/api-tool';

export default defineConfig({
  serverUrl: 'https://api.apifox.com',
  serverType: ServerType.Apifox,
  apifoxProjectId: '6997172',
  typesOnly: false,
  target: 'javascript',
  // comment: false,
  requestMethodStyle: RequestMethodStyle.config,
  pathPrefix: '',
  outputDir: 'src/service',
  indentSize: 2,
  prodEnvName: 'production',
  requestFunctionFilePath: 'src/service/request.ts',
  project: {
    token: 'APS-bEl8yPD58wfRzsXXkx4psEekqm4k2YhD',
    categories: [
      {
        id: 0,
      },
    ],
  },
});

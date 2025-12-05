export const DEFAULT_CONFIG = `import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  serverUrl: 'https://api.apifox.com',
  serverType: 'apifox',
  apifoxProjectId: '6997172',
  typesOnly: false,
  target: 'javascript',
  pathPrefix: '',
  outputDir: 'src/service',
  indentSize: 2,
  comment: true,
  prodEnvName: 'production',
  requestFunctionFilePath: 'src/service/request.ts',
  project: {
    token: 'APS-UqOdFQhnaBMU2A2q9EbuXUuDf3aqS93t',
    categories: [
      {
        id: 0,
      },
    ],
  },
});
`;

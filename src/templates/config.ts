export const configTemplate = `import { defineConfig } from '@scxfe/api-tool';

export default defineConfig([
  {
    serverUrl: '{{serverUrl}}',
    serverType: '{{serverType}}',
    {{#if apifoxProjectId}}
    apifoxProjectId: '{{apifoxProjectId}}',
    {{/if}}
    typesOnly: {{typesOnly}},
    target: '{{target}}',
    pathPrefix: '{{pathPrefix}}',
    outputDir: '{{outputDir}}',
    indentSize: {{indentSize}},
    reactHooks: {
      enabled: {{reactHooksEnabled}},
    },
    prodEnvName: '{{prodEnvName}}',
    requestFunctionFilePath: '{{requestFunctionFilePath}}',
    projects: [
      {
        {{#if token}}
        token: '{{token}}',
        {{/if}}
        categories: [
          {
            id: {{categoryId}},
          },
        ],
      },
    ],
  },
]);
`;

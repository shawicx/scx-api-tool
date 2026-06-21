import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  source: 'https://api.apifox.com/v1/projects/6997172/export-openapi',
  token: 'APS-bEl8yPD58wfRzsXXkx4psEekqm4k2YhD',
  typesFormat: 'typescript',
  concurrency: 5,
  // pathPrefix: 'api',
  hooks: {
    // beforeGenerate: () => {
    //   console.log('Generating start');
    // },
    // beforeWriteFile: (filePath, content) => {
    //   console.log('Generating file', filePath);
    //   return content;
    // },
    afterWriteFile: (filePath) => {
      console.log('Generated file:', filePath);
    },
    afterGenerate: () => {},
  },
});

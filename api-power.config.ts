import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  // source: 'https://api.apifox.com/v1/projects/6997172/export-openapi',
  source: 'https://api.apifox.com/v1/projects/8601324/export-openapi',
  token: 'APS-bEl8yPD58wfRzsXXkx4psEekqm4k2YhD',
  typesFormat: 'zod',
  // transformPath 已改为函数形式（0.6.0 起）
  // 默认恒等函数：不修改路径（运行时 baseURL 已硬编码 /api）
  // 如需添加前缀：transformPath: (p) => '/api' + p,
  // 如需去除前缀：transformPath: (p) => p.startsWith('/api') ? p.slice(4) : p,
  concurrency: 5,
  hooks: {
    // beforeGenerate: () => {
    //   console.log('Generating start');
    // },
    // beforeWriteFile: (filePath, content) => {
    //   console.log('Generating file', filePath);
    //   return content;
    // },
    // afterWriteFile: (filePath) => {
    //   console.log('Generated file:', filePath);
    // },
    // afterGenerate: () => {},
  },
});

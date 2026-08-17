import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  // 公共根输出目录（原 outputDir）
  baseOutputDir: 'src/service',
  typesFormat: 'typescript',
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

  // 服务列表（单服务场景即数组长度为 1）
  services: [
    {
      // 输出到 src/service（folder='.' 表示直接使用 baseOutputDir 自身）
      name: 'apifox-demo',
      folder: 'backend',
      // source: 'https://api.apifox.com/v1/projects/6997172/export-openapi',
      source: 'https://api.apifox.com/v1/projects/8601324/export-openapi',
      // source: 'https://api.apifox.com/v1/projects/8629864/export-openapi',
      token: 'APS-bEl8yPD58wfRzsXXkx4psEekqm4k2YhD',
    },
  ],
});

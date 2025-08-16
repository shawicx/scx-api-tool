import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  srcDir: 'docs',

  title: '@scx/api-tool',
  description: 'API 管理工具',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '首页', link: '/' },
      { text: 'CLI 工具', link: '/cli/introduction' },
    ],

    sidebar: [
      {
        text: 'CLI 工具',
        items: [
          { text: '工具介绍', link: '/cli/introduction' },
          { text: '使用说明', link: '/cli/usage' },
          { text: '配置说明', link: '/cli/configuration' },
        ],
      },
    ],

    socialLinks: [{ icon: 'github', link: 'https://github.com/shawicx/scx-api-tool' }],
  },
});

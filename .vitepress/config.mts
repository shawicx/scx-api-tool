import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  srcDir: 'docs',
  outDir: '.vitepress/dist',
  // 站点配置
  title: '@scx/api-tool',
  description:
    '根据 swagger/yapi/apifox 的接口定义生成 TypeScript/JavaScript 的接口类型及其请求函数代码',
  // 语言设置
  lang: 'zh-CN',
  // 头部配置
  head: [
    [
      'link',
      {
        rel: 'icon',
        href: '/favicon/favicon.ico',
      },
    ],
    ['meta', { name: 'theme-color', content: '#3c8772' }],
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }],
  ],
  // 主题配置
  themeConfig: {
    // 导航栏
    nav: [
      { text: '首页', link: '/' },
      { text: 'CLI 工具', link: '/cli/introduction' },
      { text: 'Git 配置', link: '/git-configuration' },
      { text: 'GitHub', link: 'https://github.com/shawicx/scx-api-tool' },
    ],

    // 侧边栏
    sidebar: [
      {
        text: 'CLI 工具',
        items: [
          { text: '工具介绍', link: '/cli/introduction' },
          { text: '使用说明', link: '/cli/usage' },
          { text: '配置说明', link: '/cli/configuration' },
        ],
      },
      {
        text: 'Git 配置',
        items: [
          { text: '配置说明', link: '/git-configuration' },
          { text: '设置总结', link: '/git-setup-summary' },
        ],
      },
      {
        text: '部署指南',
        items: [{ text: 'GitHub Pages 部署', link: '/github-pages-deployment' }],
      },
    ],

    // 社交链接
    socialLinks: [{ icon: 'github', link: 'https://github.com/shawicx/scx-api-tool' }],

    // 搜索
    search: {
      provider: 'local',
      options: {
        locales: {
          zh: {
            translations: {
              button: {
                buttonText: '搜索文档',
                buttonAriaLabel: '搜索文档',
              },
              modal: {
                noResultsText: '无法找到相关结果',
                resetButtonTitle: '清除查询条件',
                footer: {
                  selectText: '选择',
                  navigateText: '切换',
                },
              },
            },
          },
        },
      },
    },

    // 页脚
    footer: {
      message: '基于 MIT 许可证发布',
      copyright: 'Copyright © 2024-present shawicx',
    },

    // 编辑链接
    editLink: {
      pattern: 'https://github.com/shawicx/scx-api-tool/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页',
    },

    // 最后更新时间
    lastUpdated: {
      text: '最后更新时间',
      formatOptions: {
        dateStyle: 'full',
        timeStyle: 'medium',
      },
    },

    // 大纲
    outline: {
      level: [2, 3],
      label: '目录',
    },
  },
});

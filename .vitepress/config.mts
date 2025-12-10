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
    ['meta', { name: 'theme-color', content: '#1996ff' }],
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }],
  ],
  // 主题配置
  themeConfig: {
    logo: '/favicon/favicon-32x32.png',
    // 导航栏
    nav: [
      { text: '首页', link: '/' },
      { text: '快速开始', link: '/getting-started/' },
      { text: '使用指南', link: '/guides/configuration' },
      // { text: 'API 参考', link: '/api/cli' },
      { text: '开发指南', link: '/development/contributing' },
    ],

    // 侧边栏
    sidebar: [
      {
        text: '快速开始',
        items: [
          { text: '快速开始', link: '/getting-started/' },
          { text: '安装指南', link: '/getting-started/installation' },
          { text: '快速开始示例', link: '/getting-started/quick-start' },
        ],
      },
      {
        text: '使用指南',
        items: [
          { text: 'CLI 命令', link: '/guides/cli' },
          { text: '配置指南', link: '/guides/configuration' },
          { text: '模板自定义', link: '/guides/templates' },
          { text: '高级用法', link: '/guides/advanced' },
        ],
      },
      // {
      //   text: 'API 参考',
      //   items: [
      //     { text: 'CLI 命令参考', link: '/api/cli' },
      //     { text: '配置文件 API', link: '/api/configuration' },
      //   ],
      // },
      {
        text: '开发指南',
        items: [
          { text: '贡献指南', link: '/development/contributing' },
          { text: '架构说明', link: '/development/architecture' },
          { text: '变更日志', link: '/changelog' },
        ],
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

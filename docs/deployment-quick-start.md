# 🚀 快速部署指南

## 📋 一键部署到 GitHub Pages

本项目已配置完整的自动部署流程，只需几个简单步骤即可将文档部署到 GitHub Pages。

## ⚡ 快速开始

### 1. 推送代码

```bash
# 添加所有文件
git add .

# 提交更改
git commit -m "feat: 添加 GitHub Pages 自动部署配置"

# 推送到 GitHub
git push origin main
```

### 2. 启用 GitHub Pages

在 GitHub 仓库页面：

1. 点击 **Settings** 标签
2. 在左侧菜单中找到 **Pages**
3. 在 **Source** 部分选择 **GitHub Actions**
4. 保存设置

### 3. 配置 Actions 权限

1. 在 **Settings** → **Actions** → **General**
2. 在 **Workflow permissions** 中选择 **Read and write permissions**
3. 勾选 **Allow GitHub Actions to create and approve pull requests**
4. 保存设置

## 🔍 验证部署

### 检查 Actions 状态

1. 在仓库页面点击 **Actions** 标签
2. 查看 **Deploy to GitHub Pages** 工作流状态
3. 等待构建和部署完成

### 访问你的站点

部署成功后，你的文档将在以下地址可用：

```
https://shawicx.github.io/scx-api-tool
```

## 🛠️ 本地测试

在推送代码前，建议先在本地测试：

```bash
# 检查部署配置
./scripts/check-deployment.sh

# 启动开发服务器
npm run docs:dev

# 构建文档
npm run docs:build

# 预览构建结果
npm run docs:preview
```

## 📊 部署状态监控

### 成功部署的特征

- ✅ Actions 工作流显示绿色勾号
- ✅ Pages 设置显示部署状态
- ✅ 可以访问你的文档站点

### 常见问题排查

#### 构建失败

- 检查 Node.js 版本（需要 18+）
- 确认所有依赖已安装
- 查看 Actions 日志中的错误信息

#### 部署失败

- 确认 Pages 设置正确
- 检查 Actions 权限配置
- 验证分支名称（默认是 `main`）

## 🔄 自动更新

配置完成后，每次推送代码到 `main` 分支时：

1. **自动触发** GitHub Actions
2. **自动构建** VitePress 文档
3. **自动部署** 到 GitHub Pages
4. **自动更新** 你的文档站点

## 📱 移动端支持

你的文档站点已包含：

- 📱 响应式设计
- 🖱️ 触摸友好的导航
- 🔍 移动端优化的搜索
- ⚡ 快速的加载速度

## 🌐 自定义域名

如需使用自定义域名：

1. 在 **Settings** → **Pages** 中设置
2. 添加 CNAME 记录到你的域名提供商
3. 等待 DNS 传播完成

## 📈 性能优化

已配置的性能优化：

- 🚀 代码分割和懒加载
- 💾 智能缓存策略
- 🖼️ 图片和字体优化
- 📦 静态资源压缩

## 🔒 安全配置

内置的安全特性：

- 🛡️ HTTPS 强制启用
- 🔐 内容安全策略
- 🚫 XSS 防护
- 🔒 安全的依赖管理

## 📞 获取帮助

### 官方资源

- [GitHub Pages 文档](https://pages.github.com/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [VitePress 文档](https://vitepress.dev/)

### 社区支持

- [GitHub Community](https://github.com/orgs/community/discussions)
- [VitePress Discussions](https://github.com/vuejs/vitepress/discussions)

### 问题报告

遇到问题？请在 [GitHub Issues](https://github.com/shawicx/scx-api-tool/issues) 中报告。

---

🎉 **恭喜！你的文档即将自动部署到 GitHub Pages！**

推送代码后，只需等待几分钟，你的专业文档站点就会上线。

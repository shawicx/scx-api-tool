# 🚀 GitHub Pages 自动部署配置完成

## 📋 配置概览

本项目已配置完整的 GitHub Pages 自动部署流程，包括：

- ✅ GitHub Actions 工作流
- ✅ VitePress 文档站点配置
- ✅ 自动构建和部署
- ✅ Pull Request 预览支持

## 🎯 快速开始

### 1. 推送代码

```bash
git add .
git commit -m "feat: 添加 GitHub Pages 自动部署配置"
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

## 🔄 自动部署流程

配置完成后，每次推送代码到 `main` 分支时：

1. **自动触发** GitHub Actions
2. **自动构建** VitePress 文档
3. **自动部署** 到 GitHub Pages
4. **自动更新** 你的文档站点

## 📍 访问地址

部署成功后，你的文档将在以下地址可用：

```
https://shawicx.github.io/scx-api-tool
```

## 📁 配置文件说明

### GitHub Actions 工作流

- **`.github/workflows/deploy.yml`** - 主要部署工作流
- **`.github/workflows/preview-simple.yml`** - Pull Request 预览工作流

### VitePress 配置

- **`.vitepress/config.mts`** - 站点配置
- **`docs/`** - 文档内容目录

### 部署脚本

- **`scripts/check-deployment.sh`** - 部署配置检查脚本

## 🛠️ 本地开发

```bash
# 启动开发服务器
npm run docs:dev

# 构建文档
npm run docs:build

# 预览构建结果
npm run docs:preview

# 检查部署配置
./scripts/check-deployment.sh
```

## 📊 监控部署状态

1. 在 GitHub 仓库页面点击 **Actions** 标签
2. 查看 **Deploy to GitHub Pages** 工作流状态
3. 等待构建和部署完成

## 🔍 故障排除

### 构建失败

- 检查 Node.js 版本（需要 18+）
- 确认所有依赖已安装
- 查看 Actions 日志中的错误信息

### 部署失败

- 确认 Pages 设置正确
- 检查 Actions 权限配置
- 验证分支名称（默认是 `main`）

## 📚 详细文档

- [GitHub Pages 部署指南](docs/github-pages-deployment.md)
- [快速部署指南](docs/deployment-quick-start.md)
- [Git 配置说明](docs/git-configuration.md)

## 🎉 完成！

配置完成后，你的文档将自动部署到 GitHub Pages！

---

**注意**: 首次部署可能需要几分钟时间，请耐心等待。

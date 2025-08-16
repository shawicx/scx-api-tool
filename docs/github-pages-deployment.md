# GitHub Pages 部署指南

## 🚀 自动部署配置

本项目已配置了完整的 GitHub Pages 自动部署流程。当你推送代码到 `main` 分支时，GitHub Actions 会自动构建文档并部署到 GitHub Pages。

## 📁 配置文件

### 1. GitHub Actions 工作流

- **`.github/workflows/deploy.yml`** - 主要部署工作流
- **`.github/workflows/preview-simple.yml`** - Pull Request 预览工作流

### 2. GitHub Pages 配置

- **`.github/pages.yml`** - Pages 配置文件
- **`.vitepress/config.mts`** - VitePress 站点配置

## 🔧 需要配置的内容

### 1. 启用 GitHub Pages

在 GitHub 仓库设置中：

1. 进入 **Settings** → **Pages**
2. 在 **Source** 部分选择 **GitHub Actions**
3. 确保仓库是公开的（免费账户要求）

### 2. 设置仓库权限

确保 GitHub Actions 有足够权限：

1. 进入 **Settings** → **Actions** → **General**
2. 在 **Workflow permissions** 中选择 **Read and write permissions**
3. 勾选 **Allow GitHub Actions to create and approve pull requests**

### 3. 配置分支保护（推荐）

1. 进入 **Settings** → **Branches**
2. 添加 `main` 分支保护规则
3. 勾选 **Require a pull request before merging**
4. 勾选 **Require status checks to pass before merging**

## 📋 部署流程

### 自动部署

1. **推送代码**到 `main` 分支
2. **GitHub Actions 触发**构建流程
3. **构建文档**使用 VitePress
4. **部署到 GitHub Pages**
5. **访问站点**：`https://yourusername.github.io/scx-api-tool`

### Pull Request 预览

1. **创建 Pull Request**
2. **自动构建**文档
3. **检查构建状态**
4. **合并到 main 分支**
5. **自动部署**到生产环境

## 🛠️ 本地开发

### 开发服务器

```bash
# 启动开发服务器
npm run docs:dev

# 构建文档
npm run docs:build

# 预览构建结果
npm run docs:preview
```

### 构建检查

```bash
# 检查构建是否成功
npm run docs:build

# 检查构建输出目录
ls -la docs/.vitepress/dist
```

## 📊 部署状态检查

### 1. Actions 标签页

在 GitHub 仓库页面查看 **Actions** 标签页，监控部署状态。

### 2. 部署日志

如果部署失败，查看 Actions 日志：

- 构建错误
- 依赖安装问题
- 权限问题

### 3. 常见问题

#### 构建失败

- 检查 Node.js 版本兼容性
- 确认所有依赖已安装
- 验证 VitePress 配置

#### 部署失败

- 检查 GitHub Pages 设置
- 确认 Actions 权限配置
- 验证分支保护规则

## 🔍 自定义配置

### 1. 修改部署分支

编辑 `.github/workflows/deploy.yml`：

```yaml
on:
  push:
    branches: [main, develop] # 添加更多分支
```

### 2. 修改构建命令

如果使用不同的构建命令：

```yaml
- name: Build docs
  run: npm run build:docs # 修改为你的构建命令
```

### 3. 添加环境变量

在仓库设置中添加 Secrets：

1. 进入 **Settings** → **Secrets and variables** → **Actions**
2. 添加需要的环境变量

## 📱 移动端优化

VitePress 配置已包含移动端优化：

- 响应式设计
- 触摸友好的导航
- 移动端优化的搜索

## 🌐 自定义域名

如需使用自定义域名：

1. 在 **Settings** → **Pages** 中设置
2. 添加 CNAME 记录
3. 配置 SSL 证书

## 📈 性能优化

### 1. 构建优化

- 代码分割
- 懒加载
- 缓存策略

### 2. CDN 配置

- 静态资源 CDN
- 图片优化
- 字体优化

## 🔒 安全配置

### 1. 内容安全策略

在 VitePress 配置中添加 CSP 头：

```typescript
head: [
  [
    'meta',
    {
      'http-equiv': 'Content-Security-Policy',
      content: "default-src 'self'; script-src 'self' 'unsafe-inline'",
    },
  ],
];
```

### 2. 依赖安全

定期更新依赖：

```bash
npm audit
npm update
```

## 📞 获取帮助

### 1. 官方文档

- [GitHub Pages](https://pages.github.com/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [VitePress](https://vitepress.dev/)

### 2. 社区支持

- [GitHub Community](https://github.com/orgs/community/discussions)
- [VitePress Discussions](https://github.com/vuejs/vitepress/discussions)

### 3. 问题报告

如果遇到问题，请在 [GitHub Issues](https://github.com/shawicx/scx-api-tool/issues) 中报告。

---

🎉 **配置完成后，你的文档将自动部署到 GitHub Pages！**

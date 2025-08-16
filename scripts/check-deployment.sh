#!/bin/bash
#
# 部署检查脚本
# 用于检查 GitHub Pages 部署配置是否正确
#

echo "🔍 检查 GitHub Pages 部署配置..."

# 检查必要的文件是否存在
echo "📁 检查配置文件..."

# 检查 GitHub Actions 工作流
if [ -f ".github/workflows/deploy.yml" ]; then
    echo "✅ .github/workflows/deploy.yml 存在"
else
    echo "❌ .github/workflows/deploy.yml 不存在"
    exit 1
fi

# 检查 VitePress 配置
if [ -f ".vitepress/config.mts" ]; then
    echo "✅ .vitepress/config.mts 存在"
else
    echo "❌ .vitepress/config.mts 不存在"
    exit 1
fi

# 检查 package.json 中的脚本
echo "📦 检查 package.json 脚本..."
if grep -q '"docs:build"' package.json; then
    echo "✅ docs:build 脚本存在"
else
    echo "❌ docs:build 脚本不存在"
    exit 1
fi

# 检查 VitePress 依赖
echo "🔧 检查 VitePress 依赖..."
if grep -q "vitepress" package.json; then
    echo "✅ VitePress 依赖存在"
else
    echo "❌ VitePress 依赖不存在"
    exit 1
fi

# 尝试构建文档
echo "🚀 尝试构建文档..."
if npm run docs:build; then
    echo "✅ 文档构建成功"
else
    echo "❌ 文档构建失败"
    exit 1
fi

# 检查构建输出
if [ -d ".vitepress/dist" ]; then
    echo "✅ 构建输出目录存在"
    echo "📊 构建输出文件数量: $(find .vitepress/dist -type f | wc -l)"
else
    echo "❌ 构建输出目录不存在"
    exit 1
fi

echo ""
echo "🎉 所有检查通过！"
echo ""
echo "📋 下一步操作："
echo "1. 推送代码到 GitHub: git push origin main"
echo "2. 在 GitHub 仓库设置中启用 Pages"
echo "3. 在 Settings → Pages → Source 中选择 'GitHub Actions'"
echo "4. 在 Settings → Actions → General 中设置权限"
echo ""
echo "🔗 部署完成后，你的文档将在以下地址可用："
echo "   https://shawicx.github.io/scx-api-tool"
echo ""
echo "📚 详细说明请查看: docs/github-pages-deployment.md"

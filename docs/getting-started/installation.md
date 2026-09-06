# 安装指南

## 系统要求

- Node.js >= 22.12.0
- npm >= 9.0.0 或 pnpm >= 10.0.0

## 安装方式

### 1. 使用 npx（推荐）

无需全局安装，直接使用：

```bash
npx @scxfe/api-tool [command]
```

优点：

- 始终使用最新版本
- 无需全局安装，不污染系统
- 自动处理依赖

### 2. 全局安装

安装到全局环境，可在任何项目中使用：

```bash
npm install -g @scxfe/api-tool
```

或者使用 pnpm：

```bash
pnpm add -g @scxfe/api-tool
```

安装完成后，使用：

```bash
api-power [command]
```

### 3. 项目本地安装

作为开发依赖安装到项目：

```bash
npm install --save-dev @scxfe/api-tool
```

或者使用 pnpm：

```bash
pnpm add -D @scxfe/api-tool
```

在项目中使用：

```bash
npx api-power [command]

# 或者在 package.json 中添加脚本
{
  "scripts": {
    "api:generate": "api-power",
    "api:init": "api-power init"
  }
}
```

## 验证安装

检查工具是否正确安装：

```bash
api-power --version
```

或者：

```bash
npx @scxfe/api-tool --version
```

## 配置环境

### 权限设置

确保你有以下权限：

- 创建和修改文件权限
- 网络访问权限（获取 API 数据）
- 执行 CLI 命令权限

### 代理设置

如果需要通过代理访问 API，设置环境变量：

```bash
# HTTP 代理
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080

# 或者在 .npmrc 中配置
proxy=http://proxy.company.com:8080
https-proxy=http://proxy.company.com:8080
```

## 故障排除

### 常见问题

#### 1. 权限被拒绝（EACCES）

```bash
# 使用 npm 全局安装时遇到权限问题
sudo npm install -g @scxfe/api-tool

# 或者使用 nvm 管理 Node.js 版本
nvm install --latest-npm
```

#### 2. 命令未找到

```bash
# 检查 PATH 环境变量
echo $PATH | grep -o "[^:]*node[^:]*"

# 重新加载 shell 配置
source ~/.bashrc  # 或 ~/.zshrc
```

#### 3. 网络连接问题

```bash
# 检查网络连接
curl -I https://registry.npmjs.org/

# 使用淘宝镜像源
npm config set registry https://registry.npmmirror.com/
```

#### 4. 版本兼容性

```bash
# 检查 Node.js 版本
node --version  # 需要 >= 22.12.0

# 检查 npm 版本
npm --version   # 需要 >= 9.0.0

# 升级到最新版本
nvm install node
npm install -g npm@latest
```

### 获取帮助

如果遇到问题：

```bash
# 显示帮助信息
api-power --help

# 显示版本信息
api-power --version

# 调试模式
api-power --debug
```

## 下一步

安装完成后，你可以：

1. [快速开始示例](./quick-start) - 创建第一个项目
2. [配置指南](../guides/configuration) - 了解配置选项
3. [CLI 命令参考](../guides/cli) - 查看所有命令

## 升级指南

### 全局升级

```bash
npm update -g @scxfe/api-tool
```

### 项目升级

```bash
npm update @scxfe/api-tool
```

### 检查更新

```bash
npm outdated @scxfe/api-tool
```

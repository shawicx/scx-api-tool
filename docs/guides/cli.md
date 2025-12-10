# CLI 命令参考

`@scx/api-tool` 提供了完整的命令行界面来管理 API 代码生成。

## 命令概览

### 主要命令

| 命令              | 说明                 | 简写 |
| ----------------- | -------------------- | ---- |
| `api-power init`  | 初始化配置文件       | -    |
| `api-power`       | 生成代码（默认命令） | -    |
| `api-power debug` | 调试配置和数据       | -    |
| `api-power help`  | 显示帮助信息         | `-h` |

### 全局参数

| 参数        | 简写 | 说明             | 示例             |
| ----------- | ---- | ---------------- | ---------------- |
| `--config`  | `-c` | 指定配置文件路径 | `-c ./config.ts` |
| `--help`    | `-h` | 显示帮助信息     | `-h`             |
| `--version` | `-v` | 显示版本信息     | `-v`             |

## 命令详解

### 1. 初始化配置 - `api-power init`

创建项目配置文件，支持交互式配置。

```bash
# 基本用法
api-power init

# 指定配置文件名
api-power init --config custom-config.ts

# 覆盖现有配置
api-power init --force

# 使用 JavaScript 格式
api-power init --js
```

**选项参数：**

- `--config, -c`: 指定配置文件路径
- `--force, -f`: 强制覆盖现有配置文件
- `--js`: 生成 JavaScript 格式配置文件
- `--typescript, -ts`: 生成 TypeScript 格式配置文件（默认）

**交互式配置：**

执行命令后会询问以下信息：

1. **配置文件类型**: TypeScript 或 JavaScript
2. **API 平台选择**: apifox 或 swagger
3. **项目 URL**: API 平台地址
4. **项目 ID/名称**: 项目标识符
5. **输出目录**: 生成代码的目标路径

### 2. 生成代码 - `api-power`

根据配置文件生成 TypeScript 类型和请求函数。

```bash
# 基本用法
api-power

# 指定配置文件
api-power --config ./my-config.ts

# 只生成类型定义
api-power --types-only

# 调试模式
api-power --debug

# 详细输出
api-power --verbose
```

**选项参数：**

- `--config, -c`: 指定配置文件路径
- `--types-only, -t`: 只生成类型定义，不生成请求函数
- `--debug, -d`: 启用调试模式，显示详细日志
- `--verbose, -V`: 显示详细执行信息
- `--dry-run`: 预览模式，不实际生成文件

**执行流程：**

1. 🔍 检测和读取配置文件
2. 📡 连接到 API 管理平台
3. 📥 获取接口定义和数据结构
4. 🔄 处理和转换数据格式
5. 📝 生成 TypeScript 类型定义
6. ⚡ 生成 HTTP 请求函数
7. 📁 写入到输出目录

### 3. 调试命令 - `api-power debug`

调试配置和 API 连接，帮助排查问题。

```bash
# 基本调试
api-power debug

# 调试特定配置
api-power debug --config ./config.ts

# 只测试连接
api-power debug --connection-only
```

**调试内容：**

- 配置文件加载状态
- API 平台连接测试
- 认证信息验证
- 项目权限检查
- 接口数据获取测试

**选项参数：**

- `--config, -c`: 指定配置文件路径
- `--connection-only`: 只测试网络连接
- `--no-auth`: 跳过身份验证测试

### 4. 帮助信息 - `api-power help`

显示命令帮助和使用说明。

```bash
# 显示主帮助
api-power help

# 显示特定命令帮助
api-power help init
api-power help generate
```

## 输出示例

### 成功执行

```
✓ 检测配置文件: api-power.config.ts
✓ 连接到 Apifox 平台
✓ 获取项目信息: 用户管理系统 (ID: 123456789)
✓ 获取接口列表: 共 23 个接口
✓ 获取数据结构: 共 45 个类型
✓ 生成类型定义: 45 个类型
✓ 生成请求函数: 23 个函数
✓ 生成分组文件: 4 个分组

🎉 代码生成完成！
📁 输出目录: src/service
⏱️  耗时: 3.2s
```

### 调试模式输出

```
[DEBUG] 正在加载配置文件: api-power.config.ts
[DEBUG] 配置文件加载成功: 1 个配置项
[DEBUG] 尝试连接到: https://api.apifox.com
[DEBUG] 使用项目 ID: 123456789
[DEBUG] 获取项目列表成功
[DEBUG] 项目名称: 用户管理系统
[DEBUG] 获取接口列表: 23 个接口
[DEBUG] 过滤后的接口: 20 个（已排除 3 个）
[DEBUG] 生成文件清单:
[DEBUG]  - src/service/index.ts
[DEBUG]  - src/service/types.ts
[DEBUG]  - src/service/request.ts
[DEBUG]  - src/service/user/index.ts
[DEBUG]  - src/service/user/types.ts
```

## 使用技巧

### 1. 配置文件管理

```bash
# 使用不同环境的配置
api-power --config config/dev.ts
api-power --config config/prod.ts

# 验证配置文件
api-power debug --config config/prod.ts
```

### 2. 自动化脚本

在 `package.json` 中添加脚本：

```json
{
  "scripts": {
    "api:generate": "api-power",
    "api:debug": "api-power debug",
    "api:init": "api-power init",
    "api:types": "api-power --types-only",
    "precommit": "api-power && git add src/service/"
  }
}
```

### 3. CI/CD 集成

```yaml
# GitHub Actions 示例
- name: Generate API types
  run: |
    npx api-power --config .github/api-config.ts
    git add src/service/
    git diff --staged --quiet || git commit -m "chore: update API types"
```

## 错误处理

### 常见错误及解决方案

#### 1. 配置文件不存在

```bash
# 错误信息
Error: 配置文件不存在: api-power.config.ts

# 解决方案
api-power init
```

#### 2. 网络连接失败

```bash
# 错误信息
Error: 连接 Apifox 平台失败

# 解决方案
api-power debug --connection-only
# 检查网络、代理、防火墙设置
```

#### 3. 认证失败

```bash
# 错误信息
Error: API 认证失败，请检查 token

# 解决方案
# 检查 apifoxToken 配置
# 验证项目访问权限
```

#### 4. 权限问题

```bash
# 错误信息
Error: 无法创建输出目录: Permission denied

# 解决方案
# 检查输出目录权限
# 使用 sudo（不推荐）
# 修改输出目录到有权限的位置
```

### 退出码

| 退出码 | 说明         |
| ------ | ------------ |
| 0      | 成功执行     |
| 1      | 一般错误     |
| 2      | 配置文件错误 |
| 3      | 网络连接错误 |
| 4      | 权限错误     |
| 5      | API 平台错误 |

## 环境变量

可以使用环境变量覆盖配置：

```bash
# API 平台 Token
export API_POWER_TOKEN=your-token-here

# 输出目录
export API_POWER_OUTPUT_DIR=./src/services

# 调试模式
export API_POWER_DEBUG=true

# 执行命令
api-power
```

## 版本管理

### 检查版本

```bash
api-power --version
# 输出: @scx/api-tool version 1.2.3
```

### 检查更新

```bash
npm outdated @scxfe/api-tool
```

### 更新工具

```bash
# 全局更新
npm update -g @scxfe/api-tool

# 项目更新
npm update @scxfe/api-tool
```

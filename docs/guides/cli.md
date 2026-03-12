# CLI 命令参考

`@scx/api-tool` 提供了完整的命令行界面来管理 API 代码生成。

## 命令概览

### 主要命令

| 命令              | 说明                 | 直写      |
| ----------------- | -------------------- | --------- |
| `api-power init`  | 初始化配置文件       | -         |
| `api-power`       | 生成代码（默认命令） | gen       |
| `api-power debug` | 调试配置和数据       | -         |
| `api-power viz`   | 启动可视化服务器     | visualize |

## 全局参数

| 参数        | 直写 | 说明             | 示例 |
| ----------- | ---- | ---------------- | ---- |
| `--version` | `-V` | 显示版本信息     | `-V` |
| `--help`    | `-h` | 显示帮助信息     | `-h` |
| `--verbose` | `-v` | 显示详细执行信息 | `-v` |

## 命令详解

### 1. 初始化配置 - `api-power init`

创建项目配置文件。

```bash
# 基本用法
api-power init

# 覆盖现有配置
api-power init --force
```

**选项参数：**

- `--force, -f`: 强制覆盖现有配置文件
- `--verbose, -v`: 显示详细的错误信息和堆栈跟踪

### 2. 生成代码 - `api-power` (默认命令)

根据配置文件生成 TypeScript 类型和请求函数。

```bash
# 基本用法
api-power

# 指定配置文件
api-power --config ./my-config.ts

# 显示详细执行信息
api-power --verbose

# 监视模式（自动重新生成）
api-power --watch
```

**选项参数：**

- `--config, -c`: 指定配置文件路径
- `--watch, -w`: 监视配置文件更改并自动重新生成
- `--verbose, -v`: 显示详细执行信息

**执行流程：**

1. 配置验证
2. 获取 API 数据
3. 处理数据结构
4. 生成代码文件

**Watch 模式：**

使用 `--watch` 选项可以监视配置文件变化，自动重新生成代码：

```bash
api-power --watch
```

Watch 模式输出示例：

```
✅ 启动监视模式...
✅ 步骤 1/3 完成: 配置文件加载完成
✅ 步骤 2/3 完成: 初始代码生成完成
✅ 步骤 3/3 完成: 文件监视已启动
✅ 监视模式已启动，正在监控配置文件更改...
🔍 监视模式运行中...
   监控文件: /path/to/api-power.config.ts
   按 Ctrl+C 退出监视模式

✅ 检测到配置文件更改，开始重新生成...
✅ 代码生成完成
✅ 配置更新已应用，继续监视文件更改...
```

Watch 模式会在配置文件更改时自动重新生成代码，适用于开发过程中频繁调整配置的场景。

### 3. 调试命令 - `api-power debug`

启用详细输出模式，在代码生成过程中显示更多调试信息。

```bash
# 基本调试
api-power debug

# 调试特定配置
api-power debug --config ./config.ts
```

**调试内容：**

- 配置处理的详细信息（serverUrl、serverType 等）
- API 请求/响应详情（请求头、请求体、响应状态等）
- 数据处理统计（接口数量、类型数量、分类数量）
- 文件生成进度和状态
- 模板编译和缓存状态
- 各步骤的详细执行信息

**选项参数：**

- `--config, -c`: 指定配置文件路径
- `--verbose, -v`: 显示详细的错误信息和堆栈跟踪（debug 模式默认启用）

**说明：**

`api-power debug` 命令会设置 `DEBUG=true` 环境变量，然后执行正常的代码生成流程。你也可以通过设置环境变量达到相同效果：

```bash
DEBUG=true api-power
```

两者的区别是 `api-power debug` 默认启用 verbose 模式，而使用环境变量时需要手动添加 `--verbose` 选项。

### 4. 可视化 - `api-power viz`

启动可视化配置服务器，提供 Web 界面查看和编辑 API 配置。

```bash
# 启动可视化服务器
api-power viz

# 指定端口
api-power viz --port 3000
```

**选项参数：**

- `--port, -p`: 指定服务器端口（默认 "3000"）
- `--host`: 指定服务器地址（默认 "localhost"）

### 5. 帮助信息 - `api-power help`

显示命令帮助和使用说明。

```bash
# 显示主帮助
api-power help

# 显示特定命令帮助
api-power help init
api-power help generate
api-power help debug
```

## 输出示例

### 成功执行

```
步骤 1/4 完成: 配置验证完成
步骤 2/4 完成: API 数据获取完成
步骤 3/4 完成: 数据处理完成 (23 接口, 45 类型)
步骤 4/4 完成: 代码文件生成完成
所有处理步骤完成 (总耗时: 2s)
输出目录: src/service
代码生成成功完成！(耗时: 2s)
```

### 调试模式输出

```
使用配置开始代码生成 api-power.config.ts
步骤 1/4 完成: 配置验证完成
[DEBUG] 处理配置: serverUrl = https://api.apifox.com, serverType = apifox
步骤 2/4 完成: API 数据获取完成
[DEBUG] 从 API 源获取原始数据成功
[DEBUG] Apifox API 请求配置: { headers: {...}, requestBody: {...} }
[DEBUG] Apifox response status: 200
[DEBUG] Apifox response data type: object
步骤 3/4 完成: 数据处理完成 (23 接口, 45 类型)
[DEBUG] 处理后的数据计数: {"interfaces":23,"types":45,"categories":5}
[DEBUG] 正在生成 45 个类型文件...
[DEBUG] 创建类型文件: src/service/types/User.ts
[DEBUG] 正在生成 23 个接口文件...
[DEBUG] 创建接口文件: src/service/user/index.ts
步骤 4/4 完成: 代码文件生成完成
所有处理步骤完成 (总耗时: 2s)
输出目录: src/service
代码生成成功完成！(耗时: 2s)
```

## 使用技巧

### 1. 配置文件管理

```bash
# 使用不同环境的配置
api-power --config config/dev.ts
api-power --config config/prod.ts

# 启用调试模式查看详细信息
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
    "api:types": "api-power",
    "api:watch": "api-power --watch",
    "precommit": "api-power && git add src/service/"
  }
}
```

使用示例：

```bash
# 生成 API 代码
npm run api:generate

# 调试配置
npm run api:debug

# 提交前自动生成
npm run precommit
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

```yaml
# GitLab CI 示例
api:generate:
  script:
    - npx api-power --config .gitlab/api-config.ts
    - git add src/service/
    - git commit -m "chore: update API types" || echo "No changes"
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
api-power debug
# 查看详细的 API 请求和响应信息
# 检查网络、代理、防火墙设置
```

#### 3. 认证失败

```bash
# 错误信息
Error: API 认证失败，请检查 token

# 解决方案
# 检查 Apifox Token 配置
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

| 退出码 | 说明             |
| ------ | ---------------- |
| 0      | 成功执行         |
| E1001  | 配置文件未找到   |
| E1002  | 配置无效         |
| E1003  | 配置解析失败     |
| E1004  | 配置缺少必需字段 |
| E1005  | 无效的 URL 格式  |
| E2001  | 网络请求失败     |
| E2002  | 未授权访问       |
| E2003  | 请求超时         |
| E2004  | 无效的响应格式   |
| E2005  | 网络错误         |
| E3001  | 模板编译失败     |
| E3002  | 文件写入失败     |
| E3003  | 类型生成失败     |
| E3004  | Schema 生成失败  |

## 环境变量

可以使用环境变量来控制调试输出：

```bash
# 调试模式
export DEBUG=true

# 执行命令
api-power
```

## 版本管理

### 检查版本

```bash
api-power --version
# 输出: @scxfe/api-tool version 0.4.10
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

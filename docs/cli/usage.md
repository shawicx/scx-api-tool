# CLI 使用说明

## 命令概览

`@scx/api-tool` 提供了以下命令：

- `apiPower init` - 初始化配置文件
- `apiPower` - 生成代码（默认命令）
- `apiPower help` - 显示帮助信息

## 详细命令说明

### 1. 初始化配置 - `apiPower init`

初始化项目配置文件，支持 TypeScript 和 JavaScript 两种格式。

```bash
# 使用默认配置
npx apiPower init

# 使用自定义配置文件
npx apiPower init -c ./custom-config.ts
```

**交互式选项：**

- 选择配置文件类型（TypeScript 或 JavaScript）
- 是否覆盖现有配置文件

**生成的文件：**

- `apiPower.config.ts` (TypeScript 格式)
- `apiPower.config.js` (JavaScript 格式)

### 2. 生成代码 - `apiPower`

根据配置文件生成 TypeScript 类型和请求函数代码。

```bash
# 使用默认配置文件
npx apiPower

# 使用自定义配置文件
npx apiPower -c ./custom-config.ts
```

**执行流程：**

1. 读取配置文件
2. 连接到 API 管理平台
3. 获取接口定义
4. 生成代码文件
5. 写入输出目录

### 3. 帮助信息 - `apiPower help`

显示工具的详细使用说明和示例。

```bash
npx apiPower help
```

## 命令行参数

### 全局参数

| 参数       | 简写 | 说明             | 示例             |
| ---------- | ---- | ---------------- | ---------------- |
| `--config` | `-c` | 指定配置文件路径 | `-c ./config.ts` |
| `--help`   | `-h` | 显示帮助信息     | `-h`             |

### 使用示例

```bash
# 基本用法
npx apiPower

# 指定配置文件
npx apiPower -c ./my-config.ts

# 获取帮助
npx apiPower help

# 初始化配置
npx apiPower init
```

## 配置文件选项

### 配置文件类型选择

初始化时可以选择以下配置文件类型：

- **TypeScript (.ts)**: 提供完整的类型提示和检查
- **JavaScript (.js)**: 更简单的配置，适合快速使用

### 配置文件位置

工具会按以下顺序查找配置文件：

1. 命令行指定的配置文件 (`-c` 参数)
2. 当前目录的 `apiPower.config.ts`
3. 当前目录的 `apiPower.config.js`

## 执行状态和反馈

### 进度提示

工具在执行过程中会显示：

- 🔄 配置文件检测状态
- 📡 数据获取进度
- ⚙️ 代码生成状态
- ✅ 完成状态

### 错误处理

- 配置文件不存在时会提示创建
- 网络连接失败时会显示错误信息
- 数据解析错误时会提供详细错误信息

## 最佳实践

### 1. 项目集成

```bash
# 在 package.json 中添加脚本
{
  "scripts": {
    "generate:api": "apiPower",
    "generate:api:init": "apiPower init"
  }
}

# 使用 npm 脚本
npm run generate:api
```

### 2. 版本控制

- 将配置文件添加到版本控制
- 将生成的代码目录添加到 `.gitignore`
- 定期更新 API 类型定义

### 3. 团队协作

- 统一配置文件格式
- 使用环境变量管理敏感信息
- 建立代码生成规范

## 故障排除

### 常见问题

1. **配置文件不存在**

   ```bash
   npx apiPower init
   ```

2. **权限问题**

   ```bash
   # 检查文件权限
   ls -la apiPower.config.ts
   ```

3. **网络连接问题**
   - 检查网络连接
   - 验证 API 平台地址
   - 检查防火墙设置

### 调试模式

启用详细日志输出：

```bash
# 设置环境变量
export DEBUG=api-tool:*

# 运行命令
npx apiPower
```

## 更新和升级

### 检查版本

```bash
npm list @scxfe/api-tool
```

### 更新工具

```bash
npm update -g @scxfe/api-tool
```

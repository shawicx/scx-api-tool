# 快速开始

欢迎使用 `@scx/api-tool`！这是一个强大的 CLI 工具，可以帮助你从 OpenAPI 3.0、Swagger 和 Apifox 等 API 管理平台自动生成 TypeScript/JavaScript 代码。

## 🚀 5 分钟上手

### 1. 安装工具

```bash
# 使用 npx（推荐，无需安装）
npx @scxfe/api-tool

# 或者全局安装
npm install -g @scxfe/api-tool
```

### 2. 初始化配置

```bash
npx api-power init
```

这将创建一个 `api-power.config.ts` 配置文件。

### 3. 配置 API 源

编辑配置文件，设置你的 API 平台信息：

```typescript
// api-power.config.ts
import { defineConfig } from '@scx/api-tool';

export default defineConfig({
  // API 数据源 URL（Apifox 或 Swagger/OpenAPI）
  source: 'https://api.apifox.com/v1/projects/YOUR_PROJECT_ID/export-openapi',
  // 认证令牌
  token: 'YOUR_TOKEN_HERE',

  // 是否生成 API 请求方法
  generateApi: true,
  // 是否生成类型定义（在接口文件中）
  generateTypes: true,
  // 类型生成格式：'typescript' | 'zod'
  typesFormat: 'typescript',

  // 输出目录
  outputDir: 'src/service',
});
```

### 4. 生成代码

```bash
npx api-power generate
# 或简写
npx api-power gen
```

工具将自动生成：

- TypeScript 类型定义
- HTTP 请求函数
- 接口分组文件

### 5. 监视模式

如果希望在配置文件更改时自动重新生成代码：

```bash
npx api-power generate --watch
# 或简写
npx api-power gen -w
```

## 📁 生成的文件结构

根据配置的不同，生成的文件结构可能略有差异：

### 标准结构

```
src/service/
├── types.ts           # 所有类型定义
├── request.ts         # HTTP 请求函数
├── index.ts           # 主入口文件
└── [category]/        # 按分类分组的接口
    ├── index.ts
    └── types/
        └── *.ts       # 分类下的类型文件
```

### 当使用 Zod 类型时

```
src/service/
├── schemas.ts         # Zod 验证模式定义
├── request.ts         # HTTP 请求函数
├── index.ts           # 主入口文件
└── [category]/        # 按分类分组的接口
    ├── index.ts
    └── schemas/
        └── *.ts       # 分类下的 Zod 模式文件
```

注意：当 `typesFormat` 设置为 `'zod'` 时，会生成 Zod 验证模式而不是 TypeScript 类型。

## 🛠️ CLI 命令

### generate (gen)

生成 API 代码和类型定义：

```bash
npx api-power generate
# 或简写
npx api-power gen
# 监视模式
npx api-power gen -w
# 指定配置文件
npx api-power gen -c ./my-config.ts
```

### init

初始化配置文件：

```bash
npx api-power init
# 强制覆盖现有配置文件
npx api-power init -f
```

### debug

启用详细输出模式，在代码生成过程中显示更多调试信息：

```bash
npx api-power debug
```

也可以通过设置环境变量达到相同效果：

```bash
DEBUG=true npx api-power
```

**调试输出的信息包括：**

- 配置处理的详细信息
- API 请求和响应详情
- 数据处理统计（接口数、类型数、分类数）
- 文件生成进度和状态
- 模板编译和缓存状态

### visualize (viz)

启动可视化配置服务器：

```bash
npx api-power visualize
# 指定端口和主机
npx api-power viz -p 8080 --host 0.0.0.0
```

## 🎯 下一步

- [安装指南](./installation) - 详细的安装说明
- [快速开始示例](./quick-start) - 完整的实战示例
- [配置指南](../guides/configuration) - 深入了解配置选项
- [CLI 命令参考](../guides/cli) - 所有命令的详细说明

## ⚙️ 配置选项

以下是最常用的配置选项：

| 选项                  | 类型                           | 默认值          | 描述                                        |
| --------------------- | ------------------------------ | --------------- | ------------------------------------------- |
| `source`              | `string`                       | -               | API 数据源 URL（Apifox 或 Swagger/OpenAPI） |
| `token`               | `string`                       | -               | 认证令牌                                    |
| `generateApi`         | `boolean`                      | `true`          | 是否生成 API 请求方法                       |
| `generateTypes`       | `boolean`                      | `true`          | 是否生成类型定义                            |
| `typesFormat`         | `'typescript' \| 'zod'`        | `'typescript'`  | 类型生成格式                                |
| `target`              | `'javascript' \| 'typescript'` | `'typescript'`  | 目标语言                                    |
| `outputDir`           | `string`                       | `'src/service'` | 输出目录                                    |
| `indentSize`          | `number`                       | `2`             | 缩进大小                                    |
| `comment`             | `boolean`                      | `true`          | 是否生成注释                                |
| `requestFunctionName` | `string`                       | `'request'`     | 自定义请求函数名                            |
| `prodEnvName`         | `string`                       | `'production'`  | 生产环境名称                                |

### 高级配置选项

| 选项                 | 类型                                      | 默认值     | 描述                                   |
| -------------------- | ----------------------------------------- | ---------- | -------------------------------------- |
| `requestMethodStyle` | `'config' \| 'method-specific' \| 'both'` | `'config'` | 请求方法调用风格                       |
| `concurrency`        | `number`                                  | `50`       | 并发写入数量（用于文件生成的并发控制） |
| `namingStrategy`     | `NamingStrategy`                          | -          | 自定义命名策略                         |

## 🔥 支持的平台

| 平台                | 支持状态 | 说明     |
| ------------------- | -------- | -------- |
| Apifox              | ✅       | 完全支持 |
| Swagger/OpenAPI 3.0 | ✅       | 完全支持 |
| YApi                | 🚧       | 计划支持 |

## 💡 常见用例

### React 项目

```typescript
import { getUserInfo } from '@/service';

// 在组件中使用
function UserProfile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    getUserInfo().then(setUser);
  }, []);

  return <div>{user?.name}</div>;
}
```

### Node.js 项目

```typescript
import { createOrder } from '@/service';

// 在 API 路由中使用
app.post('/orders', async (req, res) => {
  const order = await createOrder(req.body);
  res.json(order);
});
```

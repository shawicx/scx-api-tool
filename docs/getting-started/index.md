# 快速开始

欢迎使用 `@scx/api-tool`！这是一个强大的 CLI 工具，可以帮助你从各种 API 管理平台自动生成 TypeScript/JavaScript 代码。

## 🚀 5 分钟上手

### 1. 安装工具

```bash
# 使用 npx（推荐，无需安装）
npx @scxfe/api-tool init

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

export default defineConfig([
  {
    serverUrl: 'https://api.apifox.com',
    serverType: 'apifox',
    apifoxProjectId: 'your-project-id',
    outputDir: 'src/service',
  },
]);
```

### 4. 生成代码

```bash
npx api-power
```

工具将自动生成：

- TypeScript 类型定义
- HTTP 请求函数
- 接口分组文件

## 📁 生成的文件结构

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

## 🎯 下一步

- [安装指南](./installation) - 详细的安装说明
- [快速开始示例](./quick-start) - 完整的实战示例
- [配置指南](../guides/configuration) - 深入了解配置选项
- [CLI 命令参考](../guides/cli) - 所有命令的详细说明

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

# 配置说明

## 配置文件结构

`@scx/api-tool` 使用 TypeScript 或 JavaScript 配置文件来定义生成规则。配置文件导出一个配置数组，每个配置项对应一个 API 项目。

## 基础配置项

### 服务器配置

| 配置项            | 类型                              | 必填 | 说明           | 示例                       |
| ----------------- | --------------------------------- | ---- | -------------- | -------------------------- |
| `serverUrl`       | `string`                          | ✅   | API 服务器地址 | `'https://api.apifox.com'` |
| `serverType`      | `'swagger' \| 'yapi' \| 'apifox'` | ✅   | API 平台类型   | `'apifox'`                 |
| `apifoxProjectId` | `string`                          | ❌   | Apifox 项目 ID | `'6720131'`                |

### 输出配置

| 配置项       | 类型                           | 必填 | 默认值          | 说明               |
| ------------ | ------------------------------ | ---- | --------------- | ------------------ |
| `typesOnly`  | `boolean`                      | ❌   | `false`         | 是否只生成类型定义 |
| `target`     | `'typescript' \| 'javascript'` | ❌   | `'typescript'`  | 输出代码类型       |
| `outputDir`  | `string`                       | ❌   | `'src/service'` | 输出目录路径       |
| `indentSize` | `number`                       | ❌   | `2`             | 代码缩进大小       |

### 路径配置

| 配置项                    | 类型     | 必填 | 默认值                     | 说明             |
| ------------------------- | -------- | ---- | -------------------------- | ---------------- |
| `pathPrefix`              | `string` | ❌   | `''`                       | 接口路径前缀     |
| `requestFunctionFilePath` | `string` | ❌   | `'src/service/request.ts'` | 请求函数文件路径 |

### 环境配置

| 配置项        | 类型     | 必填 | 默认值         | 说明         |
| ------------- | -------- | ---- | -------------- | ------------ |
| `prodEnvName` | `string` | ❌   | `'production'` | 生产环境名称 |
| `dataKey`     | `string` | ❌   | `'data'`       | 响应数据键名 |

## 高级配置项

### React Hooks 配置

```typescript
reactHooks: {
  enabled: boolean; // 是否启用 React Hooks
  // 其他 hooks 相关配置
}
```

### 项目配置

```typescript
projects: [
  {
    token: string;         // 项目访问令牌
    categories: [          // 分类配置
      {
        id: number;        // 分类 ID
        // 自定义请求函数名生成规则
        getRequestFunctionName?: (interfaceInfo, changeCase) => string;
      }
    ];
  }
]
```

## 配置示例

### 基础配置示例

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig([
  {
    // 服务器配置
    serverUrl: 'https://api.apifox.com',
    serverType: 'apifox',
    apifoxProjectId: '6720131',

    // 输出配置
    typesOnly: false,
    target: 'typescript',
    outputDir: 'src/service',
    indentSize: 2,

    // 路径配置
    pathPrefix: '',
    requestFunctionFilePath: 'src/service/request.ts',

    // 环境配置
    prodEnvName: 'production',
    dataKey: 'data',

    // React Hooks 配置
    reactHooks: {
      enabled: false,
    },

    // 项目配置
    projects: [
      {
        token: 'your-project-token',
        categories: [
          {
            id: 0,
            // 自定义请求函数名生成规则
            getRequestFunctionName(interfaceInfo, changeCase) {
              return changeCase.camelCase(interfaceInfo.path);
            },
          },
        ],
      },
    ],
  },
]);
```

### Swagger 配置示例

```typescript
export default defineConfig([
  {
    serverUrl: 'https://petstore.swagger.io/v2',
    serverType: 'swagger',
    typesOnly: false,
    target: 'typescript',
    outputDir: 'src/api',
    pathPrefix: '/api',
    projects: [
      {
        token: '', // Swagger 通常不需要 token
        categories: [
          {
            id: 0,
          },
        ],
      },
    ],
  },
]);
```

### YApi 配置示例

```typescript
export default defineConfig([
  {
    serverUrl: 'https://your-yapi-server.com',
    serverType: 'yapi',
    typesOnly: false,
    target: 'typescript',
    outputDir: 'src/api',
    projects: [
      {
        token: 'your-yapi-token',
        categories: [
          {
            id: 1,
            getRequestFunctionName(interfaceInfo, changeCase) {
              // 添加前缀避免命名冲突
              return changeCase.camelCase(`api_${interfaceInfo.path}`);
            },
          },
        ],
      },
    ],
  },
]);
```

### 多项目配置示例

```typescript
export default defineConfig([
  // 用户服务 API
  {
    serverUrl: 'https://api.apifox.com',
    serverType: 'apifox',
    apifoxProjectId: 'user-service-id',
    outputDir: 'src/service/user',
    pathPrefix: '/user',
    projects: [
      {
        token: 'user-service-token',
        categories: [{ id: 0 }],
      },
    ],
  },

  // 订单服务 API
  {
    serverUrl: 'https://api.apifox.com',
    serverType: 'apifox',
    apifoxProjectId: 'order-service-id',
    outputDir: 'src/service/order',
    pathPrefix: '/order',
    projects: [
      {
        token: 'order-service-token',
        categories: [{ id: 0 }],
      },
    ],
  },
]);
```

## 钩子函数配置

### 成功钩子

```typescript
hooks: {
  success: async () => {
    console.log('代码生成成功！');
    // 可以在这里执行后续操作，如格式化代码、运行测试等
  },
}
```

### 失败钩子

```typescript
hooks: {
  fail: async (error) => {
    console.error('代码生成失败:', error);
    // 可以在这里执行错误处理逻辑
  },
}
```

### 完成钩子

```typescript
hooks: {
  complete: async () => {
    console.log('操作完成');
    // 无论成功还是失败都会执行
  },
}
```

## 环境变量配置

### 敏感信息管理

```typescript
export default defineConfig([
  {
    serverUrl: process.env.API_SERVER_URL || 'https://api.apifox.com',
    projects: [
      {
        token: process.env.API_TOKEN || '',
        // ... 其他配置
      },
    ],
  },
]);
```

### 环境变量文件 (.env)

```bash
# .env
API_SERVER_URL=https://api.apifox.com
API_TOKEN=your-secret-token
```

## 配置验证

### TypeScript 类型检查

```typescript
import { defineConfig, ConfigWithHooks } from '@scxfe/api-tool';

// 使用类型注解确保配置正确
const config: ConfigWithHooks[] = defineConfig([
  {
    // 配置项...
  },
]);

export default config;
```

### 运行时验证

工具会在运行时验证配置的有效性，包括：

- 必填字段检查
- URL 格式验证
- 文件路径存在性检查
- 网络连接测试

## 配置最佳实践

### 1. 项目结构

```
project/
├── apiPower.config.ts          # 主配置文件
├── .env                        # 环境变量（可选）
├── src/
│   └── service/               # 生成的代码目录
└── package.json
```

### 2. 配置管理

- 使用 TypeScript 配置文件获得更好的类型提示
- 将敏感信息放在环境变量中
- 为不同环境创建不同的配置文件
- 使用版本控制管理配置文件

### 3. 性能优化

- 合理设置 `typesOnly` 选项
- 使用 `pathPrefix` 过滤不需要的接口
- 通过 `categories` 选择性生成特定分类的接口

### 4. 团队协作

- 统一配置文件格式和命名规范
- 在 README 中说明配置要求
- 提供配置模板和示例
- 建立配置审查流程

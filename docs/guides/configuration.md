# 配置指南

`@scx/api-tool` 使用灵活的配置系统来支持不同的 API 平台和生成需求。

## 配置文件

### 文件类型

支持两种配置文件格式：

- **TypeScript** (`api-power.config.ts`) - 推荐，提供完整的类型提示
- **JavaScript** (`api-power.config.js`) - 简单配置场景

### 配置文件位置

工具按以下顺序查找配置文件：

1. 命令行指定的配置文件 (`-c` 参数)
2. 当前目录的 `api-power.config.ts`
3. 当前目录的 `api-power.config.js`

## 配置结构

配置文件导出一个配置数组，每个配置项对应一个 API 项目：

```typescript
import { defineConfig } from '@scx/api-tool';

export default defineConfig([
  {
    // 基础配置
    serverUrl: 'https://api.apifox.com',
    serverType: 'apifox',
    apifoxProjectId: '123456789',

    // 输出配置
    outputDir: 'src/service',

    // ... 其他配置
  },
]);
```

## 基础配置

### 服务器配置

| 配置项            | 类型                    | 必填 | 说明           | 示例                       |
| ----------------- | ----------------------- | ---- | -------------- | -------------------------- |
| `serverUrl`       | `string`                | ✅   | API 服务器地址 | `'https://api.apifox.com'` |
| `serverType`      | `'apifox' \| 'swagger'` | ✅   | API 平台类型   | `'apifox'`                 |
| `apifoxProjectId` | `string`                | ❌   | Apifox 项目 ID | `'123456789'`              |

### 输出配置

| 配置项       | 类型                           | 默认值          | 说明               |
| ------------ | ------------------------------ | --------------- | ------------------ |
| `outputDir`  | `string`                       | `'src/service'` | 输出目录路径       |
| `typesOnly`  | `boolean`                      | `false`         | 是否只生成类型定义 |
| `target`     | `'typescript' \| 'javascript'` | `'typescript'`  | 输出代码类型       |
| `indentSize` | `number`                       | `2`             | 代码缩进大小       |

### 请求配置

```typescript
requestConfig: {
  baseURL: 'https://api.example.com',  // API 基础地址
  timeout: 10000,                      // 请求超时时间
  headers: {                          // 默认请求头
    'Content-Type': 'application/json'
  }
}
```

### 类型配置

```typescript
typeConfig: {
  enumType: 'union' | 'enum',         // 枚举类型生成方式
  optionalType: 'optional' | 'undefined',  // 可选类型生成方式
  arrayType: 'Array' | '[]'           // 数组类型生成方式
}
```

## 过滤配置

### 标签过滤

```typescript
filter: {
  includeTags: ['用户管理', '订单管理'],  // 包含的标签
  excludeTags: ['内部接口', '测试接口'],   // 排除的标签
}
```

### 路径过滤

```typescript
filter: {
  includePaths: ['/api/v1/users.*'],     // 包含的路径（正则）
  excludePaths: ['/admin/.*', '/test/.*'], // 排除的路径（正则）
}
```

### 方法过滤

```typescript
filter: {
  includeMethods: ['GET', 'POST'],      // 包含的 HTTP 方法
  excludeMethods: ['DELETE', 'PATCH'],   // 排除的 HTTP 方法
}
```

## 模板配置

### 自定义模板

```typescript
templateConfig: {
  templateDir: './custom-templates',    // 自定义模板目录
  typeTemplate: 'custom-type.hbs',      // 自定义类型模板
  requestTemplate: 'custom-request.hbs' // 自定义请求模板
}
```

### 输出文件配置

```typescript
outputFiles: {
  types: 'types.ts',                    // 类型定义文件名
  request: 'request.ts',                // 请求函数文件名
  index: 'index.ts',                    // 主入口文件名
  categoryIndex: '{category}/index.ts', // 分组索引文件名
  categoryTypes: '{category}/types.ts'  // 分组类型文件名
}
```

## 高级配置

### 项目配置

```typescript
projects: [
  {
    token: 'your-access-token', // 项目访问令牌
    categories: [
      // 分类配置
      {
        id: 12345, // 分类 ID
        getRequestFunctionName: (interfaceInfo, changeCase) => {
          // 自定义请求函数名生成规则
          return changeCase.camelCase(interfaceInfo.path);
        },
      },
    ],
  },
];
```

### 钩子函数

```typescript
hooks: {
  // 生成前钩子
  beforeGenerate: async (config) => {
    console.log('开始生成代码...');
  },

  // 生成成功钩子
  success: async (outputFiles) => {
    console.log(`生成了 ${outputFiles.length} 个文件`);

    // 运行代码格式化
    exec('npm run format');
  },

  // 生成失败钩子
  error: async (error) => {
    console.error('生成失败:', error);
    // 发送错误通知
    notify.sendError(error);
  },

  // 完成钩子（无论成功失败都会执行）
  complete: async () => {
    console.log('操作完成');
  }
}
```

## 配置示例

### 1. 基础配置

```typescript
import { defineConfig } from '@scx/api-tool';

export default defineConfig([
  {
    serverUrl: 'https://api.apifox.com',
    serverType: 'apifox',
    apifoxProjectId: '123456789',
    outputDir: 'src/service',
    typesOnly: false,
    target: 'typescript',
  },
]);
```

### 2. 完整配置

```typescript
import { defineConfig } from '@scx/api-tool';

export default defineConfig([
  {
    // 服务器配置
    serverUrl: 'https://api.apifox.com',
    serverType: 'apifox',
    apifoxProjectId: '123456789',

    // 输出配置
    outputDir: 'src/service',
    typesOnly: false,
    target: 'typescript',
    indentSize: 2,

    // 请求配置
    requestConfig: {
      baseURL: 'https://api.example.com',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    },

    // 类型配置
    typeConfig: {
      enumType: 'union',
      optionalType: 'optional',
      arrayType: 'Array',
    },

    // 过滤配置
    filter: {
      includeTags: ['用户管理', '订单管理'],
      excludePaths: ['/admin/.*', '/test/.*'],
    },

    // 项目配置
    projects: [
      {
        token: process.env.API_TOKEN,
        categories: [
          {
            id: 0,
            getRequestFunctionName: (interfaceInfo, changeCase) => {
              const path = interfaceInfo.path.replace(/^\//, '');
              return changeCase.camelCase(path);
            },
          },
        ],
      },
    ],

    // 钩子函数
    hooks: {
      success: async () => {
        console.log('代码生成成功！');
      },
      error: async (error) => {
        console.error('生成失败:', error);
      },
    },
  },
]);
```

### 3. 多项目配置

```typescript
export default defineConfig([
  // 用户服务
  {
    name: 'user-service',
    serverUrl: 'https://api.apifox.com',
    serverType: 'apifox',
    apifoxProjectId: 'user-project-id',
    outputDir: 'src/services/user',

    filter: {
      includeTags: ['用户管理'],
    },

    requestConfig: {
      baseURL: 'https://api.example.com/user',
    },
  },

  // 订单服务
  {
    name: 'order-service',
    serverUrl: 'https://api.apifox.com',
    serverType: 'apifox',
    apifoxProjectId: 'order-project-id',
    outputDir: 'src/services/order',

    filter: {
      includeTags: ['订单管理'],
    },

    requestConfig: {
      baseURL: 'https://api.example.com/order',
    },
  },
]);
```

### 4. 环境变量配置

```typescript
import { defineConfig } from '@scx/api-tool';

export default defineConfig([
  {
    serverUrl: process.env.API_SERVER_URL || 'https://api.apifox.com',
    serverType: 'apifox',
    apifoxProjectId: process.env.APIFOX_PROJECT_ID || '123456789',

    outputDir: process.env.OUTPUT_DIR || 'src/service',

    projects: [
      {
        token: process.env.API_TOKEN,
        categories: [{ id: 0 }],
      },
    ],

    // 开发环境特殊配置
    ...(process.env.NODE_ENV === 'development' && {
      requestConfig: {
        baseURL: 'http://localhost:3000/api',
      },
    }),
  },
]);
```

## 环境变量

### 常用环境变量

```bash
# API 配置
API_SERVER_URL=https://api.apifox.com
API_TOKEN=your-access-token
APIFOX_PROJECT_ID=123456789

# 输出配置
OUTPUT_DIR=src/service
TARGET=typescript

# 调试配置
DEBUG=true
VERBOSE=true
```

### .env 文件

```bash
# .env
API_SERVER_URL=https://api.apifox.com
API_TOKEN=your-secret-token
OUTPUT_DIR=src/service
```

```typescript
// 配置中使用
export default defineConfig([
  {
    serverUrl: process.env.API_SERVER_URL,
    projects: [
      {
        token: process.env.API_TOKEN,
      },
    ],
  },
]);
```

## 配置验证

### TypeScript 类型检查

使用 `defineConfig` 函数确保类型安全：

```typescript
import { defineConfig, ApiConfig } from '@scx/api-tool';

// 自动类型推断
export default defineConfig([
  {
    // IDE 会提供完整的类型提示和验证
    serverUrl: 'https://api.apifox.com',
    // ...
  },
]);

// 或者显式类型注解
const config: ApiConfig[] = [
  {
    serverUrl: 'https://api.apifox.com',
    // ...
  },
];

export default defineConfig(config);
```

### 运行时验证

工具会自动验证配置：

- ✅ 必填字段检查
- ✅ URL 格式验证
- ✅ 枚举值验证
- ✅ 文件路径检查
- ❌ 网络连接测试（可选）

## 最佳实践

### 1. 项目结构

```
project/
├── api-power.config.ts     # 主配置文件
├── .env.example           # 环境变量示例
├── .env.local             # 本地环境变量（不提交）
├── src/
│   └── service/           # 生成的代码目录
└── package.json
```

### 2. 配置管理

- ✅ 使用 TypeScript 配置文件
- ✅ 敏感信息使用环境变量
- ✅ 提供 .env.example 文件
- ✅ 配置文件加入版本控制

### 3. 团队协作

- 在 README 中说明配置要求
- 提供配置模板
- 统一命名规范
- 建立配置审查流程

### 4. 性能优化

- 使用过滤器减少生成内容
- 合理设置 `typesOnly` 选项
- 避免生成不必要的接口
- 使用缓存机制（如果支持）

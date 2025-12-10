# 快速开始示例

本教程将通过一个完整的示例，展示如何使用 `@scx/api-tool` 从 Apifox 平台生成代码。

## 准备工作

### 1. 准备 Apifox 项目

确保你有一个 Apifox 项目，并且：

- 项目已配置好 API 接口
- 知道项目 ID（在 Apifox 项目设置中找到）

### 2. 初始化项目

```bash
mkdir my-api-project
cd my-api-project
npm init -y
npm install @scxfe/api-tool --save-dev
```

## 步骤 1: 初始化配置

创建配置文件：

```bash
npx api-power init
```

这将创建 `api-power.config.ts` 文件。

## 步骤 2: 配置 API 源

编辑 `api-power.config.ts`：

```typescript
import { defineConfig } from '@scx/api-tool';

export default defineConfig([
  {
    // 基础配置
    serverUrl: 'https://api.apifox.com',
    serverType: 'apifox',
    apifoxProjectId: '123456789', // 替换为你的项目 ID

    // 输出配置
    outputDir: 'src/service',
    typesOnly: false,
    target: 'typescript',

    // 请求配置
    requestConfig: {
      baseURL: 'https://api.example.com',
      timeout: 10000,
    },

    // 类型配置
    typeConfig: {
      enumType: 'union',
      optionalType: 'optional',
    },

    // 过滤配置
    filter: {
      includeTags: ['用户管理', '订单管理'],
      excludePaths: ['/internal/.*'],
    },
  },
]);
```

## 步骤 3: 生成代码

运行生成命令：

```bash
npx api-power
```

你会看到类似输出：

```
✓ 连接到 Apifox 平台
✓ 获取项目信息 (项目 ID: 123456789)
✓ 获取接口列表 (共 15 个接口)
✓ 生成类型定义 (45 个类型)
✓ 生成请求函数 (15 个函数)
✓ 生成分组文件 (3 个分组)

🎉 代码生成完成！
📁 输出目录: src/service
```

## 步骤 4: 查看生成的代码

### 生成的文件结构

```
src/service/
├── index.ts           # 主入口，导出所有内容
├── types.ts           # 基础类型定义
├── request.ts         # HTTP 请求配置
├── user/
│   ├── index.ts       # 用户相关 API
│   └── types.ts       # 用户相关类型
├── order/
│   ├── index.ts       # 订单相关 API
│   └── types.ts       # 订单相关类型
└── product/
    ├── index.ts       # 产品相关 API
    └── types.ts       # 产品相关类型
```

### 生成的代码示例

#### 类型定义 (src/service/user/types.ts)

```typescript
export interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  avatar?: string;
}
```

#### 请求函数 (src/service/user/index.ts)

```typescript
import { request } from '../request';
import type { User, CreateUserRequest, UpdateUserRequest } from './types';

export function getUser(id: number): Promise<User> {
  return request.get(`/users/${id}`);
}

export function createUser(data: CreateUserRequest): Promise<User> {
  return request.post('/users', data);
}

export function updateUser(id: number, data: UpdateUserRequest): Promise<User> {
  return request.put(`/users/${id}`, data);
}

export function deleteUser(id: number): Promise<void> {
  return request.delete(`/users/${id}`);
}
```

#### 主入口 (src/service/index.ts)

```typescript
export * from './types';
export * from './request';
export * from './user';
export * from './order';
export * from './product';
```

## 步骤 5: 在项目中使用

### React 示例

```tsx
import React, { useState, useEffect } from 'react';
import { getUser, createUser, updateUser } from '@/src/service';

function UserProfile({ userId }: { userId: number }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const userData = await getUser(userId);
        setUser(userData);
      } catch (error) {
        console.error('获取用户失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  const handleUpdate = async (data: UpdateUserRequest) => {
    try {
      const updatedUser = await updateUser(userId, data);
      setUser(updatedUser);
    } catch (error) {
      console.error('更新用户失败:', error);
    }
  };

  if (loading) return <div>加载中...</div>;
  if (!user) return <div>用户不存在</div>;

  return (
    <div>
      <h1>{user.username}</h1>
      <p>{user.email}</p>
      <button onClick={() => handleUpdate({ username: '新用户名' })}>更新用户名</button>
    </div>
  );
}
```

### Node.js 示例

```typescript
import { createUser, getUser } from '../src/service';
import express from 'express';

const app = express();
app.use(express.json());

app.post('/users', async (req, res) => {
  try {
    const user = await createUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/users/:id', async (req, res) => {
  try {
    const user = await getUser(Number(req.params.id));
    res.json(user);
  } catch (error) {
    res.status(404).json({ error: '用户不存在' });
  }
});

app.listen(3000, () => {
  console.log('服务器运行在端口 3000');
});
```

## 高级配置

### 自定义模板

如果默认生成的代码不符合需求，可以创建自定义模板：

```bash
mkdir -p templates
# 创建自定义模板文件
```

然后在配置中指定模板目录：

```typescript
export default defineConfig([
  {
    // ... 其他配置
    templateDir: './templates',
  },
]);
```

### 多项目配置

同时配置多个 API 项目：

```typescript
export default defineConfig([
  {
    name: 'user-service',
    serverUrl: 'https://api.apifox.com',
    serverType: 'apifox',
    apifoxProjectId: '123456789',
    outputDir: 'src/services/user',
  },
  {
    name: 'order-service',
    serverUrl: 'https://api.apifox.com',
    serverType: 'apifox',
    apifoxProjectId: '987654321',
    outputDir: 'src/services/order',
  },
]);
```

## 常见问题

### 1. 接口被过滤掉

检查 `filter` 配置，确保接口标签和路径匹配你的过滤条件。

### 2. 类型生成不完整

确保 API 定义中的数据结构完整，检查 Apifox 中的响应数据定义。

### 3. 请求函数生成失败

检查 `requestConfig.baseURL` 配置是否正确。

## 下一步

- [配置指南](../guides/configuration) - 了解所有配置选项
- [CLI 命令参考](../guides/cli) - 查看所有可用命令
- [模板自定义](../guides/templates) - 创建自定义代码模板

## 实用技巧

1. **使用脚本**: 在 `package.json` 中添加快捷脚本：

```json
{
  "scripts": {
    "api:gen": "api-power",
    "api:init": "api-power init",
    "api:debug": "api-power debug"
  }
}
```

2. **版本控制**: 将 `api-power.config.ts` 加入版本控制，但忽略生成的代码文件：

```gitignore
src/service/*
```

3. **自动化**: 使用 Git hooks 在 API 更新时自动生成代码。

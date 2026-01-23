# 快速开始示例

本教程将通过一个完整的示例，展示如何使用 `@scx/api-tool` 从 Apifox 平台生成代码。

## 准备工作

### 1. 准备 Apifox 项目

确保你有一个 Apifox 项目，并且：

- 项目已配置好 API 接口
- 知道项目的 OpenAPI 导出地址

### 2. 初始化项目

```bash
mkdir my-api-project
cd my-api-project
npm init -y
npm install @scxfe/api-tool --save-dev
```

## 步骤 1: 创建配置文件

创建配置文件：

```bash
npx api-power init
```

这将创建 `api-power.config.ts` 文件。

## 步骤 2: 配置 API 源

编辑 `api-power.config.ts`：

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  // API 数据源 (必需)
  source: 'https://api.apifox.com/v1/projects/YOUR_PROJECT_ID/export-openapi',
  token: 'APS-YourAccessTokenHere',

  // 输出配置 (可选)
  outputDir: 'src/service',
  generateApi: true,
  generateTypes: true,
  target: 'typescript',
});
```

获取 Apifox Token:

1. 登录 Apifox 平台
2. 进入项目设置
3. 找到"访问令牌"或"Access Token"
4. 创建新的访问令牌
5. 复制令牌（格式类似：`APS-xxxxxxxxxxxx`）

获取项目 ID:

1. 打开你的 Apifox 项目
2. 在项目页面找导出功能
3. 选择"导出 OpenAPI"
4. 复制完整的 URL（包含项目 ID）

## 步骤 3: 生成代码

运行生成命令：

```bash
npx api-power
```

你会看到类似输出：

```
连接到 Apifox 平台
获取项目信息 (项目 ID: 6997172)
获取接口列表 (共 23 个接口)
生成类型定义 (45 个类型)
生成请求函数 (23 个函数)
生成分组文件 (4 个分组)
代码生成完成！
输出目录: src/service
耗时: 3.2s
```

## 步骤 4: 查看生成的代码

### 生成的文件结构

```
src/service/
├── index.ts           # 主入口，导出所有内容
├── request.ts         # HTTP 请求配置
├── types/             # 类型定义目录
│   ├── index.ts       # 类型索引文件
│   ├── User.ts        # 用户类型
│   └── Product.ts     # 产品类型
├── user/              # 用户相关 API
│   └── index.ts       # 用户 API 函数
├── order/             # 订单相关 API
│   └── index.ts       # 订单 API 函数
└── product/           # 产品相关 API
    └── index.ts       # 产品 API 函数
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
import { getUser, createUser, updateUser } from '@/service/user';

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
import { createUser, getUser } from '../service/user';
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

### Vue 3 示例

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getUser, updateUser } from '@/service/user';

const props = defineProps<{ userId: number }>();
const user = ref<User | null>(null);
const loading = ref(false);

const fetchUser = async () => {
  loading.value = true;
  try {
    user.value = await getUser(props.userId);
  } catch (error) {
    console.error('获取用户失败:', error);
  } finally {
    loading.value = false;
  }
};

const handleUpdate = async (data: UpdateUserRequest) => {
  try {
    user.value = await updateUser(props.userId, data);
  } catch (error) {
    console.error('更新用户失败:', error);
  }
};

onMounted(() => {
  fetchUser();
});
</script>

<template>
  <div v-if="loading">加载中...</div>
  <div v-else-if="user">
    <h1>{{ user.username }}</h1>
    <p>{{ user.email }}</p>
    <button @click="handleUpdate({ username: '新用户名' })">更新用户名</button>
  </div>
  <div v-else>用户不存在</div>
</template>
```

## 高级配置

### 只生成类型定义

```typescript
export default defineConfig({
  source: 'https://api.apifox.com/v1/projects/YOUR_PROJECT_ID/export-openapi',
  token: 'APS-YourAccessTokenHere',

  generateApi: false,
  generateTypes: true,
});
```

### 自定义路径前缀

```typescript
export default defineConfig({
  source: 'https://api.apifox.com/v1/projects/YOUR_PROJECT_ID/export-openapi',
  token: 'APS-YourAccessTokenHere',

  pathPrefix: '/api/v1',
});
```

### 使用预设配置

```typescript
export default defineConfig({
  source: 'https://api.apifox.com/v1/projects/YOUR_PROJECT_ID/export-openapi',
  token: 'APS-YourAccessTokenHere',

  // 使用 verbose 预设
  preset: 'verbose',

  // 覆盖预设中的某些选项
  outputDir: 'src/api',
});
```

## 常见问题

### 1. 接口被过滤掉

确保 API 源 URL 正确，token 有足够的权限。

### 2. 类型生成不完整

确保 Apifox 项目中的接口定义完整，包括响应数据结构。

### 3. 请求函数生成失败

检查网络连接，确保可以访问 Apifox 平台。

## 下一步

- [配置指南](../guides/configuration) - 了解所有配置选项
- [CLI 命令参考](../guides/cli) - 查看所有可用命令

## 实用技巧

### 1. 使用脚本

在 `package.json` 中添加脚本：

```json
{
  "scripts": {
    "api:gen": "api-power",
    "api:init": "api-power init",
    "api:debug": "api-power debug"
  }
}
```

### 2. 版本控制

将 `api-power.config.ts` 加入版本控制，但忽略生成的代码文件：

```gitignore
src/service/*
```

### 3. 自动化

使用 Git hooks 在 API 更新时自动生成代码。

### 4. 环境变量

使用环境变量管理敏感信息：

```typescript
export default defineConfig({
  source: process.env.API_SOURCE!,
  token: process.env.API_TOKEN!,
});
```

```bash
# .env
API_SOURCE=https://api.apifox.com/v1/projects/YOUR_PROJECT_ID/export-openapi
API_TOKEN=APS-YourAccessTokenHere
```

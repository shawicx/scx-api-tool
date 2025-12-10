# 高级用法

本文档介绍 `@scx/api-tool` 的高级功能和使用技巧。

## 多项目配置

### 微服务架构支持

```typescript
// api-power.config.ts
export default defineConfig([
  // 用户服务
  {
    name: 'user-service',
    serverUrl: 'https://api.apifox.com',
    serverType: 'apifox',
    apifoxProjectId: 'user-project-id',
    outputDir: 'src/services/user',

    requestConfig: {
      baseURL: 'https://api.example.com/user',
    },

    filter: {
      includeTags: ['用户管理', '认证'],
    },
  },

  // 订单服务
  {
    name: 'order-service',
    serverUrl: 'https://api.apifox.com',
    serverType: 'apifox',
    apifoxProjectId: 'order-project-id',
    outputDir: 'src/services/order',

    requestConfig: {
      baseURL: 'https://api.example.com/order',
    },

    filter: {
      includeTags: ['订单管理', '支付'],
    },
  },

  // 通知服务
  {
    name: 'notification-service',
    serverUrl: 'https://api.apifox.com',
    serverType: 'apifox',
    apifoxProjectId: 'notification-project-id',
    outputDir: 'src/services/notification',

    requestConfig: {
      baseURL: 'https://api.example.com/notification',
    },

    filter: {
      includeTags: ['消息推送', '邮件'],
    },
  },
]);
```

### 统一入口文件

创建统一的 API 入口：

```typescript
// src/services/index.ts
export * from './user';
export * from './order';
export * from './notification';

// 创建统一客户端
class UnifiedApiClient {
  constructor(
    private userClient: UserClient,
    private orderClient: OrderClient,
    private notificationClient: NotificationClient,
  ) {}

  // 组合操作示例
  async createUserWithNotification(userData: CreateUserRequest) {
    const user = await this.userClient.createUser(userData);

    // 发送欢迎通知
    await this.notificationClient.sendWelcomeEmail({
      userId: user.id,
      email: user.email,
    });

    return user;
  }
}

export const apiClient = new UnifiedApiClient(userClient, orderClient, notificationClient);
```

## 环境配置

### 多环境支持

```typescript
// api-power.config.ts
const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

export default defineConfig([
  {
    serverUrl: process.env.API_SERVER_URL || 'https://api.apifox.com',
    serverType: 'apifox',
    apifoxProjectId: process.env.APIFOX_PROJECT_ID || '123456789',

    outputDir: 'src/service',
    typesOnly: false,
    target: 'typescript',

    // 环境特定的请求配置
    requestConfig: {
      baseURL: isDevelopment
        ? 'http://localhost:3000/api'
        : isTest
          ? 'https://test-api.example.com'
          : 'https://api.example.com',
      timeout: isDevelopment ? 30000 : 10000,
      headers: {
        'Content-Type': 'application/json',
        ...(isDevelopment && { 'X-Debug': 'true' }),
      },
    },

    // 开发环境额外配置
    ...(isDevelopment && {
      hooks: {
        success: async () => {
          console.log('🎉 API 类型生成完成');
          // 开发环境自动启动类型检查
          exec('npm run type-check');
        },
      },
    }),
  },
]);
```

### 环境变量配置

```bash
# .env.development
API_SERVER_URL=https://api.apifox.com
APIFOX_PROJECT_ID=dev-project-id
OUTPUT_DIR=src/service
NODE_ENV=development

# .env.production
API_SERVER_URL=https://api.apifox.com
APIFOX_PROJECT_ID=prod-project-id
OUTPUT_DIR=src/service
NODE_ENV=production
```

## 高级过滤

### 复杂过滤规则

```typescript
export default defineConfig([
  {
    // ... 基础配置

    filter: {
      // 包含特定标签
      includeTags: ['用户管理', '订单管理', '商品管理'],

      // 排除内部接口
      excludePaths: [
        '/admin/.*', // 管理后台接口
        '/internal/.*', // 内部服务接口
        '/test/.*', // 测试接口
        '/health', // 健康检查
        '/metrics', // 监控指标
      ],

      // 排除特定方法
      excludeMethods: ['OPTIONS', 'HEAD'],

      // 自定义过滤函数
      customFilter: (interfaceInfo) => {
        // 排除已废弃的接口
        if (interfaceInfo.description?.includes('[废弃]')) {
          return false;
        }

        // 只包含有文档的接口
        if (!interfaceInfo.summary || interfaceInfo.summary.trim() === '') {
          return false;
        }

        // 排除参数过多的接口（可选）
        if (interfaceInfo.parameters.length > 10) {
          console.warn(`接口参数过多，已排除: ${interfaceInfo.name}`);
          return false;
        }

        return true;
      },
    },
  },
]);
```

### 分组生成

```typescript
export default defineConfig([
  {
    name: 'public-api',
    serverUrl: 'https://api.apifox.com',
    serverType: 'apifox',
    apifoxProjectId: '123456789',
    outputDir: 'src/service/public',

    filter: {
      includeTags: ['公开接口'],
      excludePaths: ['/admin/.*'],
    },
  },

  {
    name: 'admin-api',
    serverUrl: 'https://api.apifox.com',
    serverType: 'apifox',
    apifoxProjectId: '123456789',
    outputDir: 'src/service/admin',

    filter: {
      includeTags: ['管理接口'],
      includePaths: ['/admin/.*'],
    },
  },
]);
```

## 自定义钩子

### 完整的钩子配置

```typescript
export default defineConfig([
  {
    // ... 基础配置

    hooks: {
      // 生成前
      beforeGenerate: async (config) => {
        console.log('🚀 开始生成 API 代码...');
        console.log(`配置: ${config.name || 'default'}`);

        // 备份现有文件
        if (fs.existsSync(config.outputDir)) {
          const backupDir = `${config.outputDir}.backup.${Date.now()}`;
          fs.cpSync(config.outputDir, backupDir, { recursive: true });
          console.log(`📁 已备份到: ${backupDir}`);
        }
      },

      // 数据获取后
      afterFetch: async (data) => {
        console.log(`📥 获取到 ${data.interfaces.length} 个接口`);
        console.log(`📋 获取到 ${data.types.length} 个类型`);

        // 数据验证
        const invalidInterfaces = data.interfaces.filter(
          (iface) => !iface.name || !iface.method || !iface.path,
        );

        if (invalidInterfaces.length > 0) {
          console.warn(`⚠️  发现 ${invalidInterfaces.length} 个无效接口`);
        }
      },

      // 生成成功
      success: async (outputFiles) => {
        console.log(`✅ 成功生成 ${outputFiles.length} 个文件`);

        // 格式化生成的代码
        try {
          exec('npm run format', { cwd: process.cwd() });
          console.log('🎨 代码格式化完成');
        } catch (error) {
          console.warn('⚠️  代码格式化失败:', error.message);
        }

        // 类型检查
        try {
          exec('npm run type-check', { cwd: process.cwd() });
          console.log('🔍 类型检查通过');
        } catch (error) {
          console.warn('⚠️  类型检查失败，请检查生成的代码');
        }

        // 统计信息
        const stats = await analyzeGeneratedFiles(outputFiles);
        console.log('📊 生成统计:');
        console.log(`   - 类型定义: ${stats.typeCount}`);
        console.log(`   - 接口函数: ${stats.interfaceCount}`);
        console.log(`   - 总行数: ${stats.totalLines}`);
      },

      // 生成失败
      error: async (error) => {
        console.error('❌ 代码生成失败:', error.message);

        // 发送错误通知
        if (process.env.NODE_ENV === 'production') {
          await sendErrorNotification({
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
          });
        }

        // 恢复备份（如果存在）
        const backupDirs = fs
          .readdirSync('.')
          .filter((dir) => dir.startsWith('src.service.backup.'))
          .sort()
          .reverse();

        if (backupDirs.length > 0) {
          const latestBackup = backupDirs[0];
          if (fs.existsSync(latestBackup)) {
            fs.rmSync('src/service', { recursive: true, force: true });
            fs.cpSync(latestBackup, 'src/service', { recursive: true });
            console.log(`🔄 已恢复备份: ${latestBackup}`);
          }
        }
      },

      // 完成（无论成功失败）
      complete: async () => {
        console.log('🏁 API 代码生成操作完成');

        // 清理旧备份（保留最近5个）
        const backupDirs = fs
          .readdirSync('.')
          .filter((dir) => dir.startsWith('src.service.backup.'))
          .sort()
          .slice(0, -5);

        for (const backupDir of backupDirs) {
          fs.rmSync(backupDir, { recursive: true, force: true });
        }
      },
    },
  },
]);

// 辅助函数
async function analyzeGeneratedFiles(files: string[]) {
  let typeCount = 0;
  let interfaceCount = 0;
  let totalLines = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n').length;
    totalLines += lines;

    if (file.includes('type')) {
      typeCount += (content.match(/interface|type/g) || []).length;
    }

    if (file.includes('request') || file.includes('index')) {
      interfaceCount += (content.match(/function|export/g) || []).length / 2;
    }
  }

  return { typeCount, interfaceCount, totalLines };
}

async function sendErrorNotification(errorInfo: any) {
  // 发送到 Slack、钉钉或其他通知服务
  // 实现取决于你的通知系统
}
```

## 性能优化

### 大型项目优化

```typescript
export default defineConfig([
  {
    // ... 基础配置

    // 性能配置
    performance: {
      // 并发请求数量
      maxConcurrentRequests: 10,

      // 缓存配置
      cache: {
        enabled: true,
        ttl: 3600000, // 1小时
        dir: '.api-cache',
      },

      // 批处理配置
      batchSize: 50,

      // 超时配置
      timeout: {
        connect: 10000,
        socket: 30000,
        request: 60000,
      },
    },

    // 分批处理大型项目
    pagination: {
      enabled: true,
      pageSize: 100,
    },

    // 增量更新
    incremental: {
      enabled: true,
      hashFile: '.api-hash.json',
    },
  },
]);
```

### 内存优化

```typescript
// 处理大型 API 项目时的内存优化
export default defineConfig([
  {
    // ... 基础配置

    // 流式处理
    streaming: {
      enabled: true,
      chunkSize: 100,
    },

    // 内存监控
    memoryLimit: '512MB',

    // 垃圾回收策略
    gc: {
      aggressive: true,
      interval: 1000,
    },
  },
]);
```

## 集成开发流程

### Git Hooks 集成

```bash
# package.json
{
  "scripts": {
    "pre-commit": "api-power && git add src/service/",
    "post-merge": "api-power",
    "api:generate": "api-power",
    "api:check": "api-power --dry-run"
  },
  "husky": {
    "hooks": {
      "pre-commit": "npm run pre-commit",
      "post-merge": "npm run post-merge"
    }
  }
}
```

### CI/CD 集成

```yaml
# .github/workflows/api-update.yml
name: Update API Types

on:
  push:
    paths:
      - 'api-power.config.ts'
  schedule:
    - cron: '0 */6 * * *' # 每6小时检查一次

jobs:
  update-api:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Generate API types
        run: |
          npm run api:generate

      - name: Check for changes
        id: verify-changed-files
        run: |
          if [ -n "$(git status --porcelain)" ]; then
            echo "changed=true" >> $GITHUB_OUTPUT
          fi

      - name: Commit changes
        if: steps.verify-changed-files.outputs.changed == 'true'
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add src/service/
          git commit -m "chore: update API types"
          git push
```

### IDE 集成

```json
// .vscode/settings.json
{
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  }
}
```

## 监控和调试

### 详细的调试配置

```typescript
export default defineConfig([
  {
    // ... 基础配置

    // 调试配置
    debug: {
      enabled: true,
      level: 'verbose', // 'error' | 'warn' | 'info' | 'debug' | 'verbose'
      output: {
        file: './debug.log',
        console: true,
        format: 'json', // 'text' | 'json'
      },
    },

    // 监控配置
    monitoring: {
      enabled: true,
      metrics: {
        requestTime: true,
        fileSize: true,
        memoryUsage: true,
      },
      alerts: {
        slowRequest: 5000, // 5秒
        largeFile: 1024 * 1024, // 1MB
        highMemory: 512 * 1024 * 1024, // 512MB
      },
    },
  },
]);
```

### 自定义验证器

```typescript
export default defineConfig([
  {
    // ... 基础配置

    // 自定义验证
    validators: [
      // 检查接口命名规范
      {
        name: 'naming-convention',
        validate: (interfaceInfo) => {
          const validNamePattern = /^[a-z][a-zA-Z0-9]*$/;
          return validNamePattern.test(interfaceInfo.name);
        },
        message: '接口名称必须使用驼峰命名法',
      },

      // 检查必需参数
      {
        name: 'required-params',
        validate: (interfaceInfo) => {
          // GET 请求不应该有 body
          if (interfaceInfo.method === 'GET' && interfaceInfo.requestBody) {
            return false;
          }
          return true;
        },
        message: 'GET 请求不应该有请求体',
      },

      // 检查响应类型
      {
        name: 'response-type',
        validate: (interfaceInfo) => {
          // 检查是否定义了响应类型
          return interfaceInfo.responses.length > 0 && interfaceInfo.responses[0].type !== 'any';
        },
        message: '接口必须定义明确的响应类型',
      },
    ],
  },
]);
```

## 故障排除

### 常见问题和解决方案

#### 1. 大型项目生成失败

```typescript
// 解决方案：分批处理
export default defineConfig([
  {
    // ... 基础配置

    // 限制单次处理的接口数量
    batchSize: 100,

    // 启用分页
    pagination: {
      enabled: true,
      pageSize: 50,
    },
  },
]);
```

#### 2. 内存不足

```typescript
// 解决方案：优化内存使用
export default defineConfig([
  {
    // ... 基础配置

    // 流式处理
    streaming: {
      enabled: true,
      chunkSize: 50,
    },

    // 清理临时文件
    cleanup: {
      enabled: true,
      interval: 1000,
    },
  },
]);
```

#### 3. 网络超时

```typescript
// 解决方案：调整超时配置
export default defineConfig([
  {
    // ... 基础配置

    timeout: {
      connect: 30000, // 连接超时 30 秒
      socket: 60000, // Socket 超时 60 秒
      request: 120000, // 请求超时 120 秒
    },

    // 重试配置
    retry: {
      enabled: true,
      attempts: 3,
      delay: 1000,
    },
  },
]);
```

## 最佳实践总结

### 1. 配置管理

- 使用环境变量管理敏感信息
- 为不同环境创建不同的配置文件
- 定期备份配置文件

### 2. 性能优化

- 合理设置过滤器，减少生成内容
- 使用缓存机制避免重复请求
- 大型项目考虑分批处理

### 3. 团队协作

- 统一配置文件格式
- 使用 Git Hooks 确保代码同步
- 建立代码审查流程

### 4. 监控维护

- 启用详细日志记录
- 设置性能监控和告警
- 定期检查和更新配置

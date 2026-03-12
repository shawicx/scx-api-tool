# 高级用法

本文档介绍 `@scx/api-tool` 的高级功能和使用技巧。

## 自定义命名策略

### 完全自定义命名

`namingStrategy` 配置允许你完全覆盖默认的命名生成逻辑：

```typescript
import { defineConfig, type InterfaceNamingInfo } from '@scxfe/api-tool';

export default defineConfig({
  source: 'https://api.apifox.com/v1/projects/YOUR_PROJECT_ID/export-openapi',
  token: 'YOUR_TOKEN',

  // 自定义命名策略
  namingStrategy: {
    // 自定义接口名称生成
    interfaceName: (info: InterfaceNamingInfo) => {
      const method = info.method.charAt(0).toUpperCase() + info.method.slice(1).toLowerCase();
      const pathName = info.path
        .replace(/\{[^}]+\}/g, '')
        .replace(/^\//, '')
        .replace(/^api-?/i, '')
        .replace(/\//g, '-')
        .replace(/^-+|-+$/g, '');
      const words = pathName.split('-');
      const pascalCase = words
        .map((word) =>
          /[A-Z0-9]/.test(word.charAt(0)) ? word : word.charAt(0).toUpperCase() + word.slice(1),
        )
        .join('');
      return `${method}${pascalCase}`;
    },

    // 自定义函数名称生成
    functionName: (info: InterfaceNamingInfo) => {
      const camelCaseName = info.path
        .replace(/\{[^}]+\}/g, '')
        .replace(/^\//, '')
        .replace(/\//g, '_')
        .split('_')
        .map((word, index) =>
          index === 0
            ? word.toLowerCase()
            : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        )
        .join('');
      return `${camelCaseName}Api`;
    },

    // 自定义请求类型名称生成
    requestTypeName: (info: InterfaceNamingInfo) => {
      return `${info.operationId || info.path.replace(/\//g, '_')}RequestType`;
    },

    // 自定义响应类型名称生成
    responseTypeName: (info: InterfaceNamingInfo) => {
      return `${info.operationId || info.path.replace(/\//g, '_')}ResponseType`;
    },
  },
});
```

### 命名函数参数说明

每个命名函数接收 `InterfaceNamingInfo` 对象：

```typescript
interface InterfaceNamingInfo {
  path: string; // API 路径，如 "/api/users/{id}"
  method: string; // HTTP 方法，如 "GET", "POST"
  summary?: string; // 操作描述
  description?: string; // 操作详细描述
  operationId?: string; // 操作 ID（如果存在）
  tags?: string[]; // 标签数组
}
```

## 钩子系统

### 钩子生命周期

`hooks` 配置允许你在代码生成过程的不同阶段执行自定义操作：

```typescript
import { defineConfig } from '@scxfe/api-tool';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default defineConfig({
  source: 'https://api.apifox.com/v1/projects/YOUR_PROJECT_ID/export-openapi',
  token: 'YOUR_TOKEN',

  hooks: {
    // 开始生成前的钩子
    beforeGenerate: () => {
      console.log('开始生成 API 代码...');
    },

    // 生成完成后的钩子
    afterGenerate: () => {
      console.log('代码生成完成');
    },

    // 生成单个文件前的钩子（可以修改内容）
    beforeWriteFile: (filePath: string, content: string) => {
      console.log(`正在写入文件: ${filePath}`);
      return content;
    },

    // 生成单个文件后的钩子
    afterWriteFile: (filePath: string) => {
      console.log(`文件已生成: ${filePath}`);
    },
  },
});
```

### 实用钩子示例

#### 自动格式化和类型检查

```typescript
export default defineConfig({
  source: 'https://api.apifox.com/v1/projects/YOUR_PROJECT_ID/export-openapi',
  token: 'YOUR_TOKEN',

  hooks: {
    afterGenerate: async () => {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      // 格式化生成的代码
      try {
        await execAsync('npm run format');
        console.log('代码格式化完成');
      } catch (error) {
        console.warn('代码格式化失败:', error);
      }

      // 类型检查
      try {
        await execAsync('npm run type-check');
        console.log('类型检查通过');
      } catch (error) {
        console.warn('类型检查失败，请检查生成的代码');
      }
    },
  },
});
```

#### 统计生成信息

```typescript
export default defineConfig({
  source: 'https://api.apifox.com/v1/projects/YOUR_PROJECT_ID/export-openapi',
  token: 'YOUR_TOKEN',

  hooks: {
    afterGenerate: async () => {
      const fs = await import('fs');
      const path = await import('path');

      const stats = {
        files: 0,
        lines: 0,
        size: 0,
      };

      const countFiles = async (dir: string) => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            await countFiles(filePath);
          } else {
            const content = fs.readFileSync(filePath, 'utf-8');
            stats.files++;
            stats.lines += content.split('\n').length;
            stats.size += stat.size;
          }
        }
      };

      await countFiles('src/service');

      console.log('📊 生成统计:');
      console.log(`   - 文件数: ${stats.files}`);
      console.log(`   - 总行数: ${stats.lines}`);
      console.log(`   - 大小: ${(stats.size / 1024).toFixed(2)} KB`);
    },
  },
});
```

## Watch 模式

### 开发时自动重新生成

使用 `--watch` 选项可以监视配置文件变化，自动重新生成代码：

```bash
api-power --watch
```

Watch 模式适用于：

- 开发过程中频繁调整配置
- 测试不同的配置选项
- CI/CD 流程中的持续集成

### Watch 模式输出示例

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

## 环境配置

### 多环境支持

```typescript
// api-power.config.ts
const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

export default defineConfig({
  source:
    process.env.API_SOURCE || 'https://api.apifox.com/v1/projects/YOUR_PROJECT_ID/export-openapi',
  token: process.env.API_TOKEN || 'YOUR_TOKEN',

  outputDir: process.env.OUTPUT_DIR || 'src/service',
  generateApi: true,
  generateTypes: true,
  target: 'typescript',

  // 开发环境额外配置
  ...(isDevelopment && {
    comment: true,
    indentSize: 4,
  }),
});
```

### 环境变量配置

```bash
# .env.development
API_SOURCE=https://api.apifox.com/v1/projects/dev-project-id/export-openapi
API_TOKEN=dev-access-token
OUTPUT_DIR=src/service
NODE_ENV=development

# .env.production
API_SOURCE=https://api.apifox.com/v1/projects/prod-project-id/export-openapi
API_TOKEN=prod-access-token
OUTPUT_DIR=src/service
NODE_ENV=production
```

### 使用 dotenv 加载环境变量

```typescript
// api-power.config.ts
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  source: process.env.API_SOURCE,
  token: process.env.API_TOKEN,
  outputDir: process.env.OUTPUT_DIR || 'src/service',
  generateApi: true,
  generateTypes: true,
});
```

## 集成开发流程

### Git Hooks 集成

#### 使用 Husky

```bash
npm install --save-dev husky
npx husky init
```

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run api:generate
git add src/service/
```

```json
{
  "scripts": {
    "api:generate": "api-power",
    "api:debug": "api-power debug",
    "api:watch": "api-power --watch",
    "api:init": "api-power init"
  }
}
```

#### 使用 lint-staged

```bash
npm install --save-dev lint-staged
```

```json
{
  "lint-staged": {
    "src/service/**/*": ["npm run api:generate"],
    "*.ts": ["eslint --fix", "prettier --write"]
  }
}
```

### CI/CD 集成

#### GitHub Actions

```yaml
# .github/workflows/api-update.yml
name: Update API Types

on:
  push:
    paths:
      - 'api-power.config.ts'
      - '.github/workflows/api-update.yml'
  workflow_dispatch:

jobs:
  update-api:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Generate API types
        run: npm run api:generate
        env:
          API_SOURCE: ${{ secrets.API_SOURCE }}
          API_TOKEN: ${{ secrets.API_TOKEN }}

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

#### GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - api-update

api:generate:
  stage: api-update
  image: node:20
  script:
    - npm ci
    - npm run api:generate
    - |
      if [ -n "$(git status --porcelain)" ]; then
        git config --global user.email "gitlab-ci@gitlab.com"
        git config --global user.name "GitLab CI"
        git add src/service/
        git commit -m "chore: update API types" || echo "No changes"
        git push
      fi
  only:
    - main
    - schedules
```

### IDE 集成

#### VS Code 配置

```json
{
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "files.exclude": {
    "**/.api-cache": true,
    "**/.api-hash.json": true
  }
}
```

#### 推荐的 VS Code 扩展

- TypeScript and JavaScript Language Features
- ESLint
- Prettier
- Auto Import

## 调试和故障排除

### 启用调试模式

使用 `api-power debug` 命令可以在代码生成过程中显示详细的调试信息：

```bash
api-power debug
```

或通过设置环境变量达到相同效果：

```bash
DEBUG=true api-power
```

**调试输出的信息包括：**

- 配置处理的详细信息
- API 请求详情（URL、headers、请求体等）
- API 响应详情（状态码、数据类型等）
- 数据处理统计（接口数、类型数、分类数）
- 文件生成进度
- 模板编译和缓存状态

**两种方式的区别：**

- `api-power debug`：默认启用 verbose 模式（显示详细错误堆栈）
- `DEBUG=true api-power`：需要手动添加 `--verbose` 选项才能显示详细错误信息

### 常见问题

#### 1. 命名冲突

如果自定义命名导致重复名称，可以添加更复杂的逻辑：

```typescript
namingStrategy: {
  interfaceName: (info) => {
    const baseName = `${info.method}_${info.path.replace(/\//g, '_')}`;
    return baseName.replace(/[^a-zA-Z0-9_]/g, '');
  },
}
```

#### 2. 钩子执行失败

确保钩子函数是异步的：

```typescript
hooks: {
  afterGenerate: async () => {
    // 异步操作
    await someAsyncOperation();
  },
}
```

#### 3. Watch 模式不触发

检查配置文件路径是否正确，确保文件在监视范围内。

#### 4. 调试信息不够详细

如果需要查看更详细的调试信息，可以使用以下方式：

```bash
# 方式 1: 使用 debug 命令
api-power debug --verbose

# 方式 2: 设置环境变量并启用 verbose
DEBUG=true api-power --verbose
```

这将显示所有的调试信息，包括 API 请求详情、数据处理统计、文件生成进度等。

## 最佳实践

### 1. 配置管理

- 使用环境变量管理敏感信息（token）
- 为不同环境创建不同的配置文件
- 将 `api-power.config.ts` 加入版本控制，但忽略生成的代码

### 2. 命名规范

- 保持命名风格一致
- 使用清晰的描述性名称
- 考虑使用 operationId 来确保唯一性

### 3. 钩子使用

- 保持钩子函数简洁
- 避免在钩子中执行耗时操作
- 提供有意义的日志输出

### 4. 性能优化

- 合理设置 `concurrency` 参数控制并发
- 避免在 `beforeWriteFile` 中执行复杂操作
- 使用 Watch 模式减少手动生成次数

### 5. 团队协作

- 统一配置文件格式
- 使用 Git Hooks 确保代码同步
- 建立代码审查流程
- 在团队文档中说明命名规范

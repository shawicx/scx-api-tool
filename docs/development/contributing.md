# 贡献指南

感谢您对 `@scx/api-tool` 项目的关注！我们欢迎各种形式的贡献，包括但不限于：

- 🐛 报告 Bug
- 💡 提出新功能建议
- 📝 改进文档
- 🔧 提交代码修改
- 🧪 编写测试用例

## 开发环境设置

### 前置要求

- Node.js >= 16.0.0
- npm >= 7.0.0 或 pnpm >= 6.0.0
- Git

### 克隆项目

```bash
git clone https://github.com/shawicx/scx-api-tool.git
cd scx-api-tool
```

### 安装依赖

```bash
# 使用 npm
npm install

# 或使用 pnpm（推荐）
pnpm install
```

### 开发命令

```bash
# 开发模式运行
pnpm run dev

# 构建项目
pnpm run build

# 运行测试
pnpm run test

# 代码检查
pnpm run lint

# 自动修复代码格式
pnpm run lint:fix

# 类型检查
pnpm run type-check
```

## 项目结构

```
scx-api-tool/
├── src/                    # 源代码
│   ├── cli/               # CLI 相关代码
│   │   ├── commands/      # 命令实现
│   │   └── program.ts     # 主程序入口
│   ├── clients/           # API 客户端
│   │   ├── base/          # 基类 + 注册表
│   │   ├── implementations/ # ApifoxClient / SwaggerClient
│   │   └── index.ts       # 客户端工厂
│   ├── generator/         # 代码生成器
│   │   ├── index.ts       # 生成器主文件
│   │   ├── codegen.ts     # 代码生成逻辑
│   │   ├── extractor.ts   # 数据提取
│   │   ├── template.ts    # 模板处理
│   │   └── fileGenerator.ts # 文件生成
│   ├── processors/        # 数据处理器
│   │   └── openapi.ts     # OpenAPI 处理器
│   ├── templates/         # 代码模板
│   │   ├── types.ts       # 类型模板
│   │   ├── request.ts     # 请求模板
│   │   └── interface.ts   # 接口模板
│   ├── utils/             # 工具函数
│   ├── types/             # 类型定义
│   │   └── index.ts       # 主类型文件
│   └── index.ts           # 主入口文件
├── docs/                  # 文档
├── tests/                 # 测试文件
├── scripts/               # 构建脚本
├── package.json
└── README.md
```

## 开发流程

### 1. 创建分支

```bash
# 从 main 分支创建新分支
git checkout -b feature/your-feature-name

# 或修复 bug
git checkout -b fix/bug-description
```

### 2. 开发和测试

```bash
# 开发模式
pnpm run dev

# 运行测试
pnpm run test

# 代码检查
pnpm run lint

# 类型检查
pnpm run type-check
```

### 3. 提交代码

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```bash
# 功能开发
git commit -m "feat: add support for custom templates"

# Bug 修复
git commit -m "fix: resolve memory leak in large projects"

# 文档更新
git commit -m "docs: update installation guide"

# 代码重构
git commit -m "refactor: optimize data processing pipeline"
```

### 4. 推送和 PR

```bash
# 推送分支
git push origin feature/your-feature-name

# 创建 Pull Request
# 在 GitHub 上操作
```

## 代码规范

### TypeScript 规范

- 使用严格的 TypeScript 配置
- 所有函数必须有类型注解
- 接口优先于类型别名
- 使用 `const` 声明不可变变量

### 命名规范

- 文件名：kebab-case (`api-client.ts`)
- 变量和函数：camelCase (`getUserInfo`)
- 类和接口：PascalCase (`ApiClient`)
- 常量：SCREAMING_SNAKE_CASE (`API_BASE_URL`)

### 代码风格

我们使用 OxLint 和 Prettier 来保持代码风格一致：

```bash
# 自动格式化
pnpm run lint:fix

# 手动检查
pnpm run lint
```

## 测试指南

### 运行测试

```bash
# 运行所有测试
pnpm run test

# 运行特定测试文件
pnpm test api-client.test.ts

# 运行测试并生成覆盖率报告
pnpm run test:coverage

# 监听模式
pnpm run test:watch
```

### 编写测试

```typescript
// tests/client/apifox.test.ts
import { ApifoxClient } from '../../src/clients/implementations/ApifoxClient';
import { mockConfig } from '../mocks/config';

describe('ApifoxClient', () => {
  let client: ApifoxClient;

  beforeEach(() => {
    client = new ApifoxClient(mockConfig);
  });

  it('should fetch project info', async () => {
    const project = await client.getProjectInfo();
    expect(project).toBeDefined();
    expect(project.id).toBe('123456789');
  });

  it('should handle network errors', async () => {
    // 测试错误处理
    await expect(client.getProjectInfo()).rejects.toThrow();
  });
});
```

### 测试覆盖率

我们致力于保持高测试覆盖率：

- 核心功能：> 90%
- 工具函数：> 80%
- CLI 命令：> 85%

## 文档贡献

### 文档类型

- **用户文档**：使用指南、配置说明
- **API 文档**：接口说明、类型定义
- **开发文档**：架构说明、贡献指南

### 文档格式

- 使用 Markdown 格式
- 遵循现有的文档结构
- 包含代码示例
- 使用适当的标题层级

### 本地预览

```bash
# 启动文档开发服务器
pnpm run docs:dev

# 构建文档
pnpm run docs:build

# 预览构建结果
pnpm run docs:preview
```

## Bug 报告

### 报告模板

使用 GitHub Issues 报告 Bug，请包含以下信息：

1. **环境信息**
   - Node.js 版本
   - 操作系统
   - `@scx/api-tool` 版本

2. **问题描述**
   - 期望行为
   - 实际行为
   - 重现步骤

3. **配置信息**
   - 配置文件内容（敏感信息删除）
   - 命令行参数

4. **错误日志**
   - 完整的错误堆栈
   - 调试模式输出

### 示例报告

````markdown
## Bug Report

### Environment

- Node.js: 18.17.0
- OS: macOS 13.4
- @scx/api-tool: 1.2.3

### Description

When generating code from Apifox project, the tool crashes with "TypeError: Cannot read property 'id' of undefined"

### Steps to reproduce

1. Create api-power.config.ts with Apifox configuration
2. Run `api-power generate`
3. Error occurs

### Configuration

```typescript
export default defineConfig({
  baseOutputDir: 'src/service',
  services: [
    {
      name: 'main',
      folder: '.',
      source: 'https://api.apifox.com/v1/projects/123456789/export-openapi',
      token: 'APS-YourAccessTokenHere',
    },
  ],
});
```
````

### Error Log

```
TypeError: Cannot read property 'id' of undefined
    at ApifoxClient.extractInterfaces (/src/clients/apifox.ts:123:15)
    at async generateCode (/src/generator/index.ts:45:10)
```

```

## 功能请求

### 请求模板

1. **问题描述**
   - 需要解决的问题
   - 当前解决方案的不足

2. **建议方案**
   - 详细的功能描述
   - 使用场景
   - API 设计建议

3. **替代方案**
   - 考虑过的其他方案
   - 优缺点分析

4. **附加信息**
   - 相关链接
   - 参考资料

## 代码审查

### 审查清单

- [ ] 代码符合项目规范
- [ ] 包含适当的测试
- [ ] 文档已更新
- [ ] 没有引入破坏性变更
- [ ] 性能影响可接受
- [ ] 安全性已考虑

### 审查流程

1. 自动检查通过（CI）
2. 人工代码审查
3. 测试验证
4. 合并到主分支

## 发布流程

### 版本号

我们使用 [Semantic Versioning](https://semver.org/)：

- **主版本号**：不兼容的 API 修改
- **次版本号**：向下兼容的功能性新增
- **修订号**：向下兼容的问题修正

### 发布步骤

1. 更新版本号
2. 更新 CHANGELOG.md
3. 创建 Git 标签
4. 发布到 npm
5. 创建 GitHub Release

## 社区

### 获取帮助

- [GitHub Discussions](https://github.com/shawicx/scx-api-tool/discussions)
- [GitHub Issues](https://github.com/shawicx/scx-api-tool/issues)
- [文档网站](https://scx-api-tool.netlify.app/)

### 联系方式

- 邮箱：shawicx@example.com
- Twitter：@shawicx

## 许可证

本项目使用 [MIT 许可证](https://opensource.org/licenses/MIT)。

## 致谢

感谢所有为项目做出贡献的开发者！

### 贡献者

- [@shawicx](https://github.com/shawicx) - 项目创建者和维护者
- 其他贡献者...

### 特别感谢

- [TypeScript](https://www.typescriptlang.org/) - 类型系统支持
- [Handlebars](https://handlebarsjs.com/) - 模板引擎
- [Commander.js](https://github.com/tj/commander.js) - CLI 框架
- [VitePress](https://vitepress.dev/) - 文档生成

## 行为准则

我们致力于为每个人提供友好、安全和欢迎的环境。请阅读并遵守我们的[行为准则](CODE_OF_CONDUCT.md)。

### 我们的承诺

- 使用友好和包容的语言
- 尊重不同的观点和经验
- 优雅地接受建设性批评
- 关注对社区最有利的事情
- 对其他社区成员表示同理心

### 不可接受的行为

- 使用性化的语言或图像
- 人身攻击或政治攻击
- 公开或私下骚扰
- 未经明确许可发布他人的私人信息
- 其他在专业环境中可能被认为不当的行为

## 更多资源

- [开发文档](./architecture.md)
- [使用指南](../guides/)
- [配置参考](../api/configuration.md)

---

再次感谢您的贡献！🎉
```

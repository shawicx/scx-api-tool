# 开发者上手指南

## 前置要求

| 要求    | 版本      | 说明                   |
| ------- | --------- | ---------------------- |
| Node.js | >= 20.0.0 | ESM 和现代 API 所需    |
| pnpm    | 最新版    | 包管理器（不支持 npm） |
| Git     | 任意版本  | 版本控制               |

## 本地环境搭建

```bash
# 1. 克隆仓库
git clone https://github.com/shawicx/scx-api-tool.git
cd scx-api-tool

# 2. 安装依赖
pnpm install

# 3. 构建项目
pnpm run build

# 4. 开发模式运行（需要配置文件）
pnpm run dev
```

## 脚本命令参考

### 开发

| 脚本    | 命令                                                     | 说明                                  |
| ------- | -------------------------------------------------------- | ------------------------------------- |
| `dev`   | `tsx src/index.ts generate --config api-power.config.ts` | 使用 tsx 直接运行代码生成（无需构建） |
| `build` | `NODE_ENV=production tsdown`                             | 生产构建，输出到 `dist/`              |

### 代码质量

| 脚本             | 命令                                                       | 说明                        |
| ---------------- | ---------------------------------------------------------- | --------------------------- |
| `lint`           | `eslint .`                                                 | 运行 ESLint 检查            |
| `lint:fix`       | `prettier --write . && eslint --fix .`                     | 自动修复代码检查和格式问题  |
| `check:linesize` | `find src -name '*.ts' -exec wc -l {} + \| awk '$1 > 360'` | 检查是否有超过 360 行的文件 |

### 发布

| 脚本         | 命令                                                    | 说明                                  |
| ------------ | ------------------------------------------------------- | ------------------------------------- |
| `release`    | `prepublish && versioning && postaction && npm publish` | 完整发布：构建 → 版本号 → 推送 → 发布 |
| `versioning` | `standard-version`                                      | 版本号递增并生成变更日志              |

### 文档

| 脚本           | 命令                | 说明               |
| -------------- | ------------------- | ------------------ |
| `docs:dev`     | `vitepress dev`     | 启动文档开发服务器 |
| `docs:build`   | `vitepress build`   | 构建文档站点       |
| `docs:preview` | `vitepress preview` | 预览已构建的文档   |

### CI

| 脚本           | 命令                                      | 说明                         |
| -------------- | ----------------------------------------- | ---------------------------- |
| `ci:eslint`    | `eslint -f json src -o ./.ci/eslint.json` | 输出 ESLint 结果为 JSON 格式 |
| `analyze:deps` | `node scripts/analyze-deps.js`            | 分析依赖结构                 |

## 项目结构图

```
scx-api-tool/
├── src/
│   ├── cli/              # CLI 命令和程序设置
│   ├── clients/          # API 数据获取器（Swagger、Apifox）
│   ├── config/           # 配置文件加载器
│   ├── errors/           # 分层错误系统（ConfigError/FetchError/GenerateError）
│   ├── generator/        # 代码生成引擎
│   │   ├── generators/   # 专用生成器（接口、类型、Schema）
│   │   ├── naming/       # 命名策略和名称清理
│   │   └── template/     # Handlebars 模板引擎
│   ├── processors/       # OpenAPI 数据处理
│   ├── service/          # 生成的示例输出（已提交到仓库）
│   ├── templates/        # Handlebars 模板文件
│   │   └── schema-zod/   # Zod Schema 模板子模块
│   ├── types/            # TypeScript 类型定义
│   ├── utils/            # 公共工具函数
│   ├── validation/       # 配置验证
│   └── visualize/        # 可视化命令的 HTML 界面
├── docs/                 # VitePress 文档源码
├── scripts/              # 构建和工具脚本
├── .husky/               # Git 钩子
├── api-power.config.ts   # 示例/开发配置
├── tsdown.config.ts      # 构建配置
├── tsconfig.json         # TypeScript 配置
└── eslint.config.mjs     # ESLint flat 配置
```

## 编码规范

### TypeScript

- **严格模式**：已启用（`"strict": true`），但 `"noImplicitAny": false`
- **模块系统**：ESM（`"type": "module"`）
- **编译目标**：ESNext
- **模块解析**：bundler
- **路径别名**：
  - `@/*` → `src/*`
  - `@scxfe/api-tool` → `src/index.ts`

### 代码风格

- **ESLint**：`eslint-config-ali` + `eslint-config-prettier`
- **Prettier**：`prettier-config-ali`（继承配置）
- **换行符**：LF（tsconfig 中 `"newLine": "LF"`）

### Commit 规范

遵循 commitlint conventional 格式。允许的类型：

| 类型        | 用途                     |
| ----------- | ------------------------ |
| `feat`      | 新功能                   |
| `fix`       | 修复缺陷                 |
| `docs`      | 文档变更                 |
| `style`     | 代码风格变更（格式化等） |
| `test`      | 添加或更新测试           |
| `refactor`  | 代码重构（非功能/修复）  |
| `chore`     | 构建、依赖、工具         |
| `revert`    | 回退之前的提交           |
| `RELEASING` | 发布提交（大写例外）     |

### Pre-commit 钩子

每次提交时由 Husky + lint-staged 执行：

- **`*.{ts,tsx,js,...}`**：ESLint 自动修复
- **`*.{ts,js,json,css,md,...}`**：Prettier 自动格式化

### 文件大小规则

文件不应超过 **360 行**。使用 `pnpm run check:linesize` 检查。

### 导出模式

- 每个模块都有一个 `index.ts` 桶文件用于公共导出
- 类型集中在 `src/types/` 中
- 跨模块依赖通过桶文件导出

## 开发配置

项目根目录的 `api-power.config.ts` 作为开发配置：

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  source: '<你的 API 端点>',
  token: '<你的 Token>',
  typesFormat: 'zod', // 或 'typescript'
  concurrency: 5,
  hooks: {
    beforeGenerate: () => {
      /* ... */
    },
    beforeWriteFile: (filePath, content) => content,
    afterWriteFile: (filePath) => {
      /* ... */
    },
    afterGenerate: () => {
      /* ... */
    },
  },
});
```

## 关键入口点

| 入口           | 路径                        | 用途                                        |
| -------------- | --------------------------- | ------------------------------------------- |
| CLI 入口       | `src/index.ts`              | 程序启动                                    |
| CLI 程序       | `src/cli/program.ts`        | 命令注册                                    |
| 公共 API       | `src/index.ts`              | 包导出（`defineConfig` 等）                 |
| 配置类型       | `src/types/config.ts`       | `UserConfig`、`ApiConfig`、`NamingStrategy` |
| API 类型       | `src/types/api.ts`          | `OpenApiDocument`、`ApiInterface` 等        |
| 代码生成协调器 | `src/generator/codegen.ts`  | `generateFiles()`                           |
| OpenAPI 处理器 | `src/processors/openapi.ts` | `processOpenApiData()`                      |

## 调试技巧

1. 使用 `--verbose` 参数获取详细错误信息：`api-power generate --verbose`
2. 使用 `debug` 命令在不生成代码的情况下检查 API 定义
3. 使用 `visualize` 命令可视化查看 API 结构
4. 查看 `src/cli/commands/generate.ts` 了解主要生成流程

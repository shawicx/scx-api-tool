# 模板文件处理解决方案

本文档介绍了在保持模板文件可维护性的同时，避免运行时路径问题的几种解决方案。

## 问题背景

在构建CLI工具时，我们遇到了以下问题：

1. 使用字符串内嵌模板内容维护困难
2. 直接读取模板文件在构建后存在路径问题
3. 需要在构建时将模板文件转换为可用的代码

## 方案一：构建时文件内容注入（已实现，推荐）

### 特点

- ✅ 保持模板文件的可维护性
- ✅ 避免运行时路径问题
- ✅ 构建时自动化处理
- ✅ 与现有构建流程集成良好

### 实现方式

#### 1. 构建脚本

`scripts/build-templates.js` - 在构建前运行，将模板文件内容注入到代码中

#### 2. 集成构建流程

修改 `package.json` 的构建脚本：

```json
{
  "scripts": {
    "build": "node scripts/build-templates.js && tsdown",
    "build:templates": "node scripts/build-templates.js"
  }
}
```

#### 3. 自动生成文件

`src/utils/templateUtils.ts` - 自动生成，包含所有模板内容

### 使用方法

1. **添加新模板**：
   - 在 `src/templates/` 目录下创建模板文件
   - 在 `scripts/build-templates.js` 的 `TEMPLATE_CONFIG` 中添加配置

2. **构建**：

   ```bash
   pnpm run build:templates  # 仅生成模板
   pnpm run build           # 完整构建
   ```

3. **开发时**：
   - 修改模板文件后需要重新运行构建脚本
   - 可以设置文件监听自动重新生成

### 优势

- 模板文件保持原始格式，易于编辑和维护
- 构建时处理，运行时无性能开销
- 支持语法高亮和IDE智能提示
- 自动化程度高，减少人工错误

## 方案二：Webpack/Rollup 插件

### 特点

- ✅ 与构建工具深度集成
- ✅ 支持热重载
- ❌ 需要额外的插件开发
- ❌ 依赖特定构建工具

### 实现文件

`scripts/template-injection-plugin.js` - Webpack插件示例

### 适用场景

- 使用Webpack或Rollup作为主要构建工具
- 需要在开发时实时更新模板内容
- 团队有插件开发经验

## 方案三：TypeScript Transform API

### 特点

- ✅ TypeScript原生支持
- ✅ 编译时转换，性能优秀
- ❌ 复杂度较高
- ❌ 调试困难

### 实现文件

`scripts/template-transformer.ts` - TypeScript转换器示例

### 适用场景

- 纯TypeScript项目
- 需要深度定制编译过程
- 对性能要求极高的场景

## 推荐方案选择

### 小型项目（推荐方案一）

- 使用构建时文件内容注入
- 简单直接，易于理解和维护
- 适合大多数CLI工具项目

### 中型项目（方案一或方案二）

- 如果使用Webpack/Rollup，考虑方案二
- 如果构建流程简单，继续使用方案一

### 大型项目（方案三）

- 考虑TypeScript Transform API
- 适合有专门构建团队的项目
- 需要极致性能优化的场景

## 最佳实践

### 1. 模板文件组织

```
src/templates/
├── config.ts        # 配置文件模板
├── request.ts       # 请求函数模板
└── types.ts         # 类型定义模板
```

### 2. 命名约定

- 模板文件使用描述性名称
- 自动生成的文件添加注释说明
- 变量占位符使用双大括号：`{{VARIABLE}}`

### 3. 版本控制

- 模板文件纳入版本控制
- 自动生成的文件可选择是否纳入版本控制
- 在 `.gitignore` 中添加相关注释

### 4. 开发流程

1. 修改模板文件
2. 运行构建脚本生成新的工具文件
3. 测试功能是否正常
4. 提交模板文件的修改

## 常见问题

### Q: 为什么不直接使用字符串？

A: 字符串内嵌虽然简单，但失去了语法高亮、格式化、IDE支持等优势，维护困难。

### Q: 自动生成的文件是否需要提交到版本控制？

A: 建议不提交，在构建时生成。如果团队需要，可以提交但添加明确注释。

### Q: 如何处理模板文件中的特殊字符？

A: 构建脚本会自动转义反斜杠、反引号等特殊字符。

### Q: 是否支持嵌套模板？

A: 当前方案支持简单的变量替换，复杂的嵌套可以通过扩展构建脚本实现。

## 扩展功能

### 1. 文件监听

可以添加文件监听功能，在模板文件修改时自动重新生成：

```javascript
// scripts/watch-templates.js
const chokidar = require('chokidar');
const { main } = require('./build-templates');

chokidar.watch('src/templates/**/*.ts').on('change', () => {
  console.log('模板文件发生变化，重新生成...');
  main();
});
```

### 2. 模板验证

在构建时验证模板语法：

```javascript
function validateTemplate(content, filePath) {
  // 检查是否包含必要的占位符
  // 验证模板语法
  // 报告错误和警告
}
```

### 3. 多环境支持

支持不同环境的模板变体：

```javascript
const TEMPLATE_CONFIG = {
  config: {
    development: 'src/templates/config.dev.ts',
    production: 'src/templates/config.prod.ts',
  },
};
```

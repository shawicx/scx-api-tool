# 格式化器

格式化器模块为 API 代码生成工具提供了代码格式化功能。它使用 Prettier 根据文件类型对代码进行一致的样式格式化。

## 概述

格式化器主要在代码生成管道中使用，以确保所有生成的文件都根据既定的样式约定进行正确格式化。主要函数 `formatCode` 接收源代码和文件路径，然后根据文件扩展名应用适当的格式化规则。

## 函数

### `formatCode(code: string, filePath: string): Promise<string>`

使用 Prettier 根据 `filePath` 参数中指定的文件扩展名格式化提供的代码字符串。

**参数：**

- `code` (`string`): 要格式化的源代码
- `filePath` (`string`): 文件路径，用于确定适当的解析器

**返回：**

- `Promise<string>`: 一个 Promise，解析为格式化后的代码字符串，如果格式化失败则返回原始代码

**示例：**

```typescript
import { formatCode } from '@scxfe/api-tool/dist/utils/formatter';

const sourceCode = "function hello( ) { console.log('Hello World');}";
const formatted = await formatCode(sourceCode, 'example.ts');
console.log(formatted);
// 输出:
// function hello() {
//   console.log('Hello World');
// }
```

## 文件类型支持

格式化器根据文件扩展名自动检测适当的解析器：

- **`.ts` / `.tsx`**: 使用 TypeScript 解析器
- **`.js` / `.jsx`**: 使用 Babel 解析器
- **`.json`**: 使用 JSON 解析器
- **其他扩展名**: 默认使用 TypeScript 解析器

## 格式化选项

格式化器应用以下 Prettier 选项：

- `singleQuote: true` - 使用单引号而不是双引号
- `trailingComma: 'es5'` - 在 ES5 中有效的位置添加尾随逗号
- `tabWidth: 2` - 使用 2 个空格作为缩进
- `semi: true` - 在语句末尾添加分号

## 错误处理

如果 Prettier 无法格式化代码，格式化器将记录警告并返回原始的未格式化代码。这确保即使格式化失败，代码生成过程也能继续进行，同时提供对格式化问题的可见性。

## 集成

格式化器在代码生成系统中的多个位置被内部使用：

- `generateRequestFile()`: 在写入文件之前格式化请求函数模板
- `generateInterfaceFileForTag()`: 在写入标签特定的 index.ts 文件之前格式化组合的接口代码
- `generateTypeFile()`: 在写入文件之前格式化单个类型定义代码

这确保所有生成的代码都遵循一致的格式化标准，使其更易于阅读和维护。格式化器是生成过程的重要组成部分，可在所有生成的文件中保持代码质量。

## 配置

格式化器通过项目的 Prettier 设置进行配置，尽管格式化器模块使用其自己的内部配置，确保无论项目特定的 Prettier 配置如何，都能保持一致性。

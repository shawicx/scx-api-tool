import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  source: 'https://api.apifox.com/v1/projects/6997172/export-openapi',
  token: 'APS-bEl8yPD58wfRzsXXkx4psEekqm4k2YhD',
  requestFunctionName: 'myRequest',
  requestParamName: 'requestData',

  // 是否生成 API 请求方法
  generateApi: true,
  // 是否生成类型定义
  generateTypes: true,
  // 类型生成格式：'typescript' | 'zod'
  // - typescript: 生成 TypeScript 类型定义（编译时检查）
  // - zod: 生成 Zod Schema（运行时验证）
  typesFormat: 'zod', // 使用 Zod Schema

  // 自定义命名策略示例（完全覆盖默认的命名生成逻辑）
  // namingStrategy: {
  //   // 自定义接口名称生成
  //   // 例如：POST /api/ai/completion → PostAiCompletion
  //   interfaceName: (info) => {
  //     const method = info.method.charAt(0).toUpperCase() + info.method.slice(1).toLowerCase();
  //     // 移除路径参数，清理路径
  //     const pathName = info.path
  //       .replace(/\{[^}]+\}/g, '')
  //       .replace(/^\//, '')
  //       .replace(/^api-?/i, '')
  //       .replace(/\//g, '-')
  //       .replace(/^-+|-+$/g, '');

  //     // 转换为 PascalCase
  //     const words = pathName.split('-');
  //     const pascalCase = words
  //       .map((word) =>
  //         /[A-Z0-9]/.test(word.charAt(0)) ? word : word.charAt(0).toUpperCase() + word.slice(1),
  //       )
  //       .join('');

  //     return `${method}${pascalCase}`;
  //   },

  //   // 自定义函数名称生成
  //   // 例如：POST /api/ai/completion → postAiCompletionApi
  //   functionName: (info) => {
  //     const method = info.method.toLowerCase();
  //     const pathName = info.path
  //       .replace(/\{[^}]+\}/g, '')
  //       .replace(/^\//, '')
  //       .replace(/^api-?/i, '')
  //       .replace(/\//g, '-')
  //       .replace(/^-+|-+$/g, '');

  //     const words = pathName.split('-');
  //     const pascalCase = words
  //       .map((word) =>
  //         /[A-Z0-9]/.test(word.charAt(0)) ? word : word.charAt(0).toUpperCase() + word.slice(1),
  //       )
  //       .join('');

  //     return `${method}${pascalCase}Func`;
  //   },

  //   // 自定义请求类型名称生成
  //   // 例如：POST /api/ai/completion → PostAiCompletionRequestType
  //   requestTypeName: (info) => {
  //     const method = info.method.charAt(0).toUpperCase() + info.method.slice(1).toLowerCase();
  //     const pathName = info.path
  //       .replace(/\{[^}]+\}/g, '')
  //       .replace(/^\//, '')
  //       .replace(/^api-?/i, '')
  //       .replace(/\//g, '-')
  //       .replace(/^-+|-+$/g, '');

  //     const words = pathName.split('-');
  //     const pascalCase = words
  //       .map((word) =>
  //         /[A-Z0-9]/.test(word.charAt(0)) ? word : word.charAt(0).toUpperCase() + word.slice(1),
  //       )
  //       .join('');

  //     return `${method}${pascalCase}RequestType`;
  //   },

  //   // 自定义响应类型名称生成
  //   // 例如：POST /api/ai/completion → PostAiCompletionResult
  //   responseTypeName: (info) => {
  //     const method = info.method.charAt(0).toUpperCase() + info.method.slice(1).toLowerCase();
  //     const pathName = info.path
  //       .replace(/\{[^}]+\}/g, '')
  //       .replace(/^\//, '')
  //       .replace(/^api-?/i, '')
  //       .replace(/\//g, '-')
  //       .replace(/^-+|-+$/g, '');

  //     const words = pathName.split('-');
  //     const pascalCase = words
  //       .map((word) =>
  //         /[A-Z0-9]/.test(word.charAt(0)) ? word : word.charAt(0).toUpperCase() + word.slice(1),
  //       )
  //       .join('');

  //     return `${method}${pascalCase}Result`;
  //   },
  // },

  validation: {
    enabled: true, // 启用 Schema 生成（会被 typesFormat 自动控制）
    library: 'zod', // 使用 Zod 库
    outputDir: 'src/service/schemas', // 输出目录
    generateRequestSchemas: true, // 生成请求参数 Schema
    generateResponseSchemas: true, // 生成响应数据 Schema
    generateTypeSchemas: true, // 生成类型 Schema
  },
});

import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  source: 'https://api.apifox.com/v1/projects/6997172/export-openapi',
  token: 'APS-bEl8yPD58wfRzsXXkx4psEekqm4k2YhD',
  requestFunctionName: 'myRequest',
  requestParamName: 'requestData',

  // 是否生成 API 请求方法
  generateApi: true,

  // 是否生成类型定义（在接口文件中）
  generateTypes: true,

  // 类型生成格式：控制接口文件中的类型定义格式
  // - 'typescript': 生成 TypeScript 类型定义（编译时类型检查）
  // - 'zod': 生成 Zod Schema（运行时验证）
  // 注意：此选项仅控制接口文件中的类型格式，不影响独立的 Schema 文件生成
  typesFormat: 'zod',

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

  // Schema 验证配置：控制是否生成独立的 Schema 文件
  // 注意：此配置与 typesFormat 独立，可以单独控制
  validation: {
    enabled: false, // 是否启用独立的 Schema 文件生成
    library: 'zod', // 验证库类型（目前仅支持 zod）
    outputDir: 'src/service/schemas', // Schema 文件输出目录
    generateRequestSchemas: true, // 是否生成请求参数 Schema
    generateResponseSchemas: true, // 是否生成响应数据 Schema
    generateTypeSchemas: true, // 是否生成通用类型 Schema
  },
});

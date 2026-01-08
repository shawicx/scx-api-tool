import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  source: 'https://api.apifox.com/v1/projects/6997172/export-openapi',
  token: 'APS-bEl8yPD58wfRzsXXkx4psEekqm4k2YhD',
  requestFunctionName: 'myRequest',
  requestParamName: 'requestData',

  // 自定义命名策略示例（完全覆盖默认的命名生成逻辑）
  namingStrategy: {
    // 自定义接口名称生成
    // 例如：POST /api/ai/completion → PostAiCompletion
    interfaceName: (info) => {
      const method = info.method.charAt(0).toUpperCase() + info.method.slice(1).toLowerCase();
      // 移除路径参数，清理路径
      const pathName = info.path
        .replace(/\{[^}]+\}/g, '')
        .replace(/^\//, '')
        .replace(/^api-?/i, '')
        .replace(/\//g, '-')
        .replace(/^-+|-+$/g, '');

      // 转换为 PascalCase
      const words = pathName.split('-');
      const pascalCase = words
        .map((word) =>
          /[A-Z0-9]/.test(word.charAt(0)) ? word : word.charAt(0).toUpperCase() + word.slice(1),
        )
        .join('');

      return `${method}${pascalCase}Test`;
    },

    // 自定义函数名称生成
    // 例如：POST /api/ai/completion → postAiCompletionApi
    functionName: (info) => {
      const method = info.method.toLowerCase();
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

      return `${method}${pascalCase}Func`;
    },

    // 自定义请求类型名称生成
    // 例如：POST /api/ai/completion → PostAiCompletionRequestType
    requestTypeName: (info) => {
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

      return `${method}${pascalCase}RequestType`;
    },

    // 自定义响应类型名称生成
    // 例如：POST /api/ai/completion → PostAiCompletionResult
    responseTypeName: (info) => {
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

      return `${method}${pascalCase}Result`;
    },
  },

  // typesOnly: true,
  // apiOnly: true,
  // comment: false,
});

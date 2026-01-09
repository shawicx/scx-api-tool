export const configTemplate = `import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  // API 数据源 URL（Apifox 或 Swagger/OpenAPI）
  source: '{{source}}',
  // 认证令牌（如果需要）
  token: '{{token}}',

  // ========== 核心配置 ==========
  // 是否生成 API 请求方法
  generateApi: {{generateApi}},
  // 是否生成类型定义（在接口文件中）
  generateTypes: {{generateTypes}},
  // 类型生成格式：'typescript' | 'zod'
  // - 'typescript': 生成 TypeScript 类型定义（编译时类型检查）
  // - 'zod': 生成 Zod Schema（运行时验证）
  // 注意：此选项仅控制接口文件中的类型格式，不影响独立的 Schema 文件生成
  typesFormat: '{{typesFormat}}',

  // ========== 基础配置 ==========
  // 目标语言
  target: '{{target}}',
  // 路径前缀（可选）
  pathPrefix: '{{pathPrefix}}',
  // 输出目录
  outputDir: '{{outputDir}}',
  // 缩进大小
  indentSize: {{indentSize}},
  // 是否生成注释
  comment: {{comment}},
  // 生产环境名称
  prodEnvName: '{{prodEnvName}}',

  // ========== 请求函数配置 ==========
  // 请求函数文件路径
  requestFunctionFilePath: '{{requestFunctionFilePath}}',
  // 自定义请求函数名
  requestFunctionName: '{{requestFunctionName}}',
  // 自定义请求参数名
  requestParamName: '{{requestParamName}}',
  // 自定义返回数据类型名
  responseTypeName: '{{responseTypeName}}',

  // ========== Schema 验证配置（可选）==========
  // 控制是否生成独立的运行时验证 Schema 文件
  // 注意：此配置与 typesFormat 独立，可以单独控制
  /*
  validation: {
    enabled: {{validationEnabled}}, // 是否启用独立的 Schema 文件生成
    library: 'zod', // 验证库类型（目前仅支持 zod）
    outputDir: 'src/service/schemas', // Schema 文件输出目录
    generateRequestSchemas: true, // 是否生成请求参数 Schema
    generateResponseSchemas: true, // 是否生成响应数据 Schema
    generateTypeSchemas: true, // 是否生成通用类型 Schema
  },
  */

  // ========== 高级配置（可选）==========
  // 请求方法调用风格：'config' | 'method-specific' | 'both'
  // requestMethodStyle: 'config',
  // 并发写入数量（用于文件生成的并发控制）
  // concurrency: 50,
  // 自定义命名策略（完全覆盖默认的命名生成逻辑）
  /*
  namingStrategy: {
    // 自定义接口名称生成
    // 例如：POST /api/ai/completion → PostAiCompletion
    interfaceName: (info) => {
      const method = info.method.charAt(0).toUpperCase() + info.method.slice(1).toLowerCase();
      const pathName = info.path
        .replace(/\\{[^}]+\\}/g, '')
        .replace(/^\\//, '')
        .replace(/^api-?/i, '')
        .replace(/\\//g, '-')
        .replace(/^-+|-+$/g, '');
      const words = pathName.split('-');
      const pascalCase = words
        .map((word) =>
          /[A-Z0-9]/.test(word.charAt(0)) ? word : word.charAt(0).toUpperCase() + word.slice(1),
        )
        .join('');
      return \`\${method}\${pascalCase}\`;
    },
    // 其他命名函数...
  },
  */
});
`;

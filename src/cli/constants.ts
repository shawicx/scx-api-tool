/**
 * @description CLI 常量定义
 * 包含默认配置模板等常量
 */

export const DEFAULT_CONFIG = `import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  // API 数据源 URL（Apifox 或 Swagger/OpenAPI）
  source: 'https://api.apifox.com/v1/projects/6997172/export-openapi',
  // 认证令牌
  token: 'YOUR_TOKEN_HERE',

  // ========== 核心配置 ==========
  // 是否生成 API 请求方法
  generateApi: true,
  // 是否生成类型定义（在接口文件中）
  generateTypes: true,
  // 类型生成格式：'typescript' | 'zod'
  // - 'typescript': 生成 TypeScript 类型定义（编译时类型检查）
  // - 'zod': 生成 Zod Schema（运行时验证）
  typesFormat: 'typescript',

  // ========== 基础配置 ==========
  // 目标语言
  target: 'typescript',
  // 路径转换函数（可选，默认恒等函数）
  // transformPath: (p) => p.startsWith('/api') ? p.slice(4) : p,  // 去除前缀
  // transformPath: (p) => '/api/v1' + p,  // 添加前缀
  // 输出目录
  outputDir: 'src/service',
  // 缩进大小
  indentSize: 2,
  // 是否生成注释
  comment: true,
  // 生产环境名称
  prodEnvName: 'production',

  // ========== 请求函数配置 ==========
  // 请求函数文件路径
  requestFunctionFilePath: 'src/service/request.ts',
  // 自定义请求函数名
  requestFunctionName: 'request',
  // 自定义请求参数名
  requestParamName: 'params',
  // 自定义返回数据类型名
  responseTypeName: 'Response',

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

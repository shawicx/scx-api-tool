/**
 * @description CLI 常量定义
 * 包含默认配置模板等常量
 */

export const DEFAULT_CONFIG = `import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  // ========== 公共配置（所有服务默认继承）==========
  // 公共根输出目录（所有服务的输出都位于其下的子文件夹中）
  baseOutputDir: 'src/service',
  // 类型生成格式：'typescript' | 'zod'
  // - 'typescript': 生成 TypeScript 类型定义（编译时类型检查）
  // - 'zod': 生成 Zod Schema（运行时验证）
  typesFormat: 'typescript',
  // 是否生成 API 请求方法
  generateApi: true,
  // 是否生成类型定义（在接口文件中）
  generateTypes: true,
  // 目标语言
  target: 'typescript',
  // 缩进大小
  indentSize: 2,
  // 是否生成注释
  comment: true,
  // 并发写入数量（用于文件生成的并发控制）
  concurrency: 5,

  // ========== 服务列表 ==========
  // 每个服务独立生成到各自的子文件夹（默认 folder = name），互不干扰
  // source/token 下沉到服务级；其余字段可在此覆盖公共配置
  services: [
    {
      name: 'apifox-demo',
      // folder 省略时默认取 name（输出到 src/service/apifox-demo）
      source: 'https://api.apifox.com/v1/projects/6997172/export-openapi',
      token: 'YOUR_TOKEN_HERE',
    },
    /*
    // 多服务示例：微服务场景
    {
      name: 'order',
      source: 'https://order-svc/v3/api-docs',
      // 服务级覆盖公共配置
      transformPath: (p) => '/order' + p,
    },
    */
  ],
});
`;

/**
 * @description 统一的错误处理系统
 * 提供结构化的错误类型和解决方案建议
 */
import consola from 'consola';

/**
 * @description 错误代码枚举
 */
export enum ErrorCode {
  // 配置错误 (1xxx)
  CONFIG_FILE_NOT_FOUND = 'E1001',
  CONFIG_INVALID = 'E1002',
  CONFIG_PARSE_ERROR = 'E1003',
  CONFIG_MISSING_REQUIRED = 'E1004',
  CONFIG_INVALID_URL = 'E1005',

  // 网络请求错误 (2xxx)
  FETCH_REQUEST_FAILED = 'E2001',
  FETCH_UNAUTHORIZED = 'E2002',
  FETCH_TIMEOUT = 'E2003',
  _FETCH_INVALID_RESPONSE = 'E2004',
  FETCH_NETWORK_ERROR = 'E2005',

  // 代码生成错误 (3xxx)
  GENERATE_TEMPLATE_ERROR = 'E3001',
  GENERATE_WRITE_ERROR = 'E3002',
  GENERATE_TYPE_ERROR = 'E3003',
  GENERATE_SCHEMA_ERROR = 'E3004',
}

/**
 * @description 错误解决方案接口
 */
export interface ErrorSolution {
  title: string;
  steps: string[];
  documentation?: string;
}

/**
 * @description 基础错误类
 */
export class BaseError extends Error {
  code: ErrorCode;
  solutions: ErrorSolution[];
  originalError?: Error;

  constructor(code: ErrorCode, message: string, solutions: ErrorSolution[], originalError?: Error) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.solutions = solutions;
    this.originalError = originalError;

    // 维护正确的堆栈跟踪
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * @description 格式化错误输出
   */
  format(verbose = false): string {
    const lines = [`✖ ${this.message}`, '', `错误代码: ${this.code}`];

    // 添加解决方案
    if (this.solutions.length > 0) {
      lines.push('', '💡 解决方案:');
      this.solutions.forEach((solution, index) => {
        lines.push('');
        lines.push(`${index + 1}. ${solution.title}`);
        solution.steps.forEach((step, i) => {
          lines.push(`   ${i + 1}. ${step}`);
        });
        if (solution.documentation) {
          lines.push(`   📖 ${solution.documentation}`);
        }
      });
    }

    // 在 verbose 模式下显示原始错误和堆栈
    if (verbose) {
      if (this.originalError) {
        lines.push('');
        lines.push('原始错误:');
        lines.push(this.originalError.toString());
      }
      if (this.stack) {
        lines.push('');
        lines.push('堆栈跟踪:');
        lines.push(this.stack);
      }
    }

    return lines.join('\n');
  }

  /**
   * 输出错误到控制台
   */
  print(verbose = false): void {
    consola.error(this.format(verbose));
  }
}

/**
 * @description 配置错误类
 */
export class ConfigError extends BaseError {
  constructor(message: string, solutions: ErrorSolution[], originalError?: Error) {
    super(ErrorCode.CONFIG_INVALID, message, solutions, originalError);
  }
}

/**
 * 网络请求错误类
 */
export class FetchError extends BaseError {
  constructor(message: string, solutions: ErrorSolution[], originalError?: Error) {
    super(ErrorCode.FETCH_REQUEST_FAILED, message, solutions, originalError);
  }
}

/**
 * 代码生成错误类
 */
export class GenerateError extends BaseError {
  constructor(message: string, solutions: ErrorSolution[], originalError?: Error) {
    super(ErrorCode.GENERATE_TEMPLATE_ERROR, message, solutions, originalError);
  }
}

/**
 * @description 错误工厂函数
 * 提供便捷的错误创建方法，内置常见错误的解决方案
 */
export const ErrorFactory = {
  /**
   * 配置文件未找到
   */
  configNotFound(configPath: string): ConfigError {
    return new ConfigError(`配置文件未找到: ${configPath}`, [
      {
        title: '初始化配置文件',
        steps: [
          '运行 `npx api-power init` 创建配置文件',
          '检查当前目录下是否存在 api-power.config.ts',
          '确认配置文件路径是否正确',
        ],
        documentation: 'https://github.com/your-repo/wiki/config',
      },
    ]);
  },

  /**
   * @description 配置无效
   */
  configInvalid(message: string, solutions: ErrorSolution[]): ConfigError {
    return new ConfigError(message, solutions);
  },

  /**
   * @description 配置解析失败
   */
  configParseError(configPath: string, originalError: Error): ConfigError {
    return new ConfigError(
      `配置文件解析失败: ${configPath}`,
      [
        {
          title: '检查配置文件语法',
          steps: [
            '确保配置文件是有效的 TypeScript',
            '检查是否有语法错误或类型错误',
            '尝试删除 node_modules 并重新安装依赖',
            '使用 `npx api-power debug` 查看详细错误信息',
          ],
          documentation: 'https://github.com/your-repo/wiki/config-syntax',
        },
      ],
      originalError,
    );
  },

  /**
   * @description 配置缺少必需字段
   */
  configMissingRequired(field: string): ConfigError {
    return new ConfigError(`配置缺少必需字段: ${field}`, [
      {
        title: '补充必需配置',
        steps: [
          `在配置文件中添加 ${field} 字段`,
          '参考配置模板或文档了解必需字段',
          '使用 `npx api-power init` 生成完整的配置模板',
        ],
      },
    ]);
  },

  /**
   * @description 无效的 URL
   */
  invalidUrl(url: string): ConfigError {
    return new ConfigError(`无效的 URL 格式: ${url}`, [
      {
        title: '检查 URL 格式',
        steps: [
          '确保 URL 以 http:// 或 https:// 开头',
          '检查 URL 是否完整（包含域名和路径）',
          '确保 URL 中没有特殊字符或空格',
        ],
      },
    ]);
  },

  /**
   * @description 网络请求失败
   */
  fetchFailed(url: string, statusCode?: number, originalError?: Error): FetchError {
    const statusMsg = statusCode ? ` (${statusCode})` : '';
    return new FetchError(
      `API 请求失败: ${url}${statusMsg}`,
      [
        {
          title: '检查网络连接',
          steps: [
            '确认网络连接正常',
            '检查目标服务器是否在线',
            '尝试在浏览器中访问该 URL',
            '检查是否有防火墙或代理设置',
          ],
        },
        {
          title: '验证访问权限',
          steps: [
            '确认 token 或 API 密钥是否有效',
            '检查 token 是否已过期',
            '验证账户是否有访问该 API 的权限',
          ],
        },
      ],
      originalError,
    );
  },

  /**
   * @description 未授权访问
   */
  unauthorized(url: string): FetchError {
    return new FetchError(`未授权访问 API: ${url}`, [
      {
        title: '验证认证信息',
        steps: [
          '检查配置文件中的 token 字段',
          '确认 token 是否正确（无多余空格或换行）',
          '前往 Apifox/Swagger 平台重新生成 token',
          '确保 token 有访问该项目的权限',
        ],
      },
      {
        title: '检查项目权限',
        steps: [
          '确认账户是否已被添加到该项目',
          '联系项目管理员授予访问权限',
          '在 Apifox/Swagger 中检查项目设置',
        ],
      },
    ]);
  },

  /**
   * @description 请求超时
   */
  timeout(url: string, timeoutMs: number): FetchError {
    return new FetchError(`请求超时: ${url} (超过 ${timeoutMs}ms)`, [
      {
        title: '优化网络环境',
        steps: ['检查网络连接速度', '尝试使用更快的网络环境', '检查是否在网络较差的环境中运行'],
      },
      {
        title: '增加超时时间',
        steps: ['如果网络较慢，可以尝试分批获取数据', '联系 API 提供方检查服务状态'],
      },
    ]);
  },

  /**
   * @description 无效的响应格式
   */
  invalidResponse(url: string, expectedFormat: string): FetchError {
    return new FetchError(`API 返回无效的响应格式: ${url} (期望: ${expectedFormat})`, [
      {
        title: '检查 API 端点',
        steps: [
          '确认 API 端点 URL 是否正确',
          '在浏览器或 Postman 中测试该 API',
          '检查 API 文档确认响应格式',
          '联系 API 提供方确认服务状态',
        ],
      },
    ]);
  },

  /**
   * @description 模板错误
   */
  templateError(templateName: string, originalError: Error): GenerateError {
    return new GenerateError(
      `模板编译失败: ${templateName}`,
      [
        {
          title: '检查模板文件',
          steps: [
            '确认模板文件存在于 src/templates/ 目录',
            '检查模板语法是否正确',
            '验证模板变量是否都有对应的值',
            '尝试重新构建项目: pnpm run build',
          ],
        },
      ],
      originalError,
    );
  },

  /**
   * @description 文件写入错误
   */
  writeError(filePath: string, originalError: Error): GenerateError {
    return new GenerateError(
      `文件写入失败: ${filePath}`,
      [
        {
          title: '检查文件系统权限',
          steps: [
            '确认输出目录存在',
            '检查是否有写入权限',
            '确认磁盘空间充足',
            '检查文件是否被其他程序占用',
          ],
        },
      ],
      originalError,
    );
  },

  /**
   * @description Schema 错误
   */
  schemaError(schemaPath: string, message: string): GenerateError {
    return new GenerateError(`OpenAPI Schema 解析错误: ${message}`, [
      {
        title: '验证 API 定义',
        steps: [
          '使用 `npx api-power debug` 查看详细的 Schema 信息',
          '在 Swagger Editor 中验证 OpenAPI 定义',
          '检查 API 定义是否符合 OpenAPI 3.0 规范',
          '联系 API 提供方修复 Schema 问题',
        ],
      },
      {
        title: '使用调试模式',
        steps: ['运行 `DEBUG=1 npx api-power` 查看详细信息', '检查控制台输出的原始数据'],
      },
    ]);
  },
};

/**
 * @description 全局错误处理函数
 * 在 CLI 的顶层捕获所有错误并统一处理
 */
export function handleError(error: unknown, verbose = false): never {
  // 如果是我们的自定义错误，直接使用
  if (error instanceof BaseError) {
    error.print(verbose);
    process.exit(1);
  }

  // 如果是普通 Error，包装成通用错误
  if (error instanceof Error) {
    const message = error.message || '发生未知错误';
    consola.error(`✖ ${message}`);

    if (verbose) {
      consola.error('');
      consola.error('堆栈跟踪:');
      consola.error(error.stack);
    }

    process.exit(1);
  }

  // 其他类型的错误（如字符串、数字等）
  const errorMessage = String(error);
  consola.error(`✖ ${errorMessage}`);
  process.exit(1);
}

/**
 * 异步包装器
 * 自动捕获并处理异步函数中的错误
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  verbose = false,
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, verbose);
    }
  }) as T;
}

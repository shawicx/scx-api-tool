import { ConfigError, FetchError, GenerateError, ErrorSolution } from './errorClasses';
import { ErrorCode } from './errorCodes';

/**
 * @description 错误工厂函数
 * 提供便捷的错误创建方法，内置常见错误的解决方案
 */
export const ErrorFactory = {
  /**
   * @description 创建配置文件未找到错误
   * @param configPath 配置文件路径
   * @returns ConfigError 实例
   *
   * @example
   * ```typescript
   * throw ErrorFactory.configNotFound('./api-power.config.ts');
   * ```
   */
  configNotFound(configPath: string): ConfigError {
    return new ConfigError(
      `配置文件未找到: ${configPath}`,
      [
        {
          title: '初始化配置文件',
          steps: [
            '运行 `npx api-power init` 创建配置文件',
            '检查当前目录下是否存在 api-power.config.ts',
            '确认配置文件路径是否正确',
          ],
          documentation: 'https://github.com/your-repo/wiki/config',
        },
      ],
      undefined,
      ErrorCode.CONFIG_FILE_NOT_FOUND,
    );
  },

  /**
   * @description 创建配置无效错误
   * @param message 错误消息
   * @param solutions 解决方案列表
   * @returns ConfigError 实例
   *
   * @example
   * ```typescript
   * throw ErrorFactory.configInvalid('无效的配置值', [
   *   { title: '检查配置', steps: ['验证配置值类型'] }
   * ]);
   * ```
   */
  configInvalid(message: string, solutions: ErrorSolution[]): ConfigError {
    return new ConfigError(message, solutions, undefined, ErrorCode.CONFIG_INVALID);
  },

  /**
   * @description 创建配置解析失败错误
   * @param configPath 配置文件路径
   * @param originalError 原始错误
   * @returns ConfigError 实例
   *
   * @example
   * ```typescript
   * try {
   *   // 解析配置文件
   * } catch (error) {
   *   throw ErrorFactory.configParseError('./api-power.config.ts', error);
   * }
   * ```
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
      ErrorCode.CONFIG_PARSE_ERROR,
    );
  },

  /**
   * @description 创建配置缺少必需字段错误
   * @param field 缺少的字段名称
   * @returns ConfigError 实例
   *
   * @example
   * ```typescript
   * if (!config.source) {
   *   throw ErrorFactory.configMissingRequired('source');
   * }
   * ```
   */
  configMissingRequired(field: string): ConfigError {
    return new ConfigError(
      `配置缺少必需字段: ${field}`,
      [
        {
          title: '补充必需配置',
          steps: [
            `在配置文件中添加 ${field} 字段`,
            '参考配置模板或文档了解必需字段',
            '使用 `npx api-power init` 生成完整的配置模板',
          ],
        },
      ],
      undefined,
      ErrorCode.CONFIG_MISSING_REQUIRED,
    );
  },

  /**
   * @description 创建无效 URL 错误
   * @param url 无效的 URL 字符串
   * @returns ConfigError 实例
   *
   * @example
   * ```typescript
   * if (!isValidUrl(config.source)) {
   *   throw ErrorFactory.invalidUrl(config.source);
   * }
   * ```
   */
  invalidUrl(url: string): ConfigError {
    return new ConfigError(
      `无效的 URL 格式: ${url}`,
      [
        {
          title: '检查 URL 格式',
          steps: [
            '确保 URL 以 http:// 或 https:// 开头',
            '检查 URL 是否完整（包含域名和路径）',
            '确保 URL 中没有特殊字符或空格',
          ],
        },
      ],
      undefined,
      ErrorCode.CONFIG_INVALID_URL,
    );
  },

  /**
   * @description 创建网络请求失败错误
   * @param url 请求的 URL
   * @param statusCode HTTP 状态码（可选）
   * @param originalError 原始错误（可选）
   * @returns FetchError 实例
   *
   * @example
   * ```typescript
   * try {
   *   const response = await fetch(url);
   * } catch (error) {
   *   throw ErrorFactory.fetchFailed(url, 500, error);
   * }
   * ```
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
      ErrorCode.FETCH_REQUEST_FAILED,
    );
  },

  /**
   * @description 创建未授权访问错误
   * @param url 请求的 URL
   * @returns FetchError 实例
   *
   * @example
   * ```typescript
   * if (response.status === 401) {
   *   throw ErrorFactory.unauthorized(url);
   * }
   * ```
   */
  unauthorized(url: string): FetchError {
    return new FetchError(
      `未授权访问 API: ${url}`,
      [
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
      ],
      undefined,
      ErrorCode.FETCH_UNAUTHORIZED,
    );
  },

  /**
   * @description 创建请求超时错误
   * @param url 请求的 URL
   * @param timeoutMs 超时时间（毫秒）
   * @returns FetchError 实例
   *
   * @example
   * ```typescript
   * const timeout = 30000;
   * const controller = new AbortController();
   * const timer = setTimeout(() => controller.abort(), timeout);
   * ```
   */
  timeout(url: string, timeoutMs: number): FetchError {
    return new FetchError(
      `请求超时: ${url} (超过 ${timeoutMs}ms)`,
      [
        {
          title: '优化网络环境',
          steps: ['检查网络连接速度', '尝试使用更快的网络环境', '检查是否在网络较差的环境中运行'],
        },
        {
          title: '增加超时时间',
          steps: ['如果网络较慢，可以尝试分批获取数据', '联系 API 提供方检查服务状态'],
        },
      ],
      undefined,
      ErrorCode.FETCH_TIMEOUT,
    );
  },

  /**
   * @description 创建无效响应格式错误
   * @param url 请求的 URL
   * @param expectedFormat 期望的响应格式
   * @returns FetchError 实例
   *
   * @example
   * ```typescript
   * if (!isValidOpenApiResponse(data)) {
   *   throw ErrorFactory.invalidResponse(url, 'OpenAPI 3.0');
   * }
   * ```
   */
  invalidResponse(url: string, expectedFormat: string): FetchError {
    return new FetchError(
      `API 返回无效的响应格式: ${url} (期望: ${expectedFormat})`,
      [
        {
          title: '检查 API 端点',
          steps: [
            '确认 API 端点 URL 是否正确',
            '在浏览器或 Postman 中测试该 API',
            '检查 API 文档确认响应格式',
            '联系 API 提供方确认服务状态',
          ],
        },
      ],
      undefined,
      ErrorCode.FETCH_INVALID_RESPONSE,
    );
  },

  /**
   * @description 创建网络错误（连接中断、DNS 解析失败等）
   * @param url 请求的 URL
   * @param originalError 原始错误（可选）
   * @returns FetchError 实例
   *
   * @example
   * ```typescript
   * try {
   *   const response = await axios.get(url);
   * } catch (error) {
   *   if (error.code === 'ENOTFOUND') {
   *     throw ErrorFactory.networkError(url, error);
   *   }
   * }
   * ```
   */
  networkError(url: string, originalError?: Error): FetchError {
    return new FetchError(
      `网络错误，无法连接到 API: ${url}`,
      [
        {
          title: '检查网络连接',
          steps: [
            '确认网络连接正常',
            '检查 DNS 解析是否正确',
            '确认目标服务器是否可访问',
            '检查是否有防火墙或代理拦截请求',
          ],
        },
      ],
      originalError,
      ErrorCode.FETCH_NETWORK_ERROR,
    );
  },

  /**
   * @description 创建模板编译错误
   * @param templateName 模板名称
   * @param originalError 原始错误
   * @returns GenerateError 实例
   *
   * @example
   * ```typescript
   * try {
   *   const template = Handlebars.compile(templateString);
   * } catch (error) {
   *   throw ErrorFactory.templateError('api-template.hbs', error);
   * }
   * ```
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
      ErrorCode.GENERATE_TEMPLATE_ERROR,
    );
  },

  /**
   * @description 创建文件写入错误
   * @param filePath 文件路径
   * @param originalError 原始错误
   * @returns GenerateError 实例
   *
   * @example
   * ```typescript
   * try {
   *   await fs.writeFile(filePath, content);
   * } catch (error) {
   *   throw ErrorFactory.writeError(filePath, error);
   * }
   * ```
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
      ErrorCode.GENERATE_WRITE_ERROR,
    );
  },

  /**
   * @description 创建类型生成错误
   * @param typeName 类型名称
   * @param message 错误消息
   * @returns GenerateError 实例
   *
   * @example
   * ```typescript
   * if (!isValidType(typeDef)) {
   *   throw ErrorFactory.typeError(typeDef.name, '无法解析的属性结构');
   * }
   * ```
   */
  typeError(typeName: string, message: string): GenerateError {
    return new GenerateError(
      `类型生成失败 [${typeName}]: ${message}`,
      [
        {
          title: '检查类型定义',
          steps: [
            '使用 `npx api-power debug` 查看详细的类型信息',
            '检查 OpenAPI 定义中的 schema 结构',
            '确认属性类型是否被支持',
          ],
        },
      ],
      undefined,
      ErrorCode.GENERATE_TYPE_ERROR,
    );
  },

  /**
   * @description 创建 Schema 解析错误
   * @param schemaPath Schema 路径
   * @param message 错误消息
   * @returns GenerateError 实例
   *
   * @example
   * ```typescript
   * if (!isValidSchema(data)) {
   *   throw ErrorFactory.schemaError('/paths/api/users', '缺少 required 字段');
   * }
   * ```
   */
  schemaError(schemaPath: string, message: string): GenerateError {
    return new GenerateError(
      `OpenAPI Schema 解析错误: ${message}`,
      [
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
      ],
      undefined,
      ErrorCode.GENERATE_SCHEMA_ERROR,
    );
  },

  /**
   * @description 创建路径转换错误
   * @param path 触发错误的原始路径
   * @param message 错误消息
   * @param originalError 原始错误（可选）
   * @returns GenerateError 实例
   *
   * @example
   * ```typescript
   * try {
   *   const result = config.pathPrefix(path);
   * } catch (e) {
   *   throw ErrorFactory.pathTransformError(path, '处理失败', e);
   * }
   * ```
   */
  pathTransformError(path: string, message: string, originalError?: Error): GenerateError {
    return new GenerateError(
      `路径转换失败 [${path}]: ${message}`,
      [
        {
          title: '检查 pathPrefix 函数实现',
          steps: [
            '确认 pathPrefix 函数对任意 path 都返回 string',
            '检查函数内是否有运行时异常（如正则错误、未定义属性访问）',
            '使用 `npx api-power debug` 查看触发异常的具体 path',
          ],
        },
      ],
      originalError,
      ErrorCode.GENERATE_PATH_TRANSFORM_ERROR,
    );
  },
};

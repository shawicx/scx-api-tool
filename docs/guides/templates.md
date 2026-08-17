# 模板自定义

`@scx/api-tool` 使用 Handlebars 模板引擎生成代码，支持完全自定义模板以适应不同的项目需求。

## 模板系统概述

### 默认模板结构

```
src/templates/
├── types.ts           # TypeScript 类型定义模板
├── request.ts         # HTTP 请求函数模板
├── interface.ts       # API 接口定义模板
└── config.ts          # 配置文件模板
```

### 模板引擎

使用 [Handlebars](https://handlebarsjs.com/) 作为模板引擎，支持：

- 变量替换：`{\{variable\}}`
- 条件渲染：`{\{#if condition\}}...{\{/if\}}`
- 循环遍历：`{\{#each items\}}...{\{/each\}}`
- 自定义助手函数
- 模板继承：`{\{> partial\}}`

## 基础模板定制

### 1. 使用自定义模板目录

在配置中指定模板目录：

```typescript
export default defineConfig({
  baseOutputDir: 'src/service',
  // ... 其他配置
  templateDir: './my-templates', // 自定义模板目录（公共配置，所有服务共享）

  services: [
    {
      name: 'main',
      folder: '.',
      source: 'YOUR_API_SOURCE',
      token: 'YOUR_TOKEN',
    },
  ],
});
```

### 2. 覆盖特定模板

只覆盖需要的模板文件：

```
my-templates/
├── types.ts           # 覆盖默认的类型模板
└── request.ts         # 覆盖默认的请求模板
```

## 模板数据结构

### 可用变量

每个模板文件都会接收以下数据：

```typescript
interface TemplateData {
  // 项目配置（运行时的 ApiConfig，即合并后的单个服务配置）
  config: {
    outputDir: string; // 该服务的完整输出目录 = join(baseOutputDir, folder ?? name)
    target: 'typescript' | 'javascript';
    indentSize: number;
  };

  // 接口信息
  interfaces: InterfaceInfo[];

  // 类型定义
  types: TypeInfo[];

  // 当前分类信息（如果在分类模板中）
  category?: CategoryInfo;

  // 工具函数
  utils: {
    changeCase: ChangeCaseUtils;
    formatString: FormatUtils;
  };
}
```

### 接口信息结构

```typescript
interface InterfaceInfo {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  summary: string;
  description?: string;
  parameters: ParameterInfo[];
  requestBody?: RequestBodyInfo;
  responses: ResponseInfo[];
  tags: string[];
}
```

### 类型信息结构

```typescript
interface TypeInfo {
  name: string;
  description?: string;
  properties: PropertyInfo[];
  required?: string[];
  enum?: any[];
}
```

## 模板示例

### 1. 简化的类型模板

```handlebars
{\{!-- my-templates/types.ts --\}} {\{#each types\}\} {\{#if description\}\} /** *
{\{description\}\} */ {\{/if\}\} export interface {\{name\}\} { {\{#each properties\}\}
{\{name\}\}{\{#unless (lookup ../required this)\}\}?{\{/unless\}\}: {\{type\}\}; {\{/each\}\} }
{\{/each\}\}
```

### 2. 带 JSDoc 的请求模板

```handlebars
{\{!-- my-templates/request.ts --\}}
import axios from 'axios';

const request = axios.create({
  baseURL: '{\{config.requestConfig.baseURL\}\}',
  timeout: {\{config.requestConfig.timeout\}\},
});

{\{#each interfaces\}\}
/**
 * {\{summary\}\}
{\{#if description\}\}
 * {\{description\}\}
{\{/if\}\}
{\{#each parameters\}\}
 * @param {\{name\}\} {\{description\}\}
{\{/each\}\}
 */
export function {\{utils.changeCase.camelCase name\}\}(
{\{#if parameters.length\}\}
  {\{#each parameters\}\}
  {\{name\}\}{\{#unless required\}\}?{\{/unless\}\}: {\{#if (eq type 'string')\}\}string{\{else\}\}{\{type\}\}{\{/if\}\}{\{#unless @last\}\},{\{/unless\}\}
  {\{/each\}\}: void
{\{/if\}\}
): Promise<{\{responses.0.type\}\}> {
  return request.{\{lowercase method\}\}('{\{path\}\}'{\{#if parameters.length\}\}, {\{#if (eq method 'GET')\}\}{ params{\{#each parameters\}\}{\{#if value\}\}, {\{name\}\}: {\{value\}\}{\{/if\}\}{\{/each\}\} }{\{else\}\}data{\{/if\}\}{\{/if\}\});
}

{\{/each\}\}
```

### 3. React Hooks 模板

```handlebars
{\{!-- my-templates/react-hooks.ts --\}}
import { useState, useEffect } from 'react';
import * as api from './request';

{\{#each interfaces\}\}
/**
 * React Hook for {\{summary\}\}
 */
export function use{\{utils.changeCase.pascalCase name\}\}(
{\{#each parameters\}\}
  {\{name\}\}?: {\{#if (eq type 'string')\}\}string{\{else\}\}{\{type\}\}{\{/if\}\}{\{#unless @last\}\},{\{/unless\}\}
{\{/each\}\}
) {
  const [data, setData] = useState<{\{responses.0.type\}\} | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await api.{\{utils.changeCase.camelCase name\}\}(
          {\{#each parameters\}\}
          {\{name\}\}{\{#unless @last\}\},{\{/unless\}\}
          {\{/each\}\}
        );
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [{\{#each parameters\}\}{\{name\}\}{\{#unless @last\}\}, {\{/unless\}\}{\{/each\}\}]);

  return { data, loading, error };
}

{\{/each\}\}
```

## 自定义助手函数

### 1. 创建助手函数

```typescript
// src/template-helpers.ts
import type { HelperOptions } from 'handlebars';

export const registerHelpers = (Handlebars: typeof import('handlebars')) => {
  // 类型转换助手
  Handlebars.registerHelper('tsType', (swaggerType: string) => {
    const typeMap: Record<string, string> = {
      string: 'string',
      integer: 'number',
      number: 'number',
      boolean: 'boolean',
      array: 'Array<any>',
      object: 'Record<string, any>',
    };
    return typeMap[swaggerType] || 'any';
  });

  // 路径转参数名助手
  Handlebars.registerHelper('pathToParams', (path: string) => {
    return path
      .split('/')
      .filter((segment) => segment.startsWith(':'))
      .map((segment) => segment.slice(1))
      .join(', ');
  });

  // 条件判断助手
  Handlebars.registerHelper('eq', (a: any, b: any) => {
    return a === b;
  });

  // 格式化请求头助手
  Handlebars.registerHelper('formatHeaders', (headers: Record<string, string>) => {
    return Object.entries(headers)
      .map(([key, value]) => `'${key}': '${value}'`)
      .join(',\n    ');
  });
};
```

### 2. 注册助手函数

```typescript
// 在生成代码前注册助手
import { registerHelpers } from './template-helpers';

const Handlebars = require('handlebars');
registerHelpers(Handlebars);
```

## 高级模板技巧

### 1. 模板继承

创建基础模板：

```handlebars
{\{!-- my-templates/base.hbs --\}} {\{!-- 基础类型定义 --\}} {\{#each types\}\} export type
{\{name\}\} = {\{#if enum\}\}{\{#each enum\}\} | '{\{this\}\}'{\{#unless
@last\}\}{\{/unless\}\}{\{/each\}\}{\{else\}\} { {\{#each properties\}\} {\{name\}\}{\{#unless
required\}\}?{\{/unless\}\}: {\{type\}\};{\{/each\}\} }{\{/if\}\}; {\{/each\}\} {\{!-- 子模板 --\}\}
{\{> types\}\} {\{> request\}\}
```

### 2. 条件模板生成

根据配置生成不同内容：

```handlebars
{\{#if config.typesOnly\}\} // 只生成类型定义 {\{> types-only\}\} {\{else\}\} // 生成完整代码 {\{>
full\}\} {\{/if\}\}
```

### 3. 多格式输出

同时生成 TypeScript 和 JavaScript：

```handlebars
{\{#if (eq config.target 'typescript')\}\} // TypeScript 代码 import type { RequestConfig } from
'./types'; {\{else\}\} // JavaScript 代码 // @ts-check {\{/if\}\}
```

## 实用模板示例

### 1. 生成 Fetch API 版本

```handlebars
{\{!-- my-templates/fetch-request.ts --\}}
{\{#each interfaces\}\}
export function {\{utils.changeCase.camelCase name\}\}(
{\{#if parameters.length\}\}
  { {\{#each parameters\}\}
    {\{name\}\}{\{#unless required\}\}?{\{/unless\}\}: {\{#if (eq type 'string')\}\}string{\{else if (eq type 'number')\}\}number{\{else if (eq type 'boolean')\}\}boolean{\{else\}\}any{\{/if\}\}{\{#unless @last\}\};{\{/unless\}\}
    {\{/each\}\}
  }: {\{#if parameters.length\}\}{\{#if (eq method 'GET')\}\}{ {\{#each parameters\}\}{\{name\}\}: {\{#if (eq type 'string')\}\}string{\{else if (eq type 'number')\}\}number{\{else if (eq type 'boolean')\}\}boolean{\{else\}\}any{\{/if\}\}{\{#unless @last\}\}; {\{/unless\}\}{\{/each\}\} }{\{else\}\}{\{#each parameters\}\}{\{name\}\}: {\{#if (eq type 'string')\}\}string{\{else if (eq type 'number')\}\}number{\{else if (eq type 'boolean')\}\}boolean{\{else\}\}any{\{/if\}\}{\{#unless @last\}\} | {\{/unless\}\}{\{/each\}\}{\{/if\}\}{\{/if\}\} = {\{#if (eq method 'GET')\}\}{\}{\{else\}\}undefined{\{/if\}\}
): Promise<{\{responses.0.type\}\}> {
  const url = new URL('{\{path\}\}', '{\{../config.requestConfig.baseURL\}\}');

  {\{#if (eq method 'GET')\}\}
  {\{#each parameters\}\}
  if ({\{name\}\} !== undefined) {
    url.searchParams.set('{\{name\}\}', String({\{name\}\}));
  }
  {\{/each\}\}
  {\{/if\}\}

  const response = await fetch(url.toString(), {
    method: '{\{uppercase method\}\}',
    headers: {
      'Content-Type': 'application/json',
    },
    {\{#unless (eq method 'GET')\}\}
    body: JSON.stringify({\{#if parameters.length\}\}{\{#each parameters\}\}{\{name\}\}{\{#unless @last\}\}: {\{name\}\}{\{/unless\}\}{\{/each\}\}{\{/if\}\}),
    {\{/unless\}\}
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json() as Promise<{\{responses.0.type\}\}>;
}

{\{/each\}\}
```

### 2. 生成 Axios 客户端

```handlebars
{\{!-- my-templates/axios-client.ts --\}}
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string, config?: AxiosRequestConfig) {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      ...config,
    });

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        console.error('API Error:', error);
        return Promise.reject(error);
      }
    );
  }

  {\{#each interfaces\}\}
  {\{utils.changeCase.camelCase name\}\} = (
    {\{#if parameters.length\}\}
      data: {\{#if (eq method 'GET')\}\}{ {\{#each parameters\}\}{\{name\}\}?: {\{tsType type\}\};{\{/each\}\} }{\{else\}\}{ {\{#each parameters\}\}{\{name\}\}?: {\{tsType type\}\};{\{/each\}\} }{\{/if\}\}
    {\{/if\}\}
  ): Promise<{\{responses.0.type\}\}> => {
    return this.client.{\{lowercase method\}\}('{\{path\}\}'{\{#if parameters.length\}\}, {\{#if (eq method 'GET')\}\}{ params: data }{\{else\}\}data{\{/if\}\}{\{/if\}\});
  }
  {\{/each\}\}
}

export const apiClient = new ApiClient('{\{config.requestConfig.baseURL\}\}');

{\{#each interfaces\}\}
export const {\{utils.changeCase.camelCase name\}\} = apiClient.{\{utils.changeCase.camelCase name\}\};
{\{/each\}\}
```

## 模板测试

### 1. 单元测试

```typescript
// test/templates.test.ts
import { generateCode } from '../src/generator';

describe('Template Generation', () => {
  test('generates correct TypeScript types', async () => {
    const mockData = {
      types: [{ name: 'User', properties: [{ name: 'id', type: 'number' }] }],
    };

    const result = await generateCode('types.ts', mockData);
    expect(result).toContain('export interface User');
  });
});
```

### 2. 快照测试

```typescript
// test/templates.snapshot.test.ts
import { generateCode } from '../src/generator';

test('type template snapshot', async () => {
  const result = await generateCode('types.ts', mockData);
  expect(result).toMatchSnapshot();
});
```

## 最佳实践

### 1. 模板组织

```
my-templates/
├── base/                  # 基础模板
│   ├── types.hbs
│   └── request.hbs
├── frameworks/            # 框架特定模板
│   ├── react/
│   ├── vue/
│   └── angular/
└── utils/                 # 工具函数模板
    ├── validation.hbs
    └── helpers.hbs
```

### 2. 版本兼容

```handlebars
{\{#if config.typesOnly\}\} // 兼容旧版本配置 {\{> legacy-types\}\} {\{else\}\} // 新版本模板 {\{>
v2-types\}\} {\{/if\}\}
```

### 3. 错误处理

```handlebars
{\{#if interfaces\}\} {\{> interfaces\}\} {\{else\}\} // 警告：没有找到接口定义 console.warn('No
interfaces found in API definition'); {\{/if\}\}
```

### 4. 性能优化

- 缓存编译后的模板
- 避免深层嵌套循环
- 合理使用条件判断
- 复用公共模板片段

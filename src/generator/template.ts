// Simple template function to handle basic Handlebars-like syntax
export function compileTemplate(template: string): (data: any) => string {
  return (data: any) => {
    let result = template;

    // Handle #each blocks
    result = result.replace(
      /{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g,
      (_match, arrayName, content) => {
        const array = data[arrayName] || [];
        return array
          .map((item: any) => {
            let itemContent = content;
            // Handle #unless blocks within each
            itemContent = itemContent.replace(
              /{{#unless\s+(\w+)}}([\s\S]*?){{\/unless}}/g,
              (m, prop, innerContent) => {
                return !item[prop] ? innerContent : '';
              },
            );

            // Handle triple brace replacements (should output the value directly without escaping)
            itemContent = itemContent.replace(/{{{(\w+)}}}/g, (match, key) => {
              const value = item[key];
              return value !== undefined ? String(value) : match;
            });

            // Handle regular property replacements
            for (const [key, value] of Object.entries(item)) {
              // Skip triple brace replacements as they're already handled
              if (!new RegExp(`{{{${key}}}}`).test(itemContent)) {
                itemContent = itemContent.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
              }
            }
            return itemContent;
          })
          .join('');
      },
    );

    // Handle #if blocks (without else)
    result = result.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, condition, content) => {
      return data[condition] ? content : '';
    });

    // Handle #unless blocks
    result = result.replace(
      /{{#unless\s+(\w+)}}([\s\S]*?){{\/unless}}/g,
      (match, condition, content) => {
        return !data[condition] ? content : '';
      },
    );

    // Handle triple brace replacements (should output the value directly without escaping)
    result = result.replace(/{{{(\w+)}}}/g, (match, key) => {
      const value = data[key];
      return value !== undefined ? String(value) : match;
    });

    // Handle simple replacements
    for (const [key, value] of Object.entries(data)) {
      // Skip triple brace replacements as they're already handled
      if (!new RegExp(`{{{${key}}}}`).test(result)) {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      }
    }

    return result;
  };
}

// Template strings
export const requestTemplate = `import type { AxiosRequestConfig } from 'axios';
import axios from 'axios';
import consola from 'consola';

export interface RequestConfig extends AxiosRequestConfig {
  url: string;
  method: string;
}

// 用于转发请求的代理地址
const BASE_LINE_PROXY_PATH = '/api';

// 超时时间
const TIMEOUT = 5 * 1000;

export async function request<T = any>(config: RequestConfig): Promise<T> {
  try {
    const response = await axios({
      ...config,
      baseURL: BASE_LINE_PROXY_PATH,
      timeout: TIMEOUT,
    });

    return response.data;
  } catch (error) {
    consola.error('Request failed:', error);
    throw error;
  }
}
`;

export const interfaceTemplate = `// Interface for {{interfaceName}}
export interface {{interfaceName}}Request {
  {{#if hasParameters}}
  {{#each parameters}}
  /** {{description}} */
  {{name}}{{#unless required}}?{{/unless}}: {{{type}}};
  {{/each}}
  {{/if}}
}

export interface {{interfaceName}}Response {
  {{#if hasResponse}}
  {{#each responseProperties}}
  /** {{description}} */
  {{name}}: {{{type}}};
  {{/each}}
  {{/if}}
}

/**
 * {{description}}
 * @param params Request parameters
 * @returns Promise<{{interfaceName}}Response>
 */
export async function {{functionName}}(params: {{interfaceName}}Request): Promise<{{interfaceName}}Response> {
  const config: RequestConfig = {
    url: '{{path}}',
    method: '{{method}}',
    {{#if hasBody}}
    data: params,
    {{/if}}
    {{#unless hasBody}}
    {{#if hasParameters}}
    params,
    {{/if}}
    {{/unless}}
  };

  return request<{{interfaceName}}Response>(config);
}
`;

export const typeTemplate = `/**
 * {{description}}
 */
export interface {{typeName}} {
  {{#each properties}}
  /** {{description}} */
  {{name}}{{#unless required}}?{{/unless}}: {{{type}}};
  {{/each}}
}
`;

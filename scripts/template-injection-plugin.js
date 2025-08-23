/*
 * Webpack 插件示例 - 模板内容注入插件
 * 在构建时将模板文件内容注入到指定文件中
 *
 * 注意：这是一个示例插件，需要根据具体的构建工具进行调整
 */

const fs = require('fs');
const path = require('path');

class TemplateInjectionPlugin {
  constructor(options = {}) {
    this.options = {
      templates: {
        config: 'src/templates/config.ts',
        request: 'src/templates/request.ts',
      },
      outputFile: 'src/utils/templateUtils.ts',
      ...options,
    };
  }

  apply(compiler) {
    compiler.hooks.beforeCompile.tapAsync('TemplateInjectionPlugin', (compilation, callback) => {
      try {
        this.injectTemplates();
        callback();
      } catch (error) {
        callback(error);
      }
    });
  }

  injectTemplates() {
    const { templates, outputFile } = this.options;

    // 读取所有模板文件
    const templateContents = {};
    for (const [name, filePath] of Object.entries(templates)) {
      const fullPath = path.resolve(filePath);
      if (fs.existsSync(fullPath)) {
        templateContents[name] = fs.readFileSync(fullPath, 'utf8');
      }
    }

    // 生成 templateUtils.ts 内容
    const outputContent = this.generateTemplateUtilsContent(templateContents);

    // 写入文件
    const outputPath = path.resolve(outputFile);
    fs.writeFileSync(outputPath, outputContent, 'utf8');

    console.log(`✅ 模板内容已注入到: ${outputFile}`);
  }

  escapeTemplateString(content) {
    return content.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
  }

  generateTemplateUtilsContent(templates) {
    const templateEntries = Object.entries(templates)
      .map(([name, content]) => `  ${name}: \`${this.escapeTemplateString(content)}\``)
      .join(',\n');

    return `/*
 * 模版工具函数 - 自动生成，请勿手动修改
 * 由 TemplateInjectionPlugin 在构建时自动生成
 */

// 构建时自动注入的模板内容
const TEMPLATES = {
${templateEntries}
};

export function getTemplate(templateName: keyof typeof TEMPLATES): string {
  const template = TEMPLATES[templateName];
  if (!template) {
    throw new Error(\`模板不存在: \${templateName}\`);
  }
  return template;
}

export function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>,
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = \`{{\${key}}}\`;
    result = result.replace(new RegExp(placeholder, 'g'), value);
  }
  return result;
}

export function generateConfigContent(outputConfigFileType: string): string {
  const template = getTemplate('config');
  const target = outputConfigFileType === 'js' ? 'javascript' : 'typescript';
  const extension = outputConfigFileType;
  const variables = { TARGET: target, EXTENSION: extension };
  return replaceTemplateVariables(template, variables);
}
`;
  }
}

module.exports = TemplateInjectionPlugin;

// 使用示例（webpack.config.js）：
/*
const TemplateInjectionPlugin = require('./scripts/template-injection-plugin');

module.exports = {
  // ... 其他配置
  plugins: [
    new TemplateInjectionPlugin({
      templates: {
        config: 'src/templates/config.ts',
        request: 'src/templates/request.ts'
      },
      outputFile: 'src/utils/templateUtils.ts'
    })
  ]
};
*/

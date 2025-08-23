#!/usr/bin/env node
/*
 * 构建时模板内容注入脚本
 * 在构建前运行，将模板文件内容注入到 templateUtils.ts 中
 */

const fs = require('fs');
const path = require('path');

// 模板文件配置
const TEMPLATE_CONFIG = {
  config: 'src/templates/config.ts',
  request: 'src/templates/request.ts',
};

// 输出文件路径
const OUTPUT_FILE = 'src/utils/templateUtils.ts';

/**
 * 读取模板文件内容
 */
function readTemplateContent(filePath) {
  const fullPath = path.resolve(filePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`模板文件不存在: ${fullPath}`);
  }
  return fs.readFileSync(fullPath, 'utf8');
}

/**
 * 转义字符串用于嵌入到模板字符串中
 */
function escapeTemplateString(content) {
  return content
    .replace(/\\/g, '\\\\') // 转义反斜杠
    .replace(/`/g, '\\`') // 转义反引号
    .replace(/\$\{/g, '\\${'); // 转义模板字符串变量
}

/**
 * 生成 templateUtils.ts 文件内容
 */
function generateTemplateUtilsContent(templates) {
  const templateEntries = Object.entries(templates)
    .map(([name, content]) => `  ${name}: \`${escapeTemplateString(content)}\``)
    .join(',\n');

  return `/*
 * @Author: shawicx d35f3153@proton.me
 * @Date: ${new Date().toISOString().split('T')[0]} ${new Date().toTimeString().split(' ')[0]}
 * @LastEditors: Build Script
 * @LastEditTime: ${new Date().toISOString()}
 * @Description: 模版工具函数 - 自动生成，请勿手动修改
 */

// 构建时自动注入的模板内容
const TEMPLATES = {
${templateEntries}
};

/**
 * @description 获取模板内容
 * @param templateName 模板名称
 * @returns 模板内容
 */
export function getTemplate(templateName: keyof typeof TEMPLATES): string {
  const template = TEMPLATES[templateName];
  if (!template) {
    throw new Error(\`模板不存在: \${templateName}\`);
  }
  return template;
}

/**
 * @description 替换模板中的变量
 * @param template 模板内容
 * @param variables 变量映射
 * @returns 替换后的内容
 */
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

/**
 * @description 生成配置文件内容
 * @param outputConfigFileType 输出配置文件类型
 * @returns 生成的配置文件内容
 */
export function generateConfigContent(outputConfigFileType: string): string {
  const template = getTemplate('config');

  const target = outputConfigFileType === 'js' ? 'javascript' : 'typescript';
  const extension = outputConfigFileType;

  const variables = {
    TARGET: target,
    EXTENSION: extension,
  };

  return replaceTemplateVariables(template, variables);
}
`;
}

/**
 * 主函数
 */
function main() {
  try {
    console.log('📦 开始构建模板内容...');

    // 读取所有模板文件
    const templates = {};
    for (const [name, filePath] of Object.entries(TEMPLATE_CONFIG)) {
      console.log(`📄 读取模板文件: ${filePath}`);
      templates[name] = readTemplateContent(filePath);
    }

    // 生成 templateUtils.ts 内容
    const outputContent = generateTemplateUtilsContent(templates);

    // 写入文件
    const outputPath = path.resolve(OUTPUT_FILE);
    fs.writeFileSync(outputPath, outputContent, 'utf8');

    console.log(`✅ 模板内容已注入到: ${OUTPUT_FILE}`);
    console.log(`📊 共处理 ${Object.keys(templates).length} 个模板文件`);
  } catch (error) {
    console.error('❌ 构建模板内容失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { main };

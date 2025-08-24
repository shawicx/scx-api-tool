/*
 * @Author: shawicx d35f3153@proton.me
 * @Date: 2025-08-24 12:00:00
 * @LastEditors: shawicx d35f3153@proton.me
 * @LastEditTime: 2025-08-24 11:23:41
 * @Description: 模板工具函数 - 运行时读取模板文件
 */

import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

// ESM 环境下的 __filename 和 __dirname 替代方案
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// 模板文件路径配置
const TEMPLATE_DIR = path.join(__dirname, './templates');

/**
 * @description 获取模板内容
 * @param templateName 模板名称
 * @returns 模板内容
 */
export function getTemplate(templateName: string): string {
  const templatePath = path.join(TEMPLATE_DIR, `${templateName}.ts`);
  console.log(__filename, __dirname, templatePath, '文件名称');

  if (!fs.existsSync(templatePath)) {
    throw new Error(`模板文件不存在: ${templatePath}`);
  }

  return fs.readFileSync(templatePath, 'utf8');
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
    const placeholder = `{{${key}}}`;
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

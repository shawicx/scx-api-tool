/*
 * @Author: shawicx d35f3153@proton.me
 * @Date: 2025-08-13 22:53:26
 * @LastEditors: shawicx d35f3153@proton.me
 * @LastEditTime: 2025-08-23 23:38:25
 * @Description: 模版工具函数
 */
import fs from 'fs';
import path from 'path';

/**
 * @description 读取模板文件内容
 * @param templateName 模板文件名（不包含扩展名）
 * @returns 模板文件内容
 */
export function readTemplate(templateName: string): string {
  const templatePath = path.join(__dirname, '..', 'templates', `${templateName}.ts`);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`模板文件不存在: ${templatePath}`);
  }

  return fs.readFileSync(templatePath, 'utf-8');
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
  const template = readTemplate('config');

  const target = outputConfigFileType === 'js' ? 'javascript' : 'typescript';
  const extension = outputConfigFileType;

  const variables = {
    TARGET: target,
    EXTENSION: extension,
  };

  return replaceTemplateVariables(template, variables);
}

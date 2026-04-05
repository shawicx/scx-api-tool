/**
 * @description 接口函数生成器
 * 根据配置选择合适的模板生成接口函数代码
 */

import type { ApiConfig, InterfaceTemplateData } from '../../types';
import { compileTemplate } from './compiler';
import {
  getInterfaceTemplateByConfig,
  getApiOnlyTemplateByConfig,
  getZodInterfaceTemplateByConfig,
  getZodTypesOnlyTemplateByConfig,
  getZodApiOnlyTemplateByConfig,
  getTypesOnlyTemplateByConfig,
} from './templateDefinitions';

/**
 * @description 生成接口函数内容
 * 根据 generateApi、generateTypes、typesFormat 和 comment 配置选择合适的模板
 * @param interfaceInfo 接口信息对象
 * @param config 配置对象
 * @returns 生成的接口代码字符串
 */
export function generateInterfaceFunction(
  interfaceInfo: InterfaceTemplateData,
  config: ApiConfig,
): string {
  const comment = config.comment !== false;

  // JavaScript 目标始终使用 API-only 模板（无类型注解）
  if (config.target === 'javascript') {
    const template = getApiOnlyTemplateByConfig(comment);
    const compiledTemplate = compileTemplate(template);
    return compiledTemplate({
      ...interfaceInfo,
      requestFunctionName: config.requestFunctionName || 'request',
      requestMethodsObjectName: config.requestMethodsObjectName || 'requestMethods',
      requestMethodStyle: config.requestMethodStyle,
    });
  }

  const shouldGenerateTypes = config.generateTypes && config.typesFormat === 'typescript';
  const shouldGenerateApi = config.generateApi;
  const isZodMode = config.typesFormat === 'zod';
  const isZodGenerateTypes = config.generateTypes && isZodMode;

  const templateKey = `${isZodMode ? 'zod' : 'ts'}_${shouldGenerateApi ? 'api' : 'noapi'}_${shouldGenerateTypes || isZodGenerateTypes ? 'types' : 'notypes'}`;

  const templateMap: Record<string, () => string> = {
    zod_api_types: () => getZodInterfaceTemplateByConfig(comment),
    zod_noapi_types: () => getZodTypesOnlyTemplateByConfig(comment),
    zod_api_notypes: () => getZodApiOnlyTemplateByConfig(comment),
    ts_noapi_types: () => getTypesOnlyTemplateByConfig(comment),
    ts_api_notypes: () => getApiOnlyTemplateByConfig(comment),
    ts_api_types: () => getInterfaceTemplateByConfig(comment),
  };

  const template = (templateMap[templateKey] || (() => getApiOnlyTemplateByConfig(comment)))();

  const compiledTemplate = compileTemplate(template);

  return compiledTemplate({
    ...interfaceInfo,
    requestFunctionName: config.requestFunctionName || 'request',
    requestMethodsObjectName: config.requestMethodsObjectName || 'requestMethods',
    requestMethodStyle: config.requestMethodStyle,
  });
}

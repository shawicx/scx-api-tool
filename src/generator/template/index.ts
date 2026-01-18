/**
 * @description 模板系统模块
 * 提供 Handlebars 模板编译、缓存、辅助函数和 partials 管理
 */

export {
  getTemplateCacheStats,
  getTemplateFromCache,
  setTemplateCache,
  isTemplateCached,
  clearTemplateCache,
  templateCache,
} from './templateCache';

export {
  registerTemplateHelpers,
  getRegisteredHelpers,
  isHelperRegistered,
} from './templateHelpers';

export {
  registerTemplatePartials,
  getRegisteredPartials,
  isPartialRegistered,
} from './templatePartials';

export {
  generatePrecompiledMethodMap,
  getInterfaceTemplateWithComment,
  getInterfaceTemplateWithoutComment,
  getApiOnlyTemplateWithComment,
  getApiOnlyTemplateWithoutComment,
  getZodInterfaceTemplateWithComment,
  getZodInterfaceTemplateWithoutComment,
  getZodInterfaceTemplateByConfig,
  getZodApiOnlyTemplateWithComment,
  getZodApiOnlyTemplateWithoutComment,
  getZodApiOnlyTemplateByConfig,
  getTypeTemplateWithComment,
  getTypeTemplateWithoutComment,
  getTypesOnlyTemplateWithComment,
  getTypesOnlyTemplateWithoutComment,
  getTypesOnlyTemplateByConfig,
  getInterfaceTemplate,
  getApiOnlyTemplate,
  getTypeTemplate,
  getInterfaceTemplateByConfig,
  getApiOnlyTemplateByConfig,
  getTypeTemplateByConfig,
  compileTemplate,
  generateRequestFile,
  generateInterfaceFunction,
} from './compiler';

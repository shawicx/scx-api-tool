/**
 * @description 模板系统模块
 * 提供 Handlebars 模板编译、缓存、辅助函数和 partials 管理
 */

export {
  getTemplateFromCache,
  setTemplateCache,
  isTemplateCached,
  templateCache,
} from './templateCache';

export { registerTemplateHelpers } from './templateHelpers';

export { registerTemplatePartials } from './templatePartials';

export { compileTemplate, ensureRegistered } from './compiler';

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
  getInterfaceTemplateByConfig,
  getApiOnlyTemplateByConfig,
  getTypeTemplateByConfig,
} from './templateDefinitions';

export { generateRequestFile } from './requestFileGenerator';

export { generateInterfaceFunction } from './interfaceFunctionGenerator';

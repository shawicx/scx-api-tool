import { ChangeCase, ExtendedInterface } from '../types';

/**
 * @description 生成请求函数名称
 * @param interfaceInfo 接口信息
 * @param changeCase 大小写转换函数
 * @returns 请求函数名称
 */
export function getRequestFunctionName(
  interfaceInfo: ExtendedInterface,
  changeCase: ChangeCase,
): string {
  // /api/customer/v1/region/listDwg
  // 返回 getCustomerV1RegionListDwgApi
  // /api/system/v1/menu/query/{menuId}`
  // 返回 getSystemV1MenuQueryByMenuIdApi

  // 获取请求方法前缀
  const methodPrefix = interfaceInfo.method.toLowerCase();

  // 处理路径
  let { path: interfacePath } = interfaceInfo;

  // 移除开头的斜杠和api前缀
  interfacePath = interfacePath.replace(/^\/+/, '').replace(/^api\/+/, '');

  // 将路径参数 {xxx} 转换为 ByXxx 格式
  interfacePath = interfacePath.replace(
    /\{([^}]+)\}/g,
    (_, param) => `By${changeCase.pascalCase(param)}`,
  );

  // 将路径分段并转换为驼峰格式
  const pathSegments = interfacePath.split('/').filter(Boolean);
  const pathPart = pathSegments.map((segment) => changeCase.pascalCase(segment)).join('');

  // 组合最终的函数名，包含HTTP方法以区分相同路径的不同方法
  return `${methodPrefix}${pathPart}Api`;
}

/**
 * @description 生成请求数据类型名称
 * @param interfaceInfo 接口信息
 * @param changeCase 大小写转换函数
 * @returns 请求数据类型名称
 */
export function getRequestDataTypeName(
  interfaceInfo: ExtendedInterface,
  changeCase: ChangeCase,
): string {
  // /api/customer/v1/region/listDwg
  // 返回 GetCustomerV1RegionListDwgRequestType
  // /api/system/v1/menu/query/{menuId}`
  // 返回 GetSystemV1MenuQueryByMenuIdRequestType

  // 获取请求方法前缀
  const methodPrefix = changeCase.pascalCase(interfaceInfo.method);

  // 处理路径
  let { path: interfacePath } = interfaceInfo;

  // 移除开头的斜杠和api前缀
  interfacePath = interfacePath.replace(/^\/+/, '').replace(/^api\/+/, '');

  // 将路径参数 {xxx} 转换为 ByXxx 格式
  interfacePath = interfacePath.replace(
    /\{([^}]+)\}/g,
    (_, param) => `By${changeCase.pascalCase(param)}`,
  );

  // 将路径分段并转换为驼峰格式
  const pathSegments = interfacePath.split('/').filter(Boolean);
  const pathPart = pathSegments.map((segment) => changeCase.pascalCase(segment)).join('');

  // 组合最终的类型名，包含HTTP方法以区分相同路径的不同方法
  return `${methodPrefix}${pathPart}RequestType`;
}

/**
 * @description 生成响应数据类型名称
 * @param interfaceInfo 接口信息
 * @param changeCase 大小写转换函数
 * @returns 响应数据类型名称
 */
export function getResponseDataTypeName(
  interfaceInfo: ExtendedInterface,
  changeCase: ChangeCase,
): string {
  // /api/customer/v1/region/listDwg
  // 返回 GetCustomerV1RegionListDwgResponseType
  // /api/system/v1/menu/query/{menuId}`
  // 返回 GetSystemV1MenuQueryByMenuIdResponseType

  // 获取请求方法前缀
  const methodPrefix = changeCase.pascalCase(interfaceInfo.method);

  // 处理路径
  let { path: interfacePath } = interfaceInfo;

  // 移除开头的斜杠和api前缀
  interfacePath = interfacePath.replace(/^\/+/, '').replace(/^api\/+/, '');

  // 将路径参数 {xxx} 转换为 ByXxx 格式
  interfacePath = interfacePath.replace(
    /\{([^}]+)\}/g,
    (_, param) => `By${changeCase.pascalCase(param)}`,
  );

  // 将路径分段并转换为驼峰格式
  const pathSegments = interfacePath.split('/').filter(Boolean);
  const pathPart = pathSegments.map((segment) => changeCase.pascalCase(segment)).join('');

  // 组合最终的类型名，包含HTTP方法以区分相同路径的不同方法
  return `${methodPrefix}${pathPart}ResponseType`;
}

/*
 * @Author: shawicx d35f3153@proton.me
 * @Date: 2025-08-09 23:30:00
 * @LastEditors: shawicx d35f3153@proton.me
 * @LastEditTime: 2025-08-13 23:02:11
 * @Description: 接口处理相关的工具函数
 */
import isEmpty from 'lodash/isEmpty';
import omit from 'lodash/omit';
import { InterfaceList } from './apiTypes';

/**
 * @description 获取分类的接口列表
 * @param syntheticalConfig 综合配置
 * @param categoryList 分类列表
 * @param categoryId 分类ID
 * @returns 接口列表
 */
export function getInterfaceListFromCategory(
  categoryList: any[],
  categoryId: number,
): InterfaceList {
  const category = (categoryList || []).find(
    (cat: any) => !isEmpty(cat) && !isEmpty(cat.list) && cat.list[0].catid === categoryId,
  );

  if (category) {
    category.list.forEach((interfaceInfo: any) => {
      // 实现 _category 字段
      const updatedInterfaceInfo = interfaceInfo;
      updatedInterfaceInfo._category = omit(category, 'list');
    });
  }

  return category ? category.list : [];
}

/**
 * @description 处理分类ID列表
 * @param categoryIds 分类ID数组
 * @param projectCats 项目分类列表
 * @returns 处理后的分类ID数组
 */
export function processCategoryIds(categoryIds: number[], projectCats: any[]): number[] {
  let processedIds = [...categoryIds];

  // 全部分类
  if (processedIds.includes(0)) {
    const cats = Array.isArray(projectCats) ? projectCats : [];
    processedIds.push(...cats.map((cat) => cat._id));
  }

  // 唯一化
  processedIds = [...new Set(processedIds)];

  // 去掉被排除的分类
  const excludedCategoryIds = processedIds.filter((id) => id < 0).map(Math.abs);

  processedIds = processedIds.filter((id) => !excludedCategoryIds.includes(Math.abs(id)));

  // 删除不存在的分类
  const cats = Array.isArray(projectCats) ? projectCats : [];
  processedIds = processedIds.filter((id) => !!cats.find((cat) => cat._id === id));

  // 顺序化
  processedIds.sort();

  return processedIds;
}

/**
 * @description 生成分类UID
 * @param serverUrl 服务器URL
 * @param token 令牌
 * @param categoryId 分类ID
 * @returns 分类UID
 */
export function generateCategoryUID(serverUrl: string, token: string, categoryId: number): string {
  return `${serverUrl}_${token}_${categoryId}`;
}

/**
 * @description 计算接口代码的权重
 * @param serverIndex 服务器索引
 * @param projectIndex 项目索引
 * @param categoryIndex 分类索引
 * @param categoryIndex2 分类索引2
 * @returns 权重数组
 */
export function calculateInterfaceCodeWeights(
  serverIndex: number,
  projectIndex: number,
  categoryIndex: number,
  categoryIndex2: number,
): number[] {
  return [serverIndex, projectIndex, categoryIndex, categoryIndex2];
}

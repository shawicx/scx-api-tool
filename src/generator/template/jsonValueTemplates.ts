/**
 * @description JsonValue 相关模板定义
 *
 * 从 templateDefinitions.ts 拆出，避免该文件过度膨胀（AGENTS.md 约束 < 360 行）。
 * 包含两类模板：
 * - 递归 JsonValue 类型（任意 JSON 值：对象/数组/标量/null）
 * - Jackson 动态类型别名（type JsonNode = JsonValue）
 */

// ==================== JsonValue 递归类型模板 ====================

/**
 * @description JsonValue 递归类型模板 - 带注释
 * 生成 `type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }`
 * @returns 模板字符串
 */
export function getJsonValueTemplateWithComment(): string {
  return `/**
 * @description {{description}}
 */
export type {{typeName}} = string | number | boolean | null | {{typeName}}[] | { [key: string]: {{typeName}} };
`;
}

/**
 * @description JsonValue 递归类型模板 - 不带注释
 * @returns 模板字符串
 */
export function getJsonValueTemplateWithoutComment(): string {
  return `export type {{typeName}} = string | number | boolean | null | {{typeName}}[] | { [key: string]: {{typeName}} };
`;
}

/**
 * @description 根据配置获取 JsonValue 递归类型模板
 * @param comment 是否包含注释
 * @returns 模板字符串
 */
export function getJsonValueTemplateByConfig(comment: boolean): string {
  return comment ? getJsonValueTemplateWithComment() : getJsonValueTemplateWithoutComment();
}

// ==================== Jackson 别名模板 ====================

/**
 * @description 类型别名模板 - 带注释
 * 用于 Jackson 动态类型，生成 `type JsonNode = JsonValue`
 * @returns 模板字符串
 */
export function getTypeAliasTemplateWithComment(): string {
  return `/**
 * @description {{description}}
 */
export type {{typeName}} = {{aliasType}};
`;
}

/**
 * @description 类型别名模板 - 不带注释
 * @returns 模板字符串
 */
export function getTypeAliasTemplateWithoutComment(): string {
  return `export type {{typeName}} = {{aliasType}};
`;
}

/**
 * @description 根据配置获取类型别名模板
 * @param comment 是否包含注释
 * @returns 模板字符串
 */
export function getTypeAliasTemplateByConfig(comment: boolean): string {
  return comment ? getTypeAliasTemplateWithComment() : getTypeAliasTemplateWithoutComment();
}

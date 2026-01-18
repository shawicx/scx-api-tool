/**
 * @description 类型模板
 * TypeScript 类型的代码生成模板
 */

export const typeTemplate = `/**
 * {{description}}
 */
export interface {{typeName}} {
  {{#each properties}}
  /** {{description}} */
  {{{name}}}{{#unless required}}?{{/unless}}: {{{type}}};
  {{/each}}
}
`;

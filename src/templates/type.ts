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

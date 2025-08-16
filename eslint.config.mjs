/*
 * @Author: shawicx d35f3153@proton.me
 * @Date: 2025-08-08 23:50:48
 * @LastEditors: shawicx d35f3153@proton.me
 * @LastEditTime: 2025-08-13 23:16:19
 * @Description:
 */
import { base } from 'eslint-config-ali';
import prettier from 'eslint-plugin-prettier/recommended';

export default [
  ...base,
  prettier,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    ignores: [
      'docs/**/*.ts',
      'docs/**/*.js',
      'src/service/**/*',
      'src/templates/**/*',
      'lib/**/*',
      'assets/**/*',
      'apiPower.config.ts',
      '.vitepress/cache/**/*',
    ],
  },
];

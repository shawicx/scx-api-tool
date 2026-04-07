/*
 * @Author: shawicx d35f3153@proton.me
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
        projectService: true,
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
      'scripts/**/*',
      'apiPower.config.ts',
      '.vitepress/cache/**/*',
    ],
  },
  {
    files: ['src/**/__tests__/**/*.test.ts', 'src/**/__tests__/*.ts', 'tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/consistent-type-assertions': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
];

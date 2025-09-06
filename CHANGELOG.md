# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## 0.4.0 (2025-09-06)

### ⚠ BREAKING CHANGES

- **template:** 模板系统从纯运行时改为构建时注入优先，运行时降级
  解决了构建后模板文件路径问题，提升了性能和可靠性

### Features

- add GitHub Pages deployment configuration ([ed1d7f6](https://github.com/shawicx/scx-api-tool/commit/ed1d7f66007b8c9b714f3485b2b5c1fbfb2b84ef))
- major refactor and documentation updates ([67f806c](https://github.com/shawicx/scx-api-tool/commit/67f806c12b8116ee74bdf648ab949b4208dc4a26))
- major refactor and version bump to 0.1.0 ([4116462](https://github.com/shawicx/scx-api-tool/commit/4116462f620fb1e325b297d31ec13a6cdc9c45f6))
- **template:** 实现构建时模板注入系统 ([8ca512b](https://github.com/shawicx/scx-api-tool/commit/8ca512bf390a01a8805f453bb76e088c9d707306))
- update code generation utilities ([1baf9d6](https://github.com/shawicx/scx-api-tool/commit/1baf9d68065db19a10ab099cd532c1e3d2b72eae))
- update project configuration and assets ([98b93be](https://github.com/shawicx/scx-api-tool/commit/98b93beedd5e7224c4517f71dbea6273d3c42106))
- 使用config的模版文件 ([f0f223a](https://github.com/shawicx/scx-api-tool/commit/f0f223abe9780e11f2a2e68fa574f4da102bd196))
- 文件结构以及代码重构、按模块生成代码、去掉requestConfig以及mockUrl、删除vtils/haoma等依赖、使用changeset发布包 ([75c5dd4](https://github.com/shawicx/scx-api-tool/commit/75c5dd40f3ab940fad5c07bcadb740a754a06d08))
- 更新配置和类型定义 ([3f36608](https://github.com/shawicx/scx-api-tool/commit/3f366089b049d28d33085ee03a4c778793993194))
- 添加代码格式化功能和输出目录清理机制 ([6e889ed](https://github.com/shawicx/scx-api-tool/commit/6e889ed94e9da1bdc6465066543a030bda48896c))

### Bug Fixes

- bim ([950eb69](https://github.com/shawicx/scx-api-tool/commit/950eb69a07801c7b1d8188f1a854b9c41616575d))
- bin ([d8afd3a](https://github.com/shawicx/scx-api-tool/commit/d8afd3a48fa8e1ad41bdfaf1292678492ff13aaa))
- build opts ([840b37c](https://github.com/shawicx/scx-api-tool/commit/840b37c2fb3259ba266ddab2999ccab96e1497e5))
- commitlint ([cb3cb2d](https://github.com/shawicx/scx-api-tool/commit/cb3cb2d0b08204767b1bc86df2e9a0c15df3608b))
- esm ([388c073](https://github.com/shawicx/scx-api-tool/commit/388c07303eb068c2778b0512ad8aa3756f3ad876))
- favicon 404 ([e51fd17](https://github.com/shawicx/scx-api-tool/commit/e51fd178f5e4bf85442aeedc3ceffa6c33346bb2))
- github actions ([6486c08](https://github.com/shawicx/scx-api-tool/commit/6486c0815b4392f040e45498b0c62727a24f34d2))
- github acttios的pnpm 版本 ([00ab7d2](https://github.com/shawicx/scx-api-tool/commit/00ab7d29465a28a008f38112c7bcb6bb22ddabe8))
- lodash ([336edfd](https://github.com/shawicx/scx-api-tool/commit/336edfd7826fc3c2d209728b0d7c3d167ba62ec0))
- logo ([73ad59c](https://github.com/shawicx/scx-api-tool/commit/73ad59c51a9a4328c08f6c069cdb8b6e6296a250))
- main entry ([9a6ed28](https://github.com/shawicx/scx-api-tool/commit/9a6ed28ce9e7c851462c3652e00ed3dc3622bede))
- pkg配置 ([ddf4d3c](https://github.com/shawicx/scx-api-tool/commit/ddf4d3c5b4591ba4c4c183687eb5dd0e0bb75e40))
- prettier ([d35a444](https://github.com/shawicx/scx-api-tool/commit/d35a44468e5d48f4c7b6f1e268404f657898f3e3))
- publish config ([ec1a085](https://github.com/shawicx/scx-api-tool/commit/ec1a08514dd02dbfc0a67c427cb5880f6f111aa0))
- request ([656d48d](https://github.com/shawicx/scx-api-tool/commit/656d48d8efc3764b092a681a31724355b9999e84))
- templateUtils变更 ([517d499](https://github.com/shawicx/scx-api-tool/commit/517d49925e2169a97dd96e9421ee4772455ee194))
- ts error ([7f02617](https://github.com/shawicx/scx-api-tool/commit/7f026175bd6029ce47e5e8af94a14a55bf06fdc7))
- 修改git配置 ([9bf587e](https://github.com/shawicx/scx-api-tool/commit/9bf587e3830a019c36dcd1957b91f9215116008c))
- 删除git配置 ([deed76e](https://github.com/shawicx/scx-api-tool/commit/deed76ecfbdccfbba793b795f0a8294830ed9c53))
- 取掉不必要掉生成代码 ([135257b](https://github.com/shawicx/scx-api-tool/commit/135257bdab0808059cb2be9e00564696eab81a36))

### Refactors

- reorganize git config files and GitHub workflows to git directory ([0b6ad0b](https://github.com/shawicx/scx-api-tool/commit/0b6ad0b410551baf2e7644d9ea236f4cb094a73f))
- simplify vitepress config and update node version requirement ([72f304f](https://github.com/shawicx/scx-api-tool/commit/72f304f2819096fd577c4befcd2abead08f04993))
- simplify VitePress configuration ([42ee9b1](https://github.com/shawicx/scx-api-tool/commit/42ee9b19e9e41bfd53280b8d802be72224bd00f8))
- update VitePress configuration and cleanup config files ([e702f73](https://github.com/shawicx/scx-api-tool/commit/e702f7378f48187e4cc3872f4abf97439eba570b))
- 只支持esm ([6926e29](https://github.com/shawicx/scx-api-tool/commit/6926e296ceb2f94cea3320590e4139bd3070a895))
- 移除 pnpm lock 文件以提高兼容性 ([918dfe2](https://github.com/shawicx/scx-api-tool/commit/918dfe2dfc474b84d6003f3b7857978ac1b2047d))
- 重构 ([01f3219](https://github.com/shawicx/scx-api-tool/commit/01f3219ae09b0ddb84e40dd92ac0734d3ededb7f))
- 重构cli ([671f208](https://github.com/shawicx/scx-api-tool/commit/671f2088b2e6c8d784dba30d792537246d5272ac))
- 重构项目结构和类型定义 ([1260f6d](https://github.com/shawicx/scx-api-tool/commit/1260f6d499b6bd68bdde9a1444d97f91db37f97f))

### Documentation

- **changeset:** chore: changeset cfg ([21e7b50](https://github.com/shawicx/scx-api-tool/commit/21e7b5040e391230bbdea7e0c4a1ec4f86f4aabb))
- **changeset:** feat: update code generation utilities ([64fb6ec](https://github.com/shawicx/scx-api-tool/commit/64fb6ec3a7f2e58013d2e6dacc92ad33f0a70f16))
- **changeset:** fix: 去掉不必要的生成代码 ([7cfb1a3](https://github.com/shawicx/scx-api-tool/commit/7cfb1a3275e9db79894d5bd0a8e3b31b43d158f0))

## 0.3.3

### Patch Changes

- 64fb6ec: feat: update code generation utilities

## 0.3.2

### Patch Changes

- 7cfb1a3: fix: 去掉不必要的生成代码

## 0.3.1

### Patch Changes

- refactor: 重构项目结构和类型定义

## 0.3.0

### Minor Changes

- refacotr: 只支持esm

## 0.2.2

### Patch Changes

- 21e7b50: chore: changeset cfg

## 0.2.1

### Patch Changes

- fix: pkg配置

## 0.2.0

### Minor Changes

- fix: release

## 0.1.12

### Patch Changes

- refactor: 重构

## 0.1.10

### Patch Changes

- fix: bin

## 0.1.8

### Patch Changes

- fix: esm配置

## 0.1.7

### Patch Changes

- refactor: 重构cli

## 0.1.6

### Patch Changes

- fix: bin

## 0.1.5

### Patch Changes

- fix: bin

## 0.1.4

### Patch Changes

- chore: build opts

## 0.1.3

### Patch Changes

- fix: build opts

## 0.1.2

### Patch Changes

- fix: main entry

## 0.1.1

### Patch Changes

- fix: 构建

## 0.0.7

### Patch Changes

- fix: 模版问题

## 0.0.5

### Patch Changes

- fix: bug

## 0.0.3

### Patch Changes

- fix: ts-node问题

## 0.0.2

### Patch Changes

- feat: favicon

## 0.0.1

### Patch Changes

- feat: 代码重构、文件重构、支持按模块生成、outputDir替换outputFilePath、支持apifox项目、删除或升级依赖、使用changeset cli发布

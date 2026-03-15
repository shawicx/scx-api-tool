# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.5.1](https://github.com/shawicx/scx-api-tool/compare/v0.4.10...v0.5.1) (2026-03-15)

### Features

- 优化构建配置 ([6adea45](https://github.com/shawicx/scx-api-tool/commit/6adea452ec9b03b15ef6d142888be0c49b3480be))
- 添加 OpenSpec ([e01591e](https://github.com/shawicx/scx-api-tool/commit/e01591ee149101a5abcf28ecfc23ac672edf70ee))
- 添加注释以及统一注释风格 ([926fac2](https://github.com/shawicx/scx-api-tool/commit/926fac26d018ef3bc98e47e87ed14f448a596918))
- 添加配置-生成hooks ([040e72e](https://github.com/shawicx/scx-api-tool/commit/040e72e7ad16899e94cc58d633dd76d61d85f335))
- 重构zod生成系统，简化配置并统一文件结构 ([b800a98](https://github.com/shawicx/scx-api-tool/commit/b800a986eed1e7af65fdfdf0c8cbcf29557d699f))

### Bug Fixes

- 修复生成代码的问题 ([9782c80](https://github.com/shawicx/scx-api-tool/commit/9782c80c0cd549033f9fc206f843d9fe6a4404ce))

### Refactors

- 优化生成代码的导入语句，将 RequestConfig 改为类型导入 ([1414b08](https://github.com/shawicx/scx-api-tool/commit/1414b0848f2dd04023c4868ff12dbdb1692ddb2d))
- 提取公共逻辑到 processors/common.ts，删除接口按标签分组的重复代码 ([5f59251](https://github.com/shawicx/scx-api-tool/commit/5f59251cee5fe4cceedb5794681da8405cda13c2))
- 重构代码结构，拆分大文件并优化模块组织 ([642c071](https://github.com/shawicx/scx-api-tool/commit/642c071c15c47706f03debe7b51e9dc8f3e5f875))

### Documentation

- **refactor:** 更新 AGENTS.md 和 tasks.md，完成代码结构重构文档 ([9615215](https://github.com/shawicx/scx-api-tool/commit/9615215fc74c0abd0d5ccfb1b4c1a7272be00d57))
- 修改文档 ([08aa929](https://github.com/shawicx/scx-api-tool/commit/08aa92983990e9cdc087edf81f85dc2164d4523b))
- 删除不需要文件 ([c9dfb1d](https://github.com/shawicx/scx-api-tool/commit/c9dfb1d605c9b3b90cc47ebca1a6b47bc520a61c))
- 文档更新 ([05596bf](https://github.com/shawicx/scx-api-tool/commit/05596bf62485f27dd704b1bf3fa07c413fa71595))
- 更新一些文档 ([4cb2c56](https://github.com/shawicx/scx-api-tool/commit/4cb2c564c372869481824f8bc1ca1e5f1b6d50f6))
- 更新文档 ([4f83a07](https://github.com/shawicx/scx-api-tool/commit/4f83a076b99b96fb00648f394a3cecadacc8d8bc))
- 更新文档 ([6819ce3](https://github.com/shawicx/scx-api-tool/commit/6819ce32d67b86e13b251f090023b7d247ad26d5))
- 更新文档 ([2eb163f](https://github.com/shawicx/scx-api-tool/commit/2eb163fdcb788e3970e798e79e333e075eca7039))

### [0.4.10](https://github.com/shawicx/scx-api-tool/compare/v0.4.9...v0.4.10) (2026-01-10)

### Refactors

- 优化生成代码的导出语法 ([a15b85a](https://github.com/shawicx/scx-api-tool/commit/a15b85a924169f40e7e472146e836d6dc047de43))

### [0.4.9](https://github.com/shawicx/scx-api-tool/compare/v0.4.8...v0.4.9) (2026-01-09)

### Features

- 优化API代码生成器的命名规范和文件夹处理 ([1af765e](https://github.com/shawicx/scx-api-tool/commit/1af765ed3cdfbb50a68f563f414c5bb6e7f3bc6a))
- 优化构建配置，只生成入口文件的类型声明 ([797e649](https://github.com/shawicx/scx-api-tool/commit/797e649ba850fa893c2e91f37fe6246cf5796665))
- 实现 Zod Schema 支持 ([00e48c5](https://github.com/shawicx/scx-api-tool/commit/00e48c55babb2041b7ca0970df5f77947c516080))
- 支持多种 alias 路径配置 ([5b4739a](https://github.com/shawicx/scx-api-tool/commit/5b4739a54feafe2dcce9991f30db799d5f83a17e))
- 添加自定义命名配置 ([91c46a3](https://github.com/shawicx/scx-api-tool/commit/91c46a3e720a2debd8da669e1a10bc893e9f2c00))
- 配置模版更新 ([c314dd4](https://github.com/shawicx/scx-api-tool/commit/c314dd4ff6242c177ede888adbbccb3fd4fcaa42))
- 重构配置系统，生成zod schema ([63d202d](https://github.com/shawicx/scx-api-tool/commit/63d202d9cd3a84bccadf722bec4c6e091adedb14))

### Bug Fixes

- 修复requestFunctionName配置 ([16cf43a](https://github.com/shawicx/scx-api-tool/commit/16cf43ade4baf0bd1ea922ddef36b666f4472f40))
- 修复TypeScript编译错误并更新所有依赖到最新版本 ([8590dea](https://github.com/shawicx/scx-api-tool/commit/8590dea9c546d443d0bc49982c2993140f2a47bf))

### Refactors

- 重构进度显示模块并删除未使用的配置项 ([2dc7d3e](https://github.com/shawicx/scx-api-tool/commit/2dc7d3e4691325e734254e1b57b99f8eb7a4e3f6))

### Documentation

- 更新文档 ([4822ca3](https://github.com/shawicx/scx-api-tool/commit/4822ca3dd4f19412c8236d5d4f1ff7a7aa3a9b20))

### [0.4.8](https://github.com/shawicx/scx-api-tool/compare/v0.4.7...v0.4.8) (2026-01-07)

### Features

- 添加配置可视化服务器和 Web 界面 ([90e9e69](https://github.com/shawicx/scx-api-tool/commit/90e9e69cd07203129f8c2761a4d9b542f5a48952))
- 生成代码前自动清理输出目录 ([e7be749](https://github.com/shawicx/scx-api-tool/commit/e7be7496811e044c758d2ef3cdb2ba7b40a4763b))
- 统一错误处理 ([6f6dea1](https://github.com/shawicx/scx-api-tool/commit/6f6dea17128aebcaa605420300c3153d36a26c46))

### Bug Fixes

- 修复代码生成中的HTML转义和接口名称清理问题 ([fe57093](https://github.com/shawicx/scx-api-tool/commit/fe57093d6511dcfbd708969070c679d5ffc06feb))
- 修复类型名称不一致导致类型导入缺失的问题 ([a80a7d8](https://github.com/shawicx/scx-api-tool/commit/a80a7d8bdbe8ccd7b2c42460b8794f7bf02d40b7))

### [0.4.7](https://github.com/shawicx/scx-api-tool/compare/v0.4.6...v0.4.7) (2026-01-02)

### Bug Fixes

- standard-version配置 ([eb22be8](https://github.com/shawicx/scx-api-tool/commit/eb22be8aa2477b8db319119e2729bf73f5a8ecc0))
- 修复 release 流程中的 git 工作区问题 ([1d4f3b6](https://github.com/shawicx/scx-api-tool/commit/1d4f3b60e38a47f65cf2301015920e70e8f642ff))

### [0.4.6](https://github.com/shawicx/scx-api-tool/compare/v0.4.5...v0.4.6) (2026-01-02)

### Features

- 实现模板编译缓存 ([42266d6](https://github.com/shawicx/scx-api-tool/commit/42266d692be120fc53a0adf110f1837860b74aae))

### [0.4.5](https://github.com/shawicx/scx-api-tool/compare/v0.4.4...v0.4.5) (2026-01-02)

### [0.4.4](https://github.com/shawicx/scx-api-tool/compare/v0.4.3...v0.4.4) (2026-01-02)

### [0.4.3](https://github.com/shawicx/scx-api-tool/compare/v0.4.2...v0.4.3) (2026-01-02)

### Features

- claude添加配置文件 ([f9285aa](https://github.com/shawicx/scx-api-tool/commit/f9285aa9d6f3cf1f1c20b842c3322c520bd69224))
- implement comprehensive progress management system ([fbb6a3c](https://github.com/shawicx/scx-api-tool/commit/fbb6a3c3d73ecee3140f23d588f763db30eeca7e))
- update file generator and template modules ([53757ae](https://github.com/shawicx/scx-api-tool/commit/53757ae8def7986c3632a7bb0ba9261612a4e46c))
- 国际化 CLI 命令和工具函数，添加中文支持 ([1c8f30b](https://github.com/shawicx/scx-api-tool/commit/1c8f30b8f8bcce504a4481e4805cbd7ec5da1e50))
- 完成预设配置开发 ([1edf52c](https://github.com/shawicx/scx-api-tool/commit/1edf52cb36963ee07aa903dc46cc68f62b3a074c))
- 实现并发文件写入优化 ([229d195](https://github.com/shawicx/scx-api-tool/commit/229d19501004d2cad76a202d53a657915a56958e))
- 添加 apiOnly 模式 ([7f27a84](https://github.com/shawicx/scx-api-tool/commit/7f27a848d9550eeff5ec1103a5de31d4cd22df14))
- 添加 comment 配置项以控制是否生成注释 ([b5800f0](https://github.com/shawicx/scx-api-tool/commit/b5800f0287c2fa8c6cbbadcbd41ffac1b008a0f4))
- 添加请求方法风格配置选项并优化模板系统 ([108ed65](https://github.com/shawicx/scx-api-tool/commit/108ed65d3f08899f2e15d6003e99d8f3a55a9377))
- 移除reactHook配置及相关代码 ([cd97cb0](https://github.com/shawicx/scx-api-tool/commit/cd97cb0d80ca98aaea88187d7b4fe8e4376def7c))
- 调整 Apifox 项目配置结构并优化调试日志 ([773cce8](https://github.com/shawicx/scx-api-tool/commit/773cce8c8086cb4c48bef485ae5b8475c4005641))
- 配置验证功能 ([ee366d1](https://github.com/shawicx/scx-api-tool/commit/ee366d1bf002a437c182f0ec72fa6b32ce828468))
- 重构配置文件，简化为仅需2个必需配置项 ([ed3a864](https://github.com/shawicx/scx-api-tool/commit/ed3a864b9cb1960e3202e67e224325131ca5cc1c))

### Bug Fixes

- 修复typesOnly以及apiOnly配置生成的问题（重构模版系统） ([00f04f5](https://github.com/shawicx/scx-api-tool/commit/00f04f575282809cc15e9ec5f6a4aacd7f6d88fe))
- 移除临时调试代码，避免重复执行日志输出 ([d824444](https://github.com/shawicx/scx-api-tool/commit/d8244449c52f78e85a534d3a1ffbc19a8b00aabd))

### Documentation

- add QWEN.md documentation ([224704a](https://github.com/shawicx/scx-api-tool/commit/224704a66f8b3451d59a5e721972f4eb7702c82a))

### Refactors

- 优化依赖配置和构建设置 ([a80a2a3](https://github.com/shawicx/scx-api-tool/commit/a80a2a381e03ccedadd9d5850284729adddfe716))
- 拆分重构类型定义 ([f509274](https://github.com/shawicx/scx-api-tool/commit/f5092742fde9d5803548914a76f2bf99bae48204))
- 调整 ServerType 枚举为常量对象并更新配置 ([62a57d6](https://github.com/shawicx/scx-api-tool/commit/62a57d6e82846b9f34408fff98a4be8bfdfffe14))
- 重构代码注释和清理项目依赖 ([bfef9ef](https://github.com/shawicx/scx-api-tool/commit/bfef9efa356fafb07576262654559a46576f49c5))
- 重构文档结构 ([81ae4a9](https://github.com/shawicx/scx-api-tool/commit/81ae4a9ca3ce66f4ab291ff083ce4bc9a488e686))
- 重组项目结构和代码架构 ([4388e7d](https://github.com/shawicx/scx-api-tool/commit/4388e7de243dbeee3bd3311e316c53d096caf882))

### [0.4.2](https://github.com/shawicx/scx-api-tool/compare/v0.4.1...v0.4.2) (2025-09-06)

### Features

- add api-power configuration files and update TypeScript modules ([101d15a](https://github.com/shawicx/scx-api-tool/commit/101d15a23b039f831a9b6f4c1dc469981470dc00))

### Refactors

- major architecture refactoring and OpenAPI 3.0 support ([190c53c](https://github.com/shawicx/scx-api-tool/commit/190c53c2d6cabbb9e060b995c54b6692a24326bd))

### [0.4.1](https://github.com/shawicx/scx-api-tool/compare/v0.4.0...v0.4.1) (2025-09-06)

### Documentation

- 更新 CHANGELOG.md ([bf97d81](https://github.com/shawicx/scx-api-tool/commit/bf97d8168c656e56e18edd98b88fbd9b8efb9740))

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

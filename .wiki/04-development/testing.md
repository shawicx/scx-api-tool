# 测试体系

一句话职责：Vitest 单元测试的组织方式、运行命令与覆盖率要求。

## 概览

| 项       | 值                                               |
| -------- | ------------------------------------------------ |
| 框架     | Vitest（配置 `vitest.config.ts`）                |
| 位置     | 各模块同级 `__tests__/` 目录                     |
| 夹具     | `tests/fixtures/mockData.ts`（共享 mock 数据）   |
| 覆盖率   | `@vitest/coverage-v8`，语句/分支/函数/行 ≥ 75%   |
| 排除     | `src/service/**`（生成文件）、`src/templates/**` |
| 路径别名 | `@/*` → `src/*`（与 `tsconfig.json` 一致）       |

## 命令

```bash
pnpm test             # vitest run
pnpm test:watch       # 监听模式
pnpm test:coverage    # 覆盖率报告
```

## 测试文件分布（非生成代码部分）

```text
src/
  cli/commands/__tests__/                    # CLI 命令
  clients/__tests__/                         # 客户端调度
  clients/base/__tests__/                    # 注册器/基类
  clients/implementations/__tests__/         # Swagger/Apifox 客户端
  config/__tests__/                          # 配置加载器（单元）
  config/__tests__/loader.integration.test.ts  # 多服务配置加载集成测试
  errors/__tests__/                          # 错误系统
  generator/__tests__/                       # 代码生成（codegen/extractor/fileGenerator 等）
  generator/generators/__tests__/            # 各专用生成器
  generator/template/__tests__/              # 模板引擎（compiler/cache/definitions 等）
  generator/template/zod/__tests__/          # Zod 模板
  naming/__tests__/                          # 命名策略与清理
  processors/__tests__/                      # openapi/common 处理器
  utils/__tests__/                           # 工具（config/path/file/formatter/hooks/concurrency 等）
  validation/__tests__/                      # 校验集成
  validation/validators/__tests__/           # basic/url/logic 各验证器
tests/fixtures/mockData.ts                   # 共享夹具
```

## 编写要点

- 修改任何代码后运行 `pnpm test` 确保全量通过（AGENTS.md 硬性要求）
- 集成测试夹具位于 `src/config/__tests__/__integration_fixtures__/` 与 `__test_fixtures__/`（多服务配置文件样例）
- 覆盖率低于 75% 会导致 CI 失败

## Related

- [本地开发](../02-getting-started/local-development.md)
- [编码规范](./coding-conventions.md)

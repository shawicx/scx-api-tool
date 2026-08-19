# 配置体系

一句话职责：说明多服务（microservice）配置模型、解析管线与破坏式变更点。面向最终用户的完整配置项说明见 [docs/guides/configuration.md](../../docs/guides/configuration.md)，本页关注结构模型与代码流向。

## 配置模型（`src/types/config.ts`）

```typescript
import { defineConfig } from '@scxfe/api-tool';

export default defineConfig({
  // ===== 公共配置（CommonServiceConfig，所有服务继承）=====
  baseOutputDir: 'src/service', // 公共根输出目录（默认 'src/service'）
  typesFormat: 'typescript', // 'typescript' | 'zod'
  target: 'typescript', // 'javascript' 时全部输出 .js 并跳过类型
  preset: 'standard', // 'minimal' | 'standard' | 'verbose'（仅公共层生效）
  concurrency: 5,

  // ===== 服务列表（必填，非空数组）=====
  services: [
    {
      name: 'main', // 必填、全局唯一，默认 folder 取 name
      folder: '.', // 可选，输出到 join(baseOutputDir, folder)
      source: 'https://api.apifox.com/v1/projects/{id}/export-openapi',
      token: 'APS-...', // Swagger 不需要
    },
    {
      name: 'order',
      folder: 'trade/order', // 支持多段路径
      source: 'https://order-svc/v3/api-docs',
    },
  ],
});
```

关键类型链：`MultiServiceConfig`（用户输入）= 公共配置 `CommonServiceConfig` + `baseOutputDir?` + `services: ServiceConfig[]`；`ServiceConfig extends CommonServiceConfig` + 必填 `name`/`source` + 可选 `token`/`folder`。

**破坏式变更（相对 0.6.x 之前的单服务配置）**：

| 旧配置（单服务）          | 新配置（多服务）                                  |
| ------------------------- | ------------------------------------------------- |
| 顶层 `outputDir`          | 顶层 `baseOutputDir` + 每服务 `folder`            |
| 顶层 `source` / `token`   | 下沉到 `services[].source` / `.token`             |
| `defineConfig` 返回单对象 | `defineConfig` 返回 `ApiConfig[]`（单源即长度 1） |

## 解析管线

```text
api-power.config.ts（export default defineConfig({...})）
  └─ defineConfig()                      src/utils/config.ts
      └─ resolveServiceConfigs(config)   src/utils/multiService.ts
          ├─ validateConfiguration()     src/validation/index.ts（先校验原始配置）
          ├─ applyPreset(common)         剔除 services/baseOutputDir 后应用 preset
          ├─ target==='javascript' 时默认 requestFunctionFilePath .ts → .js
          └─ services.map(svc => 浅合并公共配置 + parseSourceUrl + outputDir 计算 + normalizeTransformPath)
              → ApiConfig[]
```

要点：

- **校验先于合并**：无效配置尽早失败
- **preset 仅公共层**：各 service 覆盖公共默认值（浅合并），不能单独指定 preset
- **outputDir 计算**：`join(baseOutputDir, folder ?? name)`，默认基目录 `'src/service'`
- **source 解析**：`parseSourceUrl()`（`src/utils/config.ts`）按主机名检测服务类型（含 `apifox.com` → Apifox，否则 Swagger），并从路径提取 `apifoxProjectId`
- **transformPath 规范化**：统一为函数形式（字符串形式自 0.6.0 起已硬移除）

## CLI 运行时加载

`loadConfig(configPath)`（`src/config/loader.ts`）只负责：动态 import 配置文件（`pathToFileURL`）→ 类型守卫 `isProcessedConfig` 确认导出的是 `defineConfig` 处理过的 `ApiConfig[]` → 5 秒 TTL 缓存。**不重复执行校验/合并**（配置文件求值时已完成）。

若导出格式不符（如忘记用 `defineConfig` 包裹），抛 `E1003` 配置解析错误并提示修正。

## 校验规则（`src/validation/`）

| 校验                             | 位置                                        | 说明                                                      |
| -------------------------------- | ------------------------------------------- | --------------------------------------------------------- |
| services 非空数组                | `validation/index.ts`                       | `REQUIRED_FIELD`                                          |
| 公共配置枚举/数值/布尔           | `validators/basic.ts`                       | preset、target、requestMethodStyle、indentSize 等         |
| 服务名唯一                       | `validation/index.ts`                       | `DUPLICATE_SERVICE_NAME`                                  |
| outputDir 隔离（不相同、不嵌套） | `validators/serviceDirs.ts`                 | `OUTPUT_DIR_CONFLICT`，防止生成时 cleanOutputDir 相互清理 |
| 逐服务必填/字符串/URL/逻辑       | `validators/basic.ts`、`url.ts`、`logic.ts` | name、source 等                                           |

校验失败抛 `ConfigValidationError`（携带含全部错误与修复建议的 `ValidationReport`）。

## Related

- [配置加载与校验（代码详解）](../03-codebase/config-and-validation.md)
- [ADR-011：多服务配置模型](../01-overview/decisions.md#adr-011多服务microservice配置模型)
- [docs/guides/configuration.md](../../docs/guides/configuration.md)（用户手册，全量配置项）
- [docs/guides/migration.md](../../docs/guides/migration.md)（旧配置迁移指南）

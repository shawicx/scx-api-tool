# 配置加载与校验（`src/config/` + `src/utils/` + `src/validation/`）

一句话职责：配置从用户文件到运行时 `ApiConfig[]` 的完整管线——求值时解析校验，运行时只加载缓存。

## 职责分工

| 模块                        | 职责                                                                                                                                                  |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/utils/config.ts`       | `defineConfig()`（= `resolveServiceConfigs`）、`applyPreset`、`parseSourceUrl`、`normalizeTransformPath`、`getFileExtension`、`DEFAULT_CONFIG_VALUES` |
| `src/utils/multiService.ts` | `resolveServiceConfigs()`：校验 → 公共配置应用 preset → 逐服务合并展开为 `ApiConfig[]`                                                                |
| `src/config/loader.ts`      | `loadConfig()`：动态 import 配置文件 + 5s TTL 缓存 + 导出格式类型守卫                                                                                 |
| `src/validation/`           | `validateConfiguration()`：多层校验，失败抛 `ConfigValidationError`                                                                                   |

## 解析顺序（关键设计：校验先于合并）

```text
defineConfig(MultiServiceConfig)
  1. validateConfiguration(原始配置)        // 无效配置尽早失败
  2. 剔除 services/baseOutputDir → applyPreset(公共配置)
  3. target==='javascript' 且未自定义 requestFunctionFilePath → 默认值 .ts → .js
  4. services.map:
       浅合并 {...公共ApiConfig, ...svc}
       parseSourceUrl(svc.source) → serverUrl/serverType/apifoxProjectId
       outputDir = join(baseOutputDir ?? 'src/service', folder ?? name)
       normalizeTransformPath → 恒为函数
  → ApiConfig[]
```

## loader 的类型守卫（常见报错来源）

`loadConfigImpl()` 动态 import 配置文件后，用 `isProcessedConfig()` 检查导出值是否为非空 `ApiConfig[]`（检查 `serverUrl`/`serverType`/`source`/`outputDir`/`generateApi` 等特征字段）。**配置文件必须 `export default defineConfig({...})`**——直接导出普通对象会抛 `E1003`，错误信息会提示用 `defineConfig` 包裹。

缓存：`ConfigCacheManager` 以绝对路径为键，默认 TTL 5000ms；`clearConfigCache()` / `getCacheStats()` 可管理。

## 校验流程（`validation/index.ts`）

```text
validateConfiguration(config: MultiServiceConfig)
  1. services 非空数组校验（否则直接抛出）
  2. 公共配置：枚举（preset/target/typesFormat/requestMethodStyle）+ 数值 + 布尔
  3. 服务名唯一性（DUPLICATE_SERVICE_NAME）
  4. validateServiceOutputDirs：各服务 outputDir 不相同、不嵌套（OUTPUT_DIR_CONFLICT）
  5. 逐服务：必填字段、字符串字段、source URL、服务级逻辑（公共+服务覆盖后校验）
  → 汇总 ValidationReport → displayValidationResults → 有阻断错误则抛 ConfigValidationError
```

| 验证器                      | 职责                                                                    |
| --------------------------- | ----------------------------------------------------------------------- |
| `validators/basic.ts`       | 必填、枚举、字符串/布尔/数值类型                                        |
| `validators/url.ts`         | `source` URL 格式与服务类型检测                                         |
| `validators/logic.ts`       | 跨字段逻辑一致性                                                        |
| `validators/serviceDirs.ts` | outputDir 隔离：`isNestedOrSame()` 用 `path.relative` 判断祖先-后代关系 |

`reporter.ts` 的 `displayValidationResults()` / `shouldContinue()` 负责结果展示与交互确认。

## Related

- [配置体系（用户视角）](../02-getting-started/configuration.md)
- [ADR-011：多服务配置模型](../01-overview/decisions.md#adr-011多服务microservice配置模型)
- [错误系统与日志](./errors-and-logging.md)

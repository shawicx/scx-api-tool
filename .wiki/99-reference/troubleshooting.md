# 故障排除

一句话职责：常见报错、原因与修复方法，以及调试手段。

## 常见问题

### 配置文件找不到（E1001）

- 运行 `npx api-power init` 生成默认配置，或用 `--config` 指定路径
- 确认工作目录正确

### 配置导出格式无效（E1003）

**现象**：`配置文件导出格式无效：期望 export default defineConfig({...}) 返回的 ApiConfig[]`

**原因**：配置文件直接导出了普通对象（未用 `defineConfig` 包裹），或导出的不是数组形态。

**解决**：确保配置文件为 `export default defineConfig({ baseOutputDir, services: [...] })`。loader（`src/config/loader.ts`）只加载不解析，解析校验在 `defineConfig` 求值时完成。

### 服务名重复 / 输出目录冲突（校验错误）

**现象**：`DUPLICATE_SERVICE_NAME` 或 `OUTPUT_DIR_CONFLICT`（服务 "a" 与 "b" 的输出目录相同或嵌套）

**原因**：多服务配置中 `name` 重复；或两个服务计算后的 `outputDir = join(baseOutputDir, folder ?? name)` 相同/相互嵌套，生成时 `cleanOutputDir` 会相互清理覆盖。

**解决**：每个服务提供唯一的 `name`；必要时显式指定互不嵌套的 `folder`。校验实现见 `src/validation/validators/serviceDirs.ts`。

### 认证失败 - Apifox（E2002）

- 检查该服务 `services[].token`（格式 `APS-...`）
- 在 Apifox 项目设置中重新生成 Token

### 请求超时（E2003）/ 网络错误（E2005）

- 检查网络与 `source` URL 可达性；重试生成

### transformPath 报错（E3005）

**原因**：`transformPath` 函数抛异常或返回了非字符串。

**解决**：确保 `(path: string) => string` 签名；不要传字符串形式（0.6.0 起已硬移除，校验阶段即拦截）。

### 生成的类型有冲突

- 检查 `components.schemas` 是否有同名不同定义
- 用 `namingStrategy` 自定义命名；用 `debug` 命令查看原始 Schema

### 中文标签目录名不符合预期

- `pinyin-pro` 对多音字的处理可能与预期不同；可改用英文标签或 `namingStrategy.interfaceName` 自定义

### 生成的 URL 是反引号模板字符串而非单引号

预期行为：路径含 `{param}` 占位符时自动插值为模板字符串（见 [术语表 → 路径参数插值](./glossary.md#路径参数插值path-parameter-interpolation)）；无参数路径仍为单引号字面量。

### Watch 模式不触发重新生成

- 确认修改的是配置文件本身
- Docker/VM 环境文件系统事件可能不传递；手动重新运行

## 调试方法

1. **verbose**：`api-power generate --verbose`（详细错误与堆栈）
2. **debug 命令**：dry-run 诊断（接口数/类型数/分类摘要），不生成也不清空输出目录；自动开启 debug 日志（`logger.debug`）
3. **visualize 命令**：`api-power viz --port 3000` 可视化查看 API 结构
4. **钩子打点**：

```typescript
hooks: {
  beforeWriteFile: (filePath, content) => {
    console.log('Writing:', filePath);
    return content;
  },
}
```

## Related

- [错误系统与日志](../03-codebase/errors-and-logging.md)（完整错误码表）
- [本地开发 → 调试技巧](../02-getting-started/local-development.md#调试技巧)
- [docs/guides/cli.md](../../docs/guides/cli.md)

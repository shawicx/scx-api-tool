# 故障排除

## 常见问题

### 配置文件找不到

**错误码**：E1001

**原因**：`api-power.config.ts` 文件不存在或路径错误。

**解决方案**：

1. 运行 `npx api-power init` 生成默认配置文件
2. 使用 `--config` 参数指定配置文件路径
3. 确认工作目录正确

### 认证失败 (Apifox)

**错误码**：E2002

**原因**：Apifox Token 无效或已过期。

**解决方案**：

1. 检查 `api-power.config.ts` 中的 `token` 字段
2. 确认 Token 格式为 `APS-...`
3. 在 Apifox 项目设置中重新生成 Token

### 请求超时

**错误码**：E2003

**原因**：API 定义文件过大或网络不稳定。

**解决方案**：

1. 检查网络连接
2. 重试生成
3. 如在 CI 环境中，增加超时时间配置

### 生成的类型有冲突

**原因**：OpenAPI Schema 中存在同名但不同定义的类型。

**解决方案**：

1. 检查 `components.schemas` 中是否有重复名称
2. 使用 `namingStrategy` 自定义类型名称生成规则
3. 使用 `debug` 命令检查原始 Schema 数据

### 中文标签目录名不符合预期

**原因**：`pinyin-pro` 对多音字的处理可能与预期不同。

**解决方案**：

1. 在 OpenAPI 定义中使用英文标签
2. 使用 `namingStrategy.interfaceName` 自定义接口和文件命名

### Watch 模式不触发重新生成

**原因**：文件系统事件未被正确监听。

**解决方案**：

1. 确认编辑的是配置文件而非其他文件
2. 检查是否在 Docker/VM 环境中（文件系统事件可能不传递）
3. 手动重新运行 `generate` 命令

### 生成的 URL 是反引号模板字符串而非单引号

**原因**：当 OpenAPI 路径含 `{param}` 占位符（如 `/api/users/{id}`）时，生成器会自动将其插值为模板字符串（如 `` `/api/users/${params.id}` ``），而非单引号字面量。这是预期行为，确保运行时正确填充路径参数。

**说明**：

- 路径参数从 `operation.parameters` 中匹配 `in === 'path'` 的项
- 无路径参数的接口仍使用单引号字面量（如 `'/api/users'`），与旧行为一致
- path 参数同时保留在 `RequestType` 接口中作为字段，便于类型校验

## 调试方法

1. **`--verbose` 参数**：获取详细日志输出

   ```bash
   api-power generate --verbose
   ```

2. **`debug` 命令**：dry-run 诊断模式，检查 API 定义而不生成代码

   ```bash
   api-power debug
   ```

   输出诊断报告（接口数、类型数、分类摘要、前 5 个接口/类型），不会写入或清空输出目录。

3. **`visualize` 命令**：可视化查看 API 结构

   ```bash
   api-power viz --port 3000
   ```

4. **检查生成配置**：在 `beforeWriteFile` hook 中打印配置
   ```typescript
   hooks: {
     beforeWriteFile: (filePath, content) => {
       console.log('Writing:', filePath);
       return content;
     },
   }
   ```

## 相关文档

- [错误系统模块详解](./modules/errors.md)
- [架构决策记录](./decisions.md)

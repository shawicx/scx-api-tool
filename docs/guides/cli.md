# CLI 命令参考

`@scx/api-tool` 安装后提供 `api-power` 可执行命令（bin），包含 5 个子命令。**不带子命令直接运行 `api-power` 会显示帮助信息**，不会执行生成。

## 命令概览

| 命令                  | 别名  | 说明                                                   |
| --------------------- | ----- | ------------------------------------------------------ |
| `api-power init`      | —     | 创建 `api-power.config.ts` 配置文件                    |
| `api-power generate`  | `gen` | 从 OpenAPI/Swagger 定义生成 API 请求函数和类型（核心） |
| `api-power verify`    | —     | 对生成产物运行 TypeScript 类型检查                     |
| `api-power debug`     | —     | 诊断模式：检查 API 定义与配置，**不生成任何文件**      |
| `api-power visualize` | `viz` | 启动可视化配置服务器（Web 界面）                       |

全局选项：`-V, --version` 显示版本；`-h, --help` 显示帮助；`-v, --verbose` 显示详细的错误信息和堆栈跟踪。

## 命令详解

### 1. 初始化配置 - `api-power init`

```bash
api-power init           # 在当前目录创建 api-power.config.ts
api-power init --force   # 覆盖已存在的配置文件
```

选项：`-f, --force` 覆盖现有配置文件；`-v, --verbose`。

生成的模板包含带注释的公共配置与一个示例服务，把 `source` / `token` 换成你自己的即可。字段含义见[配置参考](./config-reference.md)。

### 2. 生成代码 - `api-power generate`

```bash
api-power generate                    # 基本用法
api-power generate --config ./my.ts   # 指定配置文件
api-power generate --watch            # 监视配置文件变化并自动重新生成
api-power generate --verbose          # 错误时显示堆栈
```

选项：`-c, --config <path>`（默认 `api-power.config.ts`）、`-w, --watch`、`-v, --verbose`。

执行流程：配置验证 → 并发获取各服务数据 → 数据处理 → 生成代码文件。

真实输出（对单服务配置执行 `generate`）：

```
ℹ 使用配置开始代码生成 .tmp-e2e/docs-demo/config.ts
✔ 配置验证通过
ℹ 检测到 1 个服务
ℹ 并发获取各服务 API 数据...
✔ 请求完成: GET http://127.0.0.1:8792/v3/api-docs (25ms)
ℹ 处理服务 (1/1): http://127.0.0.1:8792/v3/api-docs
ℹ 数据处理完成: 5 个接口, 6 个类型, 0 个分类
ℹ 生成接口文件
✔ 生成接口文件：成功完成 1 个项目
ℹ 生成 API 请求方法
ℹ 创建请求函数文件: .tmp-e2e/docs-demo/out/request.ts
ℹ 生成 TypeScript 类型定义
✔ 生成类型文件：成功完成 6 个项目
ℹ 输出目录: .tmp-e2e/docs-demo/out/pet
✔ 代码生成成功完成！(共 1 个服务，耗时: 149ms)
```

多服务配置会并发拉取各服务数据、按服务依次生成，失败的服务会跳过生成并给出告警。

#### Watch 模式

`--watch` 监视**配置文件**的变化，变更时自动重新生成（防抖合并多次保存事件；上一次生成未结束时只排队一次重跑）：

```
✅ 启动监视模式...
✅ 步骤 1/3 完成: 配置文件加载完成
✅ 步骤 2/3 完成: 初始代码生成完成
✅ 步骤 3/3 完成: 文件监视已启动
✅ 监视模式已启动，正在监控配置文件更改...
🔍 监视模式运行中...
   监控文件: /path/to/api-power.config.ts
   按 Ctrl+C 退出监视模式

✅ 检测到配置文件更改，开始重新生成...
✅ 代码生成完成
✅ 配置更新已应用，继续监视文件更改...
```

### 3. 产物类型检查 - `api-power verify`

对配置中**所有服务的产物目录**运行 TypeScript 类型检查（`tsc --noEmit` 语义），验证 import 与类型完整性：

```bash
api-power verify
```

选项：`-c, --config <path>`（默认 `api-power.config.ts`）、`-v, --verbose`。

- TypeScript 编译器优先复用你项目里的 `typescript` 依赖，其次回退到工具自身的依赖；
- 复用你项目 `tsconfig.json` 的编译选项（如 `paths` 别名）；
- 发现类型错误时逐条输出 `相对路径:行:列 - TSxxxx 消息`，并以退出码 `1` 结束；通过时输出 `类型检查通过：N 个生成文件，0 个错误`。

这个命令弥补了一个常见盲区：消费方项目的 `tsconfig` 通常把生成目录排除在类型检查之外，缺失 import、类型冲突等问题会在 `verify` 中暴露。

### 4. 诊断模式 - `api-power debug`

加载配置、拉取 API 定义、处理数据并打印诊断报告，**在数据处理阶段后停止，不生成、不写入、不清空任何文件**（dry-run）：

```bash
api-power debug
api-power debug --config ./config.ts
```

真实输出：

```
✔ 配置验证通过
ℹ 检测到 1 个服务
ℹ
========== 服务 (1/1) ==========
ℹ 服务器: http://127.0.0.1:8792 (swagger)
ℹ 输出目录: .tmp-e2e/docs-demo/out/pet（dry-run 模式，不写入文件）
✔ 请求完成: GET http://127.0.0.1:8792/v3/api-docs (16ms)
ℹ API 数据获取成功
✔ 接口数: 5
✔ 类型数: 6
✔ 分类数: 0
ℹ --- 接口摘要（前 5 个）---
ℹ   GET /pets/{petId}
ℹ   DELETE /pets/{petId}
ℹ   GET /pets
ℹ   POST /pets
ℹ   POST /pets/{petId}/photos
ℹ --- 类型摘要（前 5 个）---
ℹ   PetStatus
ℹ   Category
ℹ   Tag
ℹ   Pet
ℹ   CreatePetRequest
✔
诊断完成，未写入任何文件
```

`debug` 同时启用 debug 级别日志，输出配置解析细节、API 请求/响应详情、数据处理统计等，适合诊断数据源与配置问题。

### 5. 可视化 - `api-power visualize`

启动可视化配置服务器，提供 Web 界面查看和编辑 API 配置：

```bash
api-power visualize
api-power viz --port 3000 --host 0.0.0.0
```

选项：`-c, --config <path>`、`-p, --port <number>`（默认 `3000`）、`--host <address>`（默认 `localhost`）、`-v, --verbose`。

## 错误码

命令失败时，错误信息携带结构化错误码（不是进程退出码）。进程退出码只有两种：`0` 成功，`1` 失败（`verify` 发现类型错误也返回 `1`）。

| 错误码  | 分类 | 含义                                                             |
| ------- | ---- | ---------------------------------------------------------------- |
| `E1001` | 配置 | 配置文件未找到                                                   |
| `E1002` | 配置 | 配置无效（校验规则见[配置参考](./config-reference.md#校验规则)） |
| `E1003` | 配置 | 配置解析失败（语法错误 / 未用 defineConfig 包裹）                |
| `E1004` | 配置 | 配置缺少必需字段                                                 |
| `E1005` | 配置 | 无效的 URL 格式                                                  |
| `E2001` | 网络 | 网络请求失败                                                     |
| `E2002` | 网络 | 未授权访问（token 无效或缺少权限）                               |
| `E2003` | 网络 | 请求超时                                                         |
| `E2004` | 网络 | 无效的响应格式（不符合 OpenAPI 结构）                            |
| `E2005` | 网络 | 网络错误                                                         |
| `E3001` | 生成 | 模板编译失败                                                     |
| `E3002` | 生成 | 文件写入失败                                                     |
| `E3003` | 生成 | 类型生成失败                                                     |
| `E3004` | 生成 | Schema 生成失败                                                  |
| `E3005` | 生成 | 路径转换失败（transformPath 抛错或返回非字符串）                 |

错误输出附带解决方案建议；配合 `--verbose` 可查看堆栈跟踪。

## 常见问题

### 1. 直接运行 `api-power` 没有生成代码

`api-power` 没有默认子命令，直接运行只显示帮助。生成代码请用：

```bash
api-power generate   # 或简写 api-power gen
```

### 2. 配置文件不存在

```
Error: 配置文件不存在: api-power.config.ts
```

先执行 `api-power init`，或用 `--config` 指定配置文件路径。

### 3. 想确认数据源内容再生成

用 `api-power debug`（dry-run，不会动输出目录）；看到接口/类型摘要符合预期后再执行 `generate`。

## 使用技巧

### 自动化脚本

```json
{
  "scripts": {
    "api:generate": "api-power generate",
    "api:verify": "api-power verify",
    "api:debug": "api-power debug",
    "api:init": "api-power init",
    "api:watch": "api-power generate --watch"
  }
}
```

### CI/CD 集成

```yaml
# GitHub Actions 示例
- name: Generate API types
  run: |
    npx api-power generate
    npx api-power verify
```

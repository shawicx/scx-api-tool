# 设计决策与演进

<details>
<summary>Relevant source files</summary>

- README.md
- src/clients/index.ts
- src/config/loader.ts
- src/generator/codegen.ts
- src/generator/extractor.ts
- src/generator/fileGenerator.ts
- src/generator/generators/schemaGenerator.ts
- src/generator/index.ts
- src/processors/openapi.ts
- src/utils/config.ts
- src/utils/file.ts

</details>

本页只做一件事：从提交主题、文档小节与变更频次三类证据中，还原本项目各模块的演进动机与关键决策，并为每条结论给出可追溯的锚点。

---

## 1. 演进时间线

下表按模块汇总提交体量、起止时间与高频主题。括号内数字为该主题在数据中出现的次数。

| 模块       | 提交数 | 首次提交                                                                                                                                               | 最近提交                                                                                                             | 高频主题                                                                                                                                                                                        |
| ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| generator  | 126    | `commit:4388e7de` (2025-09-29)「refactor: 重组项目结构和代码架构」                                                                                     | `commit:748f42d0` (2026-10-09)「fix: 修复 zod schema 跨类型引用缺失 import 与递归类型生成错误」                      | 引入统一 logger 模块并将 debug 命令改为 dry-run 诊断模式（×6）；修复 pathprefix 正则注入、远端数据 dos、代码注入与路径遍历等安全问题（×5）；拆解循环依赖并加固 watch 模式与多服务失败隔离（×5） |
| utils      | 41     | `commit:75c5dd40` (2025-08-13)「feat: 文件结构以及代码重构、按模块生成代码、去掉requestConfig以及mockUrl、删除vtils/haoma等依赖、使用changeset发布包」 | `commit:d461f38a` (2026-10-11)「feat: 支持文件上传的请求层增强，新增 requestTimeout 配置与 customizeAxios 扩展点」   | 引入统一 logger 模块并将 debug 命令改为 dry-run 诊断模式（×4）；添加配置-生成hooks（×3）；修复 pathprefix 正则注入、远端数据 dos、代码注入与路径遍历等安全问题（×2）                            |
| clients    | 26     | `commit:4388e7de` (2025-09-29)「refactor: 重组项目结构和代码架构」                                                                                     | `commit:66550b85` (2026-09-06)「chore: 全量升级依赖并将 ESLint 替换为 OxLint」                                       | 重构客户端架构，引入基类和注册表模式（×4）；引入统一 logger 模块并将 debug 命令改为 dry-run 诊断模式（×3）；清理装饰器死代码并强化 zod 层与 fetcher 的类型定义（×3）                            |
| processors | 26     | `commit:4388e7de` (2025-09-29)「refactor: 重组项目结构和代码架构」                                                                                     | `commit:cf83c605` (2026-09-02)「fix: 修复 FormData 数组序列化与可空类型漏 import 的生成缺陷」                        | 修复 pathprefix 正则注入、远端数据 dos、代码注入与路径遍历等安全问题（×2）；处理any类型（×2）；拆解循环依赖并加固 watch 模式与多服务失败隔离（×2）                                              |
| config     | 17     | `commit:4388e7de` (2025-09-29)「refactor: 重组项目结构和代码架构」                                                                                     | `commit:4465253d` (2026-08-24)「refactor: 拆解循环依赖并加固 watch 模式与多服务失败隔离」                            | 该模块未提供高频主题（信息不足）                                                                                                                                                                |
| validation | 12     | `commit:ee366d1b` (2025-12-15)「feat: 配置验证功能」                                                                                                   | `commit:d461f38a` (2026-10-11)「feat: 支持文件上传的请求层增强，新增 requestTimeout 配置与 customizeAxios 扩展点」   | 添加注释以及统一注释风格（×2）；配置验证功能（×2）                                                                                                                                              |
| errors     | 7      | `commit:6f6dea17` (2026-01-07)「feat: 统一错误处理」                                                                                                   | `commit:f8e9f197` (2026-07-20)「refactor: 将 pathPrefix 重命名为 transformPath 并移除命名策略中的隐式 api 前缀剥离」 | 重构代码结构，拆分大文件并优化模块组织（×2）                                                                                                                                                    |
| naming     | 6      | `commit:f9369dc3` (2026-06-22)「refactor: 重构客户端架构并拆分生成器模块」                                                                             | `commit:db7ac47c` (2026-10-09)「feat: 新增 react-query v5 风格的 Hooks 代码生成」                                    | 重构客户端架构并拆分生成器模块（×2）                                                                                                                                                            |
| schema     | 3      | `commit:4465253d` (2026-08-24)「refactor: 拆解循环依赖并加固 watch 模式与多服务失败隔离」                                                              | `commit:b8ccc34c` (2026-09-29)「feat: 支持二进制上传请求生成与请求配置透传」                                         | 该模块未提供高频主题（信息不足）                                                                                                                                                                |
| cli        | 2      | `commit:627b25fc` (2026-09-03)「feat: 新增 verify 产物类型检查命令并消除类型文件循环 import」                                                          | `commit:66550b85` (2026-09-06)「chore: 全量升级依赖并将 ESLint 替换为 OxLint」                                       | 该模块未提供高频主题（信息不足）                                                                                                                                                                |

### 1.1 generator：演进主干，三条线并行

generator 是体量最重的模块，126 次提交约占上表全部模块提交合计 266 次的 47%。它的首次提交是 `commit:4388e7de` (2025-09-29)「refactor: 重组项目结构和代码架构」——注意这是一次**结构重组**而非从零立项，因此该模块的诞生动机应读作"在既有代码上重新划分架构边界"。与之同源的是 clients、processors、config 三个模块，它们的首次提交指向同一个哈希 `commit:4388e7de`。

> **推断**（依据：generator / clients / processors / config 四个模块的首次提交均为同一哈希 `commit:4388e7de`，且主题为「重组项目结构和代码架构」）：这四个模块是在同一次结构调整中被一起组织成型的，而非各自独立演进出来的模块。数据中未提供该次重构之前的历史，无法进一步判断各模块的重组前身。

generator 的演进重心由三类高频主题勾勒出来：统一 logger 与 dry-run 诊断模式（×6）指向**可诊断性**；pathprefix 正则注入、远端数据 dos、代码注入、路径遍历等修复（×5）指向**安全性**；循环依赖拆解与 watch 模式、多服务失败隔离加固（×5）指向**结构健壮性**。而它的最近一次提交 `commit:748f42d0` (2026-10-09)「fix: 修复 zod schema 跨类型引用缺失 import 与递归类型生成错误」说明，直接面向**生成正确性**的修复一直持续到时间线末端，并未被后期的新能力建设替代。

### 1.2 utils 与 clients / processors：基础设施与正确性修补

utils 的首次提交 `commit:75c5dd40` (2025-08-13) 是上表中最早的时间点，早于 generator 的首次提交一个多月。其主题一次性包含五类动作：「文件结构以及代码重构」（结构调整）、「按模块生成代码」（生成粒度）、「去掉requestConfig以及mockUrl」（配置项删减）、「删除vtils/haoma等依赖」（依赖收敛）、「使用changeset发布包」（发布工具）。这条提交是理解项目早期取向最直接的证据：**先收敛依赖与配置面，再谈生成能力**。

utils 的高频主题里，「添加配置-生成hooks」（×3）显示该模块后来承接了配置与 hooks 相关的生成职责；最近一次提交 `commit:d461f38a` (2026-10-11)「feat: 支持文件上传的请求层增强，新增 requestTimeout 配置与 customizeAxios 扩展点」则把请求层能力（文件上传、超时、Axios 扩展点）也纳入其中。

clients 的演进关键词是「重构客户端架构，引入基类和注册表模式」（×4）与「清理装饰器死代码并强化 zod 层与 fetcher 的类型定义」（×3）——一次结构性重构加一次死代码清理与类型收紧。processors 则偏向缺陷修补：「修复 FormData 数组序列化与可空类型漏 import 的生成缺陷」（`commit:cf83c605`，2026-09-02）、「处理any类型」（×2），并与 generator 共享安全修复与循环依赖拆解主题。发布工具在数据中先后出现过两套：`commit:75c5dd40` 提到使用 changeset 发布包，不到一个月后的 `commit:474ef91e` (2025-09-05)「chore: 迁移到 standard-version，更新路径工具函数」则迁移到 standard-version。

### 1.3 中后期：从"能生成"转向"可验证、可诊断、可扩展"

按首次提交时间排列，后半段依次出现：validation（`commit:ee366d1b`，2025-12-15「feat: 配置验证功能」）、errors（`commit:6f6dea17`，2026-01-07「feat: 统一错误处理」）、naming（`commit:f9369dc3`，2026-06-22）、schema（`commit:4465253d`，2026-08-24）、cli（`commit:627b25fc`，2026-09-03「feat: 新增 verify 产物类型检查命令并消除类型文件循环 import」）。这条序列的动机指向明确：**配置要能被验证、错误要有统一出口、产物要能被类型检查**。

后续四类模块的兴起构成了本项目演进重心的转移：从"把接口生成为代码"转向"让生成过程可验证、可诊断、可扩展"。cli 模块的首次提交 `commit:627b25fc` (2026-09-03) 同时做两件事——新增 verify 产物类型检查命令、消除类型文件循环 import——把「产物质量」与「结构整洁」放在同一次提交中解决，这是本时间线里最典型的"后期治理"信号。validation 的最近提交与 utils 相同，均为 `commit:d461f38a` (2026-10-11)，说明该次请求层增强同时触达这两个模块；naming 的最近提交 `commit:db7ac47c` (2026-10-09)「feat: 新增 react-query v5 风格的 Hooks 代码生成」则是时间线末端唯一明确的能力新增主题（rest），其余末次提交多为 fix / refactor / chore。schema 是上表中体量最小的模块之一（3 次提交），且首次提交即 `commit:4465253d` (2026-08-24) 的循环依赖拆解，其成立动机在数据中只有结构治理这一条线索。

从末次提交的主题分布可以读出收尾阶段的工作性质：generator 收在「fix」（zod schema 跨类型引用缺失 import 与递归类型生成错误）、processors 收在「fix」（FormData 数组序列化与可空类型漏 import）、errors 收在「refactor」（pathPrefix 更名为 transformPath 并移除命名策略中的隐式 api 前缀剥离）、clients 与 cli 收在「chore」（全量升级依赖并将 ESLint 替换为 OxLint）。四个「fix/refactor/chore」对两个「feat」（utils、naming），说明接近数据末端时项目的主要投入是**缺陷收敛、命名语义澄清与工具链更替**，而非功能扩张。

---

## 2. 文档记录的决策

现有文档证据集中在 `README.md`，三个小节均属项目定位与使用说明，尚未提供架构级决策记录。

| 文档小节                     | 摘录（忠实原文）                                                                                                                                                                                                                                                                                      | 记录的设计决策与动机                                                                                                                                                                                                                                                                                                                                                                             |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `README.md#@scx/api-tool`    | "@scx/api-tool：一个强大的 Node.js CLI 工具，专门用于从各种 API 管理平台（如 Swagger/OpenAPI 3.0、Apifox）自动生成 TypeScript/JavaScript 代码。"                                                                                                                                                      | 明确项目形态为 **Node.js CLI 工具**，输入面为多平台 API 描述（Swagger/OpenAPI 3.0、Apifox），输出面为 TypeScript/JavaScript 代码。这条定位解释了 utils 首次提交 `commit:75c5dd40` (2025-08-13) 中「按模块生成代码」的生成粒度取向                                                                                                                                                                |
| `README.md#主要特性`         | "主要特性：- 多平台支持: 支持 Swagger、Apifox 等主流 API 管理平台 - 类型生成: 自动生成完整的 TypeScript 类型定义，支持 TypeScript 和 Zod 两种模式 - 代码生成: 自动生成 HTTP 请求函数和接口代码 - 路径参数插值: 自动将 OpenAPI 路径中的 `{param}` 占位符插值为模板字符串（如 `` `/api/stock/${params." | 四项特性对应四类能力边界：多平台输入、类型双模式（TypeScript / Zod）、请求函数代码生成、路径参数插值。其中「TypeScript 和 Zod 两种模式」与 errors 模块末次提交 `commit:f8e9f197` (2026-07-20) 及 generator 末次提交 `commit:748f42d0` (2026-10-09) 中反复出现的 zod 相关修复互为印证；「路径参数插值」则与 naming / errors 中 pathPrefix → transformPath 的更名链路（`commit:f8e9f197`）主题相邻 |
| `README.md#全局安装（推荐）` | "全局安装（推荐）：pnpm install -g @scxfe/api-tool"                                                                                                                                                                                                                                                   | 记录的分发方式是 **全局安装**，包名为 `@scxfe/api-tool`（注意与上方小节的标题名 `@scx/api-tool` 不同），包管理器为 pnpm。发布工具的演进在提交侧有对应证据：`commit:75c5dd40` (2025-08-13) 提到「使用changeset发布包」，`commit:474ef91e` (2025-09-05) 则「chore: 迁移到 standard-version，更新路径工具函数」                                                                                     |

> 说明：上表三小节均为功能介绍与安装指引性质，数据中未提供记录架构取舍、方案对比或权衡理由的设计文档；相关判断在本页中一律不越出证据范围。

---

## 3. 依赖引入决策

下表逐条列出数据中与具体依赖绑定的提交，主题保留英文原文并给出中文解释。

| 依赖             | 提交锚点                       | 提交主题（原文）                                            | 中文解释与决策信号                                                                                                                                                         |
| ---------------- | ------------------------------ | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| prettier         | `commit:d35a4446` (2025-08-24) | "fix: prettier"                                             | 早期即出现 prettier 相关修复提交，说明格式化能力在项目启动不久便被纳入工具链                                                                                               |
| prettier         | `commit:a77450db` (2026-10-11) | "fix: 将 prettier 移至运行时依赖以修复产物绝对路径导入报错" | 这是一条**依赖归类决策**：把 prettier 从开发依赖调整为运行时依赖，动机是修复生成产物中绝对路径导入报错。说明 prettier 在生成流程中被实际调用，而非仅用于仓库自身代码格式化 |
| oxlint           | `commit:66550b85` (2026-09-06) | "chore: 全量升级依赖并将 ESLint 替换为 OxLint"              | **linter 更替决策**：以 OxLint 替换 ESLint，且与「全量升级依赖」合并在同一次 chore 中。该提交同时是 clients 与 cli 两个模块的末次提交                                      |
| standard-version | `commit:474ef91e` (2025-09-05) | "chore: 迁移到 standard-version，更新路径工具函数"          | **发布工具迁移决策**：由前序发布方案迁向 standard-version，并在同次提交中更新路径工具函数                                                                                  |
| standard-version | `commit:eb22be8a` (2026-01-02) | "fix: standard-version配置"                                 | 迁移后约四个月出现配置修正提交，说明该工具链落地后仍需调参                                                                                                                 |
| typescript       | `commit:8590dea9` (2026-01-07) | "fix: 修复TypeScript编译错误并更新所有依赖到最新版本"       | **依赖整体升级决策**：一次性更新所有依赖到最新版本，并同步修复由此暴露的编译错误                                                                                           |
| typescript       | `commit:7c5ab74a` (2026-10-11) | "fix: 修复 TypeScript 类型检查错误并修正 vitest 配置位置"   | 类型检查错误的修复与测试配置位置调整合并处理，属收尾阶段的类型层收敛                                                                                                       |

两条 prettier 提交相隔逾一年（2025-08-24 → 2026-10-11），且后一条把 prettier 定性为运行时依赖，可视为格式化能力在项目演进中从"开发期工具"转为"生成期组成部分"的证据链。

---

## 4. 高频变更热点

| 文件                                          | 提交数 | 最近提交                                                                                                           |
| --------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------ |
| `src/generator/fileGenerator.ts`              | 30     | `commit:db7ac47c` (2026-10-09)「feat: 新增 react-query v5 风格的 Hooks 代码生成」                                  |
| `src/utils/config.ts`                         | 24     | `commit:d461f38a` (2026-10-11)「feat: 支持文件上传的请求层增强，新增 requestTimeout 配置与 customizeAxios 扩展点」 |
| `src/generator/codegen.ts`                    | 20     | `commit:db7ac47c` (2026-10-09)「feat: 新增 react-query v5 风格的 Hooks 代码生成」                                  |
| `src/processors/openapi.ts`                   | 18     | `commit:4465253d` (2026-08-24)「refactor: 拆解循环依赖并加固 watch 模式与多服务失败隔离」                          |
| `src/config/loader.ts`                        | 17     | `commit:4465253d` (2026-08-24)「refactor: 拆解循环依赖并加固 watch 模式与多服务失败隔离」                          |
| `src/generator/extractor.ts`                  | 16     | `commit:593422be` (2026-09-04)「feat: 支持 body/query 参数分离与 ParameterObject DTO 展开」                        |
| `src/generator/index.ts`                      | 14     | `commit:4465253d` (2026-08-24)「refactor: 拆解循环依赖并加固 watch 模式与多服务失败隔离」                          |
| `src/utils/file.ts`                           | 12     | `commit:bb208b47` (2026-07-12)「refactor: 引入统一 logger 模块并将 debug 命令改为 dry-run 诊断模式」               |
| `src/clients/index.ts`                        | 11     | `commit:bb208b47` (2026-07-12)「refactor: 引入统一 logger 模块并将 debug 命令改为 dry-run 诊断模式」               |
| `src/generator/generators/schemaGenerator.ts` | 11     | `commit:b8ccc34c` (2026-09-29)「feat: 支持二进制上传请求生成与请求配置透传」                                       |

从文件路径分布看，十处热点中有五处位于 `src/generator/` 之下（`fileGenerator.ts`、`codegen.ts`、`extractor.ts`、`index.ts`、`generators/schemaGenerator.ts`），与模块级统计中 generator 拥有 126 次提交量级一致，热点集中度与模块体量互为印证。`src/generator/fileGenerator.ts` 以 30 次变更居首，且其最近一次变更来自 `commit:db7ac47c` (2026-10-09) 的 react-query v5 风格 Hooks 生成——末尾新增的能力直接落在变更最频繁的文件上，该文件承载的生成职责在持续膨胀。

维护风险上，可从三个热点簇读出不同的稳定性特征：

- **代码生成簇**：`fileGenerator.ts`（30 次）、`codegen.ts`（20 次）、`extractor.ts`（16 次）、`generators/schemaGenerator.ts`（11 次）共享生成职责，其中前三者的末次提交集中在 2026-09 至 2026-10，且 `extractor.ts` 的末次提交是 `commit:593422be` (2026-09-04)「feat: 支持 body/query 参数分离与 ParameterObject DTO 展开」——参数形态的持续细分意味着生成侧契约仍在变化。
- **配置与处理簇**：`src/utils/config.ts`（24 次）与 `src/config/loader.ts`（17 次）分别以 `commit:d461f38a` (2026-10-11) 与 `commit:4465253d` (2026-08-24) 收尾。前者承接 requestTimeout 配置与 customizeAxios 扩展点，属于配置面持续开口；后者与 `src/processors/openapi.ts`、`src/generator/index.ts` 同属一次循环依赖拆解，三个文件在同一次重构中被同时触达。
- **基础设施簇**：`src/utils/file.ts`（12 次）与 `src/clients/index.ts`（11 次）的末次提交均为 `commit:bb208b47` (2026-07-12) 的 logger 统一改造，二者此后没有再出现在热点记录中，相对安静。

结合 modules 的高频主题看，`src/utils/config.ts` 的 24 次高变更与 utils 模块「修复 pathprefix 正则注入、远端数据 dos、代码注入与路径遍历等安全问题（×2）」及「添加配置-生成hooks（×3）」两条主题方向一致：配置文件既是安全修复的入口，也是新能力开口的落点，因而变更频繁。与之相对，`src/generator/index.ts`、`src/processors/openapi.ts`、`src/config/loader.ts` 三者的最近变更都停在 `commit:4465253d` (2026-08-24) 的同一次重构上，说明循环依赖治理在完成时已覆盖这三处；此后它们未再成为热点记录中的末次变更对象。

---

## 5. 待确认

| 缺口                                   | 缺什么证据                                                                                                                                                                               |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| config、schema、cli 三个模块无高频主题 | 数据中这三个模块的主题列表为空，无法据此判断其演进重心；需补充提交主题聚合或对应提交明细                                                                                                 |
| 架构级设计决策文档                     | 现有文档证据仅覆盖 `README.md` 的 `#@scx/api-tool`、`#主要特性`、`#全局安装（推荐）` 三个介绍性小节，没有方案对比、取舍理由类文档；本页第 2 节只能记录定位与能力边界，无法还原设计权衡   |
| schema 模块的成立动机                  | 其首次提交即 `commit:4465253d` (2026-08-24)「refactor: 拆解循环依赖并加固 watch 模式与多服务失败隔离」，即诞生于一次结构治理，数据中无该模块独立成型的动机证据                           |
| 热点文件的变更构成                     | 热点记录只提供提交次数与最近提交，没有变更规模或变更类型分布，无法区分"同一处反复修补"与"持续新增职责"                                                                                   |
| 版本发布节奏                           | 数据中无 tag / release 锚点；结合发布工具从 changeset（`commit:75c5dd40`，2025-08-13）到 standard-version（`commit:474ef91e`，2025-09-05）的迁移，只能确认工具更替，无法还原实际发布节奏 |

## Related

- 共享 6 个源文件、共享 6 个符号：[troubleshooting.md](../05-guides/troubleshooting.md)
- 共享 1 个源文件、共享 9 个符号：[overview.md](../01-overview/overview.md)
- 共享 1 个源文件、共享 7 个符号：[modules.md](../02-architecture/modules.md)
- 总入口：[README](../README.md)

<!-- wiki:source: llm -->

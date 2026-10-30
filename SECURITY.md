# 安全策略 | Security Policy

**[简体中文](#简体中文) · [English](#english)**

---

<a id="简体中文"></a>

## 简体中文

## 支持版本 | Supported Versions

| 版本                                       | 是否支持            |
| ------------------------------------------ | ------------------- |
| 最新发布版本（`main` 分支对应的 npm 发布） | ✅ 支持             |
| 更早版本                                   | ❌ 不支持，请先升级 |

## 报告漏洞

**请不要通过公开的 GitHub Issue 报告安全漏洞。**

如发现安全漏洞，请通过邮箱 **d35f3153@proton.me** 联系维护者（shawicx），内容建议包含：

- 问题概述与影响范围
- 复现步骤或概念验证（PoC）
- 受影响的版本/提交
- 可能的修复建议（如有）

我们会在收到报告后尽快确认，并在修复发布后公开致谢（除非报告者希望匿名）。

### 范围说明

- **本仓库 CLI 自身的代码**：在拉取 OpenAPI/Apifox 数据、生成代码、写入文件过程中的漏洞（如路径穿越、任意代码执行、敏感信息泄露）
- **生成的产物代码**：由本工具生成的 `request.ts` / 接口代码若存在普遍性问题（而非使用方项目自身的配置问题）
- **不在范围内**：使用方项目自身的依赖漏洞、因错误配置（如将 token 提交到公开仓库）导致的问题、对未发布/已废弃版本的攻击

---

<a id="english"></a>

## English

## Supported Versions

| Version                                            | Supported                    |
| -------------------------------------------------- | ---------------------------- |
| Latest release (the npm release built from `main`) | ✅ Yes                       |
| Earlier versions                                   | ❌ No — please upgrade first |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability, contact the maintainer (shawicx) at **d35f3153@proton.me**. Ideally include:

- A description of the issue and its impact
- Steps to reproduce or a proof of concept (PoC)
- Affected version/commit
- Suggested mitigation if you have one

We will acknowledge receipt as soon as possible, and credit you in the fix announcement unless you prefer to remain anonymous.

### Scope

- **The CLI itself**: vulnerabilities in fetching OpenAPI/Apifox data, code generation, or file writing (e.g. path traversal, arbitrary code execution, sensitive data leakage)
- **Generated output code**: systemic issues in the generated `request.ts` / interface code (not problems specific to a consumer's project setup)
- **Out of scope**: vulnerabilities in a consumer's own dependencies, issues caused by user misconfiguration (e.g. committing tokens to a public repo), attacks against unreleased/deprecated versions

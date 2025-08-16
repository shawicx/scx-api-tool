# Git 配置说明

本项目包含了完整的 Git 配置文件，用于规范代码提交和团队协作。

## 配置文件说明

### 1. .gitignore

定义了需要忽略的文件和目录，包括：

- 依赖包 (`node_modules/`)
- 构建输出 (`lib/`, `dist/`, `build/`)
- 临时文件 (`.tmp*`, `*.log`)
- 编辑器配置文件 (`.vscode/`, `.idea/`)
- 操作系统文件 (`.DS_Store`, `Thumbs.db`)
- 项目特定文件 (`src/service/*`, `docs/dist`)

### 2. .gitattributes

定义了文件类型的处理方式：

- 文本文件使用 LF 换行符
- 二进制文件标记为 binary
- 为不同文件类型设置语言标识
- 标记生成的文件为 `linguist-generated`

### 3. .gitconfig

全局 Git 配置，包括：

- 默认分支设置 (`main`)
- 行尾符处理策略
- 推送和拉取策略
- 常用命令别名
- 颜色和显示设置

### 4. .gitmessage

提交信息模板，遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构代码
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具变动

### 5. .git-blame-ignore-revs

用于忽略某些提交的 blame 信息，通常用于格式化提交。

### 6. .git/hooks/

Git 钩子脚本：

- `pre-commit`: 提交前检查代码质量和格式
- `commit-msg`: 检查提交信息格式
- `post-commit`: 提交后执行操作

### 7. .gitconfig.local

本地特定配置，不会被提交到版本控制中。

## 使用方法

### 1. 应用全局配置

```bash
# 应用 .gitconfig 中的配置
git config --global include.path "$(pwd)/.gitconfig"

# 设置提交信息模板
git config commit.template .gitmessage

# 设置 blame 忽略文件
git config blame.ignoreRevsFile .git-blame-ignore-revs
```

### 2. 应用本地配置

```bash
# 应用本地配置
git config --local include.path "$(pwd)/.gitconfig.local"
```

### 3. 使用提交信息模板

```bash
# 提交时使用模板
git commit

# 或者直接指定模板
git commit -t .gitmessage
```

### 4. 使用命令别名

配置文件中定义了许多有用的别名：

```bash
git st          # git status
git co          # git checkout
git br          # git branch
git ci          # git commit
git lg          # git log --oneline --graph --decorate --all
git ll          # git log --oneline --graph --decorate
```

## 钩子脚本功能

### pre-commit

- 运行 ESLint 检查
- 运行 TypeScript 类型检查
- 检查 console.log 语句
- 检查 TODO/FIXME 注释

### commit-msg

- 检查提交信息格式
- 验证 Conventional Commits 规范
- 检查行长度和格式

### post-commit

- 显示提交信息
- 检查是否需要推送
- 显示最近提交历史

## 注意事项

1. **钩子脚本权限**: 确保钩子脚本有执行权限
2. **本地配置**: `.gitconfig.local` 不会被提交，用于个人配置
3. **依赖工具**: 某些钩子需要安装相应的工具（如 ESLint、TypeScript）
4. **团队协作**: 这些配置有助于保持团队代码质量的一致性

## 自定义配置

你可以根据需要修改这些配置文件：

- 在 `.gitconfig.local` 中添加个人特定的配置
- 修改钩子脚本以适应项目需求
- 添加新的忽略规则到 `.gitignore`
- 自定义提交信息模板

## 故障排除

如果遇到问题：

1. 检查钩子脚本权限
2. 确认依赖工具已安装
3. 查看 Git 配置是否正确应用
4. 检查钩子脚本的语法错误

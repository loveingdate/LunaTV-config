# 🌙 Luna TV 配置编辑器开发文档

基于 GitHub API 的专业 JSON 配置文件编辑器，专为 Luna TV 配置管理而设计。

## 📋 项目概述

**项目地址：** [hafrey1/LunaTV-config](https://github.com/hafrey1/LunaTV-config)

**在线编辑器：** [hafrey1.github.io/LunaTV-config/](http://hafrey1.github.io/LunaTV-config/)

Luna TV 配置编辑器是一个基于 Web 的 JSON 配置文件编辑器，通过 GitHub API 实现配置文件的加载、编辑和保存。该编辑器专门为 LunaTV 项目的 `luna-tv-config.json` 文件设计，提供了专业的代码编辑体验和完整的版本控制功能。

---

## ✨ 主要功能特性

### 🎯 核心功能

- **JSON 编辑**：基于 Monaco Editor 的专业代码编辑体验
- **实时验证**：实时 JSON 格式验证，提供中文错误提示
- **语法高亮**：完整的 JSON 语法高亮和代码折叠功能
- **格式化工具**：一键格式化和压缩 JSON 数据

### 🔄 GitHub 集成

- **同步加载**：直接从 GitHub 仓库加载配置文件
- **安全保存**：通过 GitHub API 安全保存到仓库
- **Token 管理**：安全的 Token 存储和管理机制
- **版本控制**：自动生成提交信息和版本历史

### 👁️ 可视化功能

- **树状视图**：JSON 数据的可折叠树状展示
- **预览模式**：格式化后的 JSON 预览
- **多主题支持**：深色、浅色、高对比度主题
- **全屏模式**：专注的全屏编辑体验

### 📁 文件操作

- **文件上传**：支持本地 JSON 文件上传
- **文件下载**：导出编辑后的配置文件
- **历史记录**：本地历史版本管理
- **自动保存**：防止数据丢失的自动保存功能

---

## ⌨️ 快捷键支持

| 快捷键 | 功能 | 描述 |
| --- | --- | --- |
| `Ctrl + S` | 保存到 GitHub | 将当前编辑内容保存到 GitHub 仓库 |
| `Ctrl + O` | 从 GitHub 加载 | 从 GitHub 仓库加载最新配置文件 |
| `Ctrl + U` | 上传文件 | 上传本地 JSON 文件 |
| `Ctrl + D` | 下载文件 | 下载当前编辑的配置文件 |
| `F11` | 全屏模式 | 切换全屏编辑模式 |
| `Ctrl + F` | 查找 | 在编辑器中查找内容 |
| `Ctrl + H` | 查找替换 | 查找并替换内容 |

---

## 🚀 快速开始

### 1. 获取 GitHub Token

1. 访问 [GitHub Settings → Personal access tokens](https://github.com/settings/tokens)
2. 点击 "Generate new token (classic)"
3. 选择 `repo` 权限
4. 复制生成的 Token

### 2. 开始使用

1. 访问 [Luna TV 配置编辑器](https://hafrey1.github.io/LunaTV-config/)
2. 在编辑器中输入您的 GitHub Token
3. 点击 "📥 加载配置" 按钮
4. 在编辑器中修改配置
5. 点击 "💾 保存配置" 或使用 `Ctrl+S` 保存

---

## 🛠️ 技术架构

### 核心技术栈

- **编辑器**：Monaco Editor
- **UI框架**：纯 JavaScript + CSS Grid/Flexbox
- **API集成**：GitHub REST API
- **存储**：LocalStorage + SessionStorage
- **加密**：简单的本地加密存储

### 技术特性

- **现代化 UI**：基于 CSS Grid 和 Flexbox 的响应式设计
- **PWA 支持**：渐进式 Web 应用特性
- **TypeScript 风格**：严格的类型检查和错误处理
- **模块化架构**：清晰的代码组织和功能分离
- **国际化**：完整的中文界面和错误提示

---

## 🔒 安全特性

### Token 安全

- **本地加密**：Token 采用简单加密存储
- **自动过期**：Token 自动过期机制（7天）
- **会话隔离**：Token 仅在当前会话有效
- **手动清除**：随时清除本地存储的 Token
- **浏览器集成**：Token 被浏览器识别为密码，可存储在密码管理器中

### 数据安全

- **HTTPS 传输**：所有 API 请求均通过 HTTPS
- **权限控制**：仅访问指定仓库的配置文件
- **版本追踪**：所有修改都有完整的提交历史

---

## 📱 浏览器兼容性

| 浏览器 | 最低版本 | 支持状态 |
| --- | --- | --- |
| Chrome | 80+ | ✅ 完全支持 |
| Firefox | 75+ | ✅ 完全支持 |
| Safari | 13+ | ✅ 完全支持 |
| Edge | 80+ | ✅ 完全支持 |

---

## 🎨 UI 设计参考

### 颜色搭配

参考 [Cloudflare Workers 部署页面](https://bp.sub.cmliussss.net/) 的颜色搭配：

- **主色调**：深蓝色系 (#1e3a8a, #3b82f6)
- **辅助色**：橙色警告 (#f59e0b)、绿色成功 (#10b981)
- **背景色**：深色主题 (#0f172a) 和浅色主题 (#ffffff)
- **文本色**：高对比度文本确保可读性

### 动效设计

- **渐变过渡**：所有交互元素支持平滑过渡动画
- **Loading 状态**：操作过程中的加载动画
- **悬停效果**：按钮和链接的悬停状态反馈
- **主题切换**：平滑的主题切换动画

---

## 📦 项目结构

```
web-editor/
├── index.html          # 主页面
├── styles/
│   ├── main.css       # 主样式文件
│   ├── themes/        # 主题样式
│   └── components/    # 组件样式
├── scripts/
│   ├── app.js         # 主应用逻辑
│   ├── github-api.js  # GitHub API 集成
│   ├── editor.js      # 编辑器相关功能
│   └── utils.js       # 工具函数
├── assets/
│   ├── icons/         # 图标文件
│   └── images/        # 图片资源
└── manifest.json      # PWA 配置
```

---

## 🔧 开发部署

### 本地开发

```bash
# 克隆项目
git clone https://github.com/hafrey1/LunaTV-config.git
cd LunaTV-config/web-editor

# 启动本地服务器
python -m http.server 8000
# 或使用 Node.js
npx serve .
```

### GitHub Pages 部署

项目已配置自动部署到 GitHub Pages：

- **部署地址**：[hafrey1.github.io/LunaTV-config/](http://hafrey1.github.io/LunaTV-config/)
- **自动部署**：推送到 main 分支自动触发部署
- **自定义域名**：支持绑定自定义域名

---

## 📈 功能规划

### 已实现功能

- ✅ 基础 JSON 编辑功能
- ✅ GitHub API 集成
- ✅ 主题切换
- ✅ 文件上传下载
- ✅ 快捷键支持

### 计划功能

- 🔄 实时协作编辑
- 🔄 配置模板管理
- 🔄 批量导入导出
- 🔄 API 状态监控集成
- 🔄 移动端优化

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发规范

- 遵循现有的代码风格
- 添加适当的注释和文档
- 测试新功能的兼容性
- 更新相关文档

### 提交格式

```
feat: 添加新功能描述
fix: 修复问题描述
docs: 更新文档
style: 样式调整
```

---

## 📞 支持与反馈

如有问题或建议，请通过以下方式联系：

- **GitHub Issues**：[提交问题](https://github.com/hafrey1/LunaTV-config/issues)
- **项目地址**：[LunaTV-config](https://github.com/hafrey1/LunaTV-config)
- **在线编辑器**：[立即使用](https://hafrey1.github.io/LunaTV-config/)

---

*最后更新：2025年9月19日*

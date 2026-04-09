<div align="center">

<img src="src-tauri/icons/icon.png" width="96" alt="WeWrite Logo" />

# WeWrite Desktop

**AI 驱动的公众号写作全流程桌面应用**

[![Build Status](https://github.com/huaixia18/wewrite-desktop/actions/workflows/build.yml/badge.svg)](https://github.com/huaixia18/wewrite-desktop/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows-lightgrey.svg)]()

从热点选题到一键发布，9 步完成公众号文章创作。基于 [WeWrite CLI](https://github.com/oaker-io/wewrite) 开发的桌面版本。

[下载安装包](https://github.com/huaixia18/wewrite-desktop/releases) · [功能介绍](#核心功能) · [开发指南](#快速开始)

---

</div>

## 核心功能

WeWrite 将公众号文章创作拆解为 9 个专业步骤，每个步骤由 AI 驱动，你只需要做最终决策。

### 9 步写作流程

| 步骤 | 名称 | 说明 |
|:----:|------|------|
| 1 | **环境检查** | 自动检测 API Key、公众号凭证、图片生成配置，缺失项可跳过 |
| 2 | **选题** | 基于实时热点 + SEO 分析生成 10 个候选选题，含评分与推荐框架 |
| 3 | **框架 + 素材** | 7 套写作框架（痛点/故事/清单/对比/热点/观点/复盘）+ 真实素材自动采集 |
| 4 | **写作** | AI 生成 1500-2500 字初稿，维度随机化避免文章同质化 |
| 5 | **去 AI 化** | 29 条规则检测 AI 写作痕迹，自动修复并保留原意 |
| 6 | **SEO + 验证** | 标题优化、摘要生成、关键词密度检查、质量多维验证 |
| 7 | **配图** | 自动提取文章实体，生成与内容匹配的配图提示词 |
| 8 | **排版 + 发布** | 遵循微信约束的排版，支持直接推送到公众号草稿箱 |
| 9 | **收尾** | 保存文章记录、统计字数、输出备选标题与编辑建议 |

### 三种工作模式

| 模式 | 说明 |
|------|------|
| **自动模式** | 9 步连续执行，适合批量生产 |
| **交互模式** | 在选题、框架、配图处暂停，由你决定 |
| **逐步模式** | 每一步都确认后才继续 |

### 去 AI 化引擎

内置 29 条检测规则，覆盖四个层级：

- **语言层** — AI 高频词汇检测（"此外""值得一提的是""不可否认"等）
- **结构层** — 模板化句式、signposting、破折号过度使用
- **内容层** — 泛化分析、夸大意义、模糊归因
- **风格层** — 句长单一、词汇温度一致、过于完美的排版

支持三档强度：宽松 / 标准 / 严格

## 页面一览

```
┌──────────┬─────────────────────────────────────────────────┐
│          │  写作流程                                        │
│  WeWrite │  ┌─[1]─[2]─[3]─[4]─[5]─[6]─[7]─[8]─[9]────────┐ │
│          │  │                                              │ │
│  ┌─写作  │  │  当前步骤内容面板                               │ │
│  │  流程  │  │                                              │ │
│  ├─历史   │  │  [上一步]                    [下一步]          │ │
│  │  文章  │  └──────────────────────────────────────────────┘ │
│  ├─范文库 │                                                 │
│  └─设置   │  设置页：AI 配置 · 公众号 · 图片 · 写作风格        │
│          │          去 AI 强度 · 保存路径                      │
│          │                                                 │
└──────────┴─────────────────────────────────────────────────┘
```

## 快速开始

### 环境要求

| 工具 | 安装 |
|------|------|
| [Node.js](https://nodejs.org) ≥ 18 | `nvm install 22` |
| [pnpm](https://pnpm.io) ≥ 8 | `npm i -g pnpm` |
| [Rust](https://rustup.rs) ≥ 1.70 | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| Xcode CLT (macOS) | `xcode-select --install` |

### 安装依赖

```bash
git clone git@github.com:huaixia18/wewrite-desktop.git
cd wewrite-desktop
pnpm install
```

### 开发模式

```bash
pnpm tauri dev
```

首次运行需编译 400+ Rust crate（约 3-5 分钟），之后增量编译秒级完成。

### 打包

```bash
# 打包当前平台
pnpm tauri build

# 产物位置
src-tauri/target/release/bundle/
├── dmg/    WeWrite_0.1.0_x64.dmg          ← macOS
└── nsis/   WeWrite_0.1.0_x64-setup.exe    ← Windows
```

> 跨平台打包需要对应系统的 CI。本项目已配置 GitHub Actions，打 tag 后自动出 macOS + Windows 安装包：
>
> ```bash
> git tag v0.1.0 && git push origin v0.1.0
> ```

## 技术架构

```
┌─────────────────────────────────────────────────────────┐
│  前端 (React 19 + TypeScript)                            │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌─────────┐  │
│  │ Zustand   │ │ React     │ │ Tailwind  │ │ Radix   │  │
│  │ State     │ │ Router v7 │ │ CSS v4    │ │ UI      │  │
│  └─────┬─────┘ └───────────┘ └───────────┘ └─────────┘  │
│        │                                                 │
│  ┌─────┴──────────────────────────────────────────────┐  │
│  │            Tauri IPC Bridge (invoke)                │  │
│  └─────┬──────────────────────────────────────────────┘  │
├────────┼─────────────────────────────────────────────────┤
│  后端 (Rust + Tauri 2)                                    │
│  ┌─────┴────┐ ┌─────────┐ ┌──────────┐ ┌────────────┐   │
│  │ Pipeline │ │Humanizer│ │Articles  │ │Exemplars   │   │
│  │ 流程控制  │ │去AI引擎  │ │文章管理   │ │范文库管理   │   │
│  └──────────┘ └─────────┘ └──────────┘ └────────────┘   │
│  ┌──────────────┐  ┌─────────────────────────────────┐   │
│  │ Config 配置   │  │ SQLite (rusqlite bundled)       │   │
│  └──────────────┘  └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 项目结构

```
src/
├── pages/
│   ├── PipelinePage.tsx          # 9 步写作流程
│   ├── SettingsPage.tsx          # 设置
│   ├── HistoryPage.tsx           # 历史文章
│   └── ExemplarsPage.tsx         # 范文库
├── components/
│   ├── Sidebar.tsx               # 侧边栏导航
│   ├── StepProgress.tsx          # 进度条
│   ├── steps/                    # 9 个步骤组件
│   └── ui/                       # Button / Card / Input / Badge
├── store/
│   ├── pipeline.ts               # 流程状态 (Zustand)
│   └── config.ts                 # 配置状态
└── lib/

src-tauri/src/
├── commands/
│   ├── pipeline.rs               # 流程控制命令
│   ├── humanizer.rs              # 去 AI 化 + 文本分析
│   ├── articles.rs               # 文章 CRUD
│   ├── exemplars.rs              # 范文库 CRUD
│   └── config.rs                 # 配置读写
└── db/
    ├── mod.rs                    # SQLite 初始化
    └── schema.sql                # 数据库表结构
```

## 常用命令

```bash
pnpm tauri dev           # 开发模式
pnpm tauri build         # 生产打包
pnpm dev                 # 仅前端 Vite（纯 UI 调试）
pnpm tsc --noEmit        # TypeScript 类型检查
```

## 常见问题

<details>
<summary><code>rustc: command not found</code></summary>

```bash
export PATH="$HOME/.cargo/bin:$PATH"
```

加入 `~/.zshrc` 永久生效。

</details>

<details>
<summary><code>pnpm install</code> 失败</summary>

```bash
pnpm install --force
```

</details>

<details>
<summary>编译报错 <code>error[E0433]: failed to resolve</code></summary>

```bash
cd src-tauri && cargo fetch
```

</details>

<details>
<summary>窗口白屏</summary>

开发模式下 Vite 跑在 `http://localhost:1420`，确认端口未被占用：

```bash
lsof -i :1420
```

</details>

## 致谢

本项目的写作流程设计参考了 [WeWrite](https://github.com/oaker-io/wewrite)，去 AI 化引擎基于 [humanizer](https://github.com/blader/humanizer)。感谢两个项目作者的开源贡献。

## 贡献

欢迎提交 Issue 和 Pull Request。

## License

[MIT](LICENSE)

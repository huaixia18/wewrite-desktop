# WeWrite Desktop — 产品需求文档（PRD）

> 版本：v1.3
> 日期：2026-04-08
> 状态：修订稿
> 变更：v1.2 基础上新增文章保存路径配置

---

## 一、产品概述

### 1.1 产品定位

WeWrite Desktop 是一款面向微信公众号创作者的 AI 写作桌面客户端。将 WeWrite 的 9 步全流程（热点抓取 → 选题 → 框架 → 素材 → 写作 → 去AI化 → SEO → 配图 → 排版）封装为一个可独立运行的桌面应用，支持 Windows 和 macOS。

**零外部依赖**：用户双击安装包即可使用，无需安装 Python、Node.js 或任何运行时。所有功能在应用内完成，所有配置在应用内修改。

### 1.2 目标用户

| 用户类型 | 特征 | 核心诉求 |
|---------|------|---------|
| 个人自媒体 | 运营 1-3 个公众号，无技术背景 | 一键生成文章，操作简单 |
| 内容团队编辑 | 管理多个账号，需要批量产出 | 流程可控，效率高 |
| 技术型创作者 | 有编程能力，希望深度定制 | 可配置参数、可导出 |

### 1.3 核心价值

- **零安装**：下载 → 双击 → 写作，中间没有环境配置
- **所见即所得**：实时预览排版效果，所见即微信最终效果
- **流程可视化**：9 步进度条 + 每步可交互，用户全程掌控
- **去 AI 化**：内置 Humanizer 引擎，基于 Wikipedia 29 种 AI 写作痕迹规则，自动去除 AI 味
- **离线可用**：写作引擎本地运行，仅热点抓取和 AI 调用需联网
- **配置即用**：所有设置在应用内完成，保存即生效，无需重启

---

## 二、用户流程

### 2.1 主流程总览

```
┌──────────────────────────────────────────────────────────────────────┐
│                         WeWrite Desktop                              │
│                                                                      │
│  ┌────┐   ┌────┐   ┌────┐   ┌────┐   ┌────┐   ┌────┐   ┌────┐    │
│  │ 1. │──▶│ 2. │──▶│ 3. │──▶│ 4. │──▶│ 5. │──▶│ 6. │──▶│ 7. │    │
│  │配置│   │选题│   │框架│   │写作│   │去AI│   │SEO │   │配图│    │
│  │    │   │    │   │素材│   │    │   │化  │   │验证│   │    │    │
│  └────┘   └────┘   └────┘   └────┘   └────┘   └────┘   └────┘    │
│                                              │                      │
│                            ┌────┐   ┌────┐   │                      │
│                            │ 9. │◀──│ 8. │◀──┘                      │
│                            │收尾│   │排版│                          │
│                            └────┘   └────┘                          │
│                                                                      │
│  ════════════════════ 进度条：Step 1/9 ════════════════════         │
│  [自动模式]  [交互模式]  [暂停]  [设置]                              │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.2 详细流程图

```
启动 App（首次）
  │
  ▼
引导页（配置 AI API Key + 风格设置 + 可选微信凭证）
  │
  ▼
启动 App（非首次）
  │
  ▼
主界面
  │
  ▼
┌─────────────────────────────────────────────┐
│ Step 1: 环境检查                             │
│                                              │
│ 检查项          状态     操作                │
│ ─────────────────────────────────           │
│ AI API Key      ✅/❌    [去设置]            │
│ 微信公众号凭证   ✅/❌    [配置/跳过]         │
│ 图片生成 API    ✅/❌    [配置/跳过]         │
│ 风格配置        ✅/❌    [引导设置]          │
│                                              │
│ [降级标记] skip_publish=true                 │
│           skip_image_gen=true                │
│                                              │
│ [开始写作]                                   │
└─────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────┐
│ Step 2: 选题                                 │
│ (同上一版，略)                               │
└─────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────┐
│ Step 3: 框架 + 素材                          │
│ (同上一版，略)                               │
└─────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────┐
│ Step 4: 写作                                 │
│ (同上一版，略)                               │
└─────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────┐
│ Step 5: 去 AI 化（Humanizer）                │
│                                              │
│ 🔄 正在分析 AI 写作痕迹...                   │
│                                              │
│ ┌─── 检测报告 ──────────────────────────┐   │
│ │                                        │   │
│ │ 29 项规则扫描完成                      │   │
│ │                                        │   │
│ │ 内容模式：                             │   │
│ │  ✅ 1. 重要性夸大  — 未命中           │   │
│ │  ⚠️ 2. 名气堆砌    — 第 3 段命中      │   │
│ │  ✅ 3. -ing 表面分析 — 未命中          │   │
│ │  ✅ 4. 广告味语言  — 未命中           │   │
│ │  ✅ 5. 模糊引用    — 未命中           │   │
│ │                                        │   │
│ │ 语言模式：                             │   │
│ │  ⚠️ 7. AI 高频词汇 — 2 处命中         │   │
│ │  ⚠️ 8. 回避系动词  — 1 处命中         │   │
│ │  ✅ 9. 否定并列    — 未命中           │   │
│ │  ⚠️ 14. 破折号过密 — 12 处             │   │
│ │                                        │   │
│ │ 风格模式：                             │   │
│ │  ⚠️ 23. 空洞修饰   — 3 处命中         │   │
│ │  ✅ 24. 过度模糊限定 — 未命中          │   │
│ │  ⚠️ 25. 模板化结尾 — 需重写           │   │
│ │                                        │   │
│ │ 命中：6/29 项  总体评分：B+            │   │
│ └────────────────────────────────────────┘   │
│                                              │
│ ┌─── 修复进度 ──────────────────────────┐   │
│ │ ██████████████████░░  正在修复第 4 项  │   │
│ └────────────────────────────────────────┘   │
│                                              │
│ [查看修改对比] [跳过] [手动调整]             │
└─────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────┐
│ Step 6: SEO + 验证                           │
│ (同上一版，略)                               │
└─────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────┐
│ Step 7: 配图（可跳过）                       │
│ (同上一版，略)                               │
└─────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────┐
│ Step 8: 排版 + 发布                          │
│ (同上一版，略)                               │
└─────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────┐
│ Step 9: 收尾                                 │
│                                              │
│ ✅ 文章已生成                                │
│                                              │
│ 标题：写代码截胡57万号源：谁的病，谁的代码？ │
│ 字数：2679                                   │
│ 去AI化：6 项修复，1 处需要人工确认           │
│ 评分：53.93                                  │
│ 保存位置：~/Documents/wewrite-output/        │
│                                              │
│ [打开文件] [打开文件夹] [学习我的修改]       │
│ [再写一篇] [查看历史] [数据复盘]             │
└─────────────────────────────────────────────┘
```

---

## 三、功能模块

### 3.1 核心写作流程

| 模块 | 功能 | 输入 | 输出 |
|------|------|------|------|
| 选题引擎 | 热点抓取 + 选题评分 | 风格配置、历史记录 | Top 10 选题列表 |
| 框架选择器 | 框架推荐 + 用户选择 | 选题类型、content_style | 框架模板 |
| 素材采集 | WebSearch + 信息提取 | 关键词 | 真实素材列表 |
| 写作引擎 | AI 生成 + 维度随机化 | 框架 + 素材 + 人格 + 范文 | Markdown 草稿 |
| **Humanizer** | **29 规则扫描 + 自动修复** | **Markdown 草稿** | **去 AI 化后的 Markdown** |
| 自检系统 | 禁用词/句长/情绪检查 | 草稿 | 修复后的 Markdown |
| SEO 模块 | 标题/摘要/标签生成 | 文章内容 | SEO 元数据 |
| 质量评分 | 文本人类感分析 | Markdown | composite_score |
| 配图生成 | 封面 + 内文配图 | 文章内容 + 视觉提示词 | 图片文件 |
| 排版转换 | Markdown → 微信格式 | Markdown + 主题 | 微信 HTML |
| 发布模块 | 推送草稿箱 | 微信凭证 + HTML | media_id |

### 3.2 辅助功能

| 功能 | 描述 | 优先级 |
|------|------|--------|
| 风格引导 | 首次启动交互式设置 | P0 |
| 范文库管理 | 导入/查看/删除范文 | P1 |
| Playbook 编辑 | 可视化编辑写作规则 | P2 |
| 历史文章列表 | 浏览已生成文章，查看元数据 | P1 |
| 学习修改 | 对比修改，学习风格 | P2 |
| 排版主题库 | 预览/切换/学习排版主题 | P2 |
| 数据复盘 | 接入文章阅读量/分享率数据 | P3 |
| 批量生成 | 一次选多个选题，队列生成 | P3 |
| 内置 Markdown 编辑器 | 编辑器 + 实时预览 | P1 |

### 3.3 设置模块

| 设置项 | 内容 | 必填 |
|--------|------|------|
| AI 提供商 | API Key + 模型选择（Claude/GPT/本地模型） | 是 |
| 风格配置 | name/topics/tone/voice/blacklist/content_style/writing_persona | 是 |
| 微信公众号 | appid + secret（用于发布） | 否 |
| 图片生成 | API Key 或 providers 列表 | 否 |
| 写作参数 | sentence_variance/paragraph_rhythm/emotional_arc 等 | 否（有默认值） |
| 主题设置 | theme 名称 + 封面风格 | 否（有默认值） |
| **Humanizer** | **开启/关闭 + 严格度（宽松/标准/严格）** | **否（默认开启，标准）** |
| 文章保存路径 | 选择本地文件夹，生成的 Markdown/HTML/图片保存于此 | 否（默认 AppData/wewrite-output） |

---

## 四、界面设计

### 4.1 整体布局

```
┌──────────────────────────────────────────────────────────────┐
│  WeWrite                              [_][□][×]              │
├────────┬─────────────────────────────────────────────────────┤
│        │                                                     │
│  导航   │              主内容区                                │
│        │                                                     │
│  [写作] │  ┌──────────────────────────────────────────────┐  │
│        │  │                                              │  │
│  [历史] │  │          当前步骤的 UI 内容                    │  │
│        │  │                                              │  │
│  [范文] │  │                                              │  │
│        │  │                                              │  │
│  [设置] │  └──────────────────────────────────────────────┘  │
│        │                                                     │
│        │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│        │  Step 5/9 · 去 AI 化                                │
│        │  ▶ 自动模式                                          │
│        │                                                     │
├────────┴─────────────────────────────────────────────────────┤
│  就绪                                                        │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 模式切换

| 模式 | 行为 | 适用场景 |
|------|------|---------|
| 自动模式 | 全流程自动执行，仅在错误时暂停 | 批量生产 |
| 交互模式 | 在选题/框架/配图/Humanizer 处暂停等用户操作 | 需要人工把控 |
| 逐步模式 | 每一步完成后暂停，等用户确认 | 调试/学习 |

### 4.3 关键页面

**主写作页（Step 4）**：左栏为写作参数面板，右栏为文章实时预览。预览区支持直接编辑 Markdown，修改后自动同步。

**Humanizer 页（Step 5）**：
- 上方：29 项规则的检测报告（卡片式，每项显示 ✅/⚠️/❌ + 命中位置）
- 中方：修复进度条
- 下方：左右对比视图（原文 vs 修复后），可逐条接受/拒绝修改
- 交互模式下：显示修改对比，用户可逐条确认
- 自动模式下：全部自动修复，完成后展示检测报告

**选题页（Step 2）**：卡片式展示热点列表，每张卡片显示标题、热度、相关度评分、推荐框架。点击即选中。

**排版预览页（Step 8）**：WebView 嵌入最终微信渲染效果，左侧为原始 Markdown，右侧为微信预览，左右同步滚动。

**设置页**：表单式布局，每个设置项一行，点击展开编辑。API Key 输入框带显示/隐藏切换。文章保存路径使用系统原生文件夹选择器（macOS `NSOpenPanel` / Windows `SHBrowseForFolder`），选中后显示路径 + [更改] [打开文件夹] 按钮。修改即保存，无需重启。

**历史页**：文章卡片列表，显示标题/日期/框架/评分/字数。点击进入详情，可编辑/重新生成/导出。

---

## 五、技术架构

### 5.1 技术选型

> **核心原则：零外部依赖。** 用户双击安装包即可运行，无需安装 Python/Node/任何运行时。所有功能在应用内完成，所有配置在应用内修改。

| 层 | 方案 | 理由 |
|---|------|------|
| 框架 | **Tauri 2**（Rust + Web 前端） | 跨平台（Win/Mac）、体积小（<20MB）、安全 |
| 前端 | React + TypeScript | 生态成熟，组件化开发 |
| UI 库 | Tailwind CSS + shadcn/ui | 设计一致、可定制 |
| 后端 | Rust（Tauri commands） | 原生性能，所有业务逻辑编译为二进制 |
| 数据库 | SQLite（本地） | 轻量、无需外部服务 |
| 文件存储 | 用户自定义目录（可在设置中修改） | 文章 Markdown/HTML/图片，支持随时更换路径 |

### 5.2 脚本重写对照表

原版 WeWrite 有 6 个 Python 脚本 + Humanizer 规则，桌面端全部用 Rust 替代：

| Python 脚本 | 桌面端模块 | 实现方式 |
|-------------|-----------|---------|
| `fetch_hotspots.py` | `hotspot_fetcher` | Rust reqwest 抓取微博/头条/百度热搜 API，解析 JSON |
| `humanness_score.py` | `text_analyzer` | Rust 纯文本分析：禁用词匹配、句长统计、情绪词典、段落节奏 |
| `extract_exemplar.py` | `exemplar_parser` | Rust Markdown 解析，提取开头/情绪段/转折/收尾 |
| `seo_keywords.py` | `seo_scorer` | Rust 基于内置关键词库评分 + WebSearch 补充 |
| `learn_theme.py` | `theme_extractor` | Rust reqwest 抓取 HTML + CSS 解析 |
| `learn_edits.py` | `diff_analyzer` | Rust 文本 diff 对比（`similar` crate） |
| `toolkit/cli.py` (converter) | `wechat_converter` | Rust Markdown → 微信 HTML 转换 |
| `toolkit/cli.py` (gallery) | 前端组件 | React 直接渲染 |
| *(新增)* | **`humanizer`** | **基于 Wikipedia 29 种 AI 痕迹规则的 Rust 文本处理引擎** |
| *(新增)* | **`article_storage`** | **文章文件管理，支持用户自定义保存路径 + 迁移** |

**内置资源（编译进二进制，不读外部文件）**：
- 禁用词表（~80 个中文禁用词）
- 情绪词典（正面/负面/中性词表，~2000 词）
- 框架模板（7 套，JSON 格式）
- 写作人格配置（5 个人格 JSON）
- 范文种子（exemplar-seeds 的 Rust 常量）
- 写作规则（writing-guide 的结构化数据）
- 主题模板（3 套默认 CSS 主题）
- **Humanizer 29 规则（编译为 Rust 结构体 + 正则/词表匹配）**
- **AI 高频词汇表（中英文，~200 词）**
- **空洞修饰词表（~50 个中文空洞修饰语）**

### 5.3 架构图

```
┌──────────────────────────────────────────────────────────────┐
│                      WeWrite Desktop                          │
│                                                               │
│  ┌───────────────┐      ┌──────────────────────────────────┐ │
│  │   Frontend     │      │         Backend (Rust)            │ │
│  │  React + TS    │      │                                  │ │
│  │                │      │  ┌────────────────────────────┐   │ │
│  │  ┌──────────┐  │      │  │  AI Gateway                │   │ │
│  │  │ 选题 UI   │  │      │  │  Claude/GPT/本地模型         │   │ │
│  │  │ 写作 UI   │  │      │  │  (SSE 流式 + 同步)         │   │ │
│  │  │ 预览 UI   │  │      │  └────────────────────────────┘   │ │
│  │  │ 设置 UI   │  │      │                                  │ │
│  │  └──────────┘  │      │  ┌────────────────────────────┐   │ │
│  │                │      │  │  Humanizer                 │   │ │
│  │  ┌──────────┐  │      │  │  29 规则扫描 + 自动修复     │   │ │
│  │  │ WebView  │  │      │  │  内容/语言/风格三层检测     │   │ │
│  │  │ 微信预览  │  │      │  │  diff 对比 + 逐条修复      │   │ │
│  │  └──────────┘  │      │  └────────────────────────────┘   │ │
│  │                │      │                                  │ │
│  │  ┌──────────┐  │      │  ┌────────────────────────────┐   │ │
│  │  │ Markdown │  │      │  │  Text Analyzer             │   │ │
│  │  │  编辑器   │  │      │  │  禁用词/句长/情绪/评分      │   │ │
│  │  └──────────┘  │      │  └────────────────────────────┘   │ │
│  │                │      │                                  │ │
│  │  ┌──────────┐  │      │  ┌────────────────────────────┐   │ │
│  │  │  图片    │  │      │  │  Hotspot / WebSearch /     │   │ │
│  │  │  生成    │  │      │  │  WeChat / Converter        │   │ │
│  │  └──────────┘  │      │  └────────────────────────────┘   │ │
│  │                │      │                                  │ │
│  │                │      │  ┌────────────────────────────┐   │ │
│  │                │      │  │  SQLite                    │   │ │
│  │                │      │  │  历史/范文/配置/Playbook    │   │ │
│  │                │      │  └────────────────────────────┘   │ │
│  │                │      │                                  │ │
│  │                │      │  ┌────────────────────────────┐   │ │
│  │                │      │  │  内置资源（编译进二进制）    │   │ │
│  │                │      │  │  框架/人格/规则/禁用词/     │   │ │
│  │                │      │  │  Humanizer 29 规则/词表     │   │ │
│  │                │      │  └────────────────────────────┘   │ │
│  └───────────────┘      └──────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘

外部依赖：仅需网络连接（AI API / 热搜 API / WebSearch）
用户安装：双击 .dmg / .msi 即可，零额外配置
```

### 5.4 数据流

```
用户点击 [开始写作]
  │
  ▼
Backend: 从 SQLite 读取配置
  │
  ▼
Hotspot Fetcher → AI Gateway → 选题 → 用户选择
  │
  ▼
Web Search → 素材采集
  │
  ▼
AI Gateway → SSE 流式写作 → 实时渲染 Markdown
  │
  ▼
Text Analyzer → 自检 + 自动修复
  │
  ▼
Humanizer → 29 规则扫描（三层：内容模式 / 语言模式 / 风格模式）
  │    ├─ 扫描：逐规则检测，生成命中报告
  │    ├─ 修复：对命中项生成替换文本
  │    ├─ 交互模式 → 展示 diff，用户逐条确认
  │    ├─ 自动模式 → 全部自动修复
  │    └─ 审计："这还有什么明显的 AI 味？" → 第二轮修复
  │
  ▼
Text Analyzer → 重新评分（修复前后对比）
  │
  ▼
AI Gateway → SEO prompt（标题/摘要/标签）
  │
  ▼
WeChat Converter → 微信 HTML
  │
  ▼
SQLite 写入历史 → 保存文件到用户配置的 article_save_path → 完成
```

### 5.5 关键接口

#### Humanizer（Rust 原生）

```rust
// 基于 https://github.com/blader/humanizer 的 29 条规则
// 全部用 Rust 重写，无需 Python

/// Humanizer 严格度
enum Strictness {
    Relaxed,    // 只修复"高置信"命中（7+ 条规则命中同一模式才修）
    Standard,   // 修复所有命中的规则（推荐）
    Strict,     // 在标准基础上额外做"反 AI 审计"二次修复
}

/// 29 条规则的三个层级
enum PatternLayer {
    Content,    // 1-6: 内容模式（重要性夸大/名气堆砌/-ing分析/广告味/模糊引用/夸大趋势）
    Language,   // 7-18: 语言模式（AI词汇/系动词回避/否定并列/规则三/同义替换/破折号/加粗/emoji/...）
    Style,      // 19-29: 风格模式（聊天体/知识截止/谄媚语气/空洞修饰/过度模糊/模板化结尾/...）
}

/// 检测结果
struct HitRecord {
    rule_id: u8,            // 1-29
    pattern_name: String,   // "破折号过密"
    layer: PatternLayer,
    locations: Vec<HitLocation>,  // 命中的段落/句子位置
    severity: f64,          // 0-1，置信度
}

struct HitLocation {
    paragraph_index: usize,
    sentence_index: usize,
    original: String,       // 原文片段
    suggested: String,      // 修复建议
}

/// 主入口
#[tauri::command]
fn humanize(content: &str, strictness: Strictness) -> HumanizeResult {
    // 1. 逐规则扫描
    let hits = scan_all_rules(content);
    // 2. 按 severity 排序，过滤低置信项
    let filtered = filter_by_strictness(hits, strictness);
    // 3. 逐条修复（生成 diff）
    let patches = generate_patches(content, &filtered);
    // 4. 应用修复
    let fixed = apply_patches(content, &patches);
    // 5. 审计轮（strict 模式）
    if strictness == Strict {
        let audit_hits = audit_pass(&fixed);
        let audit_patches = generate_patches(&fixed, &audit_hits);
        let fixed = apply_patches(&fixed, &audit_patches);
    }
    HumanizeResult { original: content.to_string(), fixed, hits: filtered, patches }
}

struct HumanizeResult {
    original: String,
    fixed: String,
    hits: Vec<HitRecord>,
    patches: Vec<Patch>,
}
```

#### 29 规则实现策略

| 层 | 规则 | 匹配方式 | 修复方式 |
|---|------|---------|---------|
| 内容 (1-6) | 重要性夸大 | 关键词列表 + 句式模式 | 删除/替换为平实表述 |
| 内容 (1-6) | 名气堆砌 | 媒体名称列表 + 上下文判断 | 改为有上下文的具体引用 |
| 内容 (1-6) | -ing 表面分析 | 中文对应的"象征着/反映/体现"模式 | 删除或展开为具体分析 |
| 内容 (1-6) | 广告味语言 | "震撼/惊艳/绝美"等词表 | 替换为中性词 |
| 内容 (1-6) | 模糊引用 | "有研究指出/据报道"模式 | 要求具体来源或删除 |
| 语言 (7-18) | AI 高频词汇 | ~200 词的中英文词表 | 替换为同义但非常规的表达 |
| 语言 (7-18) | 系动词回避 | "作为/代表/标志着"检测 | 改为"是/有/能" |
| 语言 (7-18) | 破折号过密 | 正则统计 | 改为逗号/句号/括号 |
| 语言 (7-18) | Emoji 过多 | emoji 计数 | 删除或降级 |
| 风格 (19-29) | 空洞修饰 | ~50 个中文空洞词表 | 删除或替换为具体描述 |
| 风格 (19-29) | 模板化结尾 | "让我们拭目以待/未来可期"等 | 保留原文或改为留白 |
| 风格 (19-29) | 谄媚语气 | "Great question!/您说得对"等 | 删除 |

**内置词表（编译为 Rust 常量）**：

```rust
// AI 高频词汇（部分示例）
const AI_HIGH_FREQ_WORDS: &[&str] = &[
    "深入了解", "进一步", "显著", "至关重要", "不可忽视",
    "令人印象深刻", "无与伦比", "引领", "赋能", "闭环",
    "抓手", "痛点", "顶层设计", "底层逻辑", "颗粒度",
    "对齐", "拉齐", "打通", "沉淀", "反哺",
    // ... ~200 词
];

// 空洞修饰词
const EMPTY_MODIFIERS: &[&str] = &[
    "非常", "极其", "十分", "特别", "格外",
    "值得一提的是", "需要注意的是", "值得注意的是",
    "从某种意义上说", "可以说", "毫无疑问",
    // ... ~50 词
];

// 广告味词汇
const PROMO_WORDS: &[&str] = &[
    "震撼", "惊艳", "绝美", "璀璨", "璀璨夺目",
    "无与伦比", "史无前例", "空前绝后", "巅峰之作",
    "沉浸式", "极致", "匠心", "匠心独运",
    // ... ~30 词
];
```

#### AI Gateway（Rust 原生）

```rust
struct AIProvider {
    name: String,
    base_url: String,
    api_key: String,
    model: String,
}

impl AIGateway {
    fn complete(&self, prompt: &str) -> Result<String>;
    fn stream(&self, prompt: &str) -> impl Stream<Item = String>;
    fn chat(&self, messages: Vec<Message>) -> Result<String>;
}
```

#### Article Storage（Rust 原生）

```rust
// 文章保存路径管理（用户可在设置中随时修改）

struct ArticleStorage {
    save_path: PathBuf,  // 从 SQLite config 表读取，默认 {AppData}/wewrite-output
}

impl ArticleStorage {
    /// 保存文章到配置目录：{save_path}/{date}/{slug}/article.md
    fn save_article(&self, article: &Article) -> Result<PathBuf>;
    /// 列出所有已保存文章
    fn list_articles(&self) -> Result<Vec<ArticleMeta>>;
    /// 修改保存路径，可选迁移已有文件
    fn set_path(&mut self, new_path: &Path, migrate: bool) -> Result<()>;
}
```

#### Text Analyzer（Rust 原生）

```rust
#[tauri::command]
fn analyze_text(content: &str) -> ScoreReport {
    // 禁用词/句长/情绪/段落节奏/破句/词汇温度/副词密度
}

#[derive(Serialize)]
struct ScoreReport {
    composite_score: f64,
    param_scores: HashMap<String, f64>,
    suggestions: Vec<String>,
}
```

#### 微信 API（Rust 直接调用）

```rust
struct WeChatClient {
    appid: String,
    secret: String,
    access_token: Option<String>,
}

impl WeChatClient {
    fn get_access_token(&mut self) -> Result<String>;
    fn upload_draft(&self, html: &str, title: &str, digest: &str, cover: &str) -> Result<String>;
}
```

### 5.6 数据存储（SQLite Schema）

```sql
-- 应用配置
CREATE TABLE config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 默认配置项：
-- article_save_path: 文章保存目录（默认 {AppData}/wewrite-output）

-- 历史文章
CREATE TABLE articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    title TEXT NOT NULL,
    slug TEXT,
    topic_source TEXT,
    keywords TEXT,
    framework TEXT,
    enhance_strategy TEXT,
    word_count INTEGER,
    composite_score REAL,
    writing_persona TEXT,
    dimensions TEXT,
    closing_type TEXT,
    output_file TEXT,
    media_id TEXT,
    stats TEXT,
    writing_config TEXT,
    -- 新增：Humanizer 结果
    humanizer_hits INTEGER DEFAULT 0,        -- 命中规则数
    humanizer_fixes INTEGER DEFAULT 0,       -- 自动修复数
    humanizer_report TEXT,                    -- JSON: 完整检测报告
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 范文库
CREATE TABLE exemplars (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT,
    source_account TEXT,
    content TEXT NOT NULL,
    opening_hook TEXT,
    emotional_peak TEXT,
    transition TEXT,
    closing TEXT,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Playbook 规则
CREATE TABLE playbook_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule TEXT NOT NULL,
    confidence INTEGER DEFAULT 5,
    source TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 排版主题
CREATE TABLE themes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    css TEXT NOT NULL,
    learned_from TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 批量任务队列
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic TEXT,
    status TEXT DEFAULT 'pending',
    result_file TEXT,
    error TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME
);
```

---

## 六、非功能需求

### 6.1 性能

| 指标 | 目标 |
|------|------|
| 应用启动 | < 3 秒 |
| 热点抓取 | < 10 秒 |
| Humanizer 29 规则扫描 | < 500ms（2000 字文章） |
| Humanizer 修复 + 审计 | < 2 秒 |
| 文章生成（从选题到成稿） | < 3 分钟（取决于 AI 响应速度） |
| 微信预览渲染 | < 2 秒 |
| 应用体积（安装包） | < 25 MB |

### 6.2 平台兼容

| 平台 | 最低版本 | 安装方式 |
|------|---------|---------|
| macOS | 12.0+ (Monterey) | .dmg 拖入应用程序 |
| Windows | 10 (1903+) | .msi 安装向导 |
| (未来) Linux | Ubuntu 22.04+ | .deb / AppImage |

### 6.3 安全

- API Key 存储在系统钥匙串（macOS Keychain / Windows Credential Manager），不以明文写入文件
- 微信凭证同理
- 网络请求全部走 HTTPS
- 无外部进程调用，所有逻辑在应用内完成

### 6.4 离线能力

| 功能 | 是否需要网络 |
|------|------------|
| 查看历史文章 | 否 |
| 编辑 Markdown | 否 |
| 导出文件 | 否 |
| **Humanizer 去 AI 化** | **否（纯本地文本处理）** |
| 热点抓取 | 是 |
| AI 生成（选题/写作/SEO） | 是 |
| WebSearch 素材采集 | 是 |
| 微信发布 | 是 |
| 图片生成 | 是 |

---

## 七、版本规划

### v1.0 — MVP（核心闭环）

| 功能 | 状态 |
|------|------|
| 首次引导设置（API Key + 风格） | ✅ 必须 |
| 9 步完整写作流程 | ✅ 必须 |
| 自动/交互/逐步模式切换 | ✅ 必须 |
| 实时 Markdown 预览 | ✅ 必须 |
| **Humanizer 去 AI 化（29 规则 + 自动修复 + diff 对比）** | **✅ 必须** |
| 微信预览渲染 | ✅ 必须 |
| 导出 Markdown / HTML | ✅ 必须 |
| 历史文章管理 | ✅ 必须 |
| 多 AI 提供商支持（Claude + OpenAI） | ✅ 必须 |
| 内置 Markdown 编辑器 | ✅ 必须 |
| 范文库管理 | ✅ 必须 |
| 微信发布（草稿箱） | ✅ 必须 |
| 配图生成 | ⚠️ 有 API 时可用 |
| 文本人类感评分 | ✅ 必须 |
| 自动更新检查 | ✅ 必须 |
| 零外部依赖 | ✅ 必须 |

### v1.1 — 增强

| 功能 | 优先级 |
|------|--------|
| 批量生成（选题队列） | P1 |
| 排版主题库 + 学习排版 | P1 |
| Playbook 可视化编辑 | P2 |
| 学习用户的修改风格 | P2 |
| Humanizer 自定义规则（用户可添加/禁用规则） | P2 |

### v2.0 — 生态

| 功能 | 优先级 |
|------|--------|
| 文章数据复盘（接入微信数据接口） | P2 |
| 多账号管理 | P2 |
| 团队协作（共享范文库/Playbook） | P3 |
| 插件系统（自定义 Step） | P3 |
| 小绿书/图片帖生成 | P3 |
| Linux 支持 | P3 |

---

## 八、依赖清单

### 8.1 外部依赖（需用户配置，应用内操作）

| 依赖 | 用途 | 必填 | 获取方式 |
|------|------|------|---------|
| Claude API Key | AI 生成（推荐） | 与 OpenAI 二选一 | console.anthropic.com |
| OpenAI API Key | AI 生成（备选） | 与 Claude 二选一 | platform.openai.com |
| 微信公众号 AppID + Secret | 发布草稿箱 | 否 | mp.weixin.qq.com |
| 图片生成 API Key | 封面/配图 | 否 | 应用内设置 |

### 8.2 无外部运行时依赖

| 依赖 | 方案 |
|------|------|
| Python | ❌ 不需要。所有脚本用 Rust 重写 |
| Node.js | ❌ 不需要。前端代码编译为静态资源，打包进 Tauri |
| 系统 Python | ❌ 不需要。不调用任何外部进程 |
| 浏览器 | ❌ 不需要。WebView 内置 |

### 8.3 内置依赖（编译进二进制）

| 依赖 | 来源 | 说明 |
|------|------|------|
| 框架模板 | WeWrite 原始数据 | 7 套框架，编译为 Rust 常量 |
| 写作人格 | WeWrite 原始数据 | 5 个人格配置，编译为 Rust 常量 |
| 写作规则 | WeWrite writing-guide | 禁用词/句长/情绪规则，结构化 |
| 范文种子 | WeWrite exemplar-seeds | 通用人类写作模式 |
| 情绪词典 | 内置中文情绪词表 | ~2000 词，三分类 |
| SEO 规则 | WeWrite seo-rules | 标题/摘要/标签规则 |
| 主题模板 | 3 套默认 CSS | professional-clean / magazine / minimal |
| **Humanizer 29 规则** | **github.com/blader/humanizer** | **29 条 AI 痕迹检测规则，中文适配** |
| **AI 高频词汇表** | **编译为 Rust 常量** | **~200 词，中英文** |
| **空洞修饰词表** | **编译为 Rust 常量** | **~50 词** |
| **广告味词汇表** | **编译为 Rust 常量** | **~30 词** |

---

## 九、风险与降级

| 风险 | 影响 | 降级方案 |
|------|------|---------|
| AI API 调用失败 | 写作无法进行 | 切换备选提供商；显示错误 + 重试 |
| WebSearch 不可用 | 素材质量下降 | 用 LLM 训练数据 + 提示用户补充 |
| Humanizer 过度修复 | 文章语感变怪 | 交互模式下用户可逐条拒绝；提供"撤销上一步"按钮 |
| 微信 API 变更 | 发布失败 | 导出 HTML，用户手动粘贴 |
| 图片 API 失败 | 无配图 | 输出提示词 + 本地图片选择 |
| Tauri WebView 兼容性 | 部分 UI 渲染异常 | 针对 Win/Mac 分别测试 |
| SQLite 数据损坏 | 历史丢失 | 定期自动备份到用户目录 |

---

## 十、成功指标

| 指标 | 目标（v1.0 上线 3 个月） |
|------|------------------------|
| 安装量 | 1,000+ |
| 日活用户 | 200+ |
| 文章生成量 | 5,000+ |
| 用户满意度（NPS） | ≥ 40 |
| 平均单篇文章生成时间 | < 3 分钟 |
| Humanizer 修复接受率 | ≥ 70%（用户接受自动修复的比例） |
| 应用崩溃率 | < 0.1% |
| 安装到首次使用时间 | < 1 分钟（无需环境配置） |

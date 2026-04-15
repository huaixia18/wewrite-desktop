# WeWrite

微信公众号 AI 写作助手 — Web 云端版。

基于 Apple 设计系统构建的智能化写作平台，支持从热点抓取、选题分析、AI 写作、去 AI 化处理到微信公众号一键发布的全流程。

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 15 (App Router) |
| 语言 | TypeScript |
| UI 组件 | Base UI + shadcn/ui |
| 样式 | Tailwind CSS v4 + Apple Design System |
| 用户认证 | NextAuth v5 (Credentials + WeChat OAuth) |
| 数据库 | PostgreSQL + Prisma 7 |
| 状态管理 | Zustand |
| AI | Claude / GPT-4 (SSE 流式输出) |

---

## 功能概览

### 写作流水线（8 步）

1. **热点抓取** — 聚合微博热搜、头条热榜、百度指数
2. **选题分析** — AI 生成 10 个备选选题，综合评分（点击潜力 / SEO / 框架适配）
3. **选择框架** — 7 种文章结构（痛点型 / 故事型 / 清单型 / 对比型 / 热点解读型 / 纯观点型 / 复盘型）
4. **内容增强** — WebSearch 采集真实素材，拒绝 AI 空话
5. **AI 写作** — SSE 流式输出，实时预览
6. **去 AI 化** — 29 条 Humanizer 规则检测，自动修复 AI 写作痕迹
7. **SEO + 配图** — AI 生成标题、摘要、标签、封面图
8. **排版发布** — 12 套微信排版主题，手机模拟预览，一键推送草稿箱

### 其他页面

- **历史文章** — 草稿 / 已发布 / 归档三态管理
- **设置** — 账号信息、AI 提供商选择、风格人格配置、微信授权

---

## 设计系统

采用 Apple 设计规范（参考 `DESIGN.md`）：

- **背景交替** — 纯黑 `#000` / 浅灰 `#f5f5f7` 双色节拍
- **唯一强调色** — Apple Blue `#0071e3`（所有交互元素）
- **字体** — SF Pro Display（标题）/ SF Pro Text（正文），负字间距
- **按钮** — 药丸形 CTA（`border-radius: 980px`）
- **玻璃导航** — `backdrop-filter: saturate(180%) blur(20px)`
- **投影** — 极克制：`rgba(0,0,0,0.22) 3px 5px 30px 0px`
- **圆角** — 5px 微圆、8px 按钮、12px 卡片、980px 药丸

---

## 项目结构

```
web/
├── prisma/
│   └── schema.prisma          # 数据库模型（User/Article/StyleProfile…）
├── prisma.config.ts           # Prisma 7 适配器配置
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/        # 登录 / 注册页
│   │   └── (dashboard)/
│   │       ├── history/      # 历史文章页
│   │       ├── settings/      # 设置页
│   │       └── write/        # 写作流水线首页
│   │   ├── api/              # 所有 API 路由
│   │   ├── globals.css       # Apple Design System 全局样式
│   │   └── layout.tsx
│   ├── auth.ts                # NextAuth v5 配置
│   ├── components/
│   │   ├── layout/           # Sidebar + DashboardLayout
│   │   ├── pipeline/         # 8 个流水线步骤组件
│   │   └── ui/               # Apple 风格 UI 组件
│   ├── lib/
│   │   └── prisma.ts         # Prisma 单例（适配器模式）
│   └── store/
│       └── pipeline.ts       # Zustand 流水线状态
├── next.config.ts
└── package.json
```

---

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env.local
```

需要配置：

```env
# 数据库（PostgreSQL）
DATABASE_URL="postgresql://user:password@localhost:5432/wewrite"

# NextAuth
AUTH_SECRET="your-auth-secret-here"

# AI（ Anthropic / OpenAI 二选一）
ANTHROPIC_API_KEY="sk-ant-..."
OPENAI_API_KEY="sk-..."

# 微信 OAuth（可选）
WECHAT_APP_ID="wx..."
WECHAT_APP_SECRET="..."

# 微信公众号（可选，发布用）
WECHAT_MP_APPID="wx..."
WECHAT_MP_APPSECRET="..."
```

### 3. 初始化数据库

```bash
npx prisma migrate dev
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

---

## 主要依赖

```
next@16.2.3
@base-ui/react@1.3.0
@auth/prisma-adapter@2.11.1
@prisma/adapter-pg@7.7.0
@prisma/client@7.7.0
zustand@5.0.12
tailwindcss@4
next-auth@5.0.0-beta.30
```

---

## 设计参考

Apple Design System 完整规范见项目根目录 `DESIGN.md`。

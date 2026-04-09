# WeWrite Desktop

基于 Tauri 2 + React + TypeScript 构建的公众号写作辅助桌面应用。

## 环境要求

| 工具 | 版本要求 | 安装方式 |
|------|---------|---------|
| Node.js | ≥ 18 | https://nodejs.org |
| pnpm | ≥ 8 | `npm install -g pnpm` |
| Rust | ≥ 1.70 | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| Xcode CLT（macOS） | 任意 | `xcode-select --install` |

Rust 安装后需重启终端，或执行 `source ~/.cargo/env` 使 `cargo`/`rustc` 命令生效。

## 开发模式启动

```bash
# 1. 进入项目目录
cd wewrite-desktop

# 2. 安装前端依赖（首次或 package.json 变动后执行）
pnpm install

# 3. 启动开发模式
pnpm tauri dev
```

首次运行会编译 400+ 个 Rust crate，约需 3-5 分钟。之后增量编译很快。

编译完成后自动弹出原生窗口，支持热更新：
- 修改前端代码 → 立即生效
- 修改 Rust 代码 → 自动重新编译后生效

## 打包生产包

```bash
pnpm tauri build
```

产物路径：

```
src-tauri/target/release/bundle/
├── dmg/      ← macOS 安装镜像（.dmg）
├── macos/    ← macOS .app 应用包
├── deb/      ← Linux .deb（在 Linux 上打包时）
└── nsis/     ← Windows 安装程序（在 Windows 上打包时）
```

> Tauri 只能打包当前平台的格式。在 Mac 上只生成 `.dmg`，不会生成 `.exe`。

## 常用命令

```bash
pnpm tauri dev          # 开发模式（含热更新）
pnpm tauri build        # 生产打包
pnpm dev                # 仅启动 Vite 前端（纯 UI 调试，不含 Rust）
pnpm build              # 仅构建前端静态文件到 dist/
pnpm tsc --noEmit       # TypeScript 类型检查
```

## 常见问题

**`rustc: command not found`**

```bash
source ~/.cargo/env
# 或将以下内容加入 ~/.zshrc
export PATH="$HOME/.cargo/bin:$PATH"
```

**`pnpm install` 失败**

```bash
pnpm install --force
```

**Rust 编译报错 `error[E0433]: failed to resolve`**

依赖未完整下载，执行：

```bash
cd src-tauri && cargo fetch
```

**窗口白屏**

开发模式下 Vite 运行在 `http://localhost:1420`，确认端口未被占用：

```bash
lsof -i :1420
```

## 技术栈

- **前端**：React 19 + TypeScript + Tailwind CSS v4 + React Router v7 + Zustand
- **后端**：Rust + Tauri 2
- **图标**：lucide-react
- **UI 原语**：Radix UI

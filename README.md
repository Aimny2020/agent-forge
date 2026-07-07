# AgentForge

AgentForge 是基于 Tauri v2、React 和 Rust 构建的本地 Agent 工程管理工作台。项目当前处于 `0.1.0` 私有预览阶段，仅供授权的内部测试人员使用，未授权公开分发。

## 当前能力

- 桌面应用壳、项目导航、主题切换和基础状态页面
- SQLite 数据库初始化及类型化 Tauri IPC
- 本地技能与技能包扫描、Markdown 元数据解析和风险标记
- 从本地目录或 Git 仓库检查并导入技能包
- 技能详情、来源与信任状态展示
- 带依赖保护和分阶段反馈的技能删除流程

项目、Agent、任务、环境和 Harness 页面仍处于基础框架阶段，不应视为完整的生产能力。

## 架构

React 和 TypeScript 位于 `src/`：

- `app/`：路由、Provider 和共享应用外壳
- `features/`：页面级功能模块
- `shared/`：Tauri IPC 客户端、状态、通用 UI、主题和样式

Rust 位于 `src-tauri/src/`：

- `commands/`：保持轻量的 Tauri command 入口
- `application/`：应用用例与编排
- `domain/`：稳定模型和端口
- `infrastructure/`：SQLite、Markdown、Git 和系统适配

依赖方向由外向内，领域层不得依赖 Tauri、SQLite 或具体 Agent CLI。

## 环境要求

- Node.js 20 或更高版本
- npm（使用仓库内 `package-lock.json`）
- Rust stable toolchain，并安装 `rustfmt` 和 `clippy`
- 对应平台的 [Tauri v2 系统依赖](https://v2.tauri.app/start/prerequisites/)

## 本地开发

安装依赖并启动完整桌面应用：

```bash
npm ci
npm run tauri:dev
```

只启动 Vite 前端：

```bash
npm run dev
```

## 验证

提交或发布前运行：

```bash
npm run version:check
npm run lint
npm run test:run
npm run build
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo test --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
```

版本检查会比较以下三个来源：

- `package.json`
- `src-tauri/Cargo.toml`
- `src-tauri/tauri.conf.json`

三处版本必须完全一致。

## 内部预览安装包

GitHub Draft Release 构建以下产物：

- macOS ARM64 DMG
- macOS x64 DMG
- Windows x64 NSIS `.exe`

当前不提供 Linux、MSI 或移动端安装包，也没有自动更新功能。

### 安装警告

macOS 安装包仅使用 ad-hoc signing，未进行 Apple notarization。Gatekeeper 仍可能阻止首次启动，仅应在确认安装包来自本项目私有 Release 后手动放行。

Windows 安装包未签名，Microsoft Defender SmartScreen 可能显示未知发布者警告。不要绕过来源不明安装包的安全提示。

## 发布流程

普通 push 和 pull request 只运行 CI。内部预览发布使用语义化版本 tag：

1. 更新 `package.json`、`src-tauri/Cargo.toml` 和 `src-tauri/tauri.conf.json` 中的版本。
2. 运行完整验证命令。
3. 创建与版本一致的 tag，例如 `v0.1.0`。
4. 推送 tag 后，由 GitHub Actions 创建 Draft、prerelease 状态的 GitHub Release。
5. 在发布 Draft 前，分别安装并人工验证三个平台产物。

Release 工作流会拒绝 tag 与应用版本不一致的构建。当前工作流不生成 updater JSON，也不读取长期签名 Secret。

## 安全与仓库规则

- 不得提交 `.env`、数据库、Agent 凭据、签名证书或私钥。
- `.agents/` 是本地开发辅助目录，不属于产品源码，也不会上传或打包。
- 未来需要随应用分发的内置资源必须进入明确的源码目录，并通过 Tauri resources 配置声明。
- 项目共享设置未来放入 `.agentforge/manifest.toml`；敏感值只存储引用名称，真实值进入系统 Keychain。

版本变化见 [CHANGELOG.md](./CHANGELOG.md)。

## 许可证

当前私有预览版本未授予开源或公开分发许可。保留全部权利。

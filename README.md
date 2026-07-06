# AgentForge

AgentForge（Agent 工程管理器）是基于 Tauri v2、React 和 Rust 的本地 AI 开发工作台。当前版本提供可扩展的桌面应用骨架、项目工作区页面、主题系统、SQLite 初始化与类型化健康检查。

## Prerequisites

- Node.js 20 或更高版本
- Rust stable toolchain
- 对应平台的 [Tauri v2 系统依赖](https://v2.tauri.app/start/prerequisites/)

## Development

```bash
npm install
npm run tauri:dev
```

常用检查：

```bash
npm run test:run
npm run build
cargo test --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
```

## Architecture

React 表现层通过类型化 Tauri Commands 调用 Rust 应用层。应用服务只依赖 `src-tauri/src/domain/` 中的端口；SQLite、系统信息与未来的 Agent/PTY 实现位于 `infrastructure/`。依赖必须由外向内，领域层不得依赖 Tauri、SQLite 或具体 Agent CLI。

第一阶段刻意不包含项目扫描、配置写入、PTY 托管或真实 Agent 启动。设计规格与实施计划位于 `docs/superpowers/`。

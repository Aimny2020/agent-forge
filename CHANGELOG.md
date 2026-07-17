# Changelog

本文件记录 AgentPalette 的重要变更。格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### 计划

- 完成内部预览安装验证后评估 Linux 构建、正式代码签名和自动更新。

## [0.2.1] - 2026-07-13

### 变更

- 改进项目 Harness 的导航、编辑布局、文件扫描范围与切换状态管理。

## [0.1.0] - 2026-07-07

### 新增

- 基于 Tauri v2、React、TypeScript 和 Rust 的桌面应用基础架构。
- 项目导航、主题切换、共享 UI 状态和页面框架。
- SQLite 迁移、领域端口、应用服务和类型化 Tauri IPC。
- 本地技能与技能包扫描、Markdown 元数据解析及可执行内容风险检测。
- 本地目录与 Git 来源的技能导入检查、来源记录和信任状态展示。
- 技能详情、技能包成员展示及带依赖保护的删除确认流程。
- Vitest 前端测试、Rust 单元测试和 Clippy 检查。
- GitHub CI 与 tag 驱动的 macOS/Windows Draft Release 流程。

### 限制

- 本版本仅供私有内部预览，未授权公开分发。
- macOS 仅使用 ad-hoc signing，未进行 notarization。
- Windows 安装包未签名。
- 暂不提供 Linux、MSI、移动端和自动更新支持。

[Unreleased]: https://github.com/Aimny2020/agentpalette/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/Aimny2020/agentpalette/releases/tag/v0.2.1
[0.1.0]: https://github.com/Aimny2020/agentpalette/releases/tag/v0.1.0

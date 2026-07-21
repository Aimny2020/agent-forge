# 贡献指南

感谢你对 AgentPalette 的关注。欢迎提交 Bug 报告、功能建议、文档改进与 Pull Request。

## 提交 Issue

- 提交前先搜索已有 Issue，避免重复。
- Bug 报告请提供系统版本、AgentPalette 版本、复现步骤、预期结果和实际结果。
- 截图或日志请先移除令牌、用户名、本地绝对路径和其他敏感信息。
- 安全问题不要公开创建 Issue；请通过仓库维护者的私密联系方式报告。

## 提交 Pull Request

1. 先为较大的功能或设计变更创建 Issue 并讨论方案。
2. 从 `main` 创建聚焦的分支，避免混入无关格式化或重构。
3. 遵循仓库中的 `AGENTS.md` 约定：TypeScript 使用两空格缩进，Rust 使用四空格缩进。
4. 为用户可见行为、IPC 类型、领域规则与错误映射补充相应测试。
5. 提交前运行：

```bash
npm run version:check
npm run lint
npm run test:run
npm run build
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo test --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
```

6. 在 Pull Request 中说明变更范围、验证方式、相关 Issue，以及是否涉及数据库迁移或 IPC 契约。

## 贡献许可

提交 Pull Request 即表示你有权提交该代码，并同意你的贡献按本仓库的 [Apache License 2.0](./LICENSE) 许可。

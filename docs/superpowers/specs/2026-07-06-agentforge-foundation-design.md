# AgentForge Foundation Design

## Goal and Scope

AgentForge（Agent 工程管理器）是基于 Tauri v2、React、TypeScript 与 Rust 的本地 AI 开发工作台。第一阶段仅交付可运行、可扩展的应用骨架：桌面窗口、导航页面、设计系统、Rust 分层、SQLite 初始化与类型化 IPC。项目扫描、配置生成、PTY 和真实 Agent 启动均留到后续阶段。

长期产品边界是“本地 Agent 工程控制台”，而非代码编辑器、通用聊天客户端或 Agent 推理运行时。

## Architecture

采用单进程模块化单体，依赖方向由外向内：

1. **React 表现层**：页面、功能模块、设计系统和界面状态。
2. **Tauri IPC 层**：类型化 Commands、Events 与统一错误传输。
3. **Rust 应用层**：`ProjectService`、`ConfigService`、`AgentService`、`TaskService`，负责编排用例和事务。
4. **领域层**：Project、Harness、Skill、McpServer、AgentProfile、TaskRun，以及 Repository、AgentAdapter、ProcessManager 接口。
5. **基础设施层**：SQLite、文件系统、Git、Keychain、PTY、配置生成器和各 Agent 适配器。

核心业务不得直接依赖 Tauri、SQLite 或具体 Agent CLI。后续适配器首批覆盖 Claude Code、Codex CLI、Gemini CLI、OpenCode 与自定义 Shell 命令。

## Data and Configuration Direction

项目内 `.agentforge/manifest.toml` 保存可提交 Git 的工程规则；本地 SQLite 保存项目索引、运行记录、任务状态和个人偏好；密钥存入系统 Keychain。未来由中立配置模型生成各 Agent 原生配置，写入前必须展示 Diff、备份旧文件并保留无法识别的手写内容。

## Frontend Structure

应用采用“顶部全局导航 + 项目侧栏 + 主工作区”：

- 控制面板：系统健康度、最近项目、运行任务。
- 项目管理：概览、Harness、Agents、环境四个二级页签。
- Skills：全局技能库、项目启用项、来源与版本。
- MCP：服务器目录、连接状态与项目绑定。
- 任务：运行队列、PTY 会话与历史记录。
- 设置：Agent 检测、数据安全、外观与更新。

项目侧栏持续展示项目路径和健康状态。第一阶段所有页面使用模拟数据，并覆盖正常、空、加载和错误状态。

## Visual System

沿用 `stitch_agentforge_project_manager (1)` 的 Vivid Precision 方向：浅冷灰画布、白色卡片、Neo-Green 强调色、柔和阴影和 16px 圆角。标题使用 Hanken Grotesk，正文使用 Inter，间距遵循 8px 基线。提供亮色与暗色主题，并适配常见桌面窗口尺寸。

## First Runnable Flow

应用启动后，Rust 初始化应用数据目录与 SQLite，并暴露 `health_check`。React 调用该命令，展示应用版本、操作系统和数据库状态。失败统一转换为稳定错误码、用户可读消息和可选技术详情；界面提供重试，不展示原始 Rust 错误。

## Verification and Acceptance

- `npm run tauri dev` 能启动桌面应用。
- 六个一级页面和项目二级页签均可导航。
- TypeScript 与 Rust 格式检查、单元测试和生产构建通过。
- Rust 测试覆盖健康检查、数据库初始化和错误映射。
- React 测试覆盖路由、主框架、主题及四类页面状态。
- 第一阶段不包含项目扫描、配置写入、PTY 或真实 Agent 启动。

## Reference Boundary

`Antigravity-Manager` 仅作为成熟 Tauri v2 工程结构、IPC 和发布方式的参考，不复制其账号代理业务。Stitch 资料仅作为视觉与布局参考，AgentForge 的领域模型和信息架构独立设计。

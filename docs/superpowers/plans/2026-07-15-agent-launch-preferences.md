# Agent Launch Preferences and Control Center Plan

> **For agentic workers:** Implement this plan in focused vertical slices. Do not promise desktop-app project handoff until its official stable integration is verified per platform.

**Goal:** Let an individual developer select platform-specific terminal launch preferences once, then use AgentPalette as the canonical place to start an installed coding agent in a registered project.

**Architecture:** Persist user-owned macOS and Windows launch preferences in SQLite. The domain expresses launch intent; platform adapters later resolve native terminal and application commands. Project-level preferences will override global preferences. CLI agents are managed first; desktop applications are initially external handoffs.

**Tech Stack:** Tauri v2, Rust, SQLite/rusqlite, React, TypeScript, TanStack Query, Vitest.

**Implementation status (2026-07-15):** Slice 1 is complete. The first core of Slices 2 and 3 is also complete: AgentPalette scans the built-in CLI catalog and can hand off a selected registered project to Codex CLI, Claude Code, Antigravity CLI, Gemini CLI, or OpenCode through supported native terminals. Desktop-application discovery, richer diagnostics, project overrides, managed runs, and unsupported terminal integrations remain planned.

## Constraints

- A registered project is the single canonical directory; never copy it to launch an agent.
- macOS and Windows discovery/launch details must remain outside the domain layer.
- CLI agents are the first supported managed surface; desktop applications are not assumed to expose task lifecycle APIs.
- Credentials and secrets are never placed in persisted launch preferences or command-line previews.
- A failed native handoff must always expose a copyable command as a fallback.

## Slice 1: Persisted Platform Launch Preferences

**Files:** settings domain and repository port, SQLite migration, settings commands, typed IPC client, Settings page, tests.

- Persist separate macOS and Windows terminal choices with `auto` as the safe default.
- Persist launch presentation and preflight toggles: new tab/window, command preview, environment check, permissions check, and command-copy fallback.
- Render only the platform-relevant terminal list as active while preserving both platform values for portable personal configuration.

## Slice 2: Agent Discovery and Diagnostics

- Add built-in adapters for Codex CLI then Claude Code. **Implemented:** the initial catalog also includes Antigravity CLI (`agy`), Gemini CLI, and OpenCode; discovery checks `PATH` plus common user bin locations and probes `--version`.
- Discover configured path, PATH executable, and platform-standard installation locations.
- Diagnose executable version, project directory, Git, toolchain, authentication where the provider exposes a stable safe probe, and enabled MCP connectivity.
- Return structured readiness states: ready, needs-attention, restricted, missing, failed.

## Slice 3: Cross-Platform Handoff

- Build a project-scoped launch request from the selected Agent Adapter and Launch Preference.
- Implement macOS Terminal and iTerm2 plus Windows Terminal and PowerShell as first targets. **Implemented:** registered projects can launch a detected CLI through these targets; unsupported selected terminals return a visible error rather than silently opening the wrong application.
- Start external handoffs in the canonical project directory, show a command preview when configured, and persist a handoff run snapshot.
- Add a direct managed-run host only after a PTY/ConPTY implementation is validated on both platforms.

## Slice 4: Project Overrides and Run History

- Allow a project to override global terminal, agent, and launch-profile defaults.
- Add immutable run snapshots, status timeline, retry, and copy-command actions.
- Show Agent readiness and recent runs in the global dashboard and project overview.

## Verification

- Rust unit tests cover default and round-trip launch-preference persistence.
- IPC tests verify command names and camelCase payloads.
- Settings UI tests cover loading, selecting a terminal, saving, and an error state.
- Run `cargo fmt --check`, `cargo test`, `npm run test:run`, `npm run build`, and `git diff --check`.

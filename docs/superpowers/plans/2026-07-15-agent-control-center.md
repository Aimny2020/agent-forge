# Agent Control Center Implementation Plan

**Goal:** Provide a global Agent management page for discovering and maintaining local CLI and desktop Agent installations, while project overview remains focused on launching a selected project through a ready CLI.

**Architecture:** An Agent product can have multiple Agent Installations. The built-in catalog returns CLI installations discovered through `PATH` and safe common bin directories, and desktop applications discovered through platform-native application locations. Each installation exposes its surface, version when available, path, and readiness. Native open/handoff behavior remains owned by the platform adapter.

## Implemented in this slice

- Add the top-level `/agents` page and navigation item.
- Show a refreshable catalog of CLI and desktop installations, grouped by surface.
- Surface version and readiness without exposing an executable path in the management UI.
- Surface desktop-app version and readiness for macOS applications, including Codex via ChatGPT Desktop and Antigravity Desktop.
- Allow opening a detected desktop application; preserve project-scoped CLI launch on the project overview page.
- Redesign the Agents page into a compact responsive catalog grid with CLI/Desktop tabs, search, and no summary metrics or executable-path display.
- Automatically check the npm registry for supported CLI versions after discovery. The check reports current, available, or unknown rather than making an unsupported version claim.
- Install, update, and uninstall Codex CLI, Claude Code, Gemini CLI, and OpenCode through a backend allowlist. Each action first shows the exact npm command and requires confirmation, then re-detects installations and refreshes update status.
- Include eight CLI products in discovery: Codex, Claude Code, Antigravity, Gemini CLI, OpenCode, OpenClaw, Hermes Agent, and Cursor CLI. All eight expose an install or update action when their platform supports it; Hermes also exposes its own uninstall action. The card does not expose package-manager or installer provenance.

## Deferred work

- Antigravity and Cursor do not currently publish a supported CLI uninstaller, so their cards intentionally omit only the uninstall action. Their install/update commands remain provider-owned and fixed in the backend allowlist.
- Desktop client installation, updating, and uninstallation remain system-owned. The page can discover and open them, without guessing vendor-specific installers or deleting application bundles.
- Windows desktop discovery will add Start Menu and registry discovery; the first cross-platform implementation uses common install locations.
- Project defaults, update availability, authentication checks, MCP health, and managed process history follow in later slices.

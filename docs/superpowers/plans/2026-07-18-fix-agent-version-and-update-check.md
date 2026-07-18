# Fix Agent Version Detection and Update Check Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix CLI Agent version detection (from "v未知" to actual installed version) and resolve perpetual "正在检查更新" status in AgentPalette desktop app.

**Architecture:** 
1. In Rust backend (`src-tauri/src/application/agent_service.rs`), pass through the parsed/normalized version string in `discover()` instead of hardcoding `version: None`, and include non-npm CLI definitions in `check_updates()` with `"unknown"` status instead of omitting them.
2. In React frontend (`src/features/agents/AgentsPage.tsx`), enable automatic update query fetching on load (`enabled: true`) and adjust `updateLabel` to accurately distinguish fetching vs completed update checks.
3. Add unit tests for Rust backend and React frontend component.

**Tech Stack:** Rust (Tauri v2), TypeScript, React, React Query, Vitest, Testing Library.

---

### Task 1: Fix Version Detection and Update Check in Rust Backend

**Files:**
- Modify: `src-tauri/src/application/agent_service.rs:139-160,198-229,677-725`

- [ ] **Step 1: Write failing Rust unit tests for version assignment and non-NPM agent update status**

In `src-tauri/src/application/agent_service.rs`, add tests in `mod tests`:

```rust
#[test]
fn discovery_populates_version_when_executable_exists() {
    let service = AgentService::new();
    let agents = service.discover();
    for agent in agents {
        if agent.status == "ready" && agent.surface == "cli" {
            // Executable exists, so version should be populated if --version works
            // At minimum version field should be checked and normalized
        }
    }
}

#[test]
fn check_updates_includes_all_cli_agents() {
    let service = AgentService::new();
    let updates = service.check_updates();
    let agent_ids: Vec<String> = updates.into_iter().map(|u| u.agent_id).collect();
    assert!(agent_ids.contains(&"claude".to_string()));
    assert!(agent_ids.contains(&"antigravity".to_string()));
    assert!(agent_ids.contains(&"gemini".to_string()));
}
```

- [ ] **Step 2: Run Rust tests to verify failure**

Run: `cargo test --manifest-path src-tauri/Cargo.toml`
Expected: `check_updates_includes_all_cli_agents` fails because non-NPM agents like `antigravity` are currently filtered out and missing from updates list.

- [ ] **Step 3: Update `discover()` and `check_updates()` in `agent_service.rs`**

In `src-tauri/src/application/agent_service.rs`:

1. In `discover()` (line 139-156):
```rust
let version = executable
    .as_deref()
    .and_then(read_version)
    .and_then(normalize_version);

LocalAgent {
    id: definition.id.into(),
    product: definition.product.into(),
    display_name: definition.display_name.into(),
    surface: "cli".into(),
    command: definition.commands[0].into(),
    status: if executable.is_some() {
        "ready".into()
    } else {
        "missing".into()
    },
    version,
    executable_path: executable.map(|path| path.to_string_lossy().to_string()),
    can_install: can_maintain(definition, "install"),
    can_update: can_maintain(definition, "update"),
    can_uninstall: can_maintain(definition, "uninstall"),
}
```

2. In `check_updates()` (line 198-229):
```rust
pub fn check_updates(&self) -> Vec<AgentUpdate> {
    AGENTS
        .iter()
        .map(|definition| {
            let executable = definition
                .commands
                .iter()
                .find_map(|command| find_executable(command));
            let current = executable
                .as_deref()
                .and_then(read_version)
                .and_then(normalize_version);

            let (latest, status) = match definition.maintenance {
                AgentMaintenance::Npm(package) => {
                    let latest = read_npm_latest_version(package);
                    let status = match (&current, &latest) {
                        (None, _) => "not_installed",
                        (Some(_), None) => "unknown",
                        (Some(current), Some(latest)) if current == latest => "current",
                        (Some(_), Some(_)) => "available",
                    };
                    (latest, status)
                }
                _ => {
                    let status = if current.is_some() {
                        "unknown"
                    } else {
                        "not_installed"
                    };
                    (None, status)
                }
            };

            AgentUpdate {
                agent_id: definition.id.into(),
                status: status.into(),
                current_version: current,
                latest_version: latest,
            }
        })
        .collect()
}
```

- [ ] **Step 4: Run Rust tests to verify they pass**

Run: `cargo test --manifest-path src-tauri/Cargo.toml`
Expected: PASS

- [ ] **Step 5: Commit Task 1**

```bash
git add src-tauri/src/application/agent_service.rs
git commit -m "fix(backend): populate CLI agent versions and include non-NPM agents in update checks"
```

---

### Task 2: Enable Auto Update Checking and Fix Labels in Frontend

**Files:**
- Modify: `src/features/agents/AgentsPage.tsx:16-22,115`
- Create: `src/features/agents/AgentsPage.test.tsx`

- [ ] **Step 1: Write frontend unit tests for AgentsPage**

Create `src/features/agents/AgentsPage.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { AgentsPage } from './AgentsPage';
import * as tauriClient from '../../shared/api/tauriClient';

vi.mock('../../shared/api/tauriClient', () => ({
  getLocalAgents: vi.fn(),
  checkAgentUpdates: vi.fn(),
  getAgentMaintenancePlan: vi.fn(),
  applyAgentMaintenance: vi.fn(),
  openDesktopAgent: vi.fn(),
}));

describe('AgentsPage', () => {
  it('renders local agent version and update status correctly', async () => {
    vi.mocked(tauriClient.getLocalAgents).mockResolvedValue([
      {
        id: 'claude',
        product: 'Claude',
        displayName: 'Claude Code',
        surface: 'cli',
        command: 'claude',
        status: 'ready',
        version: '1.0.5',
        executablePath: 'C:\\bin\\claude.cmd',
        canInstall: false,
        canUpdate: true,
        canUninstall: true,
      },
    ]);
    vi.mocked(tauriClient.checkAgentUpdates).mockResolvedValue([
      {
        agentId: 'claude',
        status: 'current',
        currentVersion: '1.0.5',
        latestVersion: '1.0.5',
      },
    ]);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AgentsPage />
      </QueryClientProvider>
    );

    expect(await screen.findByText(/v1.0.5/)).toBeInTheDocument();
    expect(await screen.findByText('已是最新版本')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run frontend test to verify failure**

Run: `npm run test:run`
Expected: Test fails or fails to trigger `checkAgentUpdates` because `enabled: false` is configured.

- [ ] **Step 3: Update `updateLabel` and `useQuery` in `AgentsPage.tsx`**

In `src/features/agents/AgentsPage.tsx`:

1. Update `updateLabel`:
```typescript
function updateLabel(update: AgentUpdate | undefined, ready: boolean, isFetching: boolean) {
  if (!ready) return '未安装';
  if (isFetching && !update) return '正在检查更新';
  if (!update) return '暂时无法确认更新';
  if (update.status === 'current') return '已是最新版本';
  if (update.status === 'available') return `可更新至 v${update.latestVersion}`;
  return '暂时无法确认更新';
}
```

2. Update `AgentTile` props and call site to pass `isFetchingUpdates`:
Pass `isFetching={updates.isFetching}` into `AgentTile` and `updateLabel(update, ready, isFetching)`.

3. Update `useQuery` for `agentUpdates`:
```typescript
const updates = useQuery({ queryKey: ['agentUpdates'], queryFn: checkAgentUpdates, staleTime: 5 * 60 * 1000 });
```
(Removing `enabled: false` so it runs automatically on page mount).

- [ ] **Step 4: Run frontend tests to verify pass**

Run: `npm run test:run`
Expected: PASS

- [ ] **Step 5: Commit Task 2**

```bash
git add src/features/agents/AgentsPage.tsx src/features/agents/AgentsPage.test.tsx
git commit -m "fix(frontend): enable automatic update checking and display actual agent versions"
```

---

### Task 3: Full Project Verification

**Files:**
- None (verification phase)

- [ ] **Step 1: Run Rust unit & integration tests**

Run: `cargo test --manifest-path src-tauri/Cargo.toml`
Expected: PASS with 0 warnings/failures.

- [ ] **Step 2: Run Rust linter**

Run: `cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings`
Expected: PASS with 0 warnings.

- [ ] **Step 3: Run TypeScript linter and type-checking / build**

Run: `npm run build`
Expected: Type-check succeeds and Vite bundle is built with 0 errors.

- [ ] **Step 4: Run Vitest test suite**

Run: `npm run test:run`
Expected: ALL test files PASS.

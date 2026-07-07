# Skill Packs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add recursive Skill Pack discovery, atomic package management, Git provenance/update checks, and package-aware Skills UI without creating a separate Plugins module.

**Architecture:** A pure Rust scanner derives standalone Skills, Skill Packs, members, warnings, executable-content findings, and Git metadata from the filesystem. `SkillService` merges scanner output with SQLite package metadata and owns import, update, trust, project synchronization, and removal rules. React consumes an extended catalog model and renders parent-only browsing with direct member search results.

**Tech Stack:** Rust, Tauri v2, SQLite/rusqlite, React 19, TypeScript, TanStack Query, Vitest, Testing Library.

---

### Task 1: Persist package provenance and project installation state

**Files:**
- Create: `src-tauri/migrations/003_skill_packages.sql`
- Modify: `src-tauri/src/infrastructure/database.rs`
- Modify: `src-tauri/src/domain/skill.rs`
- Modify: `src-tauri/src/domain/ports.rs`

- [ ] **Step 1: Write failing database tests**

Add assertions that an in-memory database contains `skill_packages` and `project_skill_states`, then add repository tests that save and load this package record:

```rust
SkillPackageRecord {
    skill_id: "superpowers".into(),
    source_kind: SourceKind::Git,
    source_url: Some("github.com/obra/superpowers".into()),
    tracked_ref: Some("refs/tags/v6.1.1".into()),
    installed_commit: Some("abc123".into()),
    trusted_commit: None,
    last_checked_at: None,
}
```

- [ ] **Step 2: Run the targeted Rust test and confirm RED**

Run: `cargo test --manifest-path src-tauri/Cargo.toml infrastructure::database::tests -- --nocapture`

Expected: FAIL because the new tables and repository methods do not exist.

- [ ] **Step 3: Add the additive migration and domain contracts**

Create the two idempotent tables:

```sql
CREATE TABLE IF NOT EXISTS skill_packages (
  skill_id TEXT PRIMARY KEY NOT NULL,
  source_kind TEXT NOT NULL,
  source_url TEXT,
  tracked_ref TEXT,
  installed_commit TEXT,
  trusted_commit TEXT,
  last_checked_at TEXT,
  FOREIGN KEY (skill_id) REFERENCES skills_user_meta(skill_id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_skill_packages_source_url
  ON skill_packages(source_url) WHERE source_url IS NOT NULL;

CREATE TABLE IF NOT EXISTS project_skill_states (
  project_id TEXT NOT NULL,
  skill_id TEXT NOT NULL,
  installed_commit TEXT,
  sync_state TEXT NOT NULL DEFAULT 'current',
  PRIMARY KEY (project_id, skill_id),
  FOREIGN KEY (project_id, skill_id) REFERENCES project_skills(project_id, skill_id) ON DELETE CASCADE
);
```

Include the migration during database initialization. Add `SkillPackageRecord`, `SourceKind`, and repository methods for package records, source lookup, project usage, and project installation state.

- [ ] **Step 4: Implement SQLite methods and confirm GREEN**

Implement parameterized `INSERT ... ON CONFLICT DO UPDATE`, `SELECT`, and project usage queries. Run the targeted test again and expect PASS.

### Task 2: Recursively discover standalone Skills and Skill Packs

**Files:**
- Create: `src-tauri/src/application/skill_scanner.rs`
- Modify: `src-tauri/src/application/mod.rs`
- Modify: `src-tauri/src/domain/skill.rs`
- Modify: `src-tauri/src/application/skill_service.rs`

- [ ] **Step 1: Write scanner tests for classification and safety**

Create temporary fixtures covering:

```text
standalone/SKILL.md                         -> standalone
obsidian/skills/a/SKILL.md + b/SKILL.md    -> pack with two members
nested/skills/only/SKILL.md                -> standalone with nested source path
root-and-child/SKILL.md + skills/a/SKILL.md -> pack with two members
.git/skills/ignored/SKILL.md                -> ignored
node_modules/ignored/SKILL.md               -> ignored
malformed/SKILL.md + skills/good/SKILL.md   -> pack warning plus valid member
```

Also assert that script extensions, executable permission bits, and `hooks/` set `has_executable_content`.

- [ ] **Step 2: Run scanner tests and confirm RED**

Run: `cargo test --manifest-path src-tauri/Cargo.toml skill_scanner -- --nocapture`

Expected: FAIL because `skill_scanner` is not defined.

- [ ] **Step 3: Implement the pure scanner**

Add serializable catalog types:

```rust
pub enum SkillKind { Standalone, Pack }
pub struct SkillMember {
    pub id: String,
    pub relative_path: String,
    pub metadata: SkillMetadata,
    pub html_content: String,
}
pub struct Skill {
    pub id: String,
    pub kind: SkillKind,
    pub metadata: SkillMetadata,
    pub html_content: String,
    pub members: Vec<SkillMember>,
    pub category_id: Option<String>,
    pub user_notes: Option<String>,
    pub source: SkillSourceInfo,
    pub update_status: UpdateStatus,
    pub has_executable_content: bool,
    pub warnings: Vec<String>,
}
```

Walk directories without following symbolic links, prune ignored directory names, sort paths for stable output, parse every discovered `SKILL.md`, and classify by valid descendant count plus root presence. Resolve parent metadata from recognized manifests, root Skill metadata, or directory name.

- [ ] **Step 4: Integrate the scanner into `SkillService` and confirm GREEN**

Replace the one-level `get_skills` loop with scanner output merged with `skills_user_meta` and package records. Recover missing Git provenance from `git remote get-url origin`, `git symbolic-ref`, and `git rev-parse HEAD`, then persist it. Run scanner and service tests and expect PASS.

### Task 3: Make imports, removal, trust, and Git updates package-aware

**Files:**
- Modify: `src-tauri/src/application/skill_service.rs`
- Modify: `src-tauri/src/commands/skills.rs`
- Modify: `src-tauri/src/lib.rs`

- [ ] **Step 1: Write failing service tests**

Cover these observable behaviors with temporary Git repositories and a fake repository port:

- local import accepts a nested pack with no root `SKILL.md`;
- `normalize_git_url` treats HTTPS, SSH, and optional `.git` spellings as one source;
- duplicate normalized sources return `AlreadyInstalled` without creating `-1` directories;
- dirty Git worktrees refuse update;
- a package used by a project refuses direct deletion;
- enabling executable content requires a matching trusted commit;
- atomic project copy preserves the package root and records installed commit.

- [ ] **Step 2: Run the targeted tests and confirm RED**

Run: `cargo test --manifest-path src-tauri/Cargo.toml application::skill_service::tests -- --nocapture`

Expected: FAIL on the missing package lifecycle APIs.

- [ ] **Step 3: Implement lifecycle APIs**

Add service methods and Tauri commands with typed results:

```rust
inspect_skill_import(source, import_type) -> ImportInspection
confirm_skill_import(source, import_type, tracked_ref) -> ImportResult
check_skill_updates() -> Vec<SkillUpdate>
update_skill(skill_id) -> SkillUpdateResult
trust_skill(skill_id) -> ()
remove_skill_from_all_projects_and_delete(skill_id) -> ()
```

Clone Git sources to a temporary sibling path, validate before rename, prefer the highest stable semantic tag when present, otherwise use the default branch, and store normalized provenance. Never overwrite dirty global or project copies. Update clean project copies after a confirmed global update and record the commit; mark dirty copies `modified`.

- [ ] **Step 4: Confirm lifecycle tests GREEN**

Run the targeted tests, then `cargo test --manifest-path src-tauri/Cargo.toml`. Both must exit 0.

### Task 4: Render Skill Packs and member search results

**Files:**
- Modify: `src/shared/api/types.ts`
- Modify: `src/shared/api/tauriClient.ts`
- Modify: `src/shared/api/tauriClient.test.ts`
- Create: `src/features/skills/skillCatalog.ts`
- Create: `src/features/skills/skillCatalog.test.ts`
- Modify: `src/features/skills/SkillsPage.tsx`
- Modify: `src/features/skills/components/SkillCard.tsx`
- Modify: `src/features/skills/components/SkillDetailModal.tsx`
- Modify: `src/features/skills/components/ImportSkillModal.tsx`
- Modify: `src/features/skills/components/skills.css`

- [ ] **Step 1: Write failing frontend behavior tests**

Test pure catalog projection first:

```typescript
expect(projectCatalog([pack], '')).toEqual([{ type: 'skill', skill: pack }]);
expect(projectCatalog([pack], 'defuddle')).toEqual([
  { type: 'member', skill: pack, member: pack.members[0] },
]);
```

Assert category filtering counts the parent once, and a member result inherits its parent category. Add client tests for update-check, update, trust, and forced removal command payloads.

- [ ] **Step 2: Run Vitest and confirm RED**

Run: `npm run test:run -- src/features/skills/skillCatalog.test.ts src/shared/api/tauriClient.test.ts`

Expected: FAIL because package types, projection, and client methods are missing.

- [ ] **Step 3: Implement types, projection, and API calls**

Mirror the Rust tagged values as TypeScript string unions. Keep category counts parent-only. Project an empty search to parent cards and a matching member search to member cards with parent provenance.

- [ ] **Step 4: Implement package-aware UI**

Add a Skill Pack badge, member count, Git/source status, update badge, member list, member detail navigation, manual check button, import inspection summary, trust confirmation, and explicit remove-from-projects action. The package detail editor owns category and notes; member details are read-only.

- [ ] **Step 5: Run focused and full frontend tests**

Run the focused Vitest command, then `npm run test:run`. Both must exit 0.

### Task 5: Verify the complete change

**Files:**
- Modify only files required by failures found during verification.

- [ ] **Step 1: Format and lint**

Run:

```bash
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
npm run lint
```

Expected: both exit 0 with no formatting or TypeScript errors.

- [ ] **Step 2: Run all tests**

Run:

```bash
npm run test:run
cargo test --manifest-path src-tauri/Cargo.toml
```

Expected: all tests pass with zero failures.

- [ ] **Step 3: Run production checks**

Run:

```bash
npm run build
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
```

Expected: both exit 0 and Clippy reports no warnings.

- [ ] **Step 4: Review requirements and working tree**

Compare the implementation against `docs/superpowers/specs/2026-07-06-skill-packs-design.md`, inspect `git diff --check`, and report any intentionally deferred item rather than describing it as complete.

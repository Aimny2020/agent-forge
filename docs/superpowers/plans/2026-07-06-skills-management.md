# Skills Management Revision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 移除全局的技能 `is_enabled` 状态，改为项目级别的启用/停用关联表 `project_skills`；更新全局 Skills 管理页面（卡片、详情 Modal 移除启用开关，扩大备注框）；并在项目的 Harness 页面中实现勾选开启/关闭该项目下全局技能的交互。

**Architecture:** 
- **数据层**：修改 SQLite 迁移 `002_skills.sql`，删除全局 `is_enabled`。建立 `project_skills` 关系表关联 `projects(id)` 和 `skills_user_meta(skill_id)`。在数据库初始化时，默认向 `projects` 表插入 `'agent-forge-core-id'` 作为 Mock 项目以保持外键关联通过。
- **服务与 Command 层**：更新 `SkillRepository` 持久化接口与 `SkillService` 逻辑。添加项目级命令：`get_project_skills` 和 `toggle_project_skill`。
- **前端层**：修改 `SkillCard`、`SkillDetailModal` 和 `SkillsPage` 移除启用逻辑。重构 `HarnessPage.tsx` 获取全局 Skills 列表，并通过 Checkbox 列表控制项目 `'agent-forge-core-id'` 对这些技能的启用状态。

**Tech Stack:** React 19, Tauri v2, SQLite, React Query, Vanilla CSS.

## Global Constraints
- Two-space indentation in TypeScript, four-space indentation in Rust.
- React components use `PascalCase`; hooks/utilities use `camelCase`; Rust modules use `snake_case`.
- Prefer semantic CSS classes and variables from `src/shared/styles/tokens.css`.
- Run both test suites (`npm run test:run` and `cargo test`) before completing tasks.

---

### Task 1: Update Database Schema & Migration

**Files:**
- Modify: `src-tauri/migrations/002_skills.sql`
- Test: `src-tauri/src/infrastructure/database.rs`

**Interfaces:**
- Consumes: None
- Produces: Updated SQL tables (`skills_user_meta` without `is_enabled`, `project_skills` relational table) and pre-seeded mock project.

- [ ] **Step 1: Update the migration SQL**
  Modify `src-tauri/migrations/002_skills.sql`:
  ```sql
  -- 分类表
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL
  );

  -- 技能配置属性表（移除了 is_enabled 字段）
  CREATE TABLE IF NOT EXISTS skills_user_meta (
    skill_id TEXT PRIMARY KEY NOT NULL,
    category_id TEXT,
    user_notes TEXT,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
  );

  -- 项目技能关联启用表
  CREATE TABLE IF NOT EXISTS project_skills (
    project_id TEXT NOT NULL,
    skill_id TEXT NOT NULL,
    enabled_at TEXT NOT NULL,
    PRIMARY KEY (project_id, skill_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills_user_meta(skill_id) ON DELETE CASCADE
  );

  -- 预插一条 mock 项目以供外键关联通过
  INSERT OR IGNORE INTO projects (id, name, path, created_at)
  VALUES ('agent-forge-core-id', 'Agent-Forge-Core', '/users/dev/core', CURRENT_TIMESTAMP);
  ```

- [ ] **Step 2: Add database schema test assertions**
  Modify `src-tauri/src/infrastructure/database.rs` test case:
  ```rust
  #[test]
  fn in_memory_database_applies_schema_and_reports_ready() {
      let database = SqliteDatabase::open_in_memory().expect("database should initialize");

      assert_eq!(database.status().unwrap(), DatabaseStatus::Ready);
      assert!(database.has_table("_migrations").unwrap());
      assert!(database.has_table("projects").unwrap());
      assert!(database.has_table("task_runs").unwrap());
      assert!(database.has_table("categories").unwrap());
      assert!(database.has_table("skills_user_meta").unwrap());
      assert!(database.has_table("project_skills").unwrap());
  }
  ```

- [ ] **Step 3: Run cargo tests to verify migrations compile and run**
  Run: `cargo test --manifest-path src-tauri/Cargo.toml`
  Expected: PASS

- [ ] **Step 4: Commit**
  ```bash
  git add src-tauri/migrations/002_skills.sql src-tauri/src/infrastructure/database.rs
  git commit -m "feat: update SQLite migrations to remove global skill enablement and add project_skills table"
  ```

---

### Task 2: Refactor Rust Domain Types & Ports

**Files:**
- Modify: `src-tauri/src/domain/skill.rs`
- Modify: `src-tauri/src/domain/ports.rs`

**Interfaces:**
- Consumes: Database schema from Task 1.
- Produces: Updated `Skill` and `UserSkillMeta` struct types, updated `SkillRepository` trait.

- [ ] **Step 1: Update Domain struct types**
  Modify `src-tauri/src/domain/skill.rs`:
  ```rust
  use serde::{Deserialize, Serialize};

  #[derive(Debug, Clone, Serialize, Deserialize)]
  pub struct SkillMetadata {
      pub name: String,
      pub description: String,
      pub author: Option<String>,
      pub version: Option<String>,
  }

  #[derive(Debug, Clone, Serialize, Deserialize)]
  pub struct Skill {
      pub id: String,
      pub metadata: SkillMetadata,
      pub html_content: String,
      pub category_id: Option<String>,
      pub user_notes: Option<String>,
  }

  #[derive(Debug, Clone, Serialize, Deserialize)]
  pub struct Category {
      pub id: String,
      pub name: String,
      pub created_at: String,
  }

  #[derive(Debug, Clone, Serialize, Deserialize)]
  pub struct UserSkillMeta {
      pub category_id: Option<String>,
      pub user_notes: Option<String>,
  }
  ```

- [ ] **Step 2: Update SkillRepository port signature**
  Modify `src-tauri/src/domain/ports.rs` lines 18-29:
  ```rust
  pub trait SkillRepository: Send + Sync {
      fn get_user_meta(&self, skill_id: &str) -> DomainResult<Option<crate::domain::skill::UserSkillMeta>>;
      fn save_user_meta(&self, skill_id: &str, category_id: Option<&str>, user_notes: Option<&str>) -> DomainResult<()>;
      fn delete_user_meta(&self, skill_id: &str) -> DomainResult<()>;
      
      fn get_project_skills(&self, project_id: &str) -> DomainResult<Vec<String>>;
      fn save_project_skill(&self, project_id: &str, skill_id: &str, enabled: bool) -> DomainResult<()>;

      fn get_categories(&self) -> DomainResult<Vec<crate::domain::skill::Category>>;
      fn create_category(&self, id: &str, name: &str, created_at: &str) -> DomainResult<crate::domain::skill::Category>;
      fn rename_category(&self, id: &str, name: &str) -> DomainResult<()>;
      fn delete_category(&self, id: &str) -> DomainResult<()>;
  }
  ```

- [ ] **Step 3: Run cargo check to verify types compile**
  Run: `cargo check --manifest-path src-tauri/Cargo.toml`
  Expected: FAIL with errors in `database.rs` and `skill_service.rs` (which we will fix in the next task)

- [ ] **Step 4: Commit**
  ```bash
  git add src-tauri/src/domain/skill.rs src-tauri/src/domain/ports.rs
  git commit -m "refactor: update domain structures and repository ports signatures for project-level skills"
  ```

---

### Task 3: Infrastructure Persistence & Services Update

**Files:**
- Modify: `src-tauri/src/infrastructure/database.rs`
- Modify: `src-tauri/src/application/skill_service.rs`

**Interfaces:**
- Consumes: Domain signatures from Task 2.
- Produces: Updated repository methods in SqliteDatabase and SkillService directory scanner.

- [ ] **Step 1: Update repository methods in `database.rs`**
  Modify `database.rs` to implement the updated signatures:
  ```rust
      fn get_user_meta(&self, skill_id: &str) -> DomainResult<Option<UserSkillMeta>> {
          let connection = self
              .connection
              .lock()
              .map_err(|error| DomainError::Database(error.to_string()))?;
          let mut stmt = connection
              .prepare("SELECT category_id, user_notes FROM skills_user_meta WHERE skill_id = ?1")
              .map_err(database_error)?;
          
          let row = stmt
              .query_row([skill_id], |r| {
                  let category_id: Option<String> = r.get(0)?;
                  let user_notes: Option<String> = r.get(1)?;
                  Ok(UserSkillMeta {
                      category_id,
                      user_notes,
                  })
              })
              .optional()
              .map_err(database_error)?;
          
          Ok(row)
      }

      fn save_user_meta(&self, skill_id: &str, category_id: Option<&str>, user_notes: Option<&str>) -> DomainResult<()> {
          let connection = self
              .connection
              .lock()
              .map_err(|error| DomainError::Database(error.to_string()))?;
          let now = chrono::Utc::now().to_rfc3339();
          connection
              .execute(
                  "INSERT INTO skills_user_meta (skill_id, category_id, user_notes, updated_at)
                   VALUES (?1, ?2, ?3, ?4)
                   ON CONFLICT(skill_id) DO UPDATE SET
                     category_id = excluded.category_id,
                     user_notes = excluded.user_notes,
                     updated_at = excluded.updated_at",
                  rusqlite::params![skill_id, category_id, user_notes, now],
              )
              .map_err(database_error)?;
          Ok(())
      }
  ```
  Add `get_project_skills` and `save_project_skill` to `SkillRepository` implementation inside `database.rs`:
  ```rust
      fn get_project_skills(&self, project_id: &str) -> DomainResult<Vec<String>> {
          let connection = self
              .connection
              .lock()
              .map_err(|error| DomainError::Database(error.to_string()))?;
          let mut stmt = connection
              .prepare("SELECT skill_id FROM project_skills WHERE project_id = ?1")
              .map_err(database_error)?;
          
          let iter = stmt
              .query_map([project_id], |r| r.get::<_, String>(0))
              .map_err(database_error)?;
          
          let mut list = Vec::new();
          for item in iter {
              list.push(item.map_err(database_error)?);
          }
          Ok(list)
      }

      fn save_project_skill(&self, project_id: &str, skill_id: &str, enabled: bool) -> DomainResult<()> {
          let connection = self
              .connection
              .lock()
              .map_err(|error| DomainError::Database(error.to_string()))?;
          
          if enabled {
              let now = chrono::Utc::now().to_rfc3339();
              // First verify the skill exists in skills_user_meta to prevent FK violation
              connection.execute(
                  "INSERT OR IGNORE INTO skills_user_meta (skill_id, updated_at) VALUES (?1, ?2)",
                  [skill_id, &now],
              ).map_err(database_error)?;

              connection.execute(
                  "INSERT OR IGNORE INTO project_skills (project_id, skill_id, enabled_at) VALUES (?1, ?2, ?3)",
                  [project_id, skill_id, &now],
              ).map_err(database_error)?;
          } else {
              connection.execute(
                  "DELETE FROM project_skills WHERE project_id = ?1 AND skill_id = ?2",
                  [project_id, skill_id],
              ).map_err(database_error)?;
          }
          Ok(())
      }
  ```

- [ ] **Step 2: Update SkillService scanner**
  Modify `src-tauri/src/application/skill_service.rs` line 25:
  ```rust
      pub fn get_skills(&self) -> DomainResult<Vec<Skill>> {
          let mut list = Vec::new();
          if !self.skills_dir.exists() {
              return Ok(list);
          }
          for entry in fs::read_dir(&self.skills_dir).map_err(|e| DomainError::Database(e.to_string()))? {
              let entry = entry.map_err(|e| DomainError::Database(e.to_string()))?;
              let path = entry.path();
              if path.is_dir() {
                  let skill_id = path.file_name().and_then(|s| s.to_str()).unwrap_or("").to_string();
                  let skill_md_path = path.join("SKILL.md");
                  if skill_md_path.exists() {
                      let content = fs::read_to_string(&skill_md_path).map_err(|e| DomainError::Database(e.to_string()))?;
                      if let Ok((metadata, html)) = parse_skill_markdown(&content) {
                          let (cat_id, notes) = match self.repo.get_user_meta(&skill_id)? {
                              Some(meta) => (meta.category_id, meta.user_notes),
                              None => (None, None),
                          };
                          list.push(Skill {
                              id: skill_id,
                              metadata,
                              html_content: html,
                              category_id: cat_id,
                              user_notes: notes,
                          });
                      }
                  }
              }
          }
          Ok(list)
      }
  ```

- [ ] **Step 3: Run cargo tests to verify compilation and database queries**
  Run: `cargo test --manifest-path src-tauri/Cargo.toml`
  Expected: PASS

- [ ] **Step 4: Commit**
  ```bash
  git add src-tauri/src/infrastructure/database.rs src-tauri/src/application/skill_service.rs
  git commit -m "feat: implement database updates and service scan revisions for project-level skill enablement"
  ```

---

### Task 4: Tauri IPC Commands Update

**Files:**
- Modify: `src-tauri/src/commands/skills.rs`
- Modify: `src-tauri/src/lib.rs`

**Interfaces:**
- Consumes: Services from Task 3.
- Produces: Tauri Command implementations for category metadata updating and project skill enabling.

- [ ] **Step 1: Refactor `update_skill_meta` and implement project commands**
  Modify `src-tauri/src/commands/skills.rs`:
  Change `update_skill_meta`:
  ```rust
  #[tauri::command]
  pub async fn update_skill_meta(
      state: State<'_, AppState>,
      skill_id: String,
      category_id: Option<String>,
      user_notes: Option<String>,
  ) -> Result<(), CommandError> {
      state.repo.save_user_meta(
          &skill_id,
          category_id.as_deref(),
          user_notes.as_deref(),
      ).map_err(CommandError::from)
  }
  ```
  Add project command handlers:
  ```rust
  #[tauri::command]
  pub async fn get_project_skills(
      state: State<'_, AppState>,
      project_id: String,
  ) -> Result<Vec<String>, CommandError> {
      state.repo.get_project_skills(&project_id).map_err(CommandError::from)
  }

  #[tauri::command]
  pub async fn toggle_project_skill(
      state: State<'_, AppState>,
      project_id: String,
      skill_id: String,
      enabled: bool,
  ) -> Result<(), CommandError> {
      state.repo.save_project_skill(&project_id, &skill_id, enabled).map_err(CommandError::from)
  }
  ```

- [ ] **Step 2: Register project commands in `lib.rs`**
  Modify `src-tauri/src/lib.rs` line 27:
  ```rust
          .invoke_handler(tauri::generate_handler![
              health_check,
              get_skills,
              import_skill,
              delete_skill,
              update_skill_meta,
              get_project_skills,
              toggle_project_skill,
              get_categories,
              create_category,
              rename_category,
              delete_category
          ])
  ```

- [ ] **Step 3: Verify backend builds completely**
  Run: `cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings`
  Expected: PASS

- [ ] **Step 4: Commit**
  ```bash
  git add src-tauri/src/commands/skills.rs src-tauri/src/lib.rs
  git commit -m "feat: expose get_project_skills and toggle_project_skill Tauri commands"
  ```

---

### Task 5: Frontend API wrappers & typescript interface refactoring

**Files:**
- Modify: `src/shared/api/types.ts`
- Modify: `src/shared/api/tauriClient.ts`

**Interfaces:**
- Consumes: Tauri command handlers.
- Produces: Updated TypeScript clients.

- [ ] **Step 1: Remove `is_enabled` from `Skill` and update API calls**
  Modify `src/shared/api/types.ts`:
  ```typescript
  export interface Skill {
    id: string;
    metadata: SkillMetadata;
    html_content: string;
    category_id?: string;
    user_notes?: string;
  }
  ```
  Modify `src/shared/api/tauriClient.ts`:
  Change `updateSkillMeta`:
  ```typescript
  export async function updateSkillMeta(
    skillId: string,
    categoryId: string | null,
    userNotes: string | null,
  ): Promise<void> {
    try {
      await invoke<void>('update_skill_meta', { skillId, categoryId, userNotes });
    } catch (error) {
      throw normalizeError(error);
    }
  }
  ```
  Add project-scoped functions:
  ```typescript
  export async function getProjectSkills(projectId: string): Promise<string[]> {
    try {
      return await invoke<string[]>('get_project_skills', { projectId });
    } catch (error) {
      throw normalizeError(error);
    }
  }

  export async function toggleProjectSkill(
    projectId: string,
    skillId: string,
    enabled: boolean,
  ): Promise<void> {
    try {
      await invoke<void>('toggle_project_skill', { projectId, skillId, enabled });
    } catch (error) {
      throw normalizeError(error);
    }
  }
  ```

- [ ] **Step 2: Run linter to verify compiler errors**
  Run: `npm run lint`
  Expected: FAIL due to `is_enabled` usage in `SkillCard` and `SkillsPage`.

- [ ] **Step 3: Commit**
  ```bash
  git add src/shared/api/
  git commit -m "refactor: update frontend Typescript client interfaces for project-level skill operations"
  ```

---

### Task 6: Refactor Skills Grid & Card components

**Files:**
- Modify: `src/features/skills/components/SkillCard.tsx`
- Modify: `src/features/skills/components/SkillDetailModal.tsx`
- Modify: `src/features/skills/components/skills.css`

**Interfaces:**
- Consumes: Refactored `Skill` props.
- Produces: Updated card grid without global toggles.

- [ ] **Step 1: Refactor SkillCard (remove checkbox switch)**
  Modify `src/features/skills/components/SkillCard.tsx`:
  ```tsx
  import React from 'react';
  import { Trash2 } from 'lucide-react';
  import { Skill } from '../../../shared/api/types';

  interface Props {
    skill: Skill;
    categoryName: string;
    onOpenDetail: () => void;
    onDelete: (e: React.MouseEvent) => void;
  }

  export function SkillCard({ skill, categoryName, onOpenDetail, onDelete }: Props) {
    return (
      <div className="skill-card" onClick={onOpenDetail}>
        <div className="skill-card-header">
          <span className="category-tag">{categoryName}</span>
          <div className="skill-card-controls" onClick={(e) => e.stopPropagation()}>
            <button className="delete-btn" onClick={onDelete}>
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        <h4>{skill.metadata.name}</h4>
        <p className="skill-description">{skill.metadata.description}</p>
        <div className="skill-card-footer">
          {skill.metadata.version && <span className="version-badge">v{skill.metadata.version}</span>}
          {skill.metadata.author && <span className="author-badge">by {skill.metadata.author}</span>}
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 2: Refactor SkillDetailModal (remove state toggling and expand notes textarea)**
  Modify `src/features/skills/components/SkillDetailModal.tsx`:
  ```tsx
  import React, { useState } from 'react';
  import { X } from 'lucide-react';
  import { Skill, Category } from '../../../shared/api/types';

  interface Props {
    skill: Skill;
    categories: Category[];
    onClose: () => void;
    onUpdate: (categoryId: string | null, userNotes: string | null) => void;
  }

  export function SkillDetailModal({ skill, categories, onClose, onUpdate }: Props) {
    const [notes, setNotes] = useState(skill.user_notes || '');
    const [catId, setCatId] = useState(skill.category_id || '');

    const handleSave = () => {
      onUpdate(catId || null, notes || null);
      onClose();
    };

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-body" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>技能详情</h3>
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          <div className="modal-grid-content">
            <div className="modal-markdown-area">
              <h1>{skill.metadata.name}</h1>
              <div
                className="markdown-body"
                dangerouslySetInnerHTML={{ __html: skill.html_content }}
              />
            </div>
            <div className="modal-meta-editor">
              <div className="form-group">
                <label>设置分类</label>
                <select value={catId} onChange={(e) => setCatId(e.target.value)}>
                  <option value="">未分类</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group flex-fill">
                <label>技能使用说明与备注</label>
                <textarea
                  placeholder="在此添加该技能的个性化使用备注或说明..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ minHeight: '18rem' }}
                />
              </div>
              <div className="actions-footer">
                <button className="button button--secondary" onClick={onClose}>
                  取消
                </button>
                <button className="button button--primary" onClick={handleSave}>
                  保存更改
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 3: Refactor card css wrapper**
  Remove any `.toggle-switch` or switch specific styling if redundant, or leave it.
  Run: `npm run lint` (will still show errors in `SkillsPage.tsx`)

- [ ] **Step 4: Commit**
  ```bash
  git add src/features/skills/components/SkillCard.tsx src/features/skills/components/SkillDetailModal.tsx
  git commit -m "refactor: remove global switch toggling from SkillCard and SkillDetailModal"
  ```

---

### Task 7: Complete SkillsPage Assembly Update

**Files:**
- Modify: `src/features/skills/SkillsPage.tsx`

**Interfaces:**
- Consumes: Refactored Card components and metadata mutations.
- Produces: Complete skills dashboard.

- [ ] **Step 1: Update SkillsPage queries & handlers**
  Modify `src/features/skills/SkillsPage.tsx`:
  - Change `updateMetaMut`:
    ```typescript
    const updateMetaMut = useMutation({
      mutationFn: ({ id, cat, notes }: { id: string; cat: string | null; notes: string | null }) =>
        updateSkillMeta(id, cat, notes),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['skills'] }),
    });
    ```
  - Remove references to `s.is_enabled` or `updateMetaMut.mutate({ ..., enabled: !s.is_enabled })`.
  - Pass correct parameters to `SkillCard` and `SkillDetailModal`.
  
  Review of card rendering in `SkillsPage.tsx` around line 150:
  ```tsx
  <SkillCard
    key={s.id}
    skill={s}
    categoryName={getCategoryName(s.category_id)}
    onOpenDetail={() => setActiveDetailSkill(s)}
    onDelete={(e) => {
      e.stopPropagation();
      if (confirm(`确定要删除技能 "${s.metadata.name}" 吗？此操作物理删除本地文件且不可逆。`)) {
        deleteSkillMut.mutate(s.id);
      }
    }}
  />
  ```
  Review of modal rendering in `SkillsPage.tsx` around line 180:
  ```tsx
  {activeDetailSkill && (
    <SkillDetailModal
      skill={activeDetailSkill}
      categories={categories}
      onClose={() => setActiveDetailSkill(null)}
      onUpdate={(cat, notes) =>
        updateMetaMut.mutate({ id: activeDetailSkill.id, cat, notes })
      }
    />
  )}
  ```

- [ ] **Step 2: Run linter**
  Run: `npm run lint`
  Expected: PASS

- [ ] **Step 3: Commit**
  ```bash
  git add src/features/skills/SkillsPage.tsx
  git commit -m "feat: complete SkillsPage assembly updates"
  ```

---

### Task 8: Implement Project Harness Skill Enablement Page

**Files:**
- Modify: `src/features/projects/pages/HarnessPage.tsx`
- Create: `src/features/projects/pages/harness.css`

**Interfaces:**
- Consumes: `getSkills`, `getProjectSkills`, `toggleProjectSkill` API calls.
- Produces: Stateful skill list checkboxes for the active project.

- [ ] **Step 1: Replace placeholder page in `HarnessPage.tsx`**
  Modify `src/features/projects/pages/HarnessPage.tsx` to list all skills with checkboxes:
  ```tsx
  import React from 'react';
  import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
  import { getSkills, getProjectSkills, toggleProjectSkill } from '../../../shared/api/tauriClient';
  import { Card } from '../../../shared/ui/Card';
  import './harness.css';

  const MOCK_PROJECT_ID = 'agent-forge-core-id';

  export function HarnessPage() {
    const queryClient = useQueryClient();

    // Query global skills list
    const { data: skills = [], isLoading: skillsLoading } = useQuery({
      queryKey: ['skills'],
      queryFn: getSkills,
    });

    // Query enabled skills for this project
    const { data: enabledSkillIds = [], isLoading: enabledLoading } = useQuery({
      queryKey: ['projectSkills', MOCK_PROJECT_ID],
      queryFn: () => getProjectSkills(MOCK_PROJECT_ID),
    });

    // Toggle skill mutation
    const toggleSkillMut = useMutation({
      mutationFn: ({ skillId, enabled }: { skillId: string; enabled: boolean }) =>
        toggleProjectSkill(MOCK_PROJECT_ID, skillId, enabled),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['projectSkills', MOCK_PROJECT_ID] });
      },
    });

    if (skillsLoading || enabledLoading) {
      return (
        <div className="page-state">
          <div className="loading-dot" />
          <p>加载项目工程规则及技能项...</p>
        </div>
      );
    }

    const handleCheckboxChange = (skillId: string, isChecked: boolean) => {
      toggleSkillMut.mutate({ skillId, enabled: isChecked });
    };

    return (
      <div className="page-stack">
        <Card>
          <h2>项目工程规则 (Harness)</h2>
          <p className="muted-copy">在当前项目下选择并启用全局技能库（Skills），赋能此项目下的 Agent。</p>
        </Card>

        <Card>
          <h3>启用技能项</h3>
          {skills.length === 0 ? (
            <p className="muted-copy" style={{ marginTop: '1rem' }}>
              全局技能库为空，请先前往 "Skills 管理" 页面导入一些技能。
            </p>
          ) : (
            <div className="harness-skills-list">
              {skills.map((skill) => {
                const isEnabled = enabledSkillIds.includes(skill.id);
                return (
                  <div className="harness-skill-row" key={skill.id}>
                    <input
                      type="checkbox"
                      id={`skill-chk-${skill.id}`}
                      checked={isEnabled}
                      onChange={(e) => handleCheckboxChange(skill.id, e.target.checked)}
                    />
                    <label htmlFor={`skill-chk-${skill.id}`}>
                      <strong>{skill.metadata.name}</strong>
                      <span>{skill.metadata.description}</span>
                    </label>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    );
  }
  ```

- [ ] **Step 2: Create CSS file for Harness page**
  Create `src/features/projects/pages/harness.css`:
  ```css
  .harness-skills-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin-top: var(--space-2);
  }

  .harness-skill-row {
    display: flex;
    align-items: flex-start;
    gap: var(--space-1);
    padding: var(--space-2);
    border: 1px solid var(--color-outline);
    border-radius: var(--radius-sm);
    background: var(--color-surface-soft);
    transition: background 0.15s ease;
  }

  .harness-skill-row:hover {
    background: var(--color-surface-strong);
  }

  .harness-skill-row input[type='checkbox'] {
    margin-top: 4px;
    cursor: pointer;
    width: 18px;
    height: 18px;
  }

  .harness-skill-row label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    cursor: pointer;
    flex: 1;
  }

  .harness-skill-row label strong {
    font-size: 0.95rem;
    color: var(--color-ink);
  }

  .harness-skill-row label span {
    font-size: 0.8rem;
    color: var(--color-muted);
  }
  ```

- [ ] **Step 3: Run full verification build**
  Run: `npm run lint` and `npm run build`
  Expected: PASS

- [ ] **Step 4: Commit**
  ```bash
  git add src/features/projects/pages/
  git commit -m "feat: implement project skills checkboxes in HarnessPage and style layouts"
  ```

---

## 7. Verification Plan

### Automated Tests
- Run Rust tests: `cargo test --manifest-path src-tauri/Cargo.toml`
- Run Frontend vitest tests: `npm run test:run`

### Manual Verification
1. Open the dev server: `npm run tauri:dev`
2. Nav to "Skills 管理" page:
   - Verify there is no enabled toggle switch on the cards or inside the detail modal.
   - Click card to open modal. Note editing text box should now be larger. Add note, category, and save.
3. Nav to "项目管理" -> "Harness" page:
   - Check that it displays the list of imported skills.
   - Toggle checkbox for a skill (e.g. check "Systematic Debugging").
   - Refresh page (or switch tabs) and check that state persists.
   - Go to database directory (or check program status) to verify record is added/deleted in the SQLite `project_skills` table.

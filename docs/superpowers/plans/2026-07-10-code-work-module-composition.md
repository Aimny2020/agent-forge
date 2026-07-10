# Code Work Module Composition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace mutually exclusive Code Work presets with immutable multi-select Code Work modules that generate one combined `AGENTS.md` and deduplicated supporting files.

**Architecture:** Keep Document Work and Presentation Work on the existing single-preset registry. Add a separate backend-owned Code Work module registry. Code template creation validates a non-empty module list, creates shared files once, adds selected module files, and builds one `AGENTS.md` containing shared rules, task classification, selected roles, and Design -> Development -> Review recovery rules.

**Tech Stack:** Rust, Tauri v2, serde/toml, React 19, TypeScript, TanStack Query, Vitest, Rust unit tests.

## Global Constraints

- Code Work modules are `technical-design`, `feature-development`, and `code-review`.
- Code Work requires one or more immutable `selected_modules` and no `preset_id`.
- Document Work and Presentation Work require one immutable `preset_id` and no modules.
- Custom Work has neither modules nor a preset ID.
- Only `AGENTS.md` and `docs/harness.toml` are required; all `docs/` files are preselected but may be deselected.
- Shared core files are deduplicated and generated at most once.
- Generated Code Work instructions classify tasks automatically and apply roles in Design -> Development -> Review order.
- Existing imported Code Work templates without modules remain readable as legacy templates; new Code Work creation cannot create an empty module list.
- Do not implement project-level Harness application, runtime execution, Skills/MCP binding, or automatic template upgrades.

---

### Task 1: Define Code Work module domain types and registry

**Files:**
- Modify: `src-tauri/src/domain/harness.rs`
- Modify: `src-tauri/src/domain/harness_presets.rs`
- Test: `src-tauri/src/domain/harness_presets.rs`

**Interfaces:**
- Produces `CodeWorkModule { id, name, description, files, agent_instructions }`.
- Produces `built_in_code_work_modules() -> Vec<CodeWorkModule>` and `find_code_work_module(id: &str) -> Option<CodeWorkModule>`.
- Changes `built_in_harness_presets()` to return only Document Work and Presentation Work presets.

- [ ] **Step 1: Write failing registry tests**

Add tests asserting that exactly three Code Work modules exist and that each module has its required file contribution:

```rust
#[test]
fn code_work_modules_cover_design_development_and_review() {
    let modules = built_in_code_work_modules();

    assert_eq!(modules.len(), 3);
    assert!(find_code_work_module("technical-design")
        .unwrap()
        .files
        .iter()
        .any(|file| file.path == "docs/decision-record.md"));
    assert!(find_code_work_module("feature-development")
        .unwrap()
        .files
        .iter()
        .any(|file| file.path == "docs/feature_list.json"));
    assert!(find_code_work_module("code-review")
        .unwrap()
        .files
        .iter()
        .any(|file| file.path == "docs/review-findings.md"));
}
```

- [ ] **Step 2: Run the test to verify RED**

Run: `cargo test --manifest-path src-tauri/Cargo.toml domain::harness_presets::tests::code_work_modules_cover_design_development_and_review`

Expected: compilation failure because `CodeWorkModule` and registry functions do not exist.

- [ ] **Step 3: Add CodeWorkModule and its registry**

Add this serializable type to `src-tauri/src/domain/harness.rs`:

```rust
#[derive(serde::Serialize, serde::Deserialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CodeWorkModule {
    pub id: String,
    pub name: String,
    pub description: String,
    pub files: Vec<HarnessPresetFile>,
    pub agent_instructions: String,
}
```

In `harness_presets.rs`, extract the existing code-only files into `shared_code_files()`. Define the three module records with only dedicated files and concise role instructions. Keep `shared_code_files()` private; it will be exposed to creation through a public `code_work_shared_files() -> Vec<HarnessPresetFile>` function.

Remove the three Code Work entries from `built_in_harness_presets()`. Keep the two Document Work presets and one Presentation Work preset unchanged.

- [ ] **Step 4: Run the registry tests to verify GREEN**

Run: `cargo test --manifest-path src-tauri/Cargo.toml domain::harness_presets::tests`

Expected: PASS, including the existing Document and Presentation registry tests after they are updated to expect three presets rather than six.

### Task 2: Extend manifest, summaries, and creation input for immutable module provenance

**Files:**
- Modify: `src-tauri/src/domain/harness.rs`
- Modify: `src-tauri/src/application/harness_service.rs`
- Modify: `src/shared/api/types.ts`
- Test: `src-tauri/src/application/harness_service.rs`

**Interfaces:**
- `HarnessManifest.selected_modules: Vec<String>` uses `#[serde(default)]`.
- `HarnessTemplateSummary` and `HarnessTemplateDetail` expose `selected_modules: Vec<String>` / `selectedModules: string[]`.
- `CreateHarnessTemplateInput` adds `selected_modules: Vec<String>` / `selectedModules: string[]`.
- Database schema remains unchanged: the manifest is the source of truth and the list service already parses it before returning summaries.

- [ ] **Step 1: Write failing service tests for manifest module provenance**

Change the Code Work creation fixture to pass two modules and assert both detail and manifest values:

```rust
selected_modules: vec![
    "technical-design".into(),
    "feature-development".into(),
],
preset_id: None,
```

After creation, parse `docs/harness.toml` and assert:

```rust
assert_eq!(detail.selected_modules, vec![
    "technical-design".to_string(),
    "feature-development".to_string(),
]);
assert_eq!(manifest.selected_modules, detail.selected_modules);
assert!(manifest.created_from_preset.is_none());
```

- [ ] **Step 2: Run the service test to verify RED**

Run: `cargo test --manifest-path src-tauri/Cargo.toml application::harness_service::tests::test_create_and_get_harness_template`

Expected: compilation failure because `selected_modules` is absent from the input, manifest, and detail types.

- [ ] **Step 3: Add the fields and preserve non-Code behavior**

Add `selected_modules: Vec<String>` with `#[serde(default)]` to `HarnessManifest`, `HarnessTemplateSummary`, and `HarnessTemplateDetail`. Add it to `CreateHarnessTemplateInput` with `#[serde(default)]` so old manifest/input data can deserialize safely.

When listing templates, set summary modules from parsed manifest or `Vec::new()` when the manifest is missing. When returning detail, set modules from parsed manifest or `Vec::new()`.

Do not add a SQLite column. Existing database index rows remain valid because `get_harness_templates()` reconciles metadata from the manifest package. Ensure every existing Rust initializer supplies `selected_modules: Vec::new()` unless it is a new composed Code template.

- [ ] **Step 4: Run the service test to verify GREEN**

Run: `cargo test --manifest-path src-tauri/Cargo.toml application::harness_service::tests::test_create_and_get_harness_template`

Expected: PASS.

### Task 3: Generate composed Code Work templates and combined AGENTS.md

**Files:**
- Modify: `src-tauri/src/application/harness_service.rs`
- Test: `src-tauri/src/application/harness_service.rs`

**Interfaces:**
- `HarnessService::get_code_work_modules() -> Vec<CodeWorkModule>`.
- `HarnessService::get_code_work_shared_files() -> Vec<HarnessPresetFile>`.
- `resolve_creation_files(input)` returns deduplicated selected files and selected Code modules.
- `generate_code_agents_content(selected_modules, selected_files)` returns combined instructions.

- [ ] **Step 1: Write failing behavior tests for composition**

Add these tests:

```rust
fn all_selected_code_paths() -> Vec<String> {
    vec![
        "docs/architecture.md".into(),
        "docs/task-status.md".into(),
        "docs/session-handoff.md".into(),
        "docs/verification.md".into(),
        "docs/risk-rules.md".into(),
        "docs/decision-record.md".into(),
        "docs/feature_list.json".into(),
        "docs/review-rubric.md".into(),
        "docs/review-findings.md".into(),
    ]
}

#[test]
fn creates_a_composed_code_harness_with_deduplicated_shared_files() {
    let detail = service.create_harness_template(CreateHarnessTemplateInput {
        name: "Full delivery".into(),
        description: "".into(),
        work_type: "code".into(),
        selected_modules: vec![
            "technical-design".into(),
            "feature-development".into(),
            "code-review".into(),
        ],
        preset_id: None,
        optional_files: all_selected_code_paths(),
    }).unwrap();

    assert_eq!(detail.files.iter().filter(|file| file.path == "docs/task-status.md").count(), 1);
    assert!(detail.files.iter().any(|file| file.path == "docs/decision-record.md"));
    assert!(detail.files.iter().any(|file| file.path == "docs/feature_list.json"));
    assert!(detail.files.iter().any(|file| file.path == "docs/review-findings.md"));
}

#[test]
fn combined_agents_file_routes_tasks_and_orders_selected_roles() {
    let content = service.read_harness_file(&template_id, "AGENTS.md").unwrap().content;

    assert!(content.contains("## Task Classification"));
    assert!(content.contains("## Technical Design Role"));
    assert!(content.contains("## Feature Development Role"));
    assert!(content.contains("## Code Review Role"));
    assert!(content.contains("Technical Design -> Feature Development -> Code Review"));
}
```

Also add rejection tests for an empty Code module list, duplicate module IDs, an unknown module ID, a Code input containing `preset_id`, and a Document input containing modules.

- [ ] **Step 2: Run the new tests to verify RED**

Run: `cargo test --manifest-path src-tauri/Cargo.toml application::harness_service::tests`

Expected: FAIL because current creation accepts one Code preset and does not compose modules.

- [ ] **Step 3: Replace single Code preset resolution with module resolution**

Replace `resolve_creation_preset` with a branch on `input.work_type`:

```rust
match input.work_type.as_str() {
    "code" => resolve_code_modules(&input.selected_modules, input.preset_id.as_deref()),
    "document" | "presentation" => resolve_single_preset(&input.work_type, input.preset_id.as_deref(), &input.selected_modules),
    "custom" => resolve_custom_files(input.preset_id.as_deref(), &input.selected_modules),
    _ => Err(DomainError::Database("Unsupported Harness work type".into())),
}
```

`resolve_code_modules` must:

1. Reject an empty list or a non-empty `preset_id`.
2. Reject duplicate or unknown module IDs.
3. Start with `code_work_shared_files()`.
4. Append each selected module's dedicated files in the order supplied.
5. Deduplicate by file path with `HashSet<String>`, keeping the first shared or module contribution.
6. Filter the resulting offered files by `optional_files`; reject a requested path that is not offered.

Set `created_from_preset: None` and `selected_modules` in the manifest and returned summary. Keep existing Document, Presentation, and Custom creation behavior, but reject invalid cross-type `selected_modules` or `preset_id` combinations.

- [ ] **Step 4: Generate the composed AGENTS.md**

Add a Code-specific generator that writes this stable section order:

```text
# Agent Workspace Instructions
## Shared Core Rules
## Task Classification
## Technical Design Role          (only when selected)
## Feature Development Role       (only when selected)
## Code Review Role               (only when selected)
## Multi-Module Order
## Selected Harness Files
## Definition of Done
## End Of Session
```

Use each module's `agent_instructions` in its role section. Only link files that remain selected after the optional-file screen. Always include task classification language for selected modules and, when more than one selected module is present, the exact sequence `Technical Design -> Feature Development -> Code Review`. Include review recovery wording: failed review returns work to Feature Development before re-review.

- [ ] **Step 5: Run the service tests to verify GREEN**

Run: `cargo test --manifest-path src-tauri/Cargo.toml application::harness_service::tests`

Expected: PASS.

### Task 4: Add Code Work module IPC and frontend shared types

**Files:**
- Modify: `src-tauri/src/commands/harnesses.rs`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src/shared/api/types.ts`
- Modify: `src/shared/api/tauriClient.ts`
- Modify: `src/shared/api/tauriClient.test.ts`

**Interfaces:**
- Adds `get_code_work_modules() -> Vec<CodeWorkModule>` Tauri command.
- Adds `get_code_work_shared_files() -> Vec<HarnessPresetFile>` Tauri command.
- Adds TypeScript `CodeWorkModule` and `HarnessPresetFile` reuse.
- `getHarnessPresets()` returns only Document and Presentation presets.
- Adds `getCodeWorkModules()` client call.
- Adds `getCodeWorkSharedFiles()` client call. This keeps the standard file library available to Custom Work after Code presets leave `getHarnessPresets()`.

- [ ] **Step 1: Write failing Tauri client test**

Add:

```ts
it('loads the backend-owned Code Work module registry', async () => {
  invokeMock.mockResolvedValue([]);

  await expect(getCodeWorkModules()).resolves.toEqual([]);
  expect(invokeMock).toHaveBeenCalledWith('get_code_work_modules');
});

it('loads the backend-owned Code Work shared file library', async () => {
  invokeMock.mockResolvedValue([]);

  await expect(getCodeWorkSharedFiles()).resolves.toEqual([]);
  expect(invokeMock).toHaveBeenCalledWith('get_code_work_shared_files');
});
```

- [ ] **Step 2: Run the client test to verify RED**

Run: `npm run test:run -- src/shared/api/tauriClient.test.ts`

Expected: FAIL because `getCodeWorkModules` is missing.

- [ ] **Step 3: Implement command and type contracts**

Add both Rust commands, register them in `tauri::generate_handler!`, and add matching TypeScript interfaces:

```ts
export interface CodeWorkModule {
  id: string;
  name: string;
  description: string;
  files: HarnessPresetFile[];
  agentInstructions: string;
}
```

Add `selectedModules: string[]` to `HarnessManifest`, `HarnessTemplateSummary`, `HarnessTemplateDetail`, and `CreateHarnessTemplateInput`. Ensure `selectedModules` defaults to `[]` at client call sites for Document, Presentation, Custom, import, and extraction flows.

- [ ] **Step 4: Run the client test to verify GREEN**

Run: `npm run test:run -- src/shared/api/tauriClient.test.ts`

Expected: PASS.

### Task 5: Convert the Code Work creation wizard from single preset to module multi-select

**Files:**
- Modify: `src/features/harness/components/CreateHarnessModal.tsx`
- Modify: `src/features/harness/components/CreateHarnessModal.test.tsx`
- Modify: `src/features/harness/GlobalHarnessPage.tsx`
- Modify: `src/features/harness/harness.css`

**Interfaces:**
- `CreateHarnessModal` accepts `codeModules: CodeWorkModule[]` and `isCodeModulesLoading`.
- `CreateHarnessModal` accepts `codeSharedFiles: HarnessPresetFile[]` and `isCodeSharedFilesLoading`.
- Code Work submit payload has `selectedModules` and `presetId: undefined`.
- Document and Presentation continue to use one `presetId` and `selectedModules: []`.

- [ ] **Step 1: Write failing modal tests for multi-select**

Use a module fixture with all three module IDs. Add a test that selects Technical Design and Code Review, advances through the wizard, and asserts:

```tsx
expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({
  workType: 'code',
  presetId: undefined,
  selectedModules: ['technical-design', 'code-review'],
  optionalFiles: expect.arrayContaining([
    'docs/architecture.md',
    'docs/decision-record.md',
    'docs/review-rubric.md',
  ]),
}));
```

Add a second test that clicking the same module twice toggles it off and that attempting to advance with no selected Code module shows the validation error.

- [ ] **Step 2: Run modal tests to verify RED**

Run: `npm run test:run -- src/features/harness/components/CreateHarnessModal.test.tsx`

Expected: FAIL because Code Work currently renders mutually exclusive preset cards.

- [ ] **Step 3: Implement module selection and file composition in the wizard**

For `workType === 'code'`:

1. Replace the preset step with a multi-select card grid using `codeModules`.
2. Toggle module IDs in `selectedModules`; do not store a Code `presetId`.
3. Compute file options from `codeSharedFiles` plus selected module files. Deduplicate by path.
4. Preselect every offered `docs/` path.
5. Preserve a user deselection while toggling other modules unless that path was contributed only by a removed module; then remove it from selection.
6. Label file rows as `Shared` or with contributing module display names.
7. Preview one `AGENTS.md`, one `docs/harness.toml`, then the deduplicated selected files.

For Document and Presentation, retain the current single-preset card step. For Custom, retain the full standard-file library and no module/preset selection: compose it from all Document and Presentation preset files, `codeSharedFiles`, and all Code module files, deduplicated by path.

Fetch modules in `GlobalHarnessPage` with:

```ts
useQuery({ queryKey: ['code-work-modules'], queryFn: getCodeWorkModules })
```

Pass its result and loading state into the modal. Disable final creation while the relevant registry is loading.
Fetch the shared file library with a second query using `getCodeWorkSharedFiles`; pass it to the modal and include it in the relevant loading condition.

- [ ] **Step 4: Display immutable module provenance in the editor**

Replace the single Code `createdFromPreset` value in the right metadata panel with a read-only module list when `detail.workType === 'code'`. Preserve the existing preset provenance display for Document and Presentation. Do not add edit controls for either provenance form.

- [ ] **Step 5: Run modal and route tests to verify GREEN**

Run: `npm run test:run -- src/features/harness/components/CreateHarnessModal.test.tsx src/features/routes.test.tsx`

Expected: PASS.

### Task 6: Preserve legacy imports and update health checks

**Files:**
- Modify: `src-tauri/src/application/harness_service.rs`
- Modify: `src/features/harness/components/ImportHarnessModal.tsx`
- Test: `src-tauri/src/application/harness_service.rs`

**Interfaces:**
- Imported and extracted Code Work templates may retain `selected_modules: []` as legacy packages.
- New Code Work creation always requires modules.
- Validation reports missing selected module files and missing module references from AGENTS as warnings.

- [ ] **Step 1: Write failing legacy-import and health tests**

Add a test that imports a Code Work directory without modules and asserts it remains readable with an empty module list. Add a separate validation test for a composed Code template where `docs/review-findings.md` is removed and assert the report warning names `code-review` and the missing path.

- [ ] **Step 2: Run service tests to verify RED**

Run: `cargo test --manifest-path src-tauri/Cargo.toml application::harness_service::tests`

Expected: FAIL because validation does not yet understand `selected_modules`.

- [ ] **Step 3: Implement legacy and health behavior**

Do not require `selected_modules` in `import_harness_from_folder` or `extract_harness_from_project`; set the manifest list from an imported manifest when present, otherwise `Vec::new()`. Do not present module selectors in the import modal in this iteration.

Extend `validate_harness_template_internal` to load each selected module from the registry. For each selected module, append a warning if any dedicated file is missing or if the AGENTS content does not contain the module role heading or dedicated path. For a Code manifest with `selected_modules.is_empty()`, append a legacy warning instead of an error.

- [ ] **Step 4: Run service tests to verify GREEN**

Run: `cargo test --manifest-path src-tauri/Cargo.toml application::harness_service::tests`

Expected: PASS.

### Task 7: Final verification and handoff

**Files:**
- Modify: `docs/superpowers/specs/2026-07-09-harness-template-management-design.md` only if implementation reveals a necessary correction outside the superseding module specification.

**Interfaces:**
- No new interfaces; validates all prior tasks against `docs/superpowers/specs/2026-07-10-code-work-module-composition-design.md`.

- [ ] **Step 1: Format Rust**

Run: `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check`

Expected: PASS. If formatting is required, run `cargo fmt --manifest-path src-tauri/Cargo.toml` and rerun the check.

- [ ] **Step 2: Run full Rust verification**

Run: `cargo test --manifest-path src-tauri/Cargo.toml && cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings`

Expected: both commands exit 0.

- [ ] **Step 3: Run frontend verification**

Run: `npm run test:run && npm run build && npm run lint`

Expected: all commands exit 0.

- [ ] **Step 4: Perform acceptance checks**

Verify manually:

1. Code Work accepts one, two, or all three module selections.
2. It rejects zero, duplicate, unknown, and cross-type module selections.
3. Multiple selected modules produce one `AGENTS.md`, one `harness.toml`, and no duplicated shared files.
4. The combined AGENTS file includes only selected role headings and selected file references.
5. The AGENTS file contains task classification, Design -> Development -> Review ordering, and review-return behavior.
6. Document and Presentation retain single-preset creation.
7. Custom retains free file configuration.
8. Existing imported Code templates without modules remain readable and show a legacy warning rather than failing validation.

- [ ] **Step 5: Inspect handoff diff**

Run: `git diff --check && git status --short`

Expected: no whitespace errors; changed files are limited to Harness domain, service, IPC, frontend, tests, migration-free provenance changes, and specifications.

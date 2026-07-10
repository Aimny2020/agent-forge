# Code Work Module Composition Design

## Status and Scope

This specification supersedes the **Code Work** portions of [Harness Template Management Design](2026-07-09-harness-template-management-design.md): its Code Work preset table, Code Work creation flow, Code Work manifest provenance, and generated `AGENTS.md` behavior.

The scope is the global Harness template library. It does not implement project-level Harness application, runtime agent execution, Skills/MCP binding, automatic project stage management, or automatic template updates.

## Goal

Code Work is not a single mutually exclusive workflow. A long-running software project often needs technical design, feature development, and code review in the same Harness template.

The Code Work creation experience must therefore allow users to select one or more system-owned modules. The selected modules contribute their dedicated files and their `AGENTS.md` role rules into one combined Harness template.

## Work-Type Model

The global Harness wizard has four top-level work types:

- **Code Work**: a composable set of one or more Code Work modules.
- **Document Work**: one mutually exclusive document-delivery preset.
- **Presentation Work**: one mutually exclusive presentation-delivery preset.
- **Custom Work**: no system preset; the user chooses from the standard file library.

Only Code Work supports module multi-selection in this release. Document Work and Presentation Work retain their existing single-preset flow. Complex non-code combinations belong in Custom Work until there is evidence for a separate compositional model.

## Code Work Modules

The backend owns these read-only Code Work modules:

| Module ID | Display name | Dedicated files | `AGENTS.md` role |
|---|---|---|---|
| `technical-design` | Technical Design | `docs/architecture.md`, `docs/decision-record.md` | Establish boundaries, alternatives, decisions, and acceptance conditions before implementation. |
| `feature-development` | Feature Development | `docs/feature_list.json` | Implement one verified feature at a time; test and record evidence. |
| `code-review` | Code Review | `docs/review-rubric.md`, `docs/review-findings.md` | Assess changes against evidence; record findings and return failed work to development. |

The wizard displays these as checkboxes or selectable cards with multi-select behavior:

```text
Code Work
  [x] Technical Design
  [x] Feature Development
  [x] Code Review
```

At least one module is required for Code Work creation.

## Shared Core Files

Selected modules do not duplicate common long-running Harness artifacts. A composed Code Work template recommends one shared core:

```text
AGENTS.md
docs/
  harness.toml
  task-status.md
  session-handoff.md
  verification.md
  risk-rules.md
```

Selected modules add their dedicated files alongside the shared core in `docs/`:

```text
AGENTS.md
docs/
  harness.toml
  task-status.md
  session-handoff.md
  verification.md
  risk-rules.md
  architecture.md
  decision-record.md
  feature_list.json
  review-rubric.md
  review-findings.md
```

`AGENTS.md` and `docs/harness.toml` are the only required files. The shared-core and module files are selected by default in the wizard and can be deselected before creation. When selected, each shared file is created once. The system never tries to merge duplicate Markdown content from multiple modules. The user may freely edit, add, or delete content files after creation; health checks remain advisory.

## Combined AGENTS.md

The generated `AGENTS.md` is one composed instruction document, not three independent agent files. It has four sections:

1. **Shared Core Rules**: startup, scope discipline, state updates, verification evidence, risk rules, and session handoff.
2. **Task Classification**: task signals used by the AI to determine which selected module rules apply.
3. **Selected Module Roles**: one concise role section for every selected Code Work module, with explicit references to its files.
4. **Execution Order and Recovery**: ordering rules for multi-module tasks and review failure recovery.

Example structure:

```markdown
# Shared Core Rules

## Task Classification
- Architecture, boundaries, alternatives, or design decisions: Technical Design.
- Implementation, bug fixes, refactors, or tests: Feature Development.
- Review, acceptance, quality inspection, or verification of a change: Code Review.

## Technical Design Role
Use `docs/architecture.md` and `docs/decision-record.md`.

## Feature Development Role
Use `docs/feature_list.json` and record verification evidence.

## Code Review Role
Use `docs/review-rubric.md` and `docs/review-findings.md`.

## Multi-Module Order
Technical Design -> Feature Development -> Code Review.
```

All selected module rules are present in the generated `AGENTS.md`. They are not all unconditionally active: the AI determines the applicable roles from the task it receives.

## AI Task Classification and Ordering

The AI selects relevant Code Work roles from the task itself. There is no manual stage switch in the first release.

| Task | Applicable roles | Required order |
|---|---|---|
| "Design the permission model" | Technical Design | Design |
| "Implement login with tests" | Feature Development | Development |
| "Review this login change" | Code Review | Review |
| "Design and implement login" | Technical Design + Feature Development | Design -> Development |
| "Fix the review finding and verify it" | Feature Development + Code Review | Development -> Review |

When a task matches all three modules, the order is fixed:

```text
Technical Design -> Feature Development -> Code Review
```

If review does not pass, the AI returns to Feature Development, records the finding and repair evidence, then performs review again. This is a controlled loop, not three simultaneously active and conflicting instruction sets.

## Identity and Manifest

Code Work templates no longer use one `created_from_preset` value. They record their immutable module combination instead:

```toml
id = "5c91f4d0-8da2-4d89-a469-fd2d8f1db0ad"
name = "Full Software Delivery Harness"
work_type = "code"
selected_modules = [
  "technical-design",
  "feature-development",
  "code-review",
]
source = "local"
```

Rules:

- `work_type` is immutable after creation.
- `selected_modules` is immutable after creation.
- Code Work must contain at least one valid Code Work module.
- A Code Work module cannot be selected twice.
- Document and Presentation templates continue to use one immutable `created_from_preset` value.
- Custom Work has neither `created_from_preset` nor `selected_modules`.
- Template name, description, version, `AGENTS.md`, and all supporting files remain editable.

Changing a Code Work module combination requires creating or duplicating a template. This prevents a template's identity and generated instruction structure from changing unexpectedly.

## Creation Flow

### Code Work

1. Select **Code Work**.
2. Select one or more Code Work modules.
3. Enter template name and description. The backend generates a UUID.
4. Review the deduplicated shared-core and module file list. All `docs/` files are selected by default and may be deselected; `AGENTS.md` and `docs/harness.toml` are always generated.
5. Review the combined file tree.
6. Create the template and open the editor.

The file review must identify which files are shared and which module contributed each dedicated file.

### Other Work Types

- Document Work selects exactly one document preset.
- Presentation Work selects exactly one presentation preset.
- Custom Work selects zero or more files from the complete standard file library.

## Backend Registry and API Direction

The backend remains the single source of truth. Replace the current mutually exclusive Code Work presets with a module registry:

```rust
get_code_work_modules() -> Vec<CodeWorkModule>
get_harness_presets() -> Vec<HarnessPreset> // Document and Presentation only
```

Creation input direction:

```rust
CreateHarnessTemplateInput {
    name: String,
    description: String,
    work_type: String,
    selected_modules: Vec<String>,
    preset_id: Option<String>,
    optional_files: Vec<String>,
}
```

Validation rules:

- Code Work requires non-empty `selected_modules` and no `preset_id`.
- Every selected Code Work module must exist in the backend registry.
- Document and Presentation require an applicable `preset_id` and no modules.
- Custom Work requires neither a preset ID nor modules.
- The backend creates one shared core, deduplicates selected module files, and generates the combined `AGENTS.md`.

## Editing and Health

The editor shows the Code Work module combination as immutable provenance. It does not offer controls to add or remove modules after creation.

Health checks additionally warn when:

- a selected module's dedicated file is missing;
- the combined `AGENTS.md` does not reference a selected module or its dedicated files;
- `selected_modules` contains an unknown or duplicated ID;
- a Code Work manifest has neither modules nor a valid migration marker.

Warnings never rewrite user files.

## Migration and Compatibility

The existing implementation stores one `created_from_preset` value for Code Work. This design replaces that representation.

Because the product is still under active development, no automatic migration of existing Code Work templates is required in this change. Existing templates may be treated as legacy single-module templates until the user recreates or imports them under the new model.

## Acceptance Criteria

- Code Work module selection supports one, two, or all three modules.
- Code Work modules are multi-select, not mutually exclusive.
- Each selected module contributes its dedicated files and concise `AGENTS.md` role rules.
- Shared-core files are offered once regardless of the number of selected modules and generated at most once when selected.
- Generated `AGENTS.md` classifies tasks and applies selected module rules based on the task.
- Multi-module tasks follow Design -> Development -> Review.
- A failed review returns the work to Development before re-review.
- Selected Code Work modules and work type are immutable after creation.
- Document Work and Presentation Work remain single-preset flows.
- Custom Work remains free-form and does not receive Code Work module behavior.

# Skill Deletion Confirmation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a custom React confirmation modal (`ConfirmDeleteModal`) for deleting skill packages, replacing the browser native `confirm()` alerts, and progressively handling the "enabled in projects" dependency warning in a single modal flow.

**Architecture:** Use React state to manage modal progressive steps (State A: general warning, State B: project dependency list warning). Capture backend mutation errors in the modal, extract active project names using regular expressions, and offer standard or force-delete options.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, CSS, Lucide React

## Global Constraints

- Use two-space indentation in TypeScript.
- Never commit secrets or credentials.
- Keep commits focused and use Conventional Commit messages.
- Ensure all tests pass (`npm run test:run`) and code compiles (`npm run build`) after each task.

---

### Task 1: Add Unit Tests for `ConfirmDeleteModal`

**Files:**
- Create: `src/features/skills/components/ConfirmDeleteModal.test.tsx`

**Interfaces:**
- Consumes: `ConfirmDeleteModal` component from `src/features/skills/components/ConfirmDeleteModal.tsx`
- Produces: Test suites validating basic deletion verification, progressive warning transition upon project dependency errors, list rendering, and confirmation actions.

- [ ] **Step 1: Write the failing tests**

Create `src/features/skills/components/ConfirmDeleteModal.test.tsx` with the following content:

```tsx
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import type { Skill } from '../../../shared/api/types';

const mockSkill: Skill = {
  id: 'taste-skill',
  kind: 'pack',
  metadata: {
    name: 'Taste Skill',
    description: 'Design skills',
  },
  html_content: '',
  members: [],
  source: { kind: 'local' },
  update_status: 'not_applicable',
  has_executable_content: false,
  trusted: true,
  warnings: [],
};

describe('ConfirmDeleteModal', () => {
  it('renders default confirmation state and handles standard confirm', async () => {
    const handleConfirm = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <ConfirmDeleteModal
        skill={mockSkill}
        onClose={handleClose}
        onConfirm={handleConfirm}
      />
    );

    expect(screen.getByText('删除技能')).toBeInTheDocument();
    expect(screen.getByText(/确定要永久删除技能/)).toBeInTheDocument();
    expect(screen.getByText('Taste Skill')).toBeInTheDocument();

    const confirmBtn = screen.getByText('确认删除');
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    expect(handleConfirm).toHaveBeenCalledWith(false);
    expect(handleClose).toHaveBeenCalled();
  });

  it('transitions to State B warning when occupied error is thrown', async () => {
    const errorMsg = 'Skill Pack is enabled in projects: project-alpha, project-beta';
    const handleConfirm = vi.fn()
      .mockRejectedValueOnce(new Error(errorMsg)) // First standard delete fails
      .mockResolvedValueOnce(undefined);          // Second force delete succeeds
    const handleClose = vi.fn();

    render(
      <ConfirmDeleteModal
        skill={mockSkill}
        onClose={handleClose}
        onConfirm={handleConfirm}
      />
    );

    const confirmBtn = screen.getByText('确认删除');
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    // Should transition to State B: Project occupied warning
    expect(screen.getByText('该技能正在被项目使用')).toBeInTheDocument();
    expect(screen.getByText('project-alpha')).toBeInTheDocument();
    expect(screen.getByText('project-beta')).toBeInTheDocument();
    expect(screen.queryByText('确认删除')).not.toBeInTheDocument();

    // Click force delete button
    const forceConfirmBtn = screen.getByText('一键移除并彻底删除');
    await act(async () => {
      fireEvent.click(forceConfirmBtn);
    });

    expect(handleConfirm).toHaveBeenCalledWith(true);
    expect(handleClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run`
Expected: Failures due to missing `ConfirmDeleteModal` component.

- [ ] **Step 3: Commit**

```bash
git add src/features/skills/components/ConfirmDeleteModal.test.tsx
git commit -m "test: add unit tests for ConfirmDeleteModal deletion flow"
```

---

### Task 2: Implement the `ConfirmDeleteModal` Component

**Files:**
- Create: `src/features/skills/components/ConfirmDeleteModal.tsx`

**Interfaces:**
- Consumes: `Skill` types and Lucide React icons.
- Produces: `ConfirmDeleteModal` component offering progressive states, handling async confirm callbacks, and displaying error/warning details.

- [ ] **Step 1: Write `ConfirmDeleteModal.tsx`**

Create `src/features/skills/components/ConfirmDeleteModal.tsx` with the following content:

```tsx
import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, X } from 'lucide-react';
import type { Skill } from '../../../shared/api/types';

interface Props {
  skill: Skill;
  onClose: () => void;
  onConfirm: (force: boolean) => Promise<void>;
}

export function ConfirmDeleteModal({ skill, onClose, onConfirm }: Props) {
  const [occupiedProjects, setOccupiedProjects] = useState<string[] | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleDelete = async (force: boolean) => {
    setIsDeleting(true);
    setErrorMessage('');
    try {
      await onConfirm(force);
      onClose();
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('enabled in projects')) {
        const match = msg.match(/enabled in projects: (.*)/);
        const list = match ? match[1].split(', ') : [];
        setOccupiedProjects(list);
      } else {
        setErrorMessage(msg || '删除失败，请重试');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const isOccupied = occupiedProjects !== null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-body compact-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isOccupied ? (
              <ShieldAlert size={20} style={{ color: 'var(--color-danger)' }} />
            ) : (
              <AlertTriangle size={20} style={{ color: '#ff9800' }} />
            )}
            <h3>{isOccupied ? '该技能正在被项目使用' : '删除技能'}</h3>
          </div>
          <button className="close-btn" onClick={onClose} disabled={isDeleting}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 'var(--space-3)' }}>
          {isOccupied ? (
            <>
              <p style={{ margin: '0 0 var(--space-2) 0', fontSize: '0.9rem', color: 'var(--color-ink)', lineHeight: '1.5' }}>
                该技能包已在以下项目中启用，无法直接删除：
              </p>
              <div className="occupied-projects-list">
                <ul>
                  {occupiedProjects.map((proj) => (
                    <li key={proj} style={{ fontSize: '0.88rem', color: 'var(--color-ink)', marginBottom: '4px' }}>
                      {proj}
                    </li>
                  ))}
                </ul>
              </div>
              <p style={{ margin: 'var(--space-2) 0 0 0', fontSize: '0.85rem', color: 'var(--color-muted)', lineHeight: '1.5' }}>
                如果选择继续，系统将自动从以上项目中移除并禁用此技能，然后彻底删除本地源文件。
              </p>
            </>
          ) : (
            <>
              <p style={{ margin: '0 0 var(--space-2) 0', fontSize: '0.9rem', color: 'var(--color-ink)', lineHeight: '1.5' }}>
                你确定要永久删除技能 <strong style={{ color: 'var(--color-ink)' }}>{skill.metadata.name}</strong> 吗？
              </p>
              <p style={{ margin: '0', fontSize: '0.85rem', color: 'var(--color-muted)' }}>
                此操作将直接从磁盘中删除该技能的所有源文件，且不可逆。
              </p>
            </>
          )}

          {errorMessage && (
            <p style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginTop: '12px', margin: '12px 0 0 0' }}>
              {errorMessage}
            </p>
          )}
        </div>

        <div className="actions-footer" style={{ padding: 'var(--space-2) var(--space-3) var(--space-3)' }}>
          <button
            type="button"
            className="button button--secondary"
            onClick={onClose}
            disabled={isDeleting}
          >
            取消
          </button>
          {isOccupied ? (
            <button
              type="button"
              className="button button--danger"
              onClick={() => handleDelete(true)}
              disabled={isDeleting}
            >
              {isDeleting ? '正在移除并删除…' : '一键移除并彻底删除'}
            </button>
          ) : (
            <button
              type="button"
              className="button button--danger"
              onClick={() => handleDelete(false)}
              disabled={isDeleting}
            >
              {isDeleting ? '正在删除…' : '确认删除'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npm run test:run`
Expected: The Vitest test suites (including `ConfirmDeleteModal.test.tsx`) pass successfully.

- [ ] **Step 3: Commit**

```bash
git add src/features/skills/components/ConfirmDeleteModal.tsx
git commit -m "feat: implement ConfirmDeleteModal with progressive states"
```

---

### Task 3: Integrate `ConfirmDeleteModal` in `SkillsPage`

**Files:**
- Modify: `src/features/skills/SkillsPage.tsx`

**Interfaces:**
- Consumes: `ConfirmDeleteModal` component.
- Produces: Integrated delete targeting state on `SkillsPage`, triggering the custom confirm modal on skill card trash-clicks, and processing asynchronous deletions.

- [ ] **Step 1: Edit `SkillsPage.tsx`**

1. Import `ConfirmDeleteModal`.
2. Add `deleteTarget` state: `const [deleteTarget, setDeleteTarget] = useState<Skill | null>(null);`.
3. In `catalogResults.map((result) => ...)` inside `SkillCard`:
   - Replace the `onDelete` confirm handler with `setDeleteTarget(result.skill)`.
4. Render `<ConfirmDeleteModal>` at the bottom of the component if `deleteTarget` is set, executing `deleteSkillMut.mutateAsync` (or `deleteEverywhereMut.mutateAsync` when forced).
5. Clean up any alert confirm blocks.

Replace lines 197-210 in `src/features/skills/SkillsPage.tsx` with:

```tsx
                  onDelete={result.type === 'skill' ? (e) => {
                    e.stopPropagation();
                    setDeleteTarget(result.skill);
                  } : undefined}
```

And add the import statement for `ConfirmDeleteModal` at the top:

```tsx
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
```

And define state:

```tsx
  const [deleteTarget, setDeleteTarget] = useState<Skill | null>(null);
```

And render the modal at the bottom of the JSX tree:

```tsx
      {deleteTarget && (
        <ConfirmDeleteModal
          skill={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={async (force) => {
            if (force) {
              await deleteEverywhereMut.mutateAsync(deleteTarget.id);
            } else {
              await deleteSkillMut.mutateAsync(deleteTarget.id);
            }
          }}
        />
      )}
```

- [ ] **Step 2: Run test to verify passes**

Run: `npm run test:run`
Expected: Passes.

- [ ] **Step 3: Commit**

```bash
git add src/features/skills/SkillsPage.tsx
git commit -m "feat: integrate ConfirmDeleteModal into SkillsPage"
```

---

### Task 4: Add Deletion styling in CSS

**Files:**
- Modify: `src/features/skills/components/skills.css`

- [ ] **Step 1: Append styling rules**

Add styling rules for `.occupied-projects-list` and `.button--danger` at the end of `src/features/skills/components/skills.css`:

```css
/* Deletion Confirm Modal Styling */
.occupied-projects-list {
  background: var(--color-surface-soft);
  border: 1px solid var(--color-outline);
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-3);
  margin-top: var(--space-1);
  margin-bottom: var(--space-2);
  max-height: 10rem;
  overflow-y: auto;
}

.occupied-projects-list ul {
  margin: 0;
  padding-left: 1.2rem;
}

.button--danger {
  background-color: var(--color-danger) !important;
  color: white !important;
  border: 1px solid transparent;
  transition: background-color 0.2s ease;
}

.button--danger:hover:not(:disabled) {
  background-color: color-mix(in srgb, var(--color-danger) 85%, black) !important;
}
```

- [ ] **Step 2: Run verification build and tests**

Run: `npm run build && npm run test:run`
Expected: Everything compiles without errors and all 25 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/features/skills/components/skills.css
git commit -m "style: add styles for ConfirmDeleteModal elements and danger button"
```

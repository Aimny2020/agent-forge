# Skill Pack Detail Layout Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Skill Pack detail modal layout so child skills are displayed as a rich, clickable grid of cards in the main panel, removing them from the right sidebar to improve visual clarity and layout consistency.

**Architecture:** Use React state to handle navigation between the package-level default view and the member-level detail view inside `SkillDetailModal`. Use CSS Grid and custom components to render responsive cards with elegant hover styles.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, CSS, Lucide React

## Global Constraints

- Use two-space indentation in TypeScript.
- Never commit secrets or credentials.
- Keep commits focused and use Conventional Commit messages.
- Ensure all tests pass (`npm run test:run`) and code compiles (`npm run build`) after each task.

---

### Task 1: Add Unit Tests for `SkillDetailModal`

**Files:**
- Create: `src/features/skills/components/SkillDetailModal.test.tsx`

**Interfaces:**
- Consumes: `SkillDetailModal` component from `src/features/skills/components/SkillDetailModal.tsx`
- Produces: Visual layout tests verifying default pack overview grid, sub-skill selection detail view, back button navigation, and sidebar content boundaries.

- [ ] **Step 1: Write the failing tests**

Write unit tests for `SkillDetailModal`. Create `src/features/skills/components/SkillDetailModal.test.tsx` with the following content:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SkillDetailModal } from './SkillDetailModal';
import type { Skill, Category } from '../../../shared/api/types';

const mockCategories: Category[] = [
  { id: '1', name: 'Design' },
  { id: '2', name: 'Development' },
];

const mockSkillPack: Skill = {
  id: 'taste-skill',
  kind: 'pack',
  metadata: {
    name: 'Taste Skill Package',
    description: 'A beautiful package containing multiple designer skills',
    version: '1.2.0',
    author: 'Antigravity Team',
  },
  html_content: '<p>Welcome to taste-skill package documentation.</p>',
  members: [
    {
      id: 'taste-skill::sub-1',
      relative_path: 'skills/sub-1',
      metadata: { name: 'Sub Skill One', description: 'This is the first sub skill description', version: '1.0.0' },
      html_content: '<div>Detail document of sub skill one</div>',
    },
    {
      id: 'taste-skill::sub-2',
      relative_path: 'skills/sub-2',
      metadata: { name: 'Sub Skill Two', description: 'This is the second sub skill description', version: '1.0.1' },
      html_content: '<div>Detail document of sub skill two</div>',
    },
  ],
  source: { kind: 'git', url: 'https://github.com/example/taste-skill', installed_commit: 'abcdef123' },
  update_status: 'none',
  has_executable_content: false,
  trusted: true,
  warnings: [],
  user_notes: 'Some user notes',
  category_id: '1',
};

describe('SkillDetailModal', () => {
  it('renders package title, README overview and a grid of child skill cards by default', () => {
    render(
      <SkillDetailModal
        skill={mockSkillPack}
        categories={mockCategories}
        onClose={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    // Should render package title and README content
    expect(screen.getByText('Taste Skill Package')).toBeInTheDocument();
    expect(screen.getByText('Welcome to taste-skill package documentation.')).toBeInTheDocument();

    // Should render section title and both child skill cards
    expect(screen.getByText('所含子技能 (2)')).toBeInTheDocument();
    expect(screen.getByText('Sub Skill One')).toBeInTheDocument();
    expect(screen.getByText('This is the first sub skill description')).toBeInTheDocument();
    expect(screen.getByText('Sub Skill Two')).toBeInTheDocument();
    expect(screen.getByText('This is the second sub skill description')).toBeInTheDocument();

    // Back button should NOT be visible
    expect(screen.queryByText(/返回/)).not.toBeInTheDocument();

    // Sidebar should not contain the old navigation buttons
    const packMembersHeading = screen.queryByText(/2 个 Skills/);
    expect(packMembersHeading).not.toBeInTheDocument();
  });

  it('navigates to child skill doc when card is clicked and returns when back button is clicked', () => {
    render(
      <SkillDetailModal
        skill={mockSkillPack}
        categories={mockCategories}
        onClose={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    // Click the first child skill card
    const firstCard = screen.getByText('Sub Skill One').closest('.pack-member-card');
    expect(firstCard).not.toBeNull();
    fireEvent.click(firstCard!);

    // Should now display sub skill content and doc
    expect(screen.getByText('Detail document of sub skill one')).toBeInTheDocument();
    expect(screen.getByText(/返回 Taste Skill Package/)).toBeInTheDocument();

    // Click the back button
    const backBtn = screen.getByText(/返回 Taste Skill Package/);
    fireEvent.click(backBtn);

    // Should return to the grid overview and package README
    expect(screen.getByText('Welcome to taste-skill package documentation.')).toBeInTheDocument();
    expect(screen.getByText('Sub Skill One')).toBeInTheDocument();
    expect(screen.queryByText(/返回/)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run`
Expected: Failures due to missing selector `.pack-member-card`, presence of old `.pack-members` list elements in sidebar, etc.

- [ ] **Step 3: Commit**

```bash
git add src/features/skills/components/SkillDetailModal.test.tsx
git commit -m "test: add unit tests for SkillDetailModal layout redesign"
```

---

### Task 2: Implement Layout Changes in `SkillDetailModal`

**Files:**
- Modify: `src/features/skills/components/SkillDetailModal.tsx`

**Interfaces:**
- Consumes: `Skill`, `SkillMember`, `Category` types.
- Produces: Updated `SkillDetailModal` UI markup where subskill cards are displayed inside `.modal-markdown-area` (left) instead of `.modal-meta-editor` (right) when no subskill is selected.

- [ ] **Step 1: Edit `SkillDetailModal.tsx`**

Modify `src/features/skills/components/SkillDetailModal.tsx` to:
1. Render package overview, top-level README description, and card grid under `.modal-markdown-area` when `selectedMember` is undefined.
2. Render return button and specific sub-skill documentation under `.modal-markdown-area` when `selectedMember` is defined.
3. Remove the `pack-members` sidebar list completely from `.modal-meta-editor`.

Replace lines 28-124 in `src/features/skills/components/SkillDetailModal.tsx` with the following implementation:

```tsx
  const [selectedMember, setSelectedMember] = useState<SkillMember | undefined>(initialMember);
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
          <h3>{skill.kind === 'pack' ? '技能扩展包' : '技能详情'}</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-grid-content">
          <div className="modal-markdown-area">
            {selectedMember ? (
              <>
                <button className="member-back" onClick={() => setSelectedMember(undefined)}>
                  ← 返回 {skill.metadata.name}
                </button>
                <h1>{selectedMember.metadata.name}</h1>
                <div
                  className="markdown-body"
                  dangerouslySetInnerHTML={{ __html: selectedMember.html_content || '<p>暂无文档说明</p>' }}
                />
              </>
            ) : (
              <>
                <h1>{skill.metadata.name}</h1>
                {skill.html_content && (
                  <div
                    className="markdown-body"
                    dangerouslySetInnerHTML={{ __html: skill.html_content }}
                  />
                )}
                {skill.kind === 'pack' && (
                  <div className="pack-members-section">
                    <h3 className="section-title" style={{ marginTop: '2rem', marginBottom: '1rem', borderBottom: '1px solid var(--color-outline)', paddingBottom: '0.5rem' }}>
                      所含子技能 ({skill.members.length})
                    </h3>
                    <div className="pack-members-grid">
                      {skill.members.map((member) => (
                        <div
                          key={member.id}
                          className="pack-member-card"
                          onClick={() => setSelectedMember(member)}
                        >
                          <div className="pack-member-card__header">
                            <Package size={16} className="pack-member-card__icon" />
                            <h4>{member.metadata.name}</h4>
                          </div>
                          <p className="pack-member-card__desc">{member.metadata.description || '暂无描述信息'}</p>
                          <div className="pack-member-card__footer">
                            <span className="pack-member-card__version">
                              {member.metadata.version ? `v${member.metadata.version}` : ''}
                            </span>
                            <span className="pack-member-card__action">查看详情 →</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="modal-meta-editor">
            <div className="package-actions">
              {updateStatus === 'available' && onInstallUpdate && (
                <button className="button button--secondary" onClick={onInstallUpdate}>
                  <Download size={15} /> 安装更新
                </button>
              )}
              {skill.has_executable_content && !skill.trusted && onTrust && (
                <button className="button button--secondary" onClick={onTrust}>
                  <ShieldCheck size={15} /> 信任此版本
                </button>
              )}
            </div>
            {skill.warnings.length > 0 && (
              <div className="skill-warnings">
                <strong>检测警告</strong>
                {skill.warnings.map((warning) => <p key={warning}>{warning}</p>)}
              </div>
            )}
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
```

- [ ] **Step 2: Run test to verify passes**

Run: `npm run test:run`
Expected: The Vitest test suites (including `SkillDetailModal.test.tsx`) pass successfully.

- [ ] **Step 3: Commit**

```bash
git add src/features/skills/components/SkillDetailModal.tsx
git commit -m "feat: redesign SkillDetailModal layout for skill packages"
```

---

### Task 3: Implement Visual and Responsive Styling in CSS

**Files:**
- Modify: `src/features/skills/components/skills.css`

- [ ] **Step 1: Append styles to `skills.css`**

Add CSS styles for the subskill cards, grid layout, back button navigation, hover animations, and text clamping.

Append the following styles to the end of `src/features/skills/components/skills.css`:

```css
/* Redesigned Pack Members Grid and Cards */
.pack-members-section {
  display: flex;
  flex-direction: column;
}

.pack-members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--space-2);
  margin-top: var(--space-2);
  margin-bottom: var(--space-3);
}

.pack-member-card {
  border: 1px solid var(--color-outline);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  padding: var(--space-2);
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease, box-shadow 0.2s ease;
}

.pack-member-card:hover {
  transform: translateY(-3px);
  border-color: var(--color-primary);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--color-primary) 12%, transparent);
}

.pack-member-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  color: var(--color-ink);
}

.pack-member-card__icon {
  color: var(--color-primary-ink);
  flex-shrink: 0;
}

.pack-member-card__header h4 {
  margin: 0;
  font-family: 'Hanken Grotesk', sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pack-member-card__desc {
  font-size: 0.8rem;
  color: var(--color-muted);
  margin: 0 0 12px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: 3.36rem;
}

.pack-member-card__footer {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.72rem;
}

.pack-member-card__version {
  color: var(--color-muted);
}

.pack-member-card__action {
  color: var(--color-primary-ink);
  font-weight: 500;
  opacity: 0.8;
  transition: opacity 0.2s ease;
}

.pack-member-card:hover .pack-member-card__action {
  opacity: 1;
}

/* Back button matching grid styling */
.member-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 0;
  padding: 4px 8px;
  background: var(--color-surface-soft);
  color: var(--color-primary-ink);
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 500;
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-2);
  transition: background-color 0.15s ease, color 0.15s ease;
}

.member-back:hover {
  background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface-soft));
  color: var(--color-primary-ink);
}
```

- [ ] **Step 2: Run verification build and tests**

Compile frontend to ensure no build errors:
Run: `npm run build`
Expected: Builds without errors.

Run: `npm run test:run`
Expected: All 11 test files and 23 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/features/skills/components/skills.css
git commit -m "style: apply visual and hover styles to pack member cards"
```

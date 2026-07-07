import { describe, expect, it } from 'vitest';

import type { Skill } from '../../shared/api/types';
import { projectCatalog } from './skillCatalog';

const pack = {
  id: 'obsidian-skills',
  kind: 'pack',
  metadata: { name: 'Obsidian Skills', description: 'Obsidian workflows' },
  html_content: '',
  members: [
    {
      id: 'obsidian-skills::skills/defuddle',
      relative_path: 'skills/defuddle',
      metadata: { name: 'Defuddle', description: 'Extract readable content' },
      html_content: '<p>Defuddle</p>',
    },
  ],
  category_id: 'documents',
  source: { kind: 'git', url: 'https://github.com/example/obsidian-skills', installed_commit: 'abc' },
  update_status: 'current',
  has_executable_content: false,
  trusted: false,
  warnings: [],
} as Skill;

describe('projectCatalog', () => {
  it('shows only the parent pack during normal browsing', () => {
    expect(projectCatalog([pack], '')).toEqual([{ type: 'skill', skill: pack }]);
  });

  it('returns a matching member directly during search', () => {
    expect(projectCatalog([pack], 'defuddle')).toEqual([
      { type: 'member', skill: pack, member: pack.members[0] },
    ]);
  });

  it('lets member matches inherit the parent category filter', () => {
    expect(projectCatalog([pack], 'defuddle', 'documents')).toHaveLength(1);
    expect(projectCatalog([pack], 'defuddle', 'other')).toHaveLength(0);
  });
});

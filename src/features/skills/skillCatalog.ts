import type { Skill, SkillMember } from '../../shared/api/types';

export type CatalogResult =
  | { type: 'skill'; skill: Skill }
  | { type: 'member'; skill: Skill; member: SkillMember };

export function projectCatalog(
  skills: Skill[],
  search: string,
  selectedCategoryId: string | null = null,
): CatalogResult[] {
  const query = search.trim().toLocaleLowerCase();
  const categoryMatches = (skill: Skill) => {
    if (selectedCategoryId === 'uncategorized') return !skill.category_id;
    if (selectedCategoryId) return skill.category_id === selectedCategoryId;
    return true;
  };

  return skills.flatMap((skill): CatalogResult[] => {
    if (!categoryMatches(skill)) return [];
    if (!query) return [{ type: 'skill', skill }];

    const parentText = `${skill.metadata.name} ${skill.metadata.description}`.toLocaleLowerCase();
    if (parentText.includes(query)) return [{ type: 'skill', skill }];

    return skill.members
      .filter((member) =>
        `${member.metadata.name} ${member.metadata.description}`.toLocaleLowerCase().includes(query),
      )
      .map((member) => ({ type: 'member' as const, skill, member }));
  });
}

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSkills, getProjectSkills, toggleProjectSkill, trustSkill } from '../../../shared/api/tauriClient';
import type { Skill } from '../../../shared/api/types';
import { useProjectStore } from '../../../shared/store/projectStore';
import { Card } from '../../../shared/ui/Card';
import { PageState } from '../../../shared/ui/PageState';
import './harness.css';

export function ProjectSkillsPage() {
  const queryClient = useQueryClient();
  const { activeProjectId } = useProjectStore();

  // Query global skills list
  const { data: skills = [], isLoading: skillsLoading } = useQuery({
    queryKey: ['skills'],
    queryFn: getSkills,
  });

  // Query enabled skills for the active project
  const { data: enabledSkillIds = [], isLoading: enabledLoading } = useQuery({
    queryKey: ['projectSkills', activeProjectId],
    queryFn: () => getProjectSkills(activeProjectId || ''),
    enabled: !!activeProjectId,
  });

  // Toggle skill mutation
  const toggleSkillMut = useMutation({
    mutationFn: ({ skillId, enabled }: { skillId: string; enabled: boolean }) =>
      toggleProjectSkill(activeProjectId || '', skillId, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectSkills', activeProjectId] });
    },
  });

  if (!activeProjectId) {
    return (
      <PageState
        state="empty"
        title="尚未选择任何项目"
        description="请在左侧侧边栏中选择或添加一个项目，以配置该项目启用的技能。"
      />
    );
  }

  if (skillsLoading || enabledLoading) {
    return (
      <div className="page-state">
        <div className="loading-dot" />
        <p>加载项目技能配置...</p>
      </div>
    );
  }

  const handleCheckboxChange = async (skill: Skill, isChecked: boolean) => {
    if (isChecked && skill.has_executable_content && !skill.trusted) {
      const accepted = confirm(`“${skill.metadata.name}” 包含脚本或可执行内容。是否信任当前版本并启用？`);
      if (!accepted) return;
      await trustSkill(skill.id);
      await queryClient.invalidateQueries({ queryKey: ['skills'] });
    }
    toggleSkillMut.mutate({ skillId: skill.id, enabled: isChecked });
  };

  return (
    <div className="page-stack">
      <Card>
        <h3>选择启用技能</h3>
        {skills.length === 0 ? (
          <p className="muted-copy" style={{ marginTop: '1rem' }}>
            全局技能库为空，请先前往 "Skills 管理" 页面导入一些技能。
          </p>
        ) : (
          <div className="harness-skills-list">
            {skills.map((skill) => {
              const isEnabled = enabledSkillIds.includes(skill.id);
              return (
                <div className="harness-skill-row" key={skill.id} data-enabled={isEnabled}>
                  <input
                    type="checkbox"
                    id={`skill-chk-${skill.id}`}
                    checked={isEnabled}
                    onChange={(e) => handleCheckboxChange(skill, e.target.checked)}
                  />
                  <label htmlFor={`skill-chk-${skill.id}`} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    <strong>{skill.metadata.name}</strong>
                    {skill.kind === 'pack' && <span className="project-skill-pack-label">技能扩展包 · {skill.members.length} 个 Skills</span>}
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

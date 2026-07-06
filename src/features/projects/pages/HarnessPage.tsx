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

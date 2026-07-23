import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSkills, getProjectSkills, toggleProjectSkill, trustSkill } from '../../../shared/api/tauriClient';
import type { Skill } from '../../../shared/api/types';
import { useProjectStore } from '../../../shared/store/projectStore';
import { Card } from '../../../shared/ui/Card';
import { PageState } from '../../../shared/ui/PageState';
import './harness.css';

export function ProjectSkillsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { activeProjectId } = useProjectStore();
  
  // Track expanded packages
  const [expandedPacks, setExpandedPacks] = useState<Record<string, boolean>>({});

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
        title={t('projects.skills.noProjectTitle')}
        description={t('projects.skills.noProjectDescription')}
      />
    );
  }

  if (skillsLoading || enabledLoading) {
    return (
      <div className="page-state">
        <div className="loading-dot" />
        <p>{t('projects.skills.loading')}</p>
      </div>
    );
  }

  const togglePackExpand = (packId: string) => {
    setExpandedPacks((prev) => ({ ...prev, [packId]: !prev[packId] }));
  };

  const handleCheckboxChange = (skill: Skill, isChecked: boolean) => {
    toggleSkillMut.mutate({ skillId: skill.id, enabled: isChecked });
  };

  const handleSubSkillChange = (memberId: string, isChecked: boolean) => {
    toggleSkillMut.mutate({ skillId: memberId, enabled: isChecked });
  };

  const setIndeterminate = (isAnyEnabled: boolean, isAllEnabled: boolean) => (el: HTMLInputElement | null) => {
    if (el) {
      el.indeterminate = isAnyEnabled && !isAllEnabled;
    }
  };

  return (
    <div className="page-stack fixed-workspace-page project-skills-page-container">
      <Card className="project-skills-card">
        <h3>{t('projects.skills.title')}</h3>
        {skills.length === 0 ? (
          <p className="muted-copy" style={{ marginTop: '1rem' }}>
            {t('projects.skills.empty')}
          </p>
        ) : (
          <div className="harness-skills-list">
            {skills.map((skill) => {
              const isPack = skill.kind === 'pack';
              const isUntrusted = skill.has_executable_content && !skill.trusted;
              
              // Calculate package status
              const enabledMembersCount = skill.members.filter((m) => enabledSkillIds.includes(m.id)).length;
              const isAllEnabled = isPack && skill.members.length > 0 && enabledMembersCount === skill.members.length;
              const isAnyEnabled = isPack && enabledMembersCount > 0;
              const isPackChecked = isPack ? isAllEnabled : enabledSkillIds.includes(skill.id);
              
              const isExpanded = !!expandedPacks[skill.id];

              return (
                <div key={skill.id} className="harness-skill-item-container" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div 
                    className="harness-skill-row" 
                    data-enabled={isPackChecked || isAnyEnabled}
                    style={isUntrusted ? { opacity: 0.6 } : undefined}
                  >
                    {isPack && (
                      <button
                        type="button"
                        onClick={() => togglePackExpand(skill.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--color-muted)',
                          marginRight: '2px'
                        }}
                      >
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    )}
                    <input
                      type="checkbox"
                      id={`skill-chk-${skill.id}`}
                      checked={isPackChecked}
                      disabled={isUntrusted}
                      ref={isPack ? setIndeterminate(isAnyEnabled, isAllEnabled) : undefined}
                      onChange={(e) => handleCheckboxChange(skill, e.target.checked)}
                    />
                    <label 
                      htmlFor={isUntrusted ? undefined : `skill-chk-${skill.id}`}
                      style={{ cursor: isUntrusted ? 'not-allowed' : 'pointer', userSelect: 'none' }}
                    >
                      <strong>{skill.metadata.name}</strong>
                      {isPack ? (
                        <span className="project-skill-pack-label">
                          {t('projects.skills.pack', { enabled: enabledMembersCount, total: skill.members.length })}
                        </span>
                      ) : (
                        <span className="project-skill-pack-label" style={{ visibility: 'hidden', userSelect: 'none' }}>
                          {t('projects.skills.placeholder')}
                        </span>
                      )}
                      {isUntrusted && (
                        <span className="project-skill-pack-label" style={{ color: '#cf222e', marginLeft: '8px' }}>
                          {t('projects.skills.untrusted')}
                        </span>
                      )}
                    </label>
                  </div>
                  
                  {isPack && isExpanded && (
                    <div 
                      className="harness-sub-skills-list"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        paddingLeft: '28px',
                        borderLeft: '1px solid var(--color-outline, #e1e4e8)',
                        marginLeft: '18px',
                        marginTop: '4px',
                        marginBottom: '8px'
                      }}
                    >
                      {skill.members.map((member) => {
                        const isMemberEnabled = enabledSkillIds.includes(member.id);
                        return (
                          <div 
                            key={member.id} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '8px', 
                              opacity: isUntrusted ? 0.6 : 1, 
                              padding: '4px 0' 
                            }}
                          >
                            <input
                              type="checkbox"
                              id={`skill-chk-${member.id}`}
                              checked={isMemberEnabled}
                              disabled={isUntrusted}
                              onChange={(e) => handleSubSkillChange(member.id, e.target.checked)}
                              style={{ width: '16px', height: '16px', cursor: isUntrusted ? 'not-allowed' : 'pointer' }}
                            />
                            <label 
                              htmlFor={isUntrusted ? undefined : `skill-chk-${member.id}`}
                              style={{ 
                                cursor: isUntrusted ? 'not-allowed' : 'pointer', 
                                userSelect: 'none', 
                                fontSize: '0.85rem' 
                              }}
                            >
                              <strong style={{ color: 'var(--color-ink)', fontWeight: 500 }}>{member.metadata.name}</strong>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

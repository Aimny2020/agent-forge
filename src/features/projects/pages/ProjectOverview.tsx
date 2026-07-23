import { useMutation, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AppWindow, CircleAlert, ExternalLink, TerminalSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getLocalAgents, getProjectSkills, launchAgent, openDesktopAgent } from '../../../shared/api/tauriClient';
import { useProjectStore } from '../../../shared/store/projectStore';
import { Card } from '../../../shared/ui/Card';

export function ProjectOverview() {
  const { t } = useTranslation();
  const { activeProjectId } = useProjectStore();

  // Query enabled skills for the active project
  const { data: enabledSkillIds = [] } = useQuery({
    queryKey: ['projectSkills', activeProjectId],
    queryFn: () => getProjectSkills(activeProjectId || ''),
    enabled: !!activeProjectId,
  });
  const agents = useQuery({ queryKey: ['localAgents'], queryFn: getLocalAgents });
  const launchMutation = useMutation({ mutationFn: (agentId: string) => launchAgent(activeProjectId || '', agentId) });
  const openDesktopMutation = useMutation({ mutationFn: openDesktopAgent });
  const availableAgents = (agents.data || []).filter((agent) => agent.status === 'ready');

  return (
    <div className="content-grid fixed-workspace-page project-overview-page">
      <Card>
        <h2>{t('projects.summary')}</h2>
        <dl className="definition-list">
          <div>
            <dt>Harness</dt>
            <dd>0</dd>
          </div>
          <div>
            <dt>Agents</dt>
            <dd>0</dd>
          </div>
          <div>
            <dt>Skills</dt>
            <dd>{activeProjectId ? enabledSkillIds.length : 0}</dd>
          </div>
          <div>
            <dt>MCP</dt>
            <dd>0</dd>
          </div>
        </dl>
      </Card>
      <Card className="project-launch-card">
        <h2>{t('projects.launchAgent')}</h2>
        {!activeProjectId ? <p className="muted-copy">{t('projects.selectProjectToLaunch')}</p> : agents.isLoading ? <p className="muted-copy">{t('projects.detectingAgents')}</p> : availableAgents.length ? <div className="project-agent-list">
          {availableAgents.map((agent) => <div className="project-agent-row" key={agent.id}>
            <div><strong>{agent.displayName}</strong><small>{agent.version || (agent.surface === 'desktop' ? t('projects.desktopApp') : t('projects.commandLine'))}</small></div>
            {agent.surface === 'cli' ? <button type="button" className="button button--primary project-agent-row__launch" disabled={launchMutation.isPending} onClick={() => launchMutation.mutate(agent.id)}><ExternalLink size={15} /> {t('projects.open')}</button> : <button type="button" className="button button--primary project-agent-row__launch" disabled={openDesktopMutation.isPending} onClick={() => openDesktopMutation.mutate(agent.id)}><AppWindow size={15} /> {t('projects.open')}</button>}
          </div>)}
        </div> : <p className="muted-copy">{t('projects.noAgents')}</p>}
        {agents.isError && <p className="project-agent-error"><CircleAlert size={15} /> {t('projects.detectAgentsError')}</p>}
        {launchMutation.isError && <p className="project-agent-error"><CircleAlert size={15} /> {launchMutation.error instanceof Error ? launchMutation.error.message : t('projects.launchAgentError')}</p>}
        {openDesktopMutation.isError && <p className="project-agent-error"><CircleAlert size={15} /> {t('projects.openDesktopError')}</p>}
        {launchMutation.isSuccess && <p className="project-agent-success">{t('projects.launchSucceeded')}</p>}
        <Link className="button button--secondary project-launch-card__action" to="/settings"><TerminalSquare size={16} /> {t('projects.configureLaunch')}</Link>
      </Card>
    </div>
  );
}

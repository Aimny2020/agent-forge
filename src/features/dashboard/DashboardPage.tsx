import { useQuery } from '@tanstack/react-query';
import { Activity, Boxes, FolderKanban, Waypoints } from 'lucide-react';

import { getHealth } from '../../shared/api/tauriClient';
import { mockProjects } from '../../shared/mocks/projects';
import { Card } from '../../shared/ui/Card';
import { PageState } from '../../shared/ui/PageState';
import { StatusBadge } from '../../shared/ui/StatusBadge';

export function DashboardPage() {
  const health = useQuery({ queryKey: ['health'], queryFn: getHealth });

  if (health.isPending) {
    return <PageState state="loading" label="正在检查 AgentForge 运行环境" />;
  }

  if (health.isError) {
    return (
      <PageState
        state="error"
        title="无法读取系统状态"
        description="AgentForge 后端尚未就绪，请重试。"
        onRetry={() => void health.refetch()}
      />
    );
  }

  const metrics = [
    { label: '本地项目', value: '3', icon: FolderKanban },
    { label: '已连接 Agent', value: '5', icon: Waypoints },
    { label: '可用 Skills', value: '12', icon: Boxes },
    { label: '运行任务', value: '0', icon: Activity },
  ];

  return (
    <div className="page-stack">
      <header className="page-header">
        <div><p className="eyebrow">WORKBENCH OVERVIEW</p><h1>控制面板</h1></div>
        <StatusBadge tone={health.data.ready ? 'success' : 'danger'}>
          {health.data.ready ? '系统就绪' : '需要检查'}
        </StatusBadge>
      </header>

      <section className="metric-grid" aria-label="系统摘要">
        {metrics.map(({ label, value, icon: Icon }) => (
          <Card className="metric-card" key={label}>
            <Icon aria-hidden="true" size={19} />
            <strong>{value}</strong><span>{label}</span>
          </Card>
        ))}
      </section>

      <section className="content-grid">
        <Card>
          <div className="section-heading"><div><p className="eyebrow">RECENT PROJECTS</p><h2>最近项目</h2></div></div>
          <div className="project-table">
            {mockProjects.map((project) => (
              <div className="project-row" key={project.path}>
                <div><strong>{project.name}</strong><small>{project.path}</small></div>
                <span>{project.agents} Agents</span>
                <StatusBadge tone={project.status === '已就绪' ? 'success' : 'neutral'}>{project.status}</StatusBadge>
              </div>
            ))}
          </div>
        </Card>
        <Card className="system-card">
          <p className="eyebrow">RUNTIME</p><h2>本机环境</h2>
          <dl className="definition-list">
            <div><dt>应用版本</dt><dd>{health.data.version}</dd></div>
            <div><dt>运行平台</dt><dd>{health.data.platform}</dd></div>
            <div><dt>本地数据库</dt><dd>{health.data.database}</dd></div>
          </dl>
        </Card>
      </section>
    </div>
  );
}

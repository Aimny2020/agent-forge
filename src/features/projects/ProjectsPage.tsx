import { NavLink, Outlet } from 'react-router-dom';

const tabs = [
  { label: '概览', to: '/projects', end: true },
  { label: 'Harness', to: '/projects/harness' },
  { label: 'Skills', to: '/projects/skills' },
  { label: 'Agents', to: '/projects/agents' },
  { label: '环境', to: '/projects/environment' },
];

export function ProjectsPage() {
  return (
    <div className="page-stack">
      <header className="page-header">
        <div><p className="eyebrow">AGENT-FORGE-CORE</p><h1>项目管理</h1><p className="page-description">统一维护工程规则、Agent 配置与本地环境。</p></div>
      </header>
      <nav className="tab-navigation" aria-label="项目详情">
        {tabs.map((tab) => <NavLink key={tab.to} to={tab.to} end={tab.end}>{tab.label}</NavLink>)}
      </nav>
      <Outlet />
    </div>
  );
}

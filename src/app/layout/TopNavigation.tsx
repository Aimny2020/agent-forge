import { NavLink } from 'react-router-dom';

const navigation = [
  { label: '项目管理', to: '/projects' },
  { label: 'Agents', to: '/agents' },
  { label: 'Skills', to: '/skills' },
  { label: 'Harness', to: '/harness' },
  { label: '设置', to: '/settings' },
];

export function TopNavigation() {
  return (
    <header className="top-navigation">
      <div className="brand-lockup">
        <strong>AgentPalette</strong>
        <span>跨工具、本地优先的 Agent 工作空间管理器</span>
      </div>
      <nav className="global-navigation" aria-label="全局导航">
        {navigation.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}

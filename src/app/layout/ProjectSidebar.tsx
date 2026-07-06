const projects = [
  { name: 'Agent-Forge-Core', path: '/users/dev/core', active: true },
  { name: 'MES-System', path: '/users/work/mes', active: false },
  { name: 'Content-Bot', path: '/users/ai/bot', active: false },
];

export function ProjectSidebar() {
  return (
    <aside className="project-sidebar" aria-label="项目列表">
      <div className="sidebar-heading">
        <h2>我的项目</h2>
        <button type="button">＋ 添加</button>
      </div>
      <ul className="project-list">
        {projects.map((project) => (
          <li className="project-item" data-active={project.active} key={project.path}>
            <strong>{project.name}</strong>
            <small>{project.path}</small>
          </li>
        ))}
      </ul>
    </aside>
  );
}

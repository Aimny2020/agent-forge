import { Outlet } from 'react-router-dom';

import { ProjectSidebar } from './ProjectSidebar';
import { TopNavigation } from './TopNavigation';

export function AppShell() {
  return (
    <div className="app-shell">
      <TopNavigation />
      <div className="shell-body">
        <ProjectSidebar />
        <main className="workspace-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

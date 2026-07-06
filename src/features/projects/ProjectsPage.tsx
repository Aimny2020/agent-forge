import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjects, deleteProject } from '../../shared/api/tauriClient';
import { useProjectStore } from '../../shared/store/projectStore';

const tabs = [
  { label: '概览', to: '/projects', end: true },
  { label: 'Harness', to: '/projects/harness' },
  { label: 'Skills', to: '/projects/skills' },
  { label: 'Agents', to: '/projects/agents' },
  { label: '环境', to: '/projects/environment' },
];

export function ProjectsPage() {
  const queryClient = useQueryClient();
  const { activeProjectId, setActiveProjectId } = useProjectStore();

  // Query projects list
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  const activeProject = projects.find((p) => p.id === activeProjectId);

  // Mutation to delete project
  const deleteProjectMut = useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setActiveProjectId(null);
    },
  });

  const handleDeleteActiveProject = () => {
    if (!activeProject) return;

    // 二次确认机制
    const firstConfirm = confirm(
      `确定要在当前系统中删除项目 "${activeProject.name}" 吗？此操作不会物理删除该项目对应的文件夹。`
    );
    if (firstConfirm) {
      const secondConfirm = confirm(
        `请再次确认：此操作将注销该项目在系统中的注册，但不会删除物理磁盘上的文件夹。是否继续？`
      );
      if (secondConfirm) {
        deleteProjectMut.mutate(activeProject.id);
      }
    }
  };

  return (
    <div className="page-stack">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p className="eyebrow">{activeProject ? activeProject.name.toUpperCase() : '未选择项目'}</p>
          <h1>项目管理</h1>
          <p className="page-description">统一维护工程规则、Agent 配置与本地环境。</p>
        </div>
        {activeProject && (
          <button
            type="button"
            className="button button--secondary"
            onClick={handleDeleteActiveProject}
            style={{ color: '#f44336', borderColor: '#f44336', marginTop: '1rem' }}
            disabled={deleteProjectMut.isPending}
          >
            {deleteProjectMut.isPending ? '正在删除...' : '删除项目'}
          </button>
        )}
      </header>
      <nav className="tab-navigation" aria-label="项目详情">
        {tabs.map((tab) => (
          <NavLink key={tab.to} to={tab.to} end={tab.end}>
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}

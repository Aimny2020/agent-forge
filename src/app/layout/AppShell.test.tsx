import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { AppShell } from './AppShell';

describe('AppShell', () => {
  it('shows global navigation and the selected project', () => {
    render(
      <MemoryRouter initialEntries={['/projects']}>
        <AppShell />
      </MemoryRouter>,
    );

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    for (const label of ['控制面板', '项目管理', 'Skills', 'MCP', '任务', '设置']) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    }
    expect(screen.getByText('Agent-Forge-Core')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '项目管理' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});

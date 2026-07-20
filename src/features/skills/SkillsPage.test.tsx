import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { SkillsPage } from './SkillsPage';
import * as tauriClient from '../../shared/api/tauriClient';
import type { Skill } from '../../shared/api/types';

vi.mock('../../shared/api/tauriClient', () => ({
  getSkills: vi.fn(),
  getSkillDetail: vi.fn(),
  getCategories: vi.fn(),
  checkSkillUpdates: vi.fn(),
  trustSkill: vi.fn(),
  updateSkillMeta: vi.fn(),
  updateSkill: vi.fn(),
  deleteSkill: vi.fn(),
  deleteSkillEverywhere: vi.fn(),
  importSkill: vi.fn(),
  createCategory: vi.fn(),
  renameCategory: vi.fn(),
  deleteCategory: vi.fn(),
  saveCustomDescription: vi.fn(),
}));

const mockUntrustedSkill: Skill = {
  id: 'test-skill',
  kind: 'standalone',
  metadata: {
    name: 'Test Skill',
    description: 'Test skill description',
    version: '1.0.0',
  },
  members: [],
  source: { kind: 'local' },
  has_executable_content: true,
  trusted: false,
  update_status: 'unknown',
  warnings: [],
  html_content: '<p>Skill doc</p>',
};

describe('SkillsPage', () => {
  it('updates detail modal to "已信任此版本" after clicking trust button', async () => {
    vi.mocked(tauriClient.getSkills).mockResolvedValue([mockUntrustedSkill]);
    vi.mocked(tauriClient.getSkillDetail).mockResolvedValue(mockUntrustedSkill);
    vi.mocked(tauriClient.getCategories).mockResolvedValue([]);
    vi.mocked(tauriClient.trustSkill).mockResolvedValue(undefined);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <SkillsPage />
      </QueryClientProvider>
    );

    // Wait for skills card to appear
    const cardTitle = await screen.findByText('Test Skill');
    fireEvent.click(cardTitle);

    // Modal should be open and display "信任此版本" button
    const trustButton = await screen.findByRole('button', { name: /信任此版本/ });
    expect(trustButton).toBeInTheDocument();

    // After backend trust, getSkillDetail returns trusted skill
    vi.mocked(tauriClient.getSkillDetail).mockResolvedValue({
      ...mockUntrustedSkill,
      trusted: true,
    });

    fireEvent.click(trustButton);

    // Expect trustSkill to have been called
    await waitFor(() => {
      expect(tauriClient.trustSkill).toHaveBeenCalledWith('test-skill');
    });

    // Button should change to "已信任此版本"
    await waitFor(() => {
      expect(screen.getByText('已信任此版本')).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: /信任此版本/ })).not.toBeInTheDocument();
  });
});

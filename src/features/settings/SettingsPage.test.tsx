import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getHealthMock, getLaunchPreferencesMock, saveLaunchPreferencesMock } = vi.hoisted(() => ({
  getHealthMock: vi.fn(),
  getLaunchPreferencesMock: vi.fn(),
  saveLaunchPreferencesMock: vi.fn(),
}));

vi.mock('../../shared/api/tauriClient', () => ({
  getHealth: getHealthMock,
  getLaunchPreferences: getLaunchPreferencesMock,
  saveLaunchPreferences: saveLaunchPreferencesMock,
}));

import { SettingsPage } from './SettingsPage';

const preferences = {
  macosTerminal: 'auto' as const,
  windowsTerminal: 'auto' as const,
  launchPresentation: 'new_tab' as const,
  showCommandPreview: true,
  checkEnvironment: true,
  checkPermissions: true,
  allowCopyCommandFallback: true,
};

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><SettingsPage /></QueryClientProvider>);
}

describe('SettingsPage', () => {
  beforeEach(() => {
    getHealthMock.mockResolvedValue({ version: '0.2.1', platform: 'macos', database: 'ready', ready: true });
    getLaunchPreferencesMock.mockResolvedValue(preferences);
    saveLaunchPreferencesMock.mockImplementation(async (value) => value);
  });

  it('shows macOS terminal preferences and saves the selected value', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByRole('heading', { name: '设置', level: 1 })).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /iTerm2/ }));
    await user.click(screen.getByRole('button', { name: '保存启动偏好' }));

    expect(saveLaunchPreferencesMock).toHaveBeenCalledWith(
      { ...preferences, macosTerminal: 'iterm' },
      expect.anything(),
    );
  });
});

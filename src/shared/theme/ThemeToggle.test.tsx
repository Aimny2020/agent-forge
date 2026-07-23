import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { ThemeToggle } from './ThemeToggle';
import { useThemeStore } from './themeStore';

describe('ThemeToggle', () => {
  beforeEach(() => useThemeStore.setState({ theme: 'system' }));

  it('lets the user select a dark theme', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.selectOptions(screen.getByRole('combobox', { name: 'Appearance' }), 'dark');

    expect(useThemeStore.getState().theme).toBe('dark');
  });
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AppProviders } from './AppProviders';

describe('AppProviders', () => {
  it('renders application content inside shared providers', () => {
    render(<AppProviders><span>Workbench ready</span></AppProviders>);

    expect(screen.getByText('Workbench ready')).toBeInTheDocument();
  });
});

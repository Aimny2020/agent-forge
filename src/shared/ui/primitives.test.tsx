import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from './Button';
import { Card } from './Card';
import { StatusBadge } from './StatusBadge';

describe('shared UI primitives', () => {
  it('renders semantic controls and content', () => {
    render(
      <Card>
        <StatusBadge tone="success">已就绪</StatusBadge>
        <Button>重新检查</Button>
      </Card>,
    );

    expect(screen.getByText('已就绪')).toHaveAttribute('data-tone', 'success');
    expect(screen.getByRole('button', { name: '重新检查' })).toBeInTheDocument();
  });
});

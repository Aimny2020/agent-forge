import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CreateHarnessModal } from './CreateHarnessModal';

const presets = [
  {
    id: 'code-feature-development',
    workType: 'code',
    name: 'Feature Development',
    description: 'Implementation preset',
    files: [
      { path: 'docs/feature_list.json', kind: 'json', label: 'Feature list', content: '{}' },
      { path: 'docs/task-status.md', kind: 'markdown', label: 'Task status', content: '#' },
    ],
  },
  {
    id: 'code-review',
    workType: 'code',
    name: 'Code Review',
    description: 'Review preset',
    files: [{ path: 'docs/review-rubric.md', kind: 'markdown', label: 'Review rubric', content: '#' }],
  },
];

describe('CreateHarnessModal', () => {
  it('creates a code template from a selected preset without a user ID', () => {
    const onCreate = vi.fn();
    render(<CreateHarnessModal onClose={vi.fn()} onCreate={onCreate} presets={presets} />);

    fireEvent.click(screen.getByRole('button', { name: /Code Work/i }));
    fireEvent.click(screen.getByRole('button', { name: /下一步/i }));
    fireEvent.click(screen.getByRole('button', { name: /Feature Development/i }));
    fireEvent.click(screen.getByRole('button', { name: /下一步/i }));

    fireEvent.change(screen.getByLabelText('显示名称'), { target: { value: 'Frontend Harness' } });
    fireEvent.click(screen.getByRole('button', { name: /下一步/i }));
    fireEvent.click(screen.getByRole('button', { name: /下一步/i }));
    fireEvent.click(screen.getByRole('button', { name: /确认创建/i }));

    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({
      workType: 'code',
      presetId: 'code-feature-development',
      optionalFiles: expect.arrayContaining(['docs/feature_list.json']),
    }));
    expect(onCreate.mock.calls[0][0]).not.toHaveProperty('id');
  });

  it('lets Custom Work choose from the complete standard file library', () => {
    const onCreate = vi.fn();
    render(<CreateHarnessModal onClose={vi.fn()} onCreate={onCreate} presets={presets} />);

    fireEvent.click(screen.getByRole('button', { name: /Custom Work/i }));
    fireEvent.click(screen.getByRole('button', { name: /下一步/i }));
    fireEvent.change(screen.getByLabelText('显示名称'), { target: { value: 'Custom Harness' } });
    fireEvent.click(screen.getByRole('button', { name: /下一步/i }));

    expect(screen.getByText('Feature list')).toBeInTheDocument();
    expect(screen.getByText('Review rubric')).toBeInTheDocument();
  });
});

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CreateHarnessModal } from './CreateHarnessModal';

const codeModules = [
  {
    id: 'technical-design',
    name: 'Technical Design',
    description: 'Design first',
    files: [
      { path: 'docs/decision-record.md', kind: 'markdown', label: 'Decision Record', content: '' },
    ],
    agentInstructions: '',
  },
  {
    id: 'feature-development',
    name: 'Feature Development',
    description: 'Feature development',
    files: [
      { path: 'docs/feature_list.json', kind: 'json', label: 'Feature List', content: '' },
    ],
    agentInstructions: '',
  },
  {
    id: 'code-review',
    name: 'Code Review',
    description: 'Code review',
    files: [
      { path: 'docs/review-rubric.md', kind: 'markdown', label: 'Review Rubric', content: '' },
    ],
    agentInstructions: '',
  },
];

const codeSharedFiles = [
  { path: 'docs/architecture.md', kind: 'markdown', label: 'Architecture', content: '' },
];

const presets = [
  {
    id: 'doc-report',
    workType: 'document',
    name: 'Professional Report',
    description: 'Report preset',
    files: [
      { path: 'docs/document-brief.md', kind: 'markdown', label: 'Document Brief', content: '' },
    ],
  },
];

describe('CreateHarnessModal', () => {
  it('allows multi-selecting Code Work modules and composing files', () => {
    const onCreate = vi.fn();
    render(
      <CreateHarnessModal
        onClose={vi.fn()}
        onCreate={onCreate}
        presets={presets}
        codeModules={codeModules}
        codeSharedFiles={codeSharedFiles}
      />
    );

    // Step 1: Select Code Work and click Next
    fireEvent.click(screen.getByRole('button', { name: /Code Work/i }));
    fireEvent.click(screen.getByRole('button', { name: /下一步/i }));

    // Step 2: Code Work module selection. Select Technical Design and Code Review
    fireEvent.click(screen.getByRole('button', { name: /Technical Design/i }));
    fireEvent.click(screen.getByRole('button', { name: /Code Review/i }));
    fireEvent.click(screen.getByRole('button', { name: /下一步/i }));

    // Step 3: Enter name
    fireEvent.change(screen.getByLabelText('显示名称'), { target: { value: 'Code Harness' } });
    fireEvent.click(screen.getByRole('button', { name: /下一步/i }));

    // Step 4: Files selection
    fireEvent.click(screen.getByRole('button', { name: /下一步/i }));

    // Step 5: Confirm Creation
    fireEvent.click(screen.getByRole('button', { name: /确认创建/i }));

    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({
      workType: 'code',
      presetId: undefined,
      selectedModules: ['technical-design', 'code-review'],
      optionalFiles: expect.arrayContaining([
        'docs/architecture.md',
        'docs/decision-record.md',
        'docs/review-rubric.md',
      ]),
    }));
  });

  it('toggles code module off when clicked twice, and prevents advancing if none selected', () => {
    const onCreate = vi.fn();
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(
      <CreateHarnessModal
        onClose={vi.fn()}
        onCreate={onCreate}
        presets={presets}
        codeModules={codeModules}
        codeSharedFiles={codeSharedFiles}
      />
    );

    // Step 1: Select Code Work and click Next
    fireEvent.click(screen.getByRole('button', { name: /Code Work/i }));
    fireEvent.click(screen.getByRole('button', { name: /下一步/i }));

    // Step 2: Toggle module on and off
    const tdButton = screen.getByRole('button', { name: /Technical Design/i });
    fireEvent.click(tdButton); // On
    fireEvent.click(tdButton); // Off

    // Try to advance
    fireEvent.click(screen.getByRole('button', { name: /下一步/i }));
    expect(alertMock).toHaveBeenCalledWith(expect.stringContaining('请选择至少一个 Code 模块'));

    alertMock.mockRestore();
  });

  it('lets Custom Work choose from the complete standard file library', () => {
    const onCreate = vi.fn();
    render(
      <CreateHarnessModal
        onClose={vi.fn()}
        onCreate={onCreate}
        presets={presets}
        codeModules={codeModules}
        codeSharedFiles={codeSharedFiles}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Custom Work/i }));
    fireEvent.click(screen.getByRole('button', { name: /下一步/i }));
    fireEvent.change(screen.getByLabelText('显示名称'), { target: { value: 'Custom Harness' } });
    fireEvent.click(screen.getByRole('button', { name: /下一步/i }));

    expect(screen.getByText('Decision Record')).toBeInTheDocument();
    expect(screen.getByText('Feature List')).toBeInTheDocument();
    expect(screen.getByText('Review Rubric')).toBeInTheDocument();
    expect(screen.getByText('Architecture')).toBeInTheDocument();
    expect(screen.getByText('Document Brief')).toBeInTheDocument();
  });
});

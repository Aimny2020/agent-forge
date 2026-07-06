import type { HTMLAttributes } from 'react';

type StatusBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: 'neutral' | 'success' | 'danger';
};

export function StatusBadge({ tone = 'neutral', className = '', ...props }: StatusBadgeProps) {
  return (
    <span
      className={`status-badge status-badge--${tone} ${className}`.trim()}
      data-tone={tone}
      {...props}
    />
  );
}

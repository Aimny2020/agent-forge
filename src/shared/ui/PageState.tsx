import type { ReactNode } from 'react';

import { Button } from './Button';
import { Card } from './Card';

type PageStateProps =
  | { state: 'loading'; label: string }
  | { state: 'empty'; title: string; description: string }
  | { state: 'error'; title: string; description: string; onRetry: () => void }
  | { state: 'content'; children: ReactNode };

export function PageState(props: PageStateProps) {
  if (props.state === 'loading') {
    return (
      <Card className="page-state" role="status" aria-live="polite">
        <span className="loading-dot" aria-hidden="true" />
        <p>{props.label}</p>
      </Card>
    );
  }

  if (props.state === 'content') {
    return <>{props.children}</>;
  }

  return (
    <Card className="page-state" role={props.state === 'error' ? 'alert' : undefined}>
      <h2>{props.title}</h2>
      <p>{props.description}</p>
      {props.state === 'error' ? <Button onClick={props.onRetry}>重试</Button> : null}
    </Card>
  );
}

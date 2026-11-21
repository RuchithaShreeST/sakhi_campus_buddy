import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

import { Button, Card } from './ui';

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Sakhi frontend error', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="mx-auto flex min-h-screen max-w-xl items-center px-5">
        <Card className="w-full text-center">
          <AlertCircle aria-hidden="true" className="mx-auto text-sakhi-rose" size={32} />
          <h1 className="mt-3 text-xl font-bold text-sakhi-ink">Something went wrong</h1>
          <p className="mt-2 text-sm text-sakhi-muted">Your saved demo data is unchanged. Try reloading Sakhi.</p>
          <Button className="mt-5" onClick={() => window.location.reload()}>Reload app</Button>
        </Card>
      </main>
    );
  }
}

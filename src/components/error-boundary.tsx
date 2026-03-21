import { Component, ReactNode } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-background text-foreground text-center p-6">
          <div className="bg-destructive/10 w-20 h-20 rounded-full flex items-center justify-center mb-6 border border-destructive/20 shadow-sm">
            <AlertOctagon className="w-10 h-10 text-destructive" />
          </div>
          
          <h1 className="text-2xl font-semibold mb-2 tracking-tight">Application Error</h1>
          <p className="text-muted-foreground max-w-md mb-6 leading-relaxed">
            An unexpected error occurred in the Deskly application view.
          </p>
          
          {this.state.error && (
            <div className="bg-muted p-4 rounded-md border border-border w-full max-w-lg mb-8 overflow-hidden text-left relative">
              <pre className="text-xs text-muted-foreground overflow-auto max-h-40 no-scrollbar">
                {this.state.error.message}
                {'\n'}
                {this.state.error.stack}
              </pre>
            </div>
          )}

          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-medium rounded-md shadow hover:opacity-90 transition-opacity"
          >
            <RotateCcw className="w-4 h-4" />
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

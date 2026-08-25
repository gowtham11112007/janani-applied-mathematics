import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[EchoCanceller] Caught render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen w-screen bg-background">
          <div className="flex flex-col items-center gap-6 text-center max-w-md p-8 bg-panel border border-trace3/40 rounded-2xl shadow-glass">
            <AlertTriangle size={48} className="text-trace3" />
            <div>
              <h2 className="text-primary font-bold text-xl mb-2">Filter Diverged</h2>
              <p className="text-muted text-sm font-mono">
                The simulation encountered a numerical error — most likely μ was pushed beyond the stability bound
                (μ &gt; 2/(N·E[x²])). This is actually a great teaching moment about filter stability!
              </p>
              {this.state.error && (
                <pre className="mt-3 text-trace3 text-xs text-left bg-panelSolid p-3 rounded-lg overflow-x-auto border border-trace3/30">
                  {this.state.error.message}
                </pre>
              )}
            </div>
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="flex items-center gap-2 px-6 py-2.5 bg-accent/20 border border-accent/50 text-accent rounded-lg font-mono font-bold text-sm hover:bg-accent/30 transition-colors"
            >
              <RotateCcw size={16} />
              Reset &amp; Continue
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

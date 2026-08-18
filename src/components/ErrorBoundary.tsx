import React, { Component, ReactNode } from 'react';
import { AlertOctagon, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  children: ReactNode;
  onReturnToDashboard?: () => void;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, showDetails: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, showDetails: false };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, showDetails: false });
    if (this.props.onReturnToDashboard) {
      this.props.onReturnToDashboard();
    }
  };

  toggleDetails = () => {
    this.setState((prevState) => ({ showDetails: !prevState.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="w-full min-h-[400px] flex items-center justify-center bg-zinc-950 text-zinc-100 p-6 rounded-2xl border border-zinc-900">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col items-center text-center shadow-xl">
            <div className="w-12 h-12 bg-red-950/30 border border-red-900/50 rounded-full flex items-center justify-center mb-4">
              <AlertOctagon className="w-6 h-6 text-red-500" />
            </div>
            
            <h2 className="text-xl font-bold text-zinc-100 mb-2">Something went wrong</h2>
            <p className="text-zinc-400 mb-6 text-sm">
              An unexpected error occurred while rendering this view.
            </p>

            {this.state.error && (
              <div className="w-full mb-6 text-left">
                <button
                  onClick={this.toggleDetails}
                  className="flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none mb-2"
                >
                  {this.state.showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  <span>Technical details</span>
                </button>
                {this.state.showDetails && (
                  <div className="bg-zinc-950 border border-zinc-850 p-3 rounded-lg overflow-x-auto max-h-32 custom-scrollbar">
                    <p className="text-xs font-mono text-red-400 break-all leading-relaxed whitespace-pre-wrap">
                      {this.state.error.stack || this.state.error.message}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              {this.props.onReturnToDashboard && (
                <button
                  onClick={this.handleReset}
                  className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 border border-zinc-750"
                >
                  <Home className="w-4 h-4 text-zinc-400" />
                  <span>Return Home</span>
                </button>
              )}
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload App</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

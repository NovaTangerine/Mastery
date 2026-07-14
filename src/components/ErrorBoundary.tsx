import React, { Component, ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 p-6">
          <div className="max-w-md w-full bg-zinc-900 border border-red-900/50 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-red-500 mb-4">Something went wrong</h2>
            <p className="text-zinc-400 mb-6 text-sm font-mono break-all">{this.state.error?.message}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-zinc-100 text-zinc-950 rounded-full font-medium hover:bg-zinc-200 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

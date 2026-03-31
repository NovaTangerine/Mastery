import React, { useState, useEffect } from 'react';

export const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (
        event.message?.includes('ResizeObserver loop completed with undelivered notifications') ||
        event.message?.includes('ResizeObserver loop limit exceeded')
      ) {
        return;
      }
      setHasError(true);
      setError(event.error?.message || event.message || 'An unexpected error occurred');
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 p-6">
        <div className="max-w-md w-full bg-zinc-900 border border-red-900/50 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Something went wrong</h2>
          <p className="text-zinc-400 mb-6 text-sm font-mono break-all">{error}</p>
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

  return <>{children}</>;
};

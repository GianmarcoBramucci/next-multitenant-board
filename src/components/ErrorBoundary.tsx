'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Si è verificato un errore
            </h1>
            <p className="text-gray-600 mb-6">
              Qualcosa è andato storto. Ricarica la pagina per riprovare.
            </p>
            {this.state.error && (
              <details className="text-left mb-6 text-sm text-gray-500">
                <summary className="cursor-pointer font-medium mb-2">
                  Dettagli tecnici
                </summary>
                <pre className="bg-gray-100 p-3 rounded overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Ricarica la pagina
              </button>
              <button
                onClick={() => (window.location.href = '/app')}
                className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
              >
                Torna alla home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

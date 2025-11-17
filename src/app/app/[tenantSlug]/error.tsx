'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function TenantError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Tenant layout error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Errore nel caricamento dell'organizzazione
        </h1>
        <p className="text-gray-600 mb-6">
          Non è stato possibile accedere a questa organizzazione.
          Potrebbe non esistere o non hai i permessi necessari.
        </p>

        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Riprova
          </button>
          <Link
            href="/app"
            className="block w-full bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition"
          >
            Torna alle tue organizzazioni
          </Link>
        </div>

        {process.env.NODE_ENV === 'development' && error.message && (
          <details className="mt-6 text-left text-sm text-gray-500">
            <summary className="cursor-pointer font-medium">Dettagli tecnici</summary>
            <pre className="mt-2 bg-gray-100 p-3 rounded overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

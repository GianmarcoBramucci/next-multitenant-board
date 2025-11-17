'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function BoardsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams();
  const tenantSlug = params?.tenantSlug as string;

  useEffect(() => {
    console.error('Boards page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
        <div className="text-6xl mb-4">📋</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Errore nel caricamento dei board
        </h1>
        <p className="text-gray-600 mb-6">
          Si è verificato un problema durante il caricamento dei tuoi board.
        </p>

        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Riprova
          </button>
          {tenantSlug && (
            <Link
              href={`/app/${tenantSlug}/boards`}
              className="block w-full bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition"
            >
              Ricarica la pagina
            </Link>
          )}
          <Link
            href="/app"
            className="block w-full text-sm text-gray-600 hover:text-blue-600 transition"
          >
            Torna alla home
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

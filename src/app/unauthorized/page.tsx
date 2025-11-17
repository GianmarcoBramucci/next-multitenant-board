import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserTenants } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function UnauthorizedPage({
  searchParams,
}: {
  searchParams: { from?: string };
}) {
  const session = await getServerSession(authOptions);

  // Se non autenticato, redirect a login
  if (!session?.user) {
    redirect('/login');
  }

  // Ottieni i tenant dell'utente
  const userTenants = await getUserTenants(session.user.id);

  // Se ha tenant, ottieni il primo per il redirect
  const defaultTenant = userTenants[0];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Accesso non autorizzato
        </h1>
        <p className="text-gray-600 mb-6">
          Non hai i permessi per accedere a questa risorsa.
          {searchParams.from && (
            <span className="block mt-2 text-sm text-gray-500">
              Risorsa richiesta: <code className="bg-gray-100 px-1 rounded">{searchParams.from}</code>
            </span>
          )}
        </p>

        <div className="space-y-3">
          {defaultTenant ? (
            <Link
              href={`/app/${defaultTenant.slug}/boards`}
              className="block w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Torna ai tuoi board
            </Link>
          ) : (
            <Link
              href="/app"
              className="block w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Vai alla home
            </Link>
          )}

          {userTenants.length > 1 && (
            <details className="text-left">
              <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-700">
                Scegli un'altra organizzazione ({userTenants.length} disponibili)
              </summary>
              <ul className="mt-3 space-y-2">
                {userTenants.map(ut => (
                  <li key={ut.id}>
                    <Link
                      href={`/app/${ut.slug}/boards`}
                      className="block text-sm text-gray-700 hover:text-blue-600 hover:bg-gray-50 px-3 py-2 rounded"
                    >
                      {ut.name}
                      <span className="text-xs text-gray-500 ml-2">({ut.role})</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>

        <div className="mt-6 text-sm text-gray-500">
          Se pensi che questo sia un errore, contatta l'amministratore della tua organizzazione.
        </div>
      </div>
    </div>
  );
}

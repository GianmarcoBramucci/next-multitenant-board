import { redirect } from 'next/navigation';
import { getCurrentUser, getUserTenants } from '@/lib/auth';
import Link from 'next/link';

export default async function AppPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const tenants = await getUserTenants(user.id);

  if (tenants.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="text-6xl mb-4">🏢</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Nessuna organizzazione trovata
          </h1>
          <p className="text-gray-600 mb-6">
            Non fai ancora parte di nessuna organizzazione. Crea la tua prima organizzazione o unisciti a una esistente.
          </p>

          <div className="space-y-3">
            <Link
              href="/register"
              className="block w-full bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 transition font-medium"
            >
              Crea nuova organizzazione
            </Link>
            <p className="text-sm text-gray-500">
              oppure chiedi a un amministratore di invitarti nella sua organizzazione
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Già loggato come:</p>
            <p className="font-medium text-gray-900">{user.email}</p>
            <Link
              href="/api/auth/signout"
              className="inline-block mt-3 text-sm text-red-600 hover:text-red-700"
            >
              Disconnetti
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to first tenant's boards
  redirect(`/app/${tenants[0].slug}/boards`);
}

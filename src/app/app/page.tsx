import { redirect } from 'next/navigation';
import { getCurrentUser, getUserTenants } from '@/lib/auth';

export default async function AppPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const tenants = await getUserTenants(user.id);

  if (tenants.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            No organizations found
          </h1>
          <p className="text-gray-600">
            You are not a member of any organization yet.
          </p>
        </div>
      </div>
    );
  }

  // Redirect to first tenant's boards
  redirect(`/app/${tenants[0].slug}/boards`);
}

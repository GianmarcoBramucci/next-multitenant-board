import { redirect } from 'next/navigation';
import { requireAuth, getUserTenants } from '@/lib/auth';
import { getTenantBySlug } from '@/lib/tenant';
import TenantNav from '@/components/TenantNav';

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const user = await requireAuth();
  const tenant = await getTenantBySlug(tenantSlug);

  if (!tenant) {
    redirect('/app');
  }

  const tenants = await getUserTenants(user.id);
  const currentTenant = tenants.find((t) => t.slug === tenantSlug);

  if (!currentTenant) {
    redirect('/app');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TenantNav user={user} tenant={currentTenant} tenants={tenants} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

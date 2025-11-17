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
  try {
    const { tenantSlug } = await params;
    const user = await requireAuth();

    // Verifica esistenza tenant
    const tenant = await getTenantBySlug(tenantSlug);
    if (!tenant) {
      redirect(`/unauthorized?from=/app/${tenantSlug}`);
    }

    // Verifica membership utente
    const tenants = await getUserTenants(user.id);
    const currentTenant = tenants.find((t) => t.slug === tenantSlug);

    if (!currentTenant) {
      redirect(`/unauthorized?from=/app/${tenantSlug}`);
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <TenantNav user={user} tenant={currentTenant} tenants={tenants} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    );
  } catch (error) {
    // Se l'errore è già un redirect, rilancia
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      throw error;
    }

    // Log errore e redirect a unauthorized
    console.error('Error in TenantLayout:', error);
    redirect('/unauthorized');
  }
}

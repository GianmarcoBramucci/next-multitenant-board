// Tenants API route - Get all tenants for the current user

import { requireAuth } from '@/lib/auth';
import { tenantService } from '@/core/services/tenantService';
import { ok, unauthorized, internalServerError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireAuth();

    if (!user || !user.id) {
      return unauthorized();
    }

    const tenants = await tenantService.getTenantsByUserId(user.id);

    return ok({
      tenants: tenants.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        role: t.role,
        createdAt: t.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('[Tenants Error]', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorized();
    }

    return internalServerError('Failed to fetch tenants');
  }
}

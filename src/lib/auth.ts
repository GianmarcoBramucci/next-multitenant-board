// Auth helpers - NextAuth utilities and session management

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { tenantRepository } from '@/core/repositories/tenantRepository';
import { TenantSummary } from '@/types/dto/auth';

/**
 * Get the current user session (server-side only)
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

/**
 * Require authentication - throws if user is not logged in
 */
export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    throw new Error('Unauthorized');
  }

  return user;
}

/**
 * Get all tenants for the current user
 */
export async function getUserTenants(userId: string): Promise<TenantSummary[]> {
  const tenants = await tenantRepository.findByUserId(userId);

  return tenants.map((tenant) => ({
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    role: tenant.role,
  }));
}

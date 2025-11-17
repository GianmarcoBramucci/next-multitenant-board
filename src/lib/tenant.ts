// Tenant helpers - Multi-tenancy utilities

import { tenantRepository } from '@/core/repositories/tenantRepository';
import { Tenant, UserTenantMembership } from '@/core/domain/models';

/**
 * Get tenant by slug
 */
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  return tenantRepository.findBySlug(slug);
}

/**
 * Require tenant by slug - throws if not found
 */
export async function requireTenantBySlug(slug: string): Promise<Tenant> {
  const tenant = await getTenantBySlug(slug);

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  return tenant;
}

/**
 * Check if a user is a member of a tenant
 */
export async function checkUserMembership(
  userId: string,
  tenantId: string
): Promise<UserTenantMembership | null> {
  return tenantRepository.checkMembership(userId, tenantId);
}

/**
 * Require user membership - throws if not a member
 */
export async function requireUserMembership(
  userId: string,
  tenantId: string
): Promise<UserTenantMembership> {
  const membership = await checkUserMembership(userId, tenantId);

  if (!membership) {
    throw new Error('User is not a member of this tenant');
  }

  return membership;
}

/**
 * Check if user has a specific role in a tenant
 */
export async function checkUserRole(
  userId: string,
  tenantId: string,
  requiredRoles: Array<'owner' | 'admin' | 'member'>
): Promise<boolean> {
  const membership = await checkUserMembership(userId, tenantId);

  if (!membership) {
    return false;
  }

  return requiredRoles.includes(membership.role);
}

/**
 * Require specific role - throws if user doesn't have it
 */
export async function requireUserRole(
  userId: string,
  tenantId: string,
  requiredRoles: Array<'owner' | 'admin' | 'member'>
): Promise<void> {
  const hasRole = await checkUserRole(userId, tenantId, requiredRoles);

  if (!hasRole) {
    throw new Error('Insufficient permissions');
  }
}

/**
 * Get user's role in a tenant
 */
export async function getUserRole(
  userId: string,
  tenantId: string
): Promise<string> {
  const membership = await checkUserMembership(userId, tenantId);

  if (!membership) {
    throw new Error('User is not a member of this tenant');
  }

  return membership.role;
}

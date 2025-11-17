// Tenant Repository - Data access layer for Tenant entity

import { prisma } from '@/lib/prisma';
import { Tenant, UserTenantMembership } from '@/core/domain/models';

export const tenantRepository = {
  /**
   * Find a tenant by slug
   */
  async findBySlug(slug: string): Promise<Tenant | null> {
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) return null;

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    };
  },

  /**
   * Find a tenant by ID
   */
  async findById(id: string): Promise<Tenant | null> {
    const tenant = await prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) return null;

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    };
  },

  /**
   * Find a tenant by name
   */
  async findByName(name: string): Promise<Tenant | null> {
    const tenant = await prisma.tenant.findUnique({
      where: { name },
    });

    if (!tenant) return null;

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    };
  },

  /**
   * Create a new tenant
   */
  async create(data: { name: string; slug: string }): Promise<Tenant> {
    const tenant = await prisma.tenant.create({
      data: {
        name: data.name,
        slug: data.slug,
      },
    });

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    };
  },

  /**
   * Get all tenants for a user
   */
  async findByUserId(userId: string): Promise<
    Array<Tenant & { role: string }>
  > {
    const userTenants = await prisma.userTenant.findMany({
      where: { userId },
      include: { tenant: true },
    });

    return userTenants.map((ut) => ({
      id: ut.tenant.id,
      name: ut.tenant.name,
      slug: ut.tenant.slug,
      createdAt: ut.tenant.createdAt,
      updatedAt: ut.tenant.updatedAt,
      role: ut.role,
    }));
  },

  /**
   * Check if a user is a member of a tenant
   */
  async checkMembership(
    userId: string,
    tenantId: string
  ): Promise<UserTenantMembership | null> {
    const membership = await prisma.userTenant.findUnique({
      where: {
        userId_tenantId: { userId, tenantId },
      },
    });

    if (!membership) return null;

    return {
      id: membership.id,
      userId: membership.userId,
      tenantId: membership.tenantId,
      role: membership.role as 'owner' | 'admin' | 'member',
      createdAt: membership.createdAt,
    };
  },

  /**
   * Add a user to a tenant
   */
  async addMember(data: {
    userId: string;
    tenantId: string;
    role: 'owner' | 'admin' | 'member';
  }): Promise<UserTenantMembership> {
    const membership = await prisma.userTenant.create({
      data: {
        userId: data.userId,
        tenantId: data.tenantId,
        role: data.role,
      },
    });

    return {
      id: membership.id,
      userId: membership.userId,
      tenantId: membership.tenantId,
      role: membership.role as 'owner' | 'admin' | 'member',
      createdAt: membership.createdAt,
    };
  },
};

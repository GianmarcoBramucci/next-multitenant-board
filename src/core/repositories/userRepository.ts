// User Repository - Data access layer for User entity

import { prisma } from '@/lib/prisma';
import { User, UserWithPassword } from '@/core/domain/models';

export const userRepository = {
  /**
   * Find a user by email
   */
  async findByEmail(email: string): Promise<UserWithPassword | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      isActive: user.isActive,
      passwordHash: user.passwordHash,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },

  /**
   * Find a user by ID
   */
  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },

  /**
   * Create a new user
   */
  async create(data: {
    email: string;
    passwordHash: string;
    displayName: string;
  }): Promise<User> {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        displayName: data.displayName,
      },
    });

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },

  /**
   * Get users by tenant ID
   */
  async findByTenantId(tenantId: string): Promise<User[]> {
    const userTenants = await prisma.userTenant.findMany({
      where: { tenantId },
      include: { user: true },
    });

    return userTenants.map((ut) => ({
      id: ut.user.id,
      email: ut.user.email,
      displayName: ut.user.displayName,
      isActive: ut.user.isActive,
      createdAt: ut.user.createdAt,
      updatedAt: ut.user.updatedAt,
    }));
  },
};

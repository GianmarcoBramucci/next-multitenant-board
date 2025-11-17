// Tenant Service - Business logic for tenant operations

import { tenantRepository } from '@/core/repositories/tenantRepository';
import { userRepository } from '@/core/repositories/userRepository';
import { Tenant } from '@/core/domain/models';
import { createSlug } from '@/core/domain/valueObjects';
import bcrypt from 'bcrypt';

export const tenantService = {
  /**
   * Create a new tenant with owner user (used during registration)
   */
  async createTenantWithOwner(data: {
    email: string;
    password: string;
    displayName: string;
    tenantName: string;
  }): Promise<{ tenant: Tenant; userId: string }> {
    // Check if user already exists
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('Un utente con questa email esiste già');
    }

    // Check if tenant name already exists (case insensitive)
    const existingTenantByName = await tenantRepository.findByName(data.tenantName);
    if (existingTenantByName) {
      throw new Error('Un\'organizzazione con questo nome esiste già. Scegli un nome diverso.');
    }

    // Create slug from tenant name
    let slug = createSlug(data.tenantName);

    // Check if slug is unique, if not append number
    let existingTenant = await tenantRepository.findBySlug(slug);
    let counter = 1;
    while (existingTenant) {
      slug = `${createSlug(data.tenantName)}-${counter}`;
      existingTenant = await tenantRepository.findBySlug(slug);
      counter++;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await userRepository.create({
      email: data.email,
      passwordHash,
      displayName: data.displayName,
    });

    // Create tenant
    const tenant = await tenantRepository.create({
      name: data.tenantName,
      slug,
    });

    // Add user as owner
    await tenantRepository.addMember({
      userId: user.id,
      tenantId: tenant.id,
      role: 'owner',
    });

    return { tenant, userId: user.id };
  },

  /**
   * Add user to existing tenant (join organization)
   */
  async addUserToExistingTenant(data: {
    email: string;
    password: string;
    displayName: string;
    tenantSlug: string;
  }): Promise<{ tenant: Tenant; userId: string }> {
    // Check if user already exists
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('Un utente con questa email esiste già');
    }

    // Find tenant by slug
    const tenant = await tenantRepository.findBySlug(data.tenantSlug);
    if (!tenant) {
      throw new Error('Organizzazione non trovata. Verifica il codice di invito.');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await userRepository.create({
      email: data.email,
      passwordHash,
      displayName: data.displayName,
    });

    // Add user as member (not owner)
    await tenantRepository.addMember({
      userId: user.id,
      tenantId: tenant.id,
      role: 'member',
    });

    return { tenant, userId: user.id };
  },

  /**
   * Get all tenants for a user
   */
  async getTenantsByUserId(userId: string) {
    return tenantRepository.findByUserId(userId);
  },

  /**
   * Get tenant by slug
   */
  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    return tenantRepository.findBySlug(slug);
  },
};

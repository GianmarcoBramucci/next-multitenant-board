// Auth DTOs - Input/Output types for authentication

import { User, Tenant, UserTenantMembership } from '@/core/domain/models';

// ============================================================================
// INPUT DTOs
// ============================================================================

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
  tenantName: string;
}

// ============================================================================
// OUTPUT DTOs
// ============================================================================

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
}

export interface TenantSummary {
  id: string;
  name: string;
  slug: string;
  role: string;
}

export interface AuthResponse {
  user: AuthUser;
  tenants: TenantSummary[];
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

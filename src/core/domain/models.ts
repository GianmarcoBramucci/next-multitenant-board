// Domain Models - Layer 1
// Pure TypeScript types for domain entities, independent of infrastructure

export type TenantRole = 'owner' | 'admin' | 'member';

export type TodoStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export type TodoAction =
  | 'CREATED'
  | 'UPDATED'
  | 'DELETED'
  | 'STATUS_CHANGED'
  | 'ASSIGNED'
  | 'UNASSIGNED';

// ============================================================================
// TENANT
// ============================================================================
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// USER
// ============================================================================
export interface User {
  id: string;
  email: string;
  displayName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithPassword extends User {
  passwordHash: string;
}

// ============================================================================
// USER TENANT MEMBERSHIP
// ============================================================================
export interface UserTenantMembership {
  id: string;
  userId: string;
  tenantId: string;
  role: TenantRole;
  createdAt: Date;
}

export interface UserTenantMembershipWithDetails extends UserTenantMembership {
  user: User;
  tenant: Tenant;
}

// ============================================================================
// BOARD
// ============================================================================
export interface Board {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BoardWithCreator extends Board {
  createdBy: User;
}

export interface BoardWithDetails extends BoardWithCreator {
  tenant: Tenant;
  todosCount: number;
}

// ============================================================================
// TODO
// ============================================================================
export interface Todo {
  id: string;
  tenantId: string;
  boardId: string;
  title: string;
  description: string | null;
  status: TodoStatus;
  assigneeId: string | null;
  createdById: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TodoWithDetails extends Todo {
  assignee: User | null;
  createdBy: User;
}

// ============================================================================
// TODO ACTIVITY
// ============================================================================
export interface TodoActivity {
  id: string;
  tenantId: string;
  boardId: string;
  todoId: string;
  userId: string;
  action: TodoAction;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface TodoActivityWithDetails extends TodoActivity {
  user: User;
  todo: Todo;
}

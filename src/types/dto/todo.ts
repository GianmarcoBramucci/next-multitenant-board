// Todo DTOs - Input/Output types for todo operations

import { TodoStatus } from '@/core/domain/models';

// ============================================================================
// INPUT DTOs
// ============================================================================

export interface CreateTodoInput {
  title: string;
  description?: string;
  status?: TodoStatus;
  assigneeId?: string;
}

export interface UpdateTodoInput {
  title?: string;
  description?: string | null;
  status?: TodoStatus;
  assigneeId?: string | null;
  position?: number;
}

// ============================================================================
// OUTPUT DTOs
// ============================================================================

export interface TodoItem {
  id: string;
  boardId: string;
  title: string;
  description: string | null;
  status: TodoStatus;
  position: number;
  createdAt: string;
  updatedAt: string;
  assignee: {
    id: string;
    displayName: string;
  } | null;
  createdBy: {
    id: string;
    displayName: string;
  };
}

export interface TodoDetails extends TodoItem {
  tenantId: string;
}

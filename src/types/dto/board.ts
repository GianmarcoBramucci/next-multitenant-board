// Board DTOs - Input/Output types for board operations

// ============================================================================
// INPUT DTOs
// ============================================================================

export interface CreateBoardInput {
  name: string;
  description?: string;
}

export interface UpdateBoardInput {
  name?: string;
  description?: string | null;
}

// ============================================================================
// OUTPUT DTOs
// ============================================================================

export interface BoardSummary {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    displayName: string;
  };
  todosCount: number;
}

export interface BoardDetails {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    displayName: string;
    email: string;
  };
}

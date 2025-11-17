// Board Service - Business logic for board operations

import { boardRepository } from '@/core/repositories/boardRepository';
import { requireUserMembership, checkUserRole } from '@/lib/tenant';
import { Board, BoardWithCreator } from '@/core/domain/models';
import { BoardSummary } from '@/types/dto/board';
import { boardStreamRegistry } from '@/lib/sse/boardStreamRegistry';
import { createBoardEvent } from '@/lib/sse/events';

/**
 * Check if user can modify/delete a board
 * User must be either the creator or an owner of the tenant
 */
async function canModifyBoard(
  userId: string,
  tenantId: string,
  createdById: string
): Promise<boolean> {
  // Check if user is the creator
  if (userId === createdById) {
    return true;
  }

  // Check if user is an owner of the tenant
  const isOwner = await checkUserRole(userId, tenantId, ['owner']);
  return isOwner;
}

function toBoardSummary(board: BoardWithCreator): BoardSummary {
  return {
    id: board.id,
    name: board.name,
    description: board.description,
    createdAt: board.createdAt.toISOString(),
    updatedAt: board.updatedAt.toISOString(),
    createdBy: {
      id: board.createdBy.id,
      displayName: board.createdBy.displayName,
    },
    todosCount: 0,
  };
}

export const boardService = {
  /**
   * Get all boards for a tenant (with membership check)
   */
  async getBoardsForTenant(
    userId: string,
    tenantId: string
  ): Promise<BoardSummary[]> {
    // Verify user is a member of the tenant
    await requireUserMembership(userId, tenantId);

    const boards = await boardRepository.findByTenantId(tenantId);

    return boards.map(toBoardSummary);
  },

  /**
   * Get a single board by ID (with membership check)
   */
  async getBoardById(userId: string, tenantId: string, boardId: string) {
    // Verify user is a member of the tenant
    await requireUserMembership(userId, tenantId);

    const board = await boardRepository.findByIdAndTenantId(boardId, tenantId);

    if (!board) {
      throw new Error('Board not found');
    }

    return {
      id: board.id,
      tenantId: board.tenantId,
      name: board.name,
      description: board.description,
      createdAt: board.createdAt.toISOString(),
      updatedAt: board.updatedAt.toISOString(),
      createdBy: {
        id: board.createdBy.id,
        displayName: board.createdBy.displayName,
        email: board.createdBy.email,
      },
    };
  },

  /**
   * Create a new board
   */
  async createBoard(
    userId: string,
    tenantId: string,
    data: { name: string; description?: string }
  ): Promise<Board> {
    // Verify user is a member of the tenant
    await requireUserMembership(userId, tenantId);

    // Check if board with same name exists
    const exists = await boardRepository.existsByNameAndTenant(
      data.name,
      tenantId
    );

    if (exists) {
      throw new Error('A board with this name already exists');
    }

    const board = await boardRepository.create({
      tenantId,
      name: data.name,
      description: data.description,
      createdById: userId,
    });

    const boardWithCreator = await boardRepository.findById(board.id);
    if (boardWithCreator) {
      const summary = toBoardSummary(boardWithCreator);
      const event = createBoardEvent.boardCreated(userId, summary);
      boardStreamRegistry.broadcastToTenant(tenantId, event, userId);
    }

    return board;
  },

  /**
   * Update a board
   */
  async updateBoard(
    userId: string,
    tenantId: string,
    boardId: string,
    data: { name?: string; description?: string | null }
  ): Promise<Board> {
    // Verify user is a member of the tenant
    await requireUserMembership(userId, tenantId);

    // Verify board exists and belongs to tenant
    const board = await boardRepository.findByIdAndTenantId(boardId, tenantId);

    if (!board) {
      throw new Error('Board not found');
    }

    // Check permissions: only creator or owner can update
    const hasPermission = await canModifyBoard(userId, tenantId, board.createdById);
    if (!hasPermission) {
      throw new Error('You do not have permission to update this board');
    }

    // If updating name, check for duplicates
    if (data.name && data.name !== board.name) {
      const exists = await boardRepository.existsByNameAndTenant(
        data.name,
        tenantId
      );

      if (exists) {
        throw new Error('A board with this name already exists');
      }
    }

    const updatedBoard = await boardRepository.update(boardId, data);

    // Broadcast SSE event to all clients connected to this board
    const event = createBoardEvent.boardUpdated(userId, boardId, data);
    boardStreamRegistry.broadcast(boardId, event);

    // ALSO broadcast to tenant-level (for board list updates)
    boardStreamRegistry.broadcastToTenant(tenantId, event);

    return updatedBoard;
  },

  /**
   * Delete a board
   */
  async deleteBoard(
    userId: string,
    tenantId: string,
    boardId: string
  ): Promise<void> {
    // Verify user is a member of the tenant
    await requireUserMembership(userId, tenantId);

    // Verify board exists and belongs to tenant
    const board = await boardRepository.findByIdAndTenantId(boardId, tenantId);

    if (!board) {
      throw new Error('Board not found');
    }

    // Check permissions: only creator or owner can delete
    const hasPermission = await canModifyBoard(userId, tenantId, board.createdById);
    if (!hasPermission) {
      throw new Error('You do not have permission to delete this board');
    }

    // Delete the board
    await boardRepository.delete(boardId);

    // Broadcast SSE event to all clients connected to this board
    const event = createBoardEvent.boardDeleted(userId, boardId);
    boardStreamRegistry.broadcast(boardId, event);

    // ALSO broadcast to tenant-level (for board list updates)
    boardStreamRegistry.broadcastToTenant(tenantId, event);
  },
};

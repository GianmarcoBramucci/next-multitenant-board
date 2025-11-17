// Board Repository - Data access layer for Board entity

import { prisma } from '@/lib/prisma';
import { Board, BoardWithCreator } from '@/core/domain/models';

export const boardRepository = {
  /**
   * Find all boards for a tenant
   */
  async findByTenantId(tenantId: string): Promise<BoardWithCreator[]> {
    const boards = await prisma.board.findMany({
      where: { tenantId },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            displayName: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        _count: {
          select: { todos: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return boards.map((board) => ({
      id: board.id,
      tenantId: board.tenantId,
      name: board.name,
      description: board.description,
      createdById: board.createdById,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
      createdBy: board.createdBy,
    }));
  },

  /**
   * Find a board by ID
   */
  async findById(id: string): Promise<BoardWithCreator | null> {
    const board = await prisma.board.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            displayName: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!board) return null;

    return {
      id: board.id,
      tenantId: board.tenantId,
      name: board.name,
      description: board.description,
      createdById: board.createdById,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
      createdBy: board.createdBy,
    };
  },

  /**
   * Find a board by ID and tenant ID
   */
  async findByIdAndTenantId(
    id: string,
    tenantId: string
  ): Promise<BoardWithCreator | null> {
    const board = await prisma.board.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            displayName: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!board) return null;

    return {
      id: board.id,
      tenantId: board.tenantId,
      name: board.name,
      description: board.description,
      createdById: board.createdById,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
      createdBy: board.createdBy,
    };
  },

  /**
   * Create a new board
   */
  async create(data: {
    tenantId: string;
    name: string;
    description?: string;
    createdById: string;
  }): Promise<Board> {
    const board = await prisma.board.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        description: data.description,
        createdById: data.createdById,
      },
    });

    return {
      id: board.id,
      tenantId: board.tenantId,
      name: board.name,
      description: board.description,
      createdById: board.createdById,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
    };
  },

  /**
   * Update a board
   */
  async update(
    id: string,
    data: {
      name?: string;
      description?: string | null;
    }
  ): Promise<Board> {
    const board = await prisma.board.update({
      where: { id },
      data,
    });

    return {
      id: board.id,
      tenantId: board.tenantId,
      name: board.name,
      description: board.description,
      createdById: board.createdById,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
    };
  },

  /**
   * Delete a board
   */
  async delete(id: string): Promise<void> {
    await prisma.board.delete({
      where: { id },
    });
  },

  /**
   * Check if a board exists by name for a tenant
   */
  async existsByNameAndTenant(
    name: string,
    tenantId: string
  ): Promise<boolean> {
    const count = await prisma.board.count({
      where: {
        name,
        tenantId,
      },
    });

    return count > 0;
  },
};

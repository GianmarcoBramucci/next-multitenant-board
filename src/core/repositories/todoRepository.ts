// Todo Repository - Data access layer for Todo entity

import { prisma } from '@/lib/prisma';
import { Todo, TodoWithDetails, TodoStatus } from '@/core/domain/models';

export const todoRepository = {
  /**
   * Find all todos for a board
   */
  async findByBoardId(boardId: string): Promise<TodoWithDetails[]> {
    const todos = await prisma.todo.findMany({
      where: { boardId },
      include: {
        assignee: {
          select: {
            id: true,
            email: true,
            displayName: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
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
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });

    return todos.map((todo) => ({
      id: todo.id,
      tenantId: todo.tenantId,
      boardId: todo.boardId,
      title: todo.title,
      description: todo.description,
      status: todo.status as TodoStatus,
      assigneeId: todo.assigneeId,
      createdById: todo.createdById,
      position: todo.position,
      createdAt: todo.createdAt,
      updatedAt: todo.updatedAt,
      assignee: todo.assignee,
      createdBy: todo.createdBy,
    }));
  },

  /**
   * Find a todo by ID
   */
  async findById(id: string): Promise<TodoWithDetails | null> {
    const todo = await prisma.todo.findUnique({
      where: { id },
      include: {
        assignee: {
          select: {
            id: true,
            email: true,
            displayName: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
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

    if (!todo) return null;

    return {
      id: todo.id,
      tenantId: todo.tenantId,
      boardId: todo.boardId,
      title: todo.title,
      description: todo.description,
      status: todo.status as TodoStatus,
      assigneeId: todo.assigneeId,
      createdById: todo.createdById,
      position: todo.position,
      createdAt: todo.createdAt,
      updatedAt: todo.updatedAt,
      assignee: todo.assignee,
      createdBy: todo.createdBy,
    };
  },

  /**
   * Find a todo by ID and tenant ID
   */
  async findByIdAndTenantId(
    id: string,
    tenantId: string
  ): Promise<TodoWithDetails | null> {
    const todo = await prisma.todo.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        assignee: {
          select: {
            id: true,
            email: true,
            displayName: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
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

    if (!todo) return null;

    return {
      id: todo.id,
      tenantId: todo.tenantId,
      boardId: todo.boardId,
      title: todo.title,
      description: todo.description,
      status: todo.status as TodoStatus,
      assigneeId: todo.assigneeId,
      createdById: todo.createdById,
      position: todo.position,
      createdAt: todo.createdAt,
      updatedAt: todo.updatedAt,
      assignee: todo.assignee,
      createdBy: todo.createdBy,
    };
  },

  /**
   * Create a new todo
   */
  async create(data: {
    tenantId: string;
    boardId: string;
    title: string;
    description?: string;
    status?: TodoStatus;
    assigneeId?: string;
    createdById: string;
    position?: number;
  }): Promise<Todo> {
    // If no position specified, get max position + 1
    const position =
      data.position ??
      (await this.getNextPosition(data.boardId, data.status ?? 'TODO'));

    const todo = await prisma.todo.create({
      data: {
        tenantId: data.tenantId,
        boardId: data.boardId,
        title: data.title,
        description: data.description,
        status: data.status ?? 'TODO',
        assigneeId: data.assigneeId,
        createdById: data.createdById,
        position,
      },
    });

    return {
      id: todo.id,
      tenantId: todo.tenantId,
      boardId: todo.boardId,
      title: todo.title,
      description: todo.description,
      status: todo.status as TodoStatus,
      assigneeId: todo.assigneeId,
      createdById: todo.createdById,
      position: todo.position,
      createdAt: todo.createdAt,
      updatedAt: todo.updatedAt,
    };
  },

  /**
   * Update a todo
   */
  async update(
    id: string,
    data: {
      title?: string;
      description?: string | null;
      status?: TodoStatus;
      assigneeId?: string | null;
      position?: number;
    }
  ): Promise<Todo> {
    const todo = await prisma.todo.update({
      where: { id },
      data,
    });

    return {
      id: todo.id,
      tenantId: todo.tenantId,
      boardId: todo.boardId,
      title: todo.title,
      description: todo.description,
      status: todo.status as TodoStatus,
      assigneeId: todo.assigneeId,
      createdById: todo.createdById,
      position: todo.position,
      createdAt: todo.createdAt,
      updatedAt: todo.updatedAt,
    };
  },

  /**
   * Delete a todo
   */
  async delete(id: string): Promise<void> {
    await prisma.todo.delete({
      where: { id },
    });
  },

  /**
   * Get next position for a todo in a board with a specific status
   */
  async getNextPosition(boardId: string, status: TodoStatus): Promise<number> {
    const maxTodo = await prisma.todo.findFirst({
      where: { boardId, status },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    return maxTodo ? maxTodo.position + 1 : 0;
  },

  /**
   * Count todos by status for a board
   */
  async countByStatus(
    boardId: string,
    status: TodoStatus
  ): Promise<number> {
    return prisma.todo.count({
      where: {
        boardId,
        status,
      },
    });
  },
};

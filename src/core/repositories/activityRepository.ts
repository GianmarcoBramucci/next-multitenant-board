// Activity Repository - Data access layer for TodoActivity entity

import { prisma } from '@/lib/prisma';
import { TodoActivity, TodoAction } from '@/core/domain/models';

export const activityRepository = {
  /**
   * Create a new activity
   */
  async create(data: {
    tenantId: string;
    boardId: string;
    todoId: string;
    userId: string;
    action: TodoAction;
    metadata?: Record<string, unknown>;
  }): Promise<TodoActivity> {
    const activity = await prisma.todoActivity.create({
      data: {
        tenantId: data.tenantId,
        boardId: data.boardId,
        todoId: data.todoId,
        userId: data.userId,
        action: data.action,
        metadata: data.metadata ? (data.metadata as any) : null,
      },
    });

    return {
      id: activity.id,
      tenantId: activity.tenantId,
      boardId: activity.boardId,
      todoId: activity.todoId,
      userId: activity.userId,
      action: activity.action as TodoAction,
      metadata: activity.metadata as Record<string, unknown> | null,
      createdAt: activity.createdAt,
    };
  },

  /**
   * Find activities by board ID
   */
  async findByBoardId(
    boardId: string,
    limit: number = 50
  ): Promise<TodoActivity[]> {
    const activities = await prisma.todoActivity.findMany({
      where: { boardId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return activities.map((activity) => ({
      id: activity.id,
      tenantId: activity.tenantId,
      boardId: activity.boardId,
      todoId: activity.todoId,
      userId: activity.userId,
      action: activity.action as TodoAction,
      metadata: activity.metadata as Record<string, unknown> | null,
      createdAt: activity.createdAt,
    }));
  },

  /**
   * Find activities by todo ID
   */
  async findByTodoId(
    todoId: string,
    limit: number = 50
  ): Promise<TodoActivity[]> {
    const activities = await prisma.todoActivity.findMany({
      where: { todoId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return activities.map((activity) => ({
      id: activity.id,
      tenantId: activity.tenantId,
      boardId: activity.boardId,
      todoId: activity.todoId,
      userId: activity.userId,
      action: activity.action as TodoAction,
      metadata: activity.metadata as Record<string, unknown> | null,
      createdAt: activity.createdAt,
    }));
  },
};

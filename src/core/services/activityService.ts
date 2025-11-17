// Activity Service - Business logic for activity/audit log operations

import { activityRepository } from '@/core/repositories/activityRepository';
import { requireUserMembership } from '@/lib/tenant';
import { TodoActivity } from '@/core/domain/models';

export const activityService = {
  /**
   * Get activities for a board
   */
  async getActivitiesByBoardId(
    userId: string,
    tenantId: string,
    boardId: string,
    limit: number = 50
  ): Promise<TodoActivity[]> {
    // Verify user is a member of the tenant
    await requireUserMembership(userId, tenantId);

    return activityRepository.findByBoardId(boardId, limit);
  },

  /**
   * Get activities for a specific todo
   */
  async getActivitiesByTodoId(
    userId: string,
    tenantId: string,
    todoId: string,
    limit: number = 50
  ): Promise<TodoActivity[]> {
    // Verify user is a member of the tenant
    await requireUserMembership(userId, tenantId);

    return activityRepository.findByTodoId(todoId, limit);
  },
};

// Todo Service - Business logic for todo operations with real-time SSE

import { todoRepository } from '@/core/repositories/todoRepository';
import { boardRepository } from '@/core/repositories/boardRepository';
import { activityRepository } from '@/core/repositories/activityRepository';
import { requireUserMembership } from '@/lib/tenant';
import { Todo, TodoStatus } from '@/core/domain/models';
import { TodoItem } from '@/types/dto/todo';
import { boardStreamRegistry } from '@/lib/sse/boardStreamRegistry';
import { createBoardEvent } from '@/lib/sse/events';

/**
 * Convert a Todo with details to TodoItem DTO
 */
function todoToDTO(todo: {
  id: string;
  boardId: string;
  title: string;
  description: string | null;
  status: TodoStatus;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  assignee: { id: string; displayName: string } | null;
  createdBy: { id: string; displayName: string };
}): TodoItem {
  return {
    id: todo.id,
    boardId: todo.boardId,
    title: todo.title,
    description: todo.description,
    status: todo.status,
    position: todo.position,
    createdAt: todo.createdAt.toISOString(),
    updatedAt: todo.updatedAt.toISOString(),
    assignee: todo.assignee,
    createdBy: todo.createdBy,
  };
}

export const todoService = {
  /**
   * Get all todos for a board
   */
  async getTodosByBoardId(
    userId: string,
    tenantId: string,
    boardId: string
  ): Promise<TodoItem[]> {
    // Verify user is a member of the tenant
    await requireUserMembership(userId, tenantId);

    // Verify board exists and belongs to tenant
    const board = await boardRepository.findByIdAndTenantId(boardId, tenantId);

    if (!board) {
      throw new Error('Board not found');
    }

    const todos = await todoRepository.findByBoardId(boardId);

    return todos.map(todoToDTO);
  },

  /**
   * Create a new todo and broadcast to SSE clients
   */
  async createTodo(
    userId: string,
    tenantId: string,
    boardId: string,
    data: {
      title: string;
      description?: string;
      status?: TodoStatus;
      assigneeId?: string;
    }
  ): Promise<TodoItem> {
    // Verify user is a member of the tenant
    await requireUserMembership(userId, tenantId);

    // Verify board exists and belongs to tenant
    const board = await boardRepository.findByIdAndTenantId(boardId, tenantId);

    if (!board) {
      throw new Error('Board not found');
    }

    // Create todo
    const todo = await todoRepository.create({
      tenantId,
      boardId,
      title: data.title,
      description: data.description,
      status: data.status,
      assigneeId: data.assigneeId,
      createdById: userId,
    });

    // Log activity
    await activityRepository.create({
      tenantId,
      boardId,
      todoId: todo.id,
      userId,
      action: 'CREATED',
      metadata: {
        title: todo.title,
        status: todo.status,
      },
    });

    // Get full todo with relations
    const fullTodo = await todoRepository.findById(todo.id);

    if (!fullTodo) {
      throw new Error('Failed to retrieve created todo');
    }

    const todoDTO = todoToDTO(fullTodo);

    // Broadcast SSE event to all board clients
    const event = createBoardEvent.todoCreated(userId, todoDTO);
    boardStreamRegistry.broadcast(boardId, event);

    return todoDTO;
  },

  /**
   * Update a todo and broadcast to SSE clients
   */
  async updateTodo(
    userId: string,
    tenantId: string,
    boardId: string,
    todoId: string,
    data: {
      title?: string;
      description?: string | null;
      status?: TodoStatus;
      assigneeId?: string | null;
      position?: number;
    }
  ): Promise<TodoItem> {
    // Verify user is a member of the tenant
    await requireUserMembership(userId, tenantId);

    // Verify todo exists and belongs to tenant/board
    const existingTodo = await todoRepository.findByIdAndTenantId(
      todoId,
      tenantId
    );

    if (!existingTodo || existingTodo.boardId !== boardId) {
      throw new Error('Todo not found');
    }

    // Track what changed
    const changes = {
      title: data.title !== undefined && data.title !== existingTodo.title,
      description:
        data.description !== undefined &&
        data.description !== existingTodo.description,
      status: data.status !== undefined && data.status !== existingTodo.status,
      assigneeId:
        data.assigneeId !== undefined &&
        data.assigneeId !== existingTodo.assigneeId,
      position:
        data.position !== undefined && data.position !== existingTodo.position,
    };

    // Update todo
    const updatedTodo = await todoRepository.update(todoId, data);

    // Log activity
    const action = changes.status ? 'STATUS_CHANGED' : 'UPDATED';
    await activityRepository.create({
      tenantId,
      boardId,
      todoId,
      userId,
      action,
      metadata: {
        changes,
        before: {
          title: existingTodo.title,
          status: existingTodo.status,
        },
        after: {
          title: updatedTodo.title,
          status: updatedTodo.status,
        },
      },
    });

    // Get full todo with relations
    const fullTodo = await todoRepository.findById(todoId);

    if (!fullTodo) {
      throw new Error('Failed to retrieve updated todo');
    }

    const todoDTO = todoToDTO(fullTodo);

    // Broadcast appropriate SSE event
    if (changes.status && data.status) {
      const statusEvent = createBoardEvent.todoStatusChanged(
        userId,
        todoId,
        existingTodo.status,
        data.status,
        todoDTO
      );
      boardStreamRegistry.broadcast(boardId, statusEvent);
    } else {
      const updateEvent = createBoardEvent.todoUpdated(userId, todoDTO, changes);
      boardStreamRegistry.broadcast(boardId, updateEvent);
    }

    return todoDTO;
  },

  /**
   * Delete a todo and broadcast to SSE clients
   */
  async deleteTodo(
    userId: string,
    tenantId: string,
    boardId: string,
    todoId: string
  ): Promise<void> {
    // Verify user is a member of the tenant
    await requireUserMembership(userId, tenantId);

    // Verify todo exists and belongs to tenant/board
    const existingTodo = await todoRepository.findByIdAndTenantId(
      todoId,
      tenantId
    );

    if (!existingTodo || existingTodo.boardId !== boardId) {
      throw new Error('Todo not found');
    }

    // Log activity
    await activityRepository.create({
      tenantId,
      boardId,
      todoId,
      userId,
      action: 'DELETED',
      metadata: {
        title: existingTodo.title,
        status: existingTodo.status,
      },
    });

    // Delete todo
    await todoRepository.delete(todoId);

    // Broadcast SSE event
    const event = createBoardEvent.todoDeleted(userId, todoId, boardId);
    boardStreamRegistry.broadcast(boardId, event);
  },

  /**
   * Get a single todo by ID
   */
  async getTodoById(
    userId: string,
    tenantId: string,
    todoId: string
  ): Promise<TodoItem> {
    // Verify user is a member of the tenant
    await requireUserMembership(userId, tenantId);

    // Get todo
    const todo = await todoRepository.findByIdAndTenantId(todoId, tenantId);

    if (!todo) {
      throw new Error('Todo not found');
    }

    return todoToDTO(todo);
  },
};

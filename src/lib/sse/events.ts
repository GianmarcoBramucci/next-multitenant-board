// SSE Events - Type definitions for real-time events

import { BoardSummary } from '@/types/dto/board';
import { TodoItem } from '@/types/dto/todo';

/**
 * Board event types
 */
export type BoardEventType =
  | 'TODO_CREATED'
  | 'TODO_UPDATED'
  | 'TODO_DELETED'
  | 'TODO_STATUS_CHANGED'
  | 'BOARD_CREATED'
  | 'BOARD_UPDATED'
  | 'BOARD_DELETED';

/**
 * Base board event structure
 */
export interface BoardEvent<T = unknown> {
  type: BoardEventType;
  payload: T;
  timestamp: string;
  userId: string; // user who triggered the event
}

/**
 * Specific event payloads
 */
export interface TodoCreatedPayload {
  todo: TodoItem;
}

export interface TodoUpdatedPayload {
  todo: TodoItem;
  changes: {
    title?: boolean;
    description?: boolean;
    status?: boolean;
    assigneeId?: boolean;
    position?: boolean;
  };
}

export interface TodoDeletedPayload {
  todoId: string;
  boardId: string;
}

export interface TodoStatusChangedPayload {
  todoId: string;
  oldStatus: string;
  newStatus: string;
  todo: TodoItem;
}

export interface BoardCreatedPayload {
  board: BoardSummary;
}

export interface BoardUpdatedPayload {
  boardId: string;
  name?: string;
  description?: string | null;
}

export interface BoardDeletedPayload {
  boardId: string;
}

/**
 * Typed event creators
 */
export const createBoardEvent = {
  todoCreated: (userId: string, todo: TodoItem): BoardEvent<TodoCreatedPayload> => ({
    type: 'TODO_CREATED',
    payload: { todo },
    timestamp: new Date().toISOString(),
    userId,
  }),

  todoUpdated: (
    userId: string,
    todo: TodoItem,
    changes: TodoUpdatedPayload['changes']
  ): BoardEvent<TodoUpdatedPayload> => ({
    type: 'TODO_UPDATED',
    payload: { todo, changes },
    timestamp: new Date().toISOString(),
    userId,
  }),

  todoDeleted: (
    userId: string,
    todoId: string,
    boardId: string
  ): BoardEvent<TodoDeletedPayload> => ({
    type: 'TODO_DELETED',
    payload: { todoId, boardId },
    timestamp: new Date().toISOString(),
    userId,
  }),

  todoStatusChanged: (
    userId: string,
    todoId: string,
    oldStatus: string,
    newStatus: string,
    todo: TodoItem
  ): BoardEvent<TodoStatusChangedPayload> => ({
    type: 'TODO_STATUS_CHANGED',
    payload: { todoId, oldStatus, newStatus, todo },
    timestamp: new Date().toISOString(),
    userId,
  }),

  boardCreated: (
    userId: string,
    board: BoardSummary
  ): BoardEvent<BoardCreatedPayload> => ({
    type: 'BOARD_CREATED',
    payload: { board },
    timestamp: new Date().toISOString(),
    userId,
  }),

  boardUpdated: (
    userId: string,
    boardId: string,
    data: { name?: string; description?: string | null }
  ): BoardEvent<BoardUpdatedPayload> => ({
    type: 'BOARD_UPDATED',
    payload: { boardId, ...data },
    timestamp: new Date().toISOString(),
    userId,
  }),

  boardDeleted: (
    userId: string,
    boardId: string
  ): BoardEvent<BoardDeletedPayload> => ({
    type: 'BOARD_DELETED',
    payload: { boardId },
    timestamp: new Date().toISOString(),
    userId,
  }),
};

/**
 * Format an event for SSE transmission
 */
export function formatSSEMessage(event: BoardEvent): string {
  return `event: message\ndata: ${JSON.stringify(event)}\n\n`;
}

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { TodoItem } from '@/types/dto/todo';
import { BoardEvent } from '@/lib/sse/events';

interface UseBoardSSEOptions {
  boardId: string;
  onTodoCreated: (todo: TodoItem) => void;
  onTodoUpdated: (todo: TodoItem) => void;
  onTodoDeleted: (todoId: string) => void;
  onTodoStatusChanged: (todo: TodoItem) => void;
  onBoardUpdated?: (data: { boardId: string; name?: string; description?: string | null }) => void;
  onBoardDeleted?: (boardId: string) => void;
}

export function useBoardSSE({
  boardId,
  onTodoCreated,
  onTodoUpdated,
  onTodoDeleted,
  onTodoStatusChanged,
  onBoardUpdated,
  onBoardDeleted,
}: UseBoardSSEOptions) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const data: BoardEvent = JSON.parse(event.data);

        console.log('[SSE] Received event:', data.type);

        switch (data.type) {
          case 'TODO_CREATED':
            onTodoCreated((data.payload as any).todo);
            break;
          case 'TODO_UPDATED':
            onTodoUpdated((data.payload as any).todo);
            break;
          case 'TODO_DELETED':
            onTodoDeleted((data.payload as any).todoId);
            break;
          case 'TODO_STATUS_CHANGED':
            onTodoStatusChanged((data.payload as any).todo);
            break;
          case 'BOARD_UPDATED':
            if (onBoardUpdated) {
              onBoardUpdated(data.payload as any);
            }
            break;
          case 'BOARD_DELETED':
            if (onBoardDeleted) {
              onBoardDeleted((data.payload as any).boardId);
            }
            break;
          default:
            console.log('[SSE] Unknown event type:', data.type);
        }
      } catch (error) {
        console.error('[SSE] Failed to parse event:', error);
      }
    },
    [onTodoCreated, onTodoUpdated, onTodoDeleted, onTodoStatusChanged, onBoardUpdated, onBoardDeleted]
  );

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      console.log('[SSE] Already connected to board:', boardId);
      return; // Already connected
    }

    console.log('[SSE] Connecting to board:', boardId);

    const eventSource = new EventSource(`/api/stream/boards/${boardId}`);

    eventSource.onopen = () => {
      console.log('[SSE] Connection OPENED successfully for board:', boardId);
    };

    eventSource.onmessage = handleMessage;

    eventSource.onerror = (error) => {
      console.error('[SSE] Connection ERROR for board:', boardId, error);
      console.log('[SSE] EventSource readyState:', eventSource.readyState);

      eventSource.close();
      eventSourceRef.current = null;

      // Attempt to reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('[SSE] Attempting to reconnect to board:', boardId);
        connect();
      }, 3000);
    };

    eventSourceRef.current = eventSource;
    console.log('[SSE] EventSource created, readyState:', eventSource.readyState);
  }, [boardId, handleMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (eventSourceRef.current) {
      console.log('[SSE] Disconnecting');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return { disconnect };
}

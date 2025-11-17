'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { BoardEvent } from '@/lib/sse/events';
import { BoardSummary } from '@/types/dto/board';
import { SSEConnectionStatus } from './useBoardSSE';

interface UseTenantSSEOptions {
  tenantSlug: string;
  onBoardCreated?: (board: BoardSummary) => void;
  onBoardUpdated: (data: { boardId: string; name?: string; description?: string | null }) => void;
  onBoardDeleted: (boardId: string) => void;
}

export function useTenantSSE({
  tenantSlug,
  onBoardCreated,
  onBoardUpdated,
  onBoardDeleted,
}: UseTenantSSEOptions) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const [connectionStatus, setConnectionStatus] = useState<SSEConnectionStatus>('connecting');

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const data: BoardEvent = JSON.parse(event.data);

        console.log('[Tenant SSE] Received event:', data.type);

        switch (data.type) {
          case 'BOARD_CREATED':
            if (onBoardCreated) {
              onBoardCreated((data.payload as any).board);
            }
            break;
          case 'BOARD_UPDATED':
            onBoardUpdated(data.payload as any);
            break;
          case 'BOARD_DELETED':
            onBoardDeleted((data.payload as any).boardId);
            break;
          default:
            console.log('[Tenant SSE] Unknown event type:', data.type);
        }
      } catch (error) {
        console.error('[Tenant SSE] Failed to parse event:', error);
      }
    },
    [onBoardCreated, onBoardUpdated, onBoardDeleted]
  );

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      console.log('[Tenant SSE] Already connected to tenant:', tenantSlug);
      return; // Already connected
    }

    console.log('[Tenant SSE] Connecting to tenant:', tenantSlug);
    setConnectionStatus('connecting');

    const eventSource = new EventSource(`/api/stream/tenants/${tenantSlug}`);

    eventSource.onopen = () => {
      console.log('[Tenant SSE] Connection OPENED successfully for tenant:', tenantSlug);
      setConnectionStatus('connected');
    };

    eventSource.onmessage = handleMessage;

    eventSource.onerror = (error) => {
      console.error('[Tenant SSE] Connection ERROR for tenant:', tenantSlug, error);
      console.log('[Tenant SSE] EventSource readyState:', eventSource.readyState);

      setConnectionStatus('error');
      eventSource.close();
      eventSourceRef.current = null;

      // Attempt to reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('[Tenant SSE] Attempting to reconnect to tenant:', tenantSlug);
        connect();
      }, 3000);
    };

    eventSourceRef.current = eventSource;
    console.log('[Tenant SSE] EventSource created, readyState:', eventSource.readyState);
  }, [tenantSlug, handleMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (eventSourceRef.current) {
      console.log('[Tenant SSE] Disconnecting');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setConnectionStatus('disconnected');
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return { disconnect, connectionStatus };
}
